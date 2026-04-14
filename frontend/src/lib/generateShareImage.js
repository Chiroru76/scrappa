async function createImage(url) {
  // S3 画像は CORS のためバックエンドプロキシ経由で取得する
  const isS3 = url.includes('s3.amazonaws.com') || url.includes('s3.ap-northeast')
  let src = url
  if (isS3) {
    src = `/api/image-proxy/?url=${encodeURIComponent(url)}`
  }
  return new Promise((resolve, reject) => {
    const image = new Image()
    image.addEventListener('load', () => resolve(image))
    image.addEventListener('error', reject)
    image.src = src
  })
}

function formatDate(createdAt) {
  if (!createdAt) return ''
  const d = new Date(createdAt)
  const y = d.getFullYear()
  const m = String(d.getMonth() + 1).padStart(2, '0')
  const day = String(d.getDate()).padStart(2, '0')
  return `${y}.${m}.${day}`
}

// テキストを maxWidth に収まるよう折り返して行配列を返す
function wrapText(ctx, text, maxWidth) {
  const words = text.split('')
  const lines = []
  let current = ''
  for (const ch of words) {
    const candidate = current + ch
    if (ctx.measureText(candidate).width > maxWidth && current.length > 0) {
      lines.push(current)
      current = ch
    } else {
      current = candidate
    }
  }
  if (current) lines.push(current)
  return lines
}

/**
 * チェキ風のシェア画像を生成して PNG Blob を返す
 * @param {{ image_url: string, created_at?: string, memo?: string }} clip
 * @returns {Promise<Blob>}
 */
export async function generateShareImage(clip) {
  const SIZE = 1200
  const SIDE_PAD = 72       // 左右余白
  const TOP_PAD = 72        // 上余白
  const BOTTOM_PAD = 220    // 下余白（チェキ感）
  const IMG_AREA_W = SIZE - SIDE_PAD * 2
  const IMG_AREA_H = SIZE - TOP_PAD - BOTTOM_PAD

  const img = await createImage(clip.image_url)
  const canvas = document.createElement('canvas')
  canvas.width = SIZE
  canvas.height = SIZE
  const ctx = canvas.getContext('2d')

  // 白背景
  ctx.fillStyle = '#ffffff'
  ctx.fillRect(0, 0, SIZE, SIZE)

  // contain: 縦横比を保ちつつ IMG_AREA に収める
  const scale = Math.min(IMG_AREA_W / img.width, IMG_AREA_H / img.height)
  const drawW = img.width * scale
  const drawH = img.height * scale
  const drawX = SIDE_PAD + (IMG_AREA_W - drawW) / 2
  const drawY = TOP_PAD + (IMG_AREA_H - drawH) / 2
  ctx.drawImage(img, drawX, drawY, drawW, drawH)

  // 日付（クリップ画像の右下に配置）
  const dateStr = formatDate(clip.created_at)
  if (dateStr) {
    ctx.font = '400 24px "Helvetica Neue", Arial, sans-serif'
    ctx.fillStyle = '#aaaaaa'
    ctx.textAlign = 'right'
    const dateX = drawX + drawW - 12
    const dateY = drawY + drawH + 22
    ctx.fillText(dateStr, dateX, dateY)
  }

  // メモ（下余白エリアに中央揃え）
  const textBaseY = TOP_PAD + IMG_AREA_H + 110
  if (clip.memo) {
    ctx.font = '400 44px "Helvetica Neue", Arial, sans-serif'
    ctx.fillStyle = '#999999'
    ctx.textAlign = 'center'
    const maxTextWidth = SIZE - SIDE_PAD * 2
    const lines = wrapText(ctx, clip.memo, maxTextWidth)
    const lineHeight = 62
    lines.forEach((line, i) => {
      ctx.fillText(line, SIZE / 2, textBaseY + i * lineHeight)
    })
  }

  return new Promise((resolve) => canvas.toBlob(resolve, 'image/png'))
}
