-- お問い合わせテーブル
CREATE TABLE IF NOT EXISTS contact_messages (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  email TEXT NOT NULL,
  subject TEXT NOT NULL,
  body TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- RLS有効化
ALTER TABLE contact_messages ENABLE ROW LEVEL SECURITY;

-- 誰でも挿入可能（バックエンドがサービスロールで操作）
CREATE POLICY "Anyone can insert contact messages"
  ON contact_messages FOR INSERT
  WITH CHECK (true);

-- 管理者のみ参照可能（サービスロール経由）
CREATE POLICY "Service role can select contact messages"
  ON contact_messages FOR SELECT
  USING (false);
