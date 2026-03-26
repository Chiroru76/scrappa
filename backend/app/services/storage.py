import boto3
import os
from botocore.exceptions import ClientError

# S3クライアント初期化
s3_client = boto3.client(
    's3',
    aws_access_key_id=os.environ.get('AWS_ACCESS_KEY_ID'),
    aws_secret_access_key=os.environ.get('AWS_SECRET_ACCESS_KEY'),
    region_name=os.environ.get('AWS_REGION')
)

BUCKET_NAME = os.environ.get('S3_BUCKET_NAME')
REGION = os.environ.get('AWS_REGION')

def upload_to_s3(file_bytes: bytes, filename: str) -> str:
    """
    S3にファイルをアップロード
    
    Args:
        file_bytes: ファイルのバイトデータ
        filename: S3のキー（例: clips/uuid.jpg）
    
    Returns:
        S3のパブリックURL
    """
    try:
        s3_client.put_object(
            Bucket=BUCKET_NAME,
            Key=filename,
            Body=file_bytes,
            ContentType='image/jpeg'  # JPEGに統一
        )
        # パブリックURL生成
        url = f"https://{BUCKET_NAME}.s3.{REGION}.amazonaws.com/{filename}"
        return url
    except ClientError as e:
        raise Exception(f"S3アップロード失敗: {e}")

def delete_from_s3(filename: str) -> None:
    """
    S3からファイルを削除
    
    Args:
        filename: S3のキー
    """
    try:
        s3_client.delete_object(Bucket=BUCKET_NAME, Key=filename)
    except ClientError as e:
        raise Exception(f"S3削除失敗: {e}")

def generate_s3_url(filename: str) -> str:
    """
    S3のパブリックURLを生成
    
    Args:
        filename: S3のキー
    
    Returns:
        パブリックURL
    """
    return f"https://{BUCKET_NAME}.s3.{REGION}.amazonaws.com/{filename}"