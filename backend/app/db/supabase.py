import os
from supabase import create_client, Client

# 環境変数から取得
SUPABASE_URL = os.environ.get("SUPABASE_URL")
SUPABASE_KEY = os.environ.get("SUPABASE_KEY")

# クライアント作成（シングルトン）
supabase: Client = create_client(SUPABASE_URL, SUPABASE_KEY)