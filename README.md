# Scrappa 詳細設計書

**Version 1.0 | 2026年3月24日**

本ドキュメントはScrappa（デザイン収集スクラップブックWebアプリ）の全体設計をまとめたものです。技術スタック・機能設計・画面設計・データ設計・APIエンドポイント設計を含みます。

---

## 目次

1. [アプリ概要](#1-アプリ概要)
2. [技術スタック](#2-技術スタック)
3. [機能設計](#3-機能設計)
4. [画面設計](#4-画面設計)
5. [データ設計](#5-データ設計)
6. [ディレクトリ構成](#6-ディレクトリ構成)
7. [APIエンドポイント設計](#7-apiエンドポイント設計)
8. [環境変数](#8-環境変数)
9. [実装ロードマップ](#9-実装ロードマップ)

---

## 1. アプリ概要

### 1.1 コンセプト

気に入ったロゴやパッケージなどのデザイン写真を正方形にトリミングして、リングノート風のスクラップブックとして保存・閲覧・交換できるWebアプリ。

「デジタルなのに手触り感がある、アナログなコレクション帳」を世界観のコアに置き、ユーザーが自分だけのデザインコレクションを育てていく体験を提供する。

### 1.2 アプリ名

**Scrappa（スクラッパ）**

scrap（切り取る・スクラップ）＋ 軽い語尾。読みやすく・覚えやすく・国際的に通じる名前。

### 1.3 主要機能

- デザイン写真の撮影・アップロードと正方形クロップ
- リングノート風スクラップブックへの収集・整理
- タグによる分類・フィルタリング
- 他ユーザーのスクラップブック閲覧
- ユーザー間のカード交換（物理的な所有権移転）

---

## 2. 技術スタック

### 2.1 確定スタック

| レイヤー | 技術 | 用途 |
|---|---|---|
| フロントエンド | React（Vercel） | UI全般・SPA構成 |
| フロントデプロイ | Vercel | 静的ホスティング・CDN |
| ページめくり | react-pageflip | スクラップブック演出 |
| 並び替え | dnd-kit | ドラッグ＆ドロップ（Phase 2） |
| バックエンド | FastAPI（Python） | REST API |
| バックデプロイ | Render | APIサーバーホスティング |
| 画像処理 | Pillow | センタークロップ・圧縮 |
| ストレージ | AWS S3 | 画像ファイル永続保存 |
| DB | Supabase（PostgreSQL） | メタデータ・ユーザー情報 |
| 認証 | Supabase Auth | Google OAuth 2.0 |

### 2.2 フロントエンドライブラリ

| ライブラリ | 用途 |
|---|---|
| react-pageflip | ページめくりアニメーション（PC見開き・モバイル片面） |
| dnd-kit | クリップのドラッグ＆ドロップ並び替え（Phase 2） |
| Cropper.js | 手動トリミングUI（Phase 2） |
| axios / fetch | FastAPI REST APIとの通信 |
| @supabase/supabase-js | Supabase認証クライアント |

### 2.3 バックエンドライブラリ

| ライブラリ | 用途 |
|---|---|
| fastapi | Webフレームワーク・自動API仕様書生成（/docs） |
| uvicorn | ASGIサーバー（Render上での起動） |
| Pillow | 画像のセンタークロップ・リサイズ・圧縮 |
| boto3 | AWS S3へのファイルアップロード・削除 |
| supabase-py | SupabaseクライアントSDK（DB操作） |
| python-jose | JWTトークン検証（Supabase Auth連携） |
| pydantic | リクエスト・レスポンスのスキーマ定義・バリデーション |

---

## 3. 機能設計

### 3.1 MVP（最初に作る機能）

- 画像アップロード → Pillowでセンタークロップ・圧縮 → S3保存
- リングノート風スクラップブック表示（react-pageflip）
- タグ付与・フィルタリング
- Googleログイン（Supabase Google OAuth）
- ログイン時：フェードアウト遷移

### 3.2 Phase 2

- ドラッグ＆ドロップ並び替え（dnd-kit）
- 他ユーザーのスクラップブック閲覧（未ログインでも閲覧可）
- 公開・非公開設定
- 手動トリミングUI（Cropper.js）
- ログイン時：表紙めくりアニメーション

### 3.3 Phase 3

- カード交換機能（リクエスト → 承認 → 所有権移転）
- 通知機能
- カラーパレット自動抽出（Pillowで主要色取得）

---

## 4. 画面設計

### 4.1 画面一覧

| No. | 画面名 | 説明 | 認証 |
|---|---|---|---|
| 01 | ログイン画面 | リングノート表紙・Googleログインボタン・フェードアウト遷移 | 不要 |
| 02 | メイン画面（PC） | 見開き2ページ・中央リング・3×4グリッド・タグフィルター | 必要 |
| 03 | メイン画面（モバイル） | 片面1ページ・左側リング・3×4グリッド・横スクロールタグ | 必要 |
| 04 | アップロードモーダル | ドラッグ&ドロップ・プレビュー・タグ選択・保存 | 必要 |
| 05 | 他ユーザーのブック | 画面02と同構成・追加ボタンなし・カードクリックで交換モーダル | 不要 |
| 06 | 交換リクエストモーダル | 相手カード表示・差し出すカード選択・リクエスト送信 | 必要 |
| 07 | 交換リクエスト一覧 | もらったリクエスト（承認/拒否）・送ったリクエスト（保留中） | 必要 |

### 4.2 デザイン方針

| 項目 | 内容 |
|---|---|
| 世界観 | デジタルなのに手触り感がある、アナログ文具・コレクション帳の質感 |
| カラー | モノクロ（黒・白・グレー）＋ アイボリー（#F5F2E8） |
| ノート形状 | B4縦・ダブルリング（ゴールド） |
| 方眼テクスチャ | 背景・ページ・モーダル全体に方眼紙パターンを適用 |
| フォント | Caveat（ロゴ・タイトル）＋ Noto Serif JP（本文・UI） |
| PC表示 | 見開き2ページ（中央リング）・1ページあたり3×4グリッド（12枚） |
| モバイル表示 | 片面1ページ（左側リング）・1ページあたり3×4グリッド（12枚） |

### 4.3 レスポンシブ対応

| 環境 | 判定条件 | 表示形式 | リング位置 | 総ページ数 |
|---|---|---|---|---|
| PC | 横幅 768px 以上 | 見開き2ページ | 中央 | 基準 |
| モバイル | 横幅 768px 未満 | 片面1ページ | 左側 | PC比2倍 |

### 4.4 画面遷移

```
ログイン画面
  └─ Googleログイン成功・フェードアウト
       ↓
メイン画面
  ├─ ［＋ボタン］──────────────→ アップロードモーダル
  ├─ ［通知アイコン］────────→ 交換リクエスト一覧
  └─ ［他ユーザーのブック遷移］→ 他ユーザーのブック画面
                                      └─ ［カードクリック］→ 交換リクエストモーダル
```

---

## 5. データ設計

### 5.1 テーブル関係（ER図）

```
auth.users（Supabase管理）
  └── users
        └── clips ──── clip_tags ──── tags
```

> `exchange_requests` テーブルは Phase 3 で追加予定。MVP には含まない。

### 5.2 usersテーブル

```sql
CREATE TABLE users (
  id          UUID PRIMARY KEY REFERENCES auth.users(id),
  username    TEXT NOT NULL UNIQUE,
  avatar_url  TEXT,
  created_at  TIMESTAMP NOT NULL DEFAULT NOW()
);
```

| カラム名 | 型 | 制約 | 説明 |
|---|---|---|---|
| id | UUID | PK, FK→auth.users | SupabaseのユーザーID |
| username | TEXT | NOT NULL, UNIQUE | 表示名 |
| avatar_url | TEXT | NULL可 | アバター画像URL |
| created_at | TIMESTAMP | NOT NULL, DEFAULT NOW() | 作成日時 |

> `is_public` は Phase 2-3（公開/非公開設定）で追加予定。MVP では全ユーザー公開前提。

### 5.3 clipsテーブル

```sql
CREATE TABLE clips (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id     UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  image_url   TEXT NOT NULL,
  page        INTEGER NOT NULL DEFAULT 1,
  position    INTEGER NOT NULL DEFAULT 0,
  created_at  TIMESTAMP NOT NULL DEFAULT NOW()
);
```

| カラム名 | 型 | 制約 | 説明 |
|---|---|---|---|
| id | UUID | PK, DEFAULT gen_random_uuid() | クリップID |
| user_id | UUID | NOT NULL, FK→users, CASCADE | 所有ユーザー |
| image_url | TEXT | NOT NULL | S3の画像URL |
| page | INTEGER | NOT NULL, DEFAULT 1 | 配置ページ番号 |
| position | INTEGER | NOT NULL, DEFAULT 0 | ページ内の順番 |
| created_at | TIMESTAMP | NOT NULL, DEFAULT NOW() | 作成日時 |

> image_urlの例：`https://bucket-name.s3.ap-northeast-1.amazonaws.com/clips/uuid.jpg`
>
> `is_public` は Phase 2-3（公開/非公開設定）で追加予定。MVP では全クリップ公開前提。

### 5.4 tagsテーブル

```sql
CREATE TABLE tags (
  id       UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id  UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  name     TEXT NOT NULL,
  UNIQUE (user_id, name)
);
```

| カラム名 | 型 | 制約 | 説明 |
|---|---|---|---|
| id | UUID | PK | タグID |
| user_id | UUID | NOT NULL, FK→users, CASCADE | 所有ユーザー |
| name | TEXT | NOT NULL | タグ名 |
| — | — | UNIQUE(user_id, name) | 同一ユーザー内でname一意 |

> タグはユーザーをまたいで共有しない。同名タグでも別ユーザーなら別レコード。

### 5.5 clip_tagsテーブル（中間テーブル）

```sql
CREATE TABLE clip_tags (
  clip_id  UUID NOT NULL REFERENCES clips(id) ON DELETE CASCADE,
  tag_id   UUID NOT NULL REFERENCES tags(id) ON DELETE CASCADE,
  PRIMARY KEY (clip_id, tag_id)
);
```

| カラム名 | 型 | 制約 | 説明 |
|---|---|---|---|
| clip_id | UUID | NOT NULL, FK→clips, CASCADE | クリップID |
| tag_id | UUID | NOT NULL, FK→tags, CASCADE | タグID |
| — | — | PRIMARY KEY(clip_id, tag_id) | 複合主キー |

### 5.6 exchange_requestsテーブル（Phase 3）

> **MVP には含まない。** Phase 3-1 で追加予定。

```sql
CREATE TABLE exchange_requests (
  id             UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  from_user_id   UUID NOT NULL REFERENCES users(id),
  to_user_id     UUID NOT NULL REFERENCES users(id),
  offer_clip_id  UUID NOT NULL REFERENCES clips(id),
  want_clip_id   UUID NOT NULL REFERENCES clips(id),
  status         TEXT NOT NULL DEFAULT 'pending',
  created_at     TIMESTAMP NOT NULL DEFAULT NOW(),
  CONSTRAINT status_check CHECK (status IN ('pending', 'accepted', 'rejected'))
);
```

### 5.7 画像交換時のトランザクション（Phase 3）

> **MVP には含まない。** Phase 3-1 で実装予定。

承認時は以下の3操作をトランザクションで原子的に実行する。途中で失敗した場合は全てロールバックする。

```python
async def accept_exchange(request_id: str):
    async with db.transaction():
        request = await get_exchange_request(request_id)

        # 1. ステータス更新
        await update_request_status(request_id, "accepted")

        # 2. offer_clipの所有者を変更（末尾に追加）
        await update_clip_owner(
            clip_id=request.offer_clip_id,
            new_owner=request.to_user_id
        )

        # 3. want_clipの所有者を変更（末尾に追加）
        await update_clip_owner(
            clip_id=request.want_clip_id,
            new_owner=request.from_user_id
        )
```

---

## 6. ディレクトリ構成

### 6.1 モノレポ構成

```
scrappa/
├── frontend/          # React（Vercel）
├── backend/           # FastAPI（Render）
└── README.md
```

### 6.2 フロントエンド（frontend/）

```
frontend/
├── src/
│   ├── components/
│   │   ├── ui/                    # 汎用UIパーツ
│   │   │   ├── Button.jsx
│   │   │   └── Modal.jsx
│   │   ├── book/                  # スクラップブック関連
│   │   │   ├── Book.jsx           # react-pageflip本体
│   │   │   ├── Page.jsx           # 見開き1ページ
│   │   │   └── ClipCard.jsx       # 画像1枚
│   │   ├── upload/                # アップロード関連
│   │   │   ├── UploadModal.jsx
│   │   │   └── CropPreview.jsx
│   │   └── exchange/              # 交換関連
│   │       ├── ExchangeModal.jsx
│   │       └── RequestList.jsx
│   ├── pages/
│   │   ├── Login.jsx              # ログイン画面
│   │   ├── Home.jsx               # 自分のブック（メイン）
│   │   └── User.jsx               # 他ユーザーのブック
│   ├── hooks/
│   │   ├── useClips.js            # クリップ取得・操作
│   │   ├── useTags.js             # タグ取得・操作
│   │   └── useExchange.js         # 交換リクエスト操作
│   ├── lib/
│   │   ├── api.js                 # FastAPIへのfetch
│   │   └── supabase.js            # Supabaseクライアント
│   ├── App.jsx
│   └── main.jsx
├── .env                           # 環境変数
└── package.json
```

### 6.3 バックエンド（backend/）

```
backend/
├── app/
│   ├── routers/
│   │   ├── clips.py               # /clips エンドポイント
│   │   ├── tags.py                # /tags エンドポイント
│   │   └── exchanges.py           # /exchanges エンドポイント
│   ├── services/
│   │   ├── image.py               # Pillowでクロップ・圧縮
│   │   └── storage.py             # boto3でS3操作
│   ├── models/
│   │   ├── clip.py                # Pydanticスキーマ
│   │   ├── tag.py
│   │   └── exchange.py
│   ├── db/
│   │   └── supabase.py            # Supabaseクライアント
│   └── main.py                    # FastAPIエントリーポイント
├── .env                           # 環境変数
└── requirements.txt
```

---

## 7. APIエンドポイント設計

### 7.1 共通仕様

**ベースURL**

- 開発環境：`http://localhost:8000`
- 本番環境：`https://your-app.onrender.com`

**認証**

Supabase AuthのJWTトークンをAuthorizationヘッダーで送信する。

```
Authorization: Bearer {supabase_jwt_token}
```

**認証要件の分類**

| 分類 | 説明 |
|---|---|
| 必要 | 有効なJWTトークンが必須。なければ401を返す。 |
| 条件付き | トークンがあれば検証。なくてもアクセス可（公開リソースのみ）。 |
| 不要 | 認証なしでアクセス可能。 |

**エラーレスポンス共通形式**

```json
{
  "error": {
    "code": "ERROR_CODE",
    "message": "エラーの説明"
  }
}
```

**エラーコード一覧**

| code | HTTPステータス | 説明 |
|---|---|---|
| UNAUTHORIZED | 401 | 未認証（トークンなし・無効） |
| FORBIDDEN | 403 | 権限なし（他人のリソースへのアクセス） |
| NOT_FOUND | 404 | リソースが存在しない |
| DUPLICATE_TAG | 400 | 同名タグが既に存在する |
| DUPLICATE_REQUEST | 400 | 同じ組み合わせの交換リクエストが既に存在 |
| INVALID_FILE | 400 | ファイル形式・サイズ不正 |
| INVALID_STATUS | 400 | 操作できないステータス |
| S3_ERROR | 500 | S3操作失敗 |

---

### 7.2 /clips — 画像管理

#### `GET /clips` — 画像一覧取得

**認証：条件付き**

| パラメータ | 型 | 必須 | 説明 |
|---|---|---|---|
| user_id | string | 任意 | 指定時は他ユーザーの公開クリップを取得（認証不要） |
| tag | string | 任意 | タグ名で絞り込み |
| page | integer | 任意 | ページ番号（デフォルト：1） |
| limit | integer | 任意 | 取得件数（デフォルト：24） |

> user_idなし＆認証あり → 自分のクリップ全件（公開・非公開）
>
> user_idあり＆認証不要 → 指定ユーザーの公開クリップのみ

**レスポンス 200**

```json
{
  "clips": [
    {
      "id": "uuid-xxxx",
      "image_url": "https://bucket.s3.ap-northeast-1.amazonaws.com/clips/uuid.jpg",
      "tags": ["ロゴ", "モノクロ"],
      "page": 1,
      "position": 0,
      "is_public": true,
      "created_at": "2026-03-24T10:00:00"
    }
  ],
  "total": 32,
  "page": 1,
  "limit": 24
}
```

---

#### `POST /clips` — 画像アップロード

**認証：必要　Content-Type：multipart/form-data**

| フィールド | 型 | 必須 | 説明 |
|---|---|---|---|
| file | File | ○ | 画像ファイル（jpeg / png / webp・上限10MB） |
| tags | string[] | 任意 | タグ名の配列（新規タグは自動作成） |
| page | integer | 任意 | 追加先ページ（省略時は最終ページ） |

**処理フロー**

1. ファイルのバリデーション（形式・サイズ上限10MB）
2. Pillowでセンタークロップ → 正方形
3. 300×300px にリサイズ・品質75%で圧縮（JPEG変換）
4. boto3でS3にアップロード（パス：`clips/{uuid}.jpg`）
5. Supabaseのclipsテーブルにレコード挿入
6. 新規タグはtagsテーブルに挿入 → clip_tagsに中間レコード挿入

**レスポンス 201**

```json
{
  "id": "uuid-xxxx",
  "image_url": "https://bucket.s3.ap-northeast-1.amazonaws.com/clips/uuid.jpg",
  "tags": ["ロゴ"],
  "page": 1,
  "position": 6,
  "created_at": "2026-03-24T10:00:00"
}
```

**エラー**

| code | 条件 |
|---|---|
| INVALID_FILE | 形式がjpeg/png/webp以外・サイズ10MB超過 |
| S3_ERROR | S3アップロード失敗 |

---

#### `GET /clips/{id}` — 画像詳細取得

**認証：条件付き（非公開クリップは本人のみアクセス可）**

**レスポンス 200**

```json
{
  "id": "uuid-xxxx",
  "image_url": "https://bucket.s3.ap-northeast-1.amazonaws.com/clips/uuid.jpg",
  "tags": ["ロゴ", "モノクロ"],
  "page": 1,
  "position": 0,
  "is_public": true,
  "created_at": "2026-03-24T10:00:00"
}
```

**エラー**

| code | 条件 |
|---|---|
| FORBIDDEN | 非公開クリップに未認証または他ユーザーがアクセス |
| NOT_FOUND | IDが存在しない |

---

#### `PATCH /clips/{id}` — メタデータ・タグ更新

**認証：必要　送ったフィールドのみ更新（部分更新）**

**リクエストボディ**

```json
{
  "tags": ["ロゴ", "タイポグラフィ"],
  "page": 2,
  "position": 3,
  "is_public": false
}
```

> tagsは差分更新でなく全置き換え。送った配列が新しいタグ一覧になる。
>
> 新規タグ名が含まれる場合はtagsテーブルに自動作成する。

**レスポンス 200**

```json
{
  "id": "uuid-xxxx",
  "tags": ["ロゴ", "タイポグラフィ"],
  "page": 2,
  "position": 3,
  "is_public": false,
  "updated_at": "2026-03-24T11:00:00"
}
```

**エラー**

| code | 条件 |
|---|---|
| FORBIDDEN | 他ユーザーのクリップを編集しようとした |
| NOT_FOUND | IDが存在しない |

---

#### `DELETE /clips/{id}` — 画像削除

**認証：必要**

**処理フロー**

1. clip_tagsテーブルの中間レコードを削除
2. S3から画像ファイルを削除（パス：`clips/{uuid}.jpg`）
3. clipsテーブルのレコードを削除

**レスポンス：204 No Content**

**エラー**

| code | 条件 |
|---|---|
| FORBIDDEN | 他ユーザーのクリップを削除しようとした |
| NOT_FOUND | IDが存在しない |

---

#### `PATCH /clips/reorder` — 並び替え一括更新

**認証：必要　ドラッグ＆ドロップ後に全件まとめて更新（Phase 2）**

**リクエストボディ**

```json
{
  "clips": [
    { "id": "uuid-aaaa", "page": 1, "position": 0 },
    { "id": "uuid-bbbb", "page": 1, "position": 1 },
    { "id": "uuid-cccc", "page": 2, "position": 0 }
  ]
}
```

> トランザクションで全件まとめて更新。途中失敗時は全ロールバック。

**レスポンス 200**

```json
{ "updated": 3 }
```

---

### 7.3 /tags — タグ管理

#### `GET /tags` — タグ一覧取得

**認証：必要　自分のタグ一覧をclip_count付きで返す**

**レスポンス 200**

```json
{
  "tags": [
    { "id": "uuid-xxxx", "name": "ロゴ", "clip_count": 12 },
    { "id": "uuid-yyyy", "name": "パッケージ", "clip_count": 8 }
  ]
}
```

> clip_countはフィルターUI表示用（例：「ロゴ (12)」）。

---

#### `POST /tags` — タグ作成

**認証：必要**

**リクエストボディ**

```json
{ "name": "タイポグラフィ" }
```

**処理フロー**

1. 同一ユーザー内で同名タグが存在しないか確認
2. tagsテーブルにレコード挿入

**レスポンス 201**

```json
{ "id": "uuid-xxxx", "name": "タイポグラフィ", "clip_count": 0 }
```

**エラー**

| code | 条件 |
|---|---|
| DUPLICATE_TAG | 同名タグが既に存在する |

---

#### `PATCH /tags/{id}` — タグ名変更

**認証：必要**

**リクエストボディ**

```json
{ "name": "タイポ" }
```

**処理フロー**

1. タグの所有者確認
2. 同一ユーザー内で変更後の名前が存在しないか確認
3. tagsテーブルのnameを更新

**レスポンス 200**

```json
{ "id": "uuid-xxxx", "name": "タイポ", "clip_count": 5 }
```

**エラー**

| code | 条件 |
|---|---|
| DUPLICATE_TAG | 変更後の名前が既に存在する |
| FORBIDDEN | 他ユーザーのタグを編集しようとした |
| NOT_FOUND | IDが存在しない |

---

#### `DELETE /tags/{id}` — タグ削除

**認証：必要**

**処理フロー**

1. タグの所有者確認
2. clip_tagsテーブルの中間レコードを削除（クリップ自体は削除しない）
3. tagsテーブルのレコードを削除

**レスポンス：204 No Content**

**エラー**

| code | 条件 |
|---|---|
| FORBIDDEN | 他ユーザーのタグを削除しようとした |
| NOT_FOUND | IDが存在しない |

---

### 7.4 /exchanges — 交換リクエスト管理

#### `GET /exchanges` — 交換リクエスト一覧取得

**認証：必要　もらったリクエスト（received）と送ったリクエスト（sent）を一括返却**

**レスポンス 200**

```json
{
  "received": [
    {
      "id": "uuid-xxxx",
      "from_user": { "id": "...", "username": "minami_design", "avatar_url": "..." },
      "offer_clip": { "id": "...", "image_url": "https://...", "tags": ["パッケージ"] },
      "want_clip":  { "id": "...", "image_url": "https://...", "tags": ["ロゴ"] },
      "status": "pending",
      "created_at": "2026-03-24T10:00:00"
    }
  ],
  "sent": [
    {
      "id": "uuid-yyyy",
      "to_user": { "id": "...", "username": "hana_scrap", "avatar_url": "..." },
      "offer_clip": { "id": "...", "image_url": "https://...", "tags": ["ロゴ"] },
      "want_clip":  { "id": "...", "image_url": "https://...", "tags": ["その他"] },
      "status": "pending",
      "created_at": "2026-03-22T09:00:00"
    }
  ]
}
```

---

#### `POST /exchanges` — 交換リクエスト送信

**認証：必要**

**リクエストボディ**

```json
{ "offer_clip_id": "uuid-eeee", "want_clip_id": "uuid-ffff" }
```

**処理フロー**

1. offer_clip_idが自分のクリップか確認
2. want_clip_idが相手のクリップか確認
3. want_clipがis_public=trueか確認
4. 同じoffer/want組み合わせのpendingリクエストが既にないか確認
5. exchange_requestsテーブルにレコード挿入

**レスポンス 201**

```json
{
  "id": "uuid-xxxx",
  "offer_clip_id": "uuid-eeee",
  "want_clip_id": "uuid-ffff",
  "status": "pending",
  "created_at": "2026-03-24T10:00:00"
}
```

**エラー**

| code | 条件 |
|---|---|
| FORBIDDEN | offer_clip_idが自分のクリップでない |
| FORBIDDEN | want_clipがis_public=false（非公開） |
| DUPLICATE_REQUEST | 同じ組み合わせのpendingリクエストが既に存在 |
| NOT_FOUND | clip_idが存在しない |

---

#### `PATCH /exchanges/{id}` — 交換リクエスト承認・拒否

**認証：必要　自分宛のリクエストのみ操作可能**

**リクエストボディ**

```json
{ "action": "accept" }
```

| action | 説明 |
|---|---|
| accept | 承認する |
| reject | 拒否する |

**accept時の処理フロー（トランザクション）**

1. exchange_requests.status を accepted に更新
2. offer_clip の user_id を to_user_id に変更・page/positionを末尾に再設定
3. want_clip の user_id を from_user_id に変更・page/positionを末尾に再設定

> 3操作をトランザクションで原子的に実行。途中失敗時は全ロールバック。

**reject時の処理フロー**

- exchange_requests.status を rejected に更新するのみ（クリップ移動なし）

**レスポンス 200**

```json
{ "id": "uuid-xxxx", "status": "accepted", "updated_at": "2026-03-24T11:00:00" }
```

**エラー**

| code | 条件 |
|---|---|
| FORBIDDEN | 自分宛でないリクエストを操作しようとした |
| INVALID_STATUS | すでにaccept/reject済みのリクエストを操作しようとした |
| NOT_FOUND | IDが存在しない |

---

#### `DELETE /exchanges/{id}` — 交換リクエスト取り消し

**認証：必要　pending中のリクエストのみ取り消し可能**

**処理フロー**

1. リクエストの送信者（from_user_id）が自分か確認
2. statusがpendingか確認（accept/reject済みは取り消し不可）
3. レコードを削除

**レスポンス：204 No Content**

**エラー**

| code | 条件 |
|---|---|
| FORBIDDEN | 自分が送ったリクエストでない |
| INVALID_STATUS | pending以外のリクエストは取り消し不可 |
| NOT_FOUND | IDが存在しない |

---

### 7.5 エンドポイント全体まとめ

| メソッド | エンドポイント | 認証 | 説明 |
|---|---|---|---|
| GET | /clips | 条件付き | 一覧取得（user_id指定で他ユーザー・認証不要） |
| POST | /clips | 必要 | 画像アップロード |
| GET | /clips/{id} | 条件付き | 詳細取得（非公開は本人のみ） |
| PATCH | /clips/{id} | 必要 | メタデータ・タグ更新（部分更新） |
| DELETE | /clips/{id} | 必要 | 削除（S3も削除） |
| PATCH | /clips/reorder | 必要 | 並び替え一括更新 |
| GET | /tags | 必要 | タグ一覧取得（clip_count付き） |
| POST | /tags | 必要 | タグ作成 |
| PATCH | /tags/{id} | 必要 | タグ名変更 |
| DELETE | /tags/{id} | 必要 | タグ削除 |
| GET | /exchanges | 必要 | リクエスト一覧（received / sent） |
| POST | /exchanges | 必要 | リクエスト送信 |
| PATCH | /exchanges/{id} | 必要 | 承認・拒否 |
| DELETE | /exchanges/{id} | 必要 | リクエスト取り消し（pending中のみ） |

---

## 8. 環境変数

### 8.1 バックエンド（backend/.env）

| 変数名 | 説明 | 例 |
|---|---|---|
| SUPABASE_URL | SupabaseプロジェクトURL | https://xxxx.supabase.co |
| SUPABASE_KEY | Supabase Service Roleキー | eyJ... |
| S3_BUCKET_NAME | S3バケット名 | scrappa-images |
| AWS_ACCESS_KEY_ID | AWSアクセスキー | AKIA... |
| AWS_SECRET_ACCESS_KEY | AWSシークレットキー | xxxx |
| AWS_REGION | AWSリージョン | ap-northeast-1 |

### 8.2 フロントエンド（frontend/.env）

| 変数名 | 説明 | 例 |
|---|---|---|
| VITE_API_URL | FastAPIのベースURL | https://your-app.onrender.com |
| VITE_SUPABASE_URL | SupabaseプロジェクトURL | https://xxxx.supabase.co |
| VITE_SUPABASE_ANON_KEY | Supabase Anon Key（公開可） | eyJ... |

---

## 9. 実装ロードマップ

### 9.1 MVP実装ステップ

| Step | 内容 | 主な作業 |
|---|---|---|
| 1 | インフラセットアップ | Supabase・S3バケット・Render・Vercelの初期設定 |
| 2 | DBマイグレーション | Supabaseで4テーブル作成（users・clips・tags・clip_tags） |
| 3 | 認証実装 | FastAPI：JWT検証ミドルウェア・Supabase Google OAuth |
| 4 | 画像アップロードAPI | POST /clips：Pillow + boto3 + Supabaseレコード挿入 |
| 5 | クリップ一覧API | GET /clips：フィルタリング・ページネーション |
| 6 | タグAPI | GET/POST/PATCH/DELETE /tags |
| 7 | Reactログイン画面 | Supabase Google OAuth・フェードアウト遷移 |
| 8 | Reactメイン画面 | react-pageflip・クリップグリッド・APIとの接続 |
| 9 | アップロードモーダル | ドラッグ&ドロップ・プレビュー・タグ選択 |
| 10 | 動作確認・デプロイ | Render/Vercelへのデプロイ・CORS設定・E2Eテスト |

### 9.2 Phase 2以降

| Phase | 内容 |
|---|---|
| Phase 2-1 | 他ユーザーのスクラップブック閲覧（GET /clips?user_id=xxx） |
| Phase 2-2 | 公開・非公開設定（users.is_public・clips.is_public カラム追加） |
| Phase 2-3 | 手動トリミングUI（Cropper.js） |
| Phase 2-4 | ログイン時の表紙めくりアニメーション |
| Phase 3-1 | 交換機能API（POST/PATCH/DELETE /exchanges） |
| Phase 3-2 | 交換リクエストUI（モーダル・一覧画面） |
| Phase 3-3 | 通知機能 |
| Phase 3-4 | カラーパレット自動抽出 |

---

*以上*