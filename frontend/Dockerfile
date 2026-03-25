FROM node:20-alpine

# 作業ディレクトリ設定
WORKDIR /app

# package.jsonとpackage-lock.jsonをコピー
COPY package*.json ./

# 依存関係のインストール
RUN npm install

# ソースコードはボリュームマウントで提供される
# 開発サーバー起動（ホストからアクセス可能にするため0.0.0.0でバインド）
CMD ["npm", "run", "dev", "--", "--host", "0.0.0.0"]

EXPOSE 3000