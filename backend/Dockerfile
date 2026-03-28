FROM python:3.11-slim

# 作業ディレクトリ設定
WORKDIR /app

# Pythonの出力バッファリングを無効化（ログ即座表示）
ENV PYTHONUNBUFFERED=1

# requirements.txtをコピー
COPY requirements.txt .

# 依存関係のインストール
RUN pip install --no-cache-dir -r requirements.txt

# ソースコードをコピー
COPY . .

# FastAPIサーバー起動（本番: --reload なし、ポートは環境変数から）
CMD ["sh", "-c", "uvicorn app.main:app --host 0.0.0.0 --port ${PORT:-8000}"]

EXPOSE 8000