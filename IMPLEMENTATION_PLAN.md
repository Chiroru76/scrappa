# Scrappa MVP実装計画

## Context（背景）

Scrappaは、デザイン写真を正方形にトリミングしてリングノート風のスクラップブックとして保存・閲覧できるWebアプリです。

**現状:**
- プロジェクトは完全に初期状態（README.mdのみ存在）
- 詳細な設計書（950行以上）が完成している
- 技術スタック、API設計、DB設計、UI設計が全て定義済み

**目的:**
- MVP（Phase 1）機能を実装し、デプロイ可能な状態にする
- 画像アップロード・正方形クロップ・リングノート風表示・タグ管理の基本機能を実現

**技術スタック:**
- フロントエンド: React (Vite) + react-pageflip + Vercel
- バックエンド: FastAPI + Pillow + boto3 + Render
- DB/認証: Supabase (PostgreSQL + Google OAuth)
- ストレージ: AWS S3

---

## 実装アプローチ

### 基本方針

1. **バックエンド → フロントエンド** の順に実装（API完成後にUI接続）
2. **認証なし → 認証あり** の順に実装（開発効率を優先）
3. **段階的な統合テスト** で早期に問題を検出

### Minimum Viable Path（最短実装経路）

```
環境構築 → インフラ → バックエンドコア → 認証 →
フロントエンド基盤 → UI実装 → アップロード機能 →
レスポンシブ対応 → デプロイ
```

---

## 実装ステップ

### Step 1: プロジェクト基盤セットアップ（1日）

#### 1.1 ディレクトリ構造作成

```
scrappa/
├── frontend/
│   ├── src/
│   │   ├── components/
│   │   │   ├── ui/
│   │   │   ├── book/
│   │   │   ├── upload/
│   │   │   └── exchange/
│   │   ├── pages/
│   │   ├── hooks/
│   │   ├── lib/
│   │   ├── App.jsx
│   │   └── main.jsx
│   ├── public/
│   ├── index.html
│   ├── package.json
│   ├── vite.config.js
│   ├── .env.example
│   └── .gitignore
└── backend/
    ├── app/
    │   ├── routers/
    │   ├── services/
    │   ├── models/
    │   ├── db/
    │   ├── middleware/
    │   └── main.py
    ├── requirements.txt
    ├── .env.example
    └── .gitignore
```

#### 1.2 主要な設定ファイル

**backend/requirements.txt:**
```
fastapi==0.109.0
uvicorn[standard]==0.27.0
pillow==10.2.0
boto3==1.34.0
supabase==2.3.0
python-jose[cryptography]==3.3.0
python-multipart==0.0.9
pydantic==2.5.0
```

**frontend/package.json:**
```json
{
  "name": "scrappa-frontend",
  "dependencies": {
    "react": "^18.2.0",
    "react-dom": "^18.2.0",
    "react-pageflip": "^2.0.3",
    "@supabase/supabase-js": "^2.39.0",
    "axios": "^1.6.0"
  }
}
```

**frontend/vite.config.js:**
```javascript
import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

export default defineConfig({
  plugins: [react()],
  server: {
    port: 3000,
    proxy: {
      '/api': {
        target: 'http://localhost:8000',
        changeOrigin: true,
        rewrite: (path) => path.replace(/^\/api/, '')
      }
    }
  }
})
```

#### 確認項目
- [ ] ディレクトリ構造が作成されている
- [ ] .gitignoreが機能している（.envが除外される）
- [ ] package.json / requirements.txtが存在する

---

### Step 2: インフラストラクチャセットアップ（1日）

#### 2.1 Supabaseプロジェクト作成

1. https://supabase.com で新規プロジェクト作成
2. プロジェクトURL・Service Role Key・Anon Keyを取得
3. Google OAuth設定を有効化（Authentication > Providers > Google）

