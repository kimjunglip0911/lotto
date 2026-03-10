import torch
import torch.nn as nn
import torch.optim as optim
import numpy as np
import uuid
from infrastructure.persistence.database import get_connection
from infrastructure.persistence import queries

class LottoLSTM(nn.Module):
    def __init__(self, input_size=45, hidden_size=64, num_layers=2, output_size=45):
        super(LottoLSTM, self).__init__()
        self.lstm = nn.LSTM(input_size, hidden_size, num_layers, batch_first=True)
        self.fc = nn.Linear(hidden_size, output_size)
    
    def forward(self, x):
        # x shape: (batch, seq_len, input_size)
        out, _ = self.lstm(x)
        # Taking the last time step output
        out = self.fc(out[:, -1, :])
        return out

class LottoBiLSTM(nn.Module):
    def __init__(self, input_size=45, hidden_size=64, num_layers=2, output_size=45):
        super(LottoBiLSTM, self).__init__()
        self.lstm = nn.LSTM(input_size, hidden_size, num_layers, batch_first=True, bidirectional=True)
        self.fc = nn.Linear(hidden_size * 2, output_size)
    
    def forward(self, x):
        out, _ = self.lstm(x)
        out = self.fc(out[:, -1, :])
        return out

def prepare_data(draw_no: int, window_size=7, max_samples=300):
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
    """, (draw_no, max_samples + window_size))
    rows = cursor.fetchall()
    conn.close()
    
    if len(rows) < window_size + 1:
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
    for i in range(len(data) - window_size):
        X.append(data[i:i+window_size])
        y.append(data[i+window_size])
    
    X = torch.tensor(np.array(X))
    y = torch.tensor(np.array(y))
    
    # Latest sequence for prediction
    latest_X = torch.tensor(np.array([data[-window_size:]]))
    
    return X, y, latest_X

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
