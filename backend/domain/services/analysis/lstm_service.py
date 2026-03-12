import torch
import torch.nn as nn
import torch.optim as optim
import numpy as np
import uuid
from infrastructure.persistence.database import get_connection
from infrastructure.persistence import queries

# 조정 가능 수치 (1210~1214 회차 5등 이상 목표 — 4차 재조정)
WINDOW_SIZE = 3       # 직전 3회차로 최근 트렌드 강하게 반영
MAX_SAMPLES = 120     # 최근 120회차만 사용 (직전 패턴 집중)
HIDDEN_SIZE = 128     # 모델 용량 확대
NUM_LAYERS = 2
EPOCHS = 150
LR = 0.004
RANDOM_SEED = 2025    # 시드 변경으로 분포 다양화


def _set_seed() -> None:
    """재현성을 위한 랜덤 시드 고정."""
    if RANDOM_SEED is not None:
        torch.manual_seed(RANDOM_SEED)
        np.random.seed(RANDOM_SEED)


class LottoLSTM(nn.Module):
    def __init__(self, input_size=45, hidden_size=None, num_layers=None, output_size=45):
        h = HIDDEN_SIZE if hidden_size is None else hidden_size
        n = NUM_LAYERS if num_layers is None else num_layers
        super(LottoLSTM, self).__init__()
        self.lstm = nn.LSTM(input_size, h, n, batch_first=True)
        self.fc = nn.Linear(h, output_size)
    
    def forward(self, x):
        # x shape: (batch, seq_len, input_size)
        out, _ = self.lstm(x)
        # Taking the last time step output
        out = self.fc(out[:, -1, :])
        return out

class LottoBiLSTM(nn.Module):
    def __init__(self, input_size=45, hidden_size=None, num_layers=None, output_size=45):
        h = HIDDEN_SIZE if hidden_size is None else hidden_size
        n = NUM_LAYERS if num_layers is None else num_layers
        super(LottoBiLSTM, self).__init__()
        self.lstm = nn.LSTM(input_size, h, n, batch_first=True, bidirectional=True)
        self.fc = nn.Linear(h * 2, output_size)
    
    def forward(self, x):
        out, _ = self.lstm(x)
        out = self.fc(out[:, -1, :])
        return out

def prepare_data(draw_no: int, window_size=None, max_samples=None):
    ws = WINDOW_SIZE if window_size is None else window_size
    ms = MAX_SAMPLES if max_samples is None else max_samples
    conn = get_connection()
    conn.row_factory = None
    cursor = conn.cursor()
    
    # Fetch previous winning numbers
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

    # Convert to multi-hot encoding (1-45 -> 0-44 index)
    data = []
    for row in reversed(rows): # From oldest to newest
        vec = np.zeros(45, dtype=np.float32)
        for num in row:
            if 1 <= num <= 45:
                vec[num-1] = 1.0
        data.append(vec)
    
    X = []
    y = []
    for i in range(len(data) - ws):
        X.append(data[i:i+ws])
        y.append(data[i+ws])
    
    X = torch.tensor(np.array(X))
    y = torch.tensor(np.array(y))
    
    # Latest sequence for prediction
    latest_X = torch.tensor(np.array([data[-ws:]]))
    
    return X, y, latest_X

def train_and_predict(model, X, y, latest_X, epochs=None):
    ep = EPOCHS if epochs is None else epochs
    criterion = nn.BCEWithLogitsLoss()
    optimizer = optim.Adam(model.parameters(), lr=LR)
    
    model.train()
    for epoch in range(ep):
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

def sample_numbers(probabilities, top_n=12):
    # Get indices of top N probabilities
    indices = np.argsort(probabilities)[-top_n:]
    # Add numbers (indices + 1)
    candidates = [int(idx + 1) for idx in indices]
    
    # Randomly pick 6 numbers from the top N candidates
    # This provides variety for the 2 sets
    np.random.shuffle(candidates)
    selected = sorted(candidates[:6])
    return selected

def generate_lstm_sets(count: int, draw_no: int, method: str):
    _set_seed()
    X, y, latest_X = prepare_data(draw_no)
    
    if X is None:
        # Fallback if not enough data
        return []

    if method == "LSTM":
        model = LottoLSTM()
    else:
        model = LottoBiLSTM()
        
    probs = train_and_predict(model, X, y, latest_X)
    
    conn = get_connection()
    cursor = conn.cursor()
    group_id = f"group_{method.lower()}_{uuid.uuid4().hex[:8]}"
    
    sets_to_save = []
    for _ in range(count):
        nums = sample_numbers(probs)
        
        cursor.execute(queries.INSERT_DRAWING, (
            group_id,
            nums[0], nums[1], nums[2],
            nums[3], nums[4], nums[5],
            0, # bonus_num
            0, # draw_count
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

def get_lstm_scores(draw_no: int, method: str) -> list[float]:
    """
    LSTM/Bi-LSTM 기법의 1~45번 숫자별 정규화된 확률을 도출합니다.
    """
    _set_seed()
    X, y, latest_X = prepare_data(draw_no)
    
    if X is None:
        return [1.0 / 45.0 for _ in range(45)]

    if method == "LSTM":
        model = LottoLSTM()
    else:
        model = LottoBiLSTM()
        
    probs = train_and_predict(model, X, y, latest_X)
    
    # 0 방지 및 정규화
    probs = np.maximum(probs, 1e-5)
    total_prob = probs.sum()
    norm_probs = probs / total_prob
    return norm_probs.tolist()