**取得する環境変数:**
- `SUPABASE_URL`
- `SUPABASE_KEY`（Service Role）
- `VITE_SUPABASE_ANON_KEY`（Anon Public）

#### 2.2 AWS S3バケット作成

1. S3で新規バケット作成（名前: `scrappa-images-[環境]`）
2. リージョン: ap-northeast-1
3. パブリックアクセスブロック: オフ
4. CORS設定を追加
5. IAMユーザー作成＆アクセスキー取得

**取得する環境変数:**
- `S3_BUCKET_NAME`
- `AWS_ACCESS_KEY_ID`
- `AWS_SECRET_ACCESS_KEY`
- `AWS_REGION`

#### 2.3 データベースマイグレーション

Supabase SQLエディタで以下を順番に実行:

```sql
-- 1. usersテーブル
CREATE TABLE users (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  username TEXT NOT NULL UNIQUE,
  avatar_url TEXT,
  is_public BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMP NOT NULL DEFAULT NOW()
);

-- 2. clipsテーブル
CREATE TABLE clips (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  image_url TEXT NOT NULL,
  page INTEGER NOT NULL DEFAULT 1,
  position INTEGER NOT NULL DEFAULT 0,
  is_public BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMP NOT NULL DEFAULT NOW()
);
CREATE INDEX idx_clips_user_id ON clips(user_id);
CREATE INDEX idx_clips_page ON clips(user_id, page);

-- 3. tagsテーブル
CREATE TABLE tags (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  UNIQUE (user_id, name)
);
CREATE INDEX idx_tags_user_id ON tags(user_id);

-- 4. clip_tagsテーブル
CREATE TABLE clip_tags (
  clip_id UUID NOT NULL REFERENCES clips(id) ON DELETE CASCADE,
  tag_id UUID NOT NULL REFERENCES tags(id) ON DELETE CASCADE,
  PRIMARY KEY (clip_id, tag_id)
);
CREATE INDEX idx_clip_tags_tag_id ON clip_tags(tag_id);

-- 5. exchange_requestsテーブル
CREATE TABLE exchange_requests (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  from_user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  to_user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  offer_clip_id UUID NOT NULL REFERENCES clips(id) ON DELETE CASCADE,
  want_clip_id UUID NOT NULL REFERENCES clips(id) ON DELETE CASCADE,
  status TEXT NOT NULL DEFAULT 'pending',
  created_at TIMESTAMP NOT NULL DEFAULT NOW(),
  CONSTRAINT status_check CHECK (status IN ('pending', 'accepted', 'rejected'))
);
CREATE INDEX idx_exchange_from_user ON exchange_requests(from_user_id);
CREATE INDEX idx_exchange_to_user ON exchange_requests(to_user_id);
```

#### 確認項目
- [ ] Supabaseダッシュボードにアクセスできる
- [ ] S3バケットが作成されている
- [ ] 5つのテーブルが正しく作成されている

---

### Step 3: バックエンドコア実装（2-3日）

#### 3.1 基盤サービス

**backend/app/db/supabase.py:**
```python
import os
from supabase import create_client, Client

SUPABASE_URL = os.environ.get("SUPABASE_URL")
SUPABASE_KEY = os.environ.get("SUPABASE_KEY")

supabase: Client = create_client(SUPABASE_URL, SUPABASE_KEY)
```

**backend/app/services/storage.py:**
- `upload_to_s3(file_bytes, filename)` - S3アップロード
- `delete_from_s3(filename)` - S3削除
- `generate_s3_url(filename)` - パブリックURL生成

**backend/app/services/image.py:**
- `center_crop_to_square(image_bytes)` - センタークロップ
- `resize_and_compress(image, size=300)` - リサイズ・圧縮

#### 3.2 Pydanticモデル

**backend/app/models/clip.py:**
```python
from pydantic import BaseModel
from typing import List, Optional
from datetime import datetime

class ClipResponse(BaseModel):
    id: str
    image_url: str
    tags: List[str]
    page: int
    position: int
    is_public: bool
    created_at: datetime

class ClipCreate(BaseModel):
    tags: Optional[List[str]] = []
    page: Optional[int] = None
```

同様に実装:
- `backend/app/models/tag.py`
- `backend/app/models/exchange.py`

#### 3.3 FastAPIメイン

**backend/app/main.py:**
```python
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

app = FastAPI(title="Scrappa API", version="1.0.0")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:3000"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

@app.get("/")
def root():
    return {"message": "Scrappa API"}
```

#### 3.4 クリップAPI（認証なし版）

**backend/app/routers/clips.py:**

**POST /clips:**
1. multipart/form-dataでファイル受け取り
2. ファイルバリデーション（jpeg/png/webp、10MB以下）
3. center_crop_to_square() → resize_and_compress()
4. upload_to_s3()でS3にアップロード
5. Supabaseのclipsテーブルにレコード挿入
6. tagsがあればtagsテーブルに挿入・clip_tagsに関連付け

**GET /clips:**
1. クエリパラメータ: `tag`, `page`, `limit`
2. Supabaseから取得（JOIN: clips + clip_tags + tags）
3. ページネーション対応

#### 3.5 タグAPI（認証なし版）

**backend/app/routers/tags.py:**
- `GET /tags` - タグ一覧（clip_count付き）
- `POST /tags` - タグ作成
- `PATCH /tags/{id}` - タグ名変更
- `DELETE /tags/{id}` - タグ削除

#### 確認項目
- [ ] `uvicorn app.main:app --reload`で起動できる
- [ ] http://localhost:8000/docs でSwagger UIが表示される
- [ ] curlでPOST /clipsが成功する
- [ ] S3に画像がアップロードされる
- [ ] Supabaseにレコードが挿入される

---

### Step 4: 認証実装（1日）

#### 4.1 JWT検証ミドルウェア

**backend/app/middleware/auth.py:**
```python
from fastapi import Depends, HTTPException, Header
from jose import jwt, JWTError
import os

SUPABASE_JWT_SECRET = os.environ.get("SUPABASE_JWT_SECRET")

async def get_current_user(authorization: str = Header(None)):
    if not authorization:
        raise HTTPException(status_code=401, detail="Unauthorized")

    try:
        token = authorization.replace("Bearer ", "")
        payload = jwt.decode(token, SUPABASE_JWT_SECRET, algorithms=["HS256"])
        user_id = payload.get("sub")
        if not user_id:
            raise HTTPException(status_code=401, detail="Invalid token")
        return user_id
    except JWTError:
        raise HTTPException(status_code=401, detail="Invalid token")
```

#### 4.2 エンドポイントに認証を追加

- `POST /clips`に`user_id = Depends(get_current_user)`を追加
- `GET /clips`に条件付き認証を追加（user_idパラメータなし時のみ必須）
- タグAPIに認証を追加

#### 確認項目
- [ ] 認証なしでPOST /clipsが401エラーを返す
- [ ] 認証ありでPOST /clipsが成功する
- [ ] JWT検証が正しく動作する

---

### Step 5: フロントエンド基盤実装（1日）

#### 5.1 Supabaseクライアント

**frontend/src/lib/supabase.js:**
```javascript
import { createClient } from '@supabase/supabase-js'

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY

export const supabase = createClient(supabaseUrl, supabaseAnonKey)
```

#### 5.2 APIクライアント

**frontend/src/lib/api.js:**
```javascript
import axios from 'axios'
import { supabase } from './supabase'

const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL
})

api.interceptors.request.use(async (config) => {
  const { data: { session } } = await supabase.auth.getSession()
  if (session) {
    config.headers.Authorization = `Bearer ${session.access_token}`
  }
  return config
})

export default api
```

#### 5.3 ログイン画面

**frontend/src/pages/Login.jsx:**
1. リングノート表紙のデザイン
2. Googleログインボタン
3. ログイン成功時のフェードアウト遷移
4. Supabase Google OAuth実装

```javascript
import { supabase } from '../lib/supabase'

const handleGoogleLogin = async () => {
  await supabase.auth.signInWithOAuth({
    provider: 'google',
    options: {
      redirectTo: `${window.location.origin}/auth/callback`
    }
  })
}
```

#### 確認項目
- [ ] `npm run dev`でフロントエンドが起動する
- [ ] Googleログインボタンが表示される
- [ ] Google OAuth画面が表示される
- [ ] ログイン成功後にホーム画面に遷移する

---

### Step 6: フロントエンドUI実装（3-4日）

#### 6.1 カスタムフック

**frontend/src/hooks/useClips.js:**
```javascript
import { useState, useEffect } from 'react'
import api from '../lib/api'

export function useClips(tag = null) {
  const [clips, setClips] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    async function fetchClips() {
      try {
        const params = tag ? { tag } : {}
        const response = await api.get('/clips', { params })
        setClips(response.data.clips)
      } catch (error) {
        console.error(error)
      } finally {
        setLoading(false)
      }
    }
    fetchClips()
  }, [tag])

  return { clips, loading }
}
```

同様に実装: `frontend/src/hooks/useTags.js`

#### 6.2 スクラップブックコンポーネント

**frontend/src/components/book/ClipCard.jsx:**
- 正方形の画像表示
- タグ表示

**frontend/src/components/book/Page.jsx:**
- 3×4グリッドレイアウト
- 12枚のClipCardを配置

**frontend/src/components/book/Book.jsx:**
```javascript
import HTMLFlipBook from 'react-pageflip'
import Page from './Page'

export default function Book({ clips }) {
  const pages = []
  for (let i = 0; i < clips.length; i += 12) {
    pages.push(clips.slice(i, i + 12))
  }

  return (
    <HTMLFlipBook
      width={400}
      height={600}
      showCover={true}
      mobileScrollSupport={true}
    >
      {pages.map((pageClips, index) => (
        <div key={index} className="page">
          <Page clips={pageClips} pageNumber={index + 1} />
        </div>
      ))}
    </HTMLFlipBook>
  )
}
```

#### 6.3 Home画面

**frontend/src/pages/Home.jsx:**
- Bookコンポーネントの表示
- タグフィルター（横スクロール）
- アップロードボタン（＋ボタン）

#### 確認項目
- [ ] 画像が3×4グリッドで表示される
- [ ] ページめくりアニメーションが動作する
- [ ] タグフィルターで絞り込みができる

---

### Step 7: アップロード機能実装（2日）

#### 7.1 アップロードモーダル

**frontend/src/components/upload/UploadModal.jsx:**
```javascript
import { useState } from 'react'
import api from '../../lib/api'

export default function UploadModal({ isOpen, onClose, onSuccess }) {
  const [file, setFile] = useState(null)
  const [tags, setTags] = useState([])
  const [preview, setPreview] = useState(null)

  const handleFileSelect = (e) => {
    const selectedFile = e.target.files[0]
    setFile(selectedFile)
    setPreview(URL.createObjectURL(selectedFile))
  }

  const handleUpload = async () => {
    const formData = new FormData()
    formData.append('file', file)
    tags.forEach(tag => formData.append('tags', tag))

    try {
      await api.post('/clips', formData)
      onSuccess()
      onClose()
    } catch (error) {
      console.error(error)
    }
  }

  return (
    <div className={`modal ${isOpen ? 'open' : ''}`}>
      <input type="file" onChange={handleFileSelect} />
      {preview && <img src={preview} alt="Preview" />}
      {/* タグ選択UI */}
      <button onClick={handleUpload}>保存</button>
    </div>
  )
}
```

