import torch
import torch.nn as nn
import torch.optim as optim
import numpy as np
import uuid
from infrastructure.persistence.database import get_connection
from infrastructure.persistence import queries


# --- 1-1. 데이터 준비 ---
def prepare_data(draw_no: int, window_size=7, max_samples=300):
    """과거 당첨 번호를 2D Grid(5x9)로 변환하여 CNN 학습용 데이터셋을 구성한다."""
    conn = get_connection()
    conn.row_factory = None
    cursor = conn.cursor()

    cursor.execute("""
        SELECT num1, num2, num3, num4, num5, num6 
        FROM lotto_winners 
        WHERE draw_no < ? 
        ORDER BY draw_no DESC 
        LIMIT ?
    """, (draw_no, max_samples + window_size))
    rows = cursor.fetchall()
    conn.close()

    if len(rows) < window_size + 1:
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
    for i in range(len(grids) - window_size):
        # (window_size, 5, 9) 형태
        X.append(np.stack(grids[i:i + window_size], axis=0))
        y.append(flat_targets[i + window_size])

    X = torch.tensor(np.array(X))          # (N, window_size, 5, 9)
    y = torch.tensor(np.array(y))          # (N, 45)

    # 예측용 최신 시퀀스
    latest_X = torch.tensor(
        np.array([np.stack(grids[-window_size:], axis=0)])
    )  # (1, window_size, 5, 9)

    return X, y, latest_X


# --- 1-2. CNN 모델 ---
class LottoCNN(nn.Module):
    def __init__(self, in_channels=7, output_size=45):
        super().__init__()
        self.conv1 = nn.Conv2d(in_channels, 32, kernel_size=3, padding=1)
        self.conv2 = nn.Conv2d(32, 64, kernel_size=3, padding=1)
        self.pool = nn.MaxPool2d(kernel_size=2, stride=1)
        # 5→pool→4→pool→3,  9→pool→8→pool→7
        self.fc1 = nn.Linear(64 * 3 * 7, output_size)

    def forward(self, x):
        x = torch.relu(self.conv1(x))
        x = self.pool(x)
        x = torch.relu(self.conv2(x))
        x = self.pool(x)
        x = x.view(x.size(0), -1)
        x = self.fc1(x)
        return x


# --- 1-3. 학습 및 추론 ---
def train_and_predict(model, X, y, latest_X, epochs=50):
    criterion = nn.BCEWithLogitsLoss()
    optimizer = optim.Adam(model.parameters(), lr=0.01)

    model.train()
    for epoch in range(epochs):
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
