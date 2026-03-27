/**
 * 画像URLからImageオブジェクトを非同期で生成する
 */
function createImage(url) {
  return new Promise((resolve, reject) => {
    const image = new Image()
    image.addEventListener('load', () => resolve(image))
    image.addEventListener('error', reject)
    image.src = url
  })
}

/**
 * react-easy-cropが返すcroppedAreaPixels座標を使って
 * Canvas APIでクロップ済みのJPEG Blobを生成する
 *
 * @param {string} imageSrc - 元画像のblob URL
 * @param {{ x: number, y: number, width: number, height: number }} pixelCrop - クロップ範囲（ピクセル）
 * @returns {Promise<Blob>} クロップ済みのJPEG Blob
 */
export async function getCroppedBlob(imageSrc, pixelCrop) {
  const image = await createImage(imageSrc)
  const canvas = document.createElement('canvas')
  canvas.width = pixelCrop.width
  canvas.height = pixelCrop.height
  const ctx = canvas.getContext('2d')

  // 元画像の指定範囲だけをcanvasに描画（= トリミング）
  // drawImage 9引数: (image, sx, sy, sw, sh, dx, dy, dw, dh)
  ctx.drawImage(
    image,
    pixelCrop.x, pixelCrop.y, pixelCrop.width, pixelCrop.height,
    0, 0, pixelCrop.width, pixelCrop.height
  )

  return new Promise((resolve) => canvas.toBlob(resolve, 'image/jpeg', 0.95))
}