#### 確認項目
- [ ] ＋ボタンでモーダルが開く
- [ ] ドラッグ&ドロップが動作する
- [ ] プレビューが表示される
- [ ] アップロード成功後にメイン画面が更新される

---

### Step 8: レスポンシブ対応（1日）

#### 8.1 PC/モバイル判定

**frontend/src/components/book/Book.jsx:**
```javascript
const [isMobile, setIsMobile] = useState(window.innerWidth < 768)

useEffect(() => {
  const handleResize = () => {
    setIsMobile(window.innerWidth < 768)
  }
  window.addEventListener('resize', handleResize)
  return () => window.removeEventListener('resize', handleResize)
}, [])

return (
  <HTMLFlipBook
    width={isMobile ? 300 : 400}
    height={isMobile ? 450 : 600}
    size={isMobile ? 'stretch' : 'fixed'}
  >
    {/* ページ */}
  </HTMLFlipBook>
)
```

#### 確認項目
- [ ] ブラウザ幅でレイアウトが切り替わる
- [ ] モバイル表示で片面1ページになる
- [ ] PC表示で見開き2ページになる

---

### Step 9: デプロイ（1-2日）

#### 9.1 Renderへのバックエンドデプロイ

1. https://render.com で新規Web Service作成
2. Build Command: `pip install -r backend/requirements.txt`
3. Start Command: `cd backend && uvicorn app.main:app --host 0.0.0.0 --port $PORT`
4. Environment Variables設定（Supabase・S3）

#### 9.2 Vercelへのフロントエンドデプロイ

1. https://vercel.com でプロジェクト作成
2. Framework Preset: Vite
3. Root Directory: frontend
4. Environment Variables設定

#### 9.3 CORS設定更新

**backend/app/main.py:**
```python
app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        "http://localhost:3000",
        "https://your-app.vercel.app"  # 実際のVercel URLに変更
    ],
    ...
)
```

#### 確認項目
- [ ] Renderでバックエンドが起動している
- [ ] Vercelでフロントエンドがデプロイされている
- [ ] 本番環境でログイン→アップロード→表示が動作する

---

## Critical Files（重要ファイル）

実装時に最も重要なファイル（優先順位順）:

1. **backend/app/main.py**
   - FastAPIのエントリーポイント・CORS設定

2. **backend/app/routers/clips.py**
   - 画像アップロード・取得のコアロジック

3. **backend/app/services/image.py**
   - 画像処理（クロップ・リサイズ・圧縮）

4. **frontend/src/components/book/Book.jsx**
   - react-pageflipを使ったスクラップブック本体

5. **frontend/src/pages/Login.jsx**
   - Google OAuth実装とフェードアウト遷移

6. **frontend/src/lib/api.js**
   - JWT自動付与のAPIクライアント

---

## 検証方法

### ローカル環境での動作確認

1. バックエンド起動:
```bash
cd backend
uvicorn app.main:app --reload
```

2. フロントエンド起動:
```bash
cd frontend
npm run dev
```

3. テストシナリオ:
   - [ ] ログイン → ホーム画面遷移
   - [ ] アップロードモーダルで画像アップロード
   - [ ] タグフィルターで絞り込み
   - [ ] ページめくり動作確認
   - [ ] レスポンシブ動作確認

### 本番環境での動作確認

1. デプロイされたURLにアクセス
2. ログイン → アップロード → 表示の一連の流れを確認
3. 複数デバイスでレスポンシブ確認

---

## 実装期間見積もり

**合計: 12-16日**

- 環境構築: 1日
- インフラ: 1日
- バックエンドコア: 2-3日
- 認証: 1日
- フロントエンド基盤: 1日
- UI実装: 3-4日
- アップロード機能: 2日
- レスポンシブ対応: 1日
- デプロイ: 1-2日

---

## 次のステップ（MVP完成後）

- Phase 2: ドラッグ&ドロップ並び替え、他ユーザーのブック閲覧
- Phase 3: カード交換機能、通知機能