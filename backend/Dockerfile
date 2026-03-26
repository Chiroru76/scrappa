FROM python:3.11-slim

# 作業ディレクトリ設定
WORKDIR /app

# Pythonの出力バッファリングを無効化（ログ即座表示）
ENV PYTHONUNBUFFERED=1

# requirements.txtをコピー
COPY requirements.txt .

# 依存関係のインストール
RUN pip install --no-cache-dir -r requirements.txt

# ソースコードはボリュームマウントで提供される
# FastAPIサーバー起動（リロード有効）
CMD ["uvicorn", "app.main:app", "--host", "0.0.0.0", "--port", "8000", "--reload"]

EXPOSE 8000