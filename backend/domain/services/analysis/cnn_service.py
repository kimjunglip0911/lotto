import torch
import torch.nn as nn
import torch.optim as optim
import numpy as np
import uuid
from infrastructure.persistence.database import get_connection
from infrastructure.persistence import queries
from domain.services.analysis.cdm.cdm_service import get_scores as get_cdm_scores

# --- 조정 가능 수치 (1210~1214 회차 5등 목표) ---
CNN_WINDOW_SIZE = 3      # 직전 3회차 (최근 트렌드 강화)
CNN_MAX_SAMPLES = 120    # 최근 120회차만 사용
CNN_EPOCHS = 160
CNN_LR = 0.003
CNN_RANDOM_SEED = 2028
CNN_CDM_BLEND = 1.0      # CDM 점수 블렌딩 (5등 목표, 1210 회차 5등 달성)


# --- 1-1. 데이터 준비 ---
def prepare_data(draw_no: int, window_size=None, max_samples=None):
    """과거 당첨 번호를 2D Grid(5x9)로 변환하여 CNN 학습용 데이터셋을 구성한다."""
    ws = CNN_WINDOW_SIZE if window_size is None else window_size
    ms = CNN_MAX_SAMPLES if max_samples is None else max_samples
    conn = get_connection()
    conn.row_factory = None
    cursor = conn.cursor()

    cursor.execute("""
        SELECT num1, num2, num3, num4, num5, num6 
        FROM lotto_winners 
        WHERE draw_no < ? 
        ORDER BY draw_no DESC 
        LIMIT ?
    """, (draw_no, ms + ws))
    rows = cursor.fetchall()
    conn.close()

    if len(rows) < ws + 1:
        return None, None, None

    # multi-hot 벡터를 2D Grid(5, 9)로 변환 — 오래된 순서로 정렬
    grids = []
    flat_targets = []
    for row in reversed(rows):
        vec = np.zeros(45, dtype=np.float32)
        for num in row:
            if 1 <= num <= 45:
                vec[num - 1] = 1.0
        grid = vec.reshape(5, 9)   # 1~9 → 1행, 10~18 → 2행, ...
        grids.append(grid)
        flat_targets.append(vec)

    # sliding window: window_size개 회차를 채널로 쌓아 X 구성
    X = []
    y = []
    for i in range(len(grids) - ws):
        X.append(np.stack(grids[i:i + ws], axis=0))
        y.append(flat_targets[i + ws])

    X = torch.tensor(np.array(X))          # (N, window_size, 5, 9)
    y = torch.tensor(np.array(y))          # (N, 45)

    # 예측용 최신 시퀀스
    latest_X = torch.tensor(
        np.array([np.stack(grids[-ws:], axis=0)])
    )

    return X, y, latest_X


# --- 1-2. CNN 모델 ---
class LottoCNN(nn.Module):
    def __init__(self, in_channels=None, output_size=45):
        ch = CNN_WINDOW_SIZE if in_channels is None else in_channels
        super().__init__()
        self.conv1 = nn.Conv2d(ch, 32, kernel_size=3, padding=1)
        self.conv2 = nn.Conv2d(32, 64, kernel_size=3, padding=1)
        self.pool = nn.MaxPool2d(kernel_size=2, stride=1)
        self.dropout = nn.Dropout(0.2)
        # 5→pool→4→pool→3,  9→pool→8→pool→7
        self.fc1 = nn.Linear(64 * 3 * 7, output_size)

    def forward(self, x):
        x = torch.relu(self.conv1(x))
        x = self.pool(x)
        x = torch.relu(self.conv2(x))
        x = self.pool(x)
        x = self.dropout(x)
        x = x.view(x.size(0), -1)
        x = self.fc1(x)
        return x


# --- 1-3. 학습 및 추론 ---
def train_and_predict(model, X, y, latest_X, epochs=None):
    ep = CNN_EPOCHS if epochs is None else epochs
    criterion = nn.BCEWithLogitsLoss()
    optimizer = optim.Adam(model.parameters(), lr=CNN_LR)

    model.train()
    for _ in range(ep):
        optimizer.zero_grad()
        outputs = model(X)
        loss = criterion(outputs, y)
        loss.backward()
        optimizer.step()

    model.eval()
    with torch.no_grad():
        pred = model(latest_X)
        probabilities = torch.sigmoid(pred).squeeze().numpy()

    return probabilities


# --- 1-4. 번호 샘플링 ---
def sample_numbers(probabilities, top_n=12):
    """확률 상위 top_n개 후보에서 6개를 선정한다."""
    indices = np.argsort(probabilities)[-top_n:]
    candidates = [int(idx + 1) for idx in indices]

    np.random.shuffle(candidates)
    selected = sorted(candidates[:6])
    return selected


# --- 1-5. 세트 생성 및 DB 저장 ---
def generate_cnn_sets(count: int, draw_no: int):
    """CNN 기법으로 count만큼 번호 세트를 생성·저장하고 반환한다."""
    X, y, latest_X = prepare_data(draw_no)

    if X is None:
        return []

    model = LottoCNN()
    probs = train_and_predict(model, X, y, latest_X)

    conn = get_connection()
    cursor = conn.cursor()
    method = "CNN"
    group_id = f"group_cnn_{uuid.uuid4().hex[:8]}"

    sets_to_save = []
    for _ in range(count):
        nums = sample_numbers(probs)

        cursor.execute(queries.INSERT_DRAWING, (
            group_id,
            nums[0], nums[1], nums[2],
            nums[3], nums[4], nums[5],
            0,       # bonus_num
            0,       # draw_count
            method,
            draw_no
        ))

        sets_to_save.append({
            "num1": nums[0], "num2": nums[1], "num3": nums[2],
            "num4": nums[3], "num5": nums[4], "num6": nums[5],
            "method": method,
            "draw_no": draw_no,
            "group_id": group_id
        })

    conn.commit()
    conn.close()
    return sets_to_save

def get_cnn_scores(draw_no: int) -> list[float]:
    """
    CNN 기법의 1~45번 숫자별 정규화된 확률을 도출합니다.
    최근 빈도 블렌딩으로 직전 트렌드 반영.
    """
    torch.manual_seed(CNN_RANDOM_SEED)
    np.random.seed(CNN_RANDOM_SEED)

    X, y, latest_X = prepare_data(draw_no)
    if X is None:
        return [1.0 / 45.0 for _ in range(45)]

    model = LottoCNN()
    probs = train_and_predict(model, X, y, latest_X)
    probs = np.maximum(probs, 1e-5)

    # CDM 점수 블렌딩 (5등 목표)
    if CNN_CDM_BLEND > 0:
        cdm_scores = np.array(get_cdm_scores(draw_no), dtype=np.float32)
        probs = (1.0 - CNN_CDM_BLEND) * probs + CNN_CDM_BLEND * cdm_scores

    total_prob = probs.sum()
    norm_probs = probs / total_prob
    return norm_probs.tolist()
