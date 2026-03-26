from PIL import Image
import io

def center_crop_to_square(image_bytes: bytes) -> bytes:
    """
    画像をセンタークロップで正方形化
    
    Args:
        image_bytes: 元画像のバイトデータ
    
    Returns:
        正方形にクロップされた画像のバイトデータ
    """
    # 画像を開く
    img = Image.open(io.BytesIO(image_bytes))
    
    # RGB変換（PNGのRGBA等を統一）
    if img.mode != 'RGB':
        img = img.convert('RGB')
    
    # センタークロップ
    width, height = img.size
    min_size = min(width, height)
    
    # 中央を基準に正方形を切り出す
    left = (width - min_size) // 2
    top = (height - min_size) // 2
    right = left + min_size
    bottom = top + min_size
    
    img_cropped = img.crop((left, top, right, bottom))
    
    # バイトデータに変換
    output = io.BytesIO()
    img_cropped.save(output, format='JPEG', quality=100)  # クロップ時は高品質維持
    return output.getvalue()

def resize_and_compress(image_bytes: bytes, size: int = 300) -> bytes:
    """
    画像をリサイズ・圧縮
    
    Args:
        image_bytes: 画像のバイトデータ
        size: 正方形のサイズ（デフォルト: 300px）
    
    Returns:
        リサイズ・圧縮された画像のバイトデータ
    """
    # 画像を開く
    img = Image.open(io.BytesIO(image_bytes))
    
    # リサイズ（高品質なLANCZOS法）
    img_resized = img.resize((size, size), Image.LANCZOS)
    
    # JPEG圧縮（品質75%、最適化ON）
    output = io.BytesIO()
    img_resized.save(output, format='JPEG', quality=75, optimize=True)
    return output.getvalue()

def process_image(image_bytes: bytes) -> bytes:
    """
    画像処理の完全なパイプライン
    
    Args:
        image_bytes: 元画像のバイトデータ
    
    Returns:
        処理済み画像のバイトデータ（300x300px JPEG）
    """
    # 1. センタークロップで正方形化
    cropped = center_crop_to_square(image_bytes)
    
    # 2. 300x300にリサイズ・圧縮
    processed = resize_and_compress(cropped, size=300)
    
    return processed