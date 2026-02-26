from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from typing import List, Optional
import sqlite3
import os

app = FastAPI()

# CORS 설정
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

class LottoWinner(BaseModel):
    draw_no: int
    num1: int
    num2: int
    num3: int
    num4: int
    num5: int
    num6: int
    bonus_num: int
    winner_count: Optional[int]
    winner_amount: Optional[int]

class MessageResponse(BaseModel):
    message: str

def get_db_path():
    return os.path.join(os.path.dirname(__file__), 'infrastructure', 'persistence', 'lotto.db')

@app.get("/", response_model=MessageResponse)
def read_root():
    return {"message": "Hello from FastAPI"}

@app.get("/api/winners", response_model=List[LottoWinner])
def get_winners():
    db_path = get_db_path()
    if not os.path.exists(db_path):
        raise HTTPException(status_code=404, detail="Database not found")
    
    try:
        conn = sqlite3.connect(db_path)
        conn.row_factory = sqlite3.Row
        cursor = conn.cursor()
        
        # 최신순 정렬
        cursor.execute("SELECT * FROM lotto_winners ORDER BY draw_no DESC")
        rows = cursor.fetchall()
        
        winners = [dict(row) for row in rows]
        
        conn.close()
        return winners
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))
