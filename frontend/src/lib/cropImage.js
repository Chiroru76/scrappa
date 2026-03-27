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
 * react-easy-cropが返すcroppedAreaPixels座標と回転角度を使って
 * Canvas APIでクロップ済みのJPEG Blobを生成する
 *
 * @param {string} imageSrc - 元画像のblob URL
 * @param {{ x: number, y: number, width: number, height: number }} pixelCrop - クロップ範囲（ピクセル）
 * @param {number} rotation - 回転角度（度数法、デフォルト0）
 * @returns {Promise<Blob>} クロップ済みのJPEG Blob
 */
export async function getCroppedBlob(imageSrc, pixelCrop, rotation = 0) {
  const image = await createImage(imageSrc)
  const canvas = document.createElement('canvas')
  const ctx = canvas.getContext('2d')

  // 回転後に画像がはみ出さないよう、対角線長のsafeAreaを確保
  const maxSize = Math.max(image.width, image.height)
  const safeArea = 2 * ((maxSize / 2) * Math.sqrt(2))

  canvas.width = safeArea
  canvas.height = safeArea

  // キャンバス中心を基準に回転
  ctx.translate(safeArea / 2, safeArea / 2)
  ctx.rotate((rotation * Math.PI) / 180)
  ctx.translate(-safeArea / 2, -safeArea / 2)

  // 回転した状態で画像を中央に描画
  ctx.drawImage(
    image,
    safeArea / 2 - image.width / 2,
    safeArea / 2 - image.height / 2
  )

  // 回転済みのピクセルデータを取得し、クロップ範囲だけ切り出す
  const data = ctx.getImageData(0, 0, safeArea, safeArea)
  canvas.width = pixelCrop.width
  canvas.height = pixelCrop.height

  ctx.putImageData(
    data,
    Math.round(0 - safeArea / 2 + image.width / 2 - pixelCrop.x),
    Math.round(0 - safeArea / 2 + image.height / 2 - pixelCrop.y)
  )

  return new Promise((resolve) => canvas.toBlob(resolve, 'image/jpeg', 0.95))
}
