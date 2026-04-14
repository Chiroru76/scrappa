async function fetchAsBlob(url) {
  // S3 画像は CORS のためバックエンドプロキシ経由で fetch し Blob URL に変換する
  // （<img src> にプロキシURLを直接渡すと Canvas が tainted になり toBlob が失敗する）
  const proxyUrl = `/api/image-proxy/?url=${encodeURIComponent(url)}`
  const resp = await fetch(proxyUrl)
  if (!resp.ok) throw new Error(`proxy fetch failed: ${resp.status}`)
  return await resp.blob()
}

async function createImage(url) {
  const isS3 = url.includes('s3.amazonaws.com') || url.includes('s3.ap-northeast')

  let src = url
  let blobUrl = null

  if (isS3) {
    const blob = await fetchAsBlob(url)
    blobUrl = URL.createObjectURL(blob)
    src = blobUrl
  }

  return new Promise((resolve, reject) => {
    const image = new Image()
    image.addEventListener('load', () => {
      if (blobUrl) URL.revokeObjectURL(blobUrl)
      resolve(image)
    })
    image.addEventListener('error', (e) => {
      if (blobUrl) URL.revokeObjectURL(blobUrl)
      reject(new Error(`image load failed: ${src}`))
    })
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
  const lines = []
  let current = ''
  for (const ch of text.split('')) {
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
  // 750px: iOS Safari のメモリ制限に収まる範囲で SNS 投稿に十分な解像度
  const SIZE = 750
  const SIDE_PAD = 45
  const TOP_PAD = 45
  const BOTTOM_PAD = 138
  const IMG_AREA_W = SIZE - SIDE_PAD * 2
  const IMG_AREA_H = SIZE - TOP_PAD - BOTTOM_PAD

  const img = await createImage(clip.image_url)

  const canvas = document.createElement('canvas')
  canvas.width = SIZE
  canvas.height = SIZE
  const ctx = canvas.getContext('2d')
  if (!ctx) throw new Error('canvas context unavailable')

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

  // 日付（クリップ画像の右下）
  const dateStr = formatDate(clip.created_at)
  if (dateStr) {
    ctx.font = '400 15px "Helvetica Neue", Arial, sans-serif'
    ctx.fillStyle = '#aaaaaa'
    ctx.textAlign = 'right'
    ctx.fillText(dateStr, drawX + drawW - 8, drawY + drawH + 14)
  }

  // メモ（下余白エリアに中央揃え）
  if (clip.memo) {
    ctx.font = '400 28px "Helvetica Neue", Arial, sans-serif'
    ctx.fillStyle = '#999999'
    ctx.textAlign = 'center'
    const maxTextWidth = SIZE - SIDE_PAD * 2
    const lines = wrapText(ctx, clip.memo, maxTextWidth)
    const lineHeight = 38
    const memoStartY = TOP_PAD + IMG_AREA_H + 69
    lines.forEach((line, i) => {
      ctx.fillText(line, SIZE / 2, memoStartY + i * lineHeight)
    })
  }

  return new Promise((resolve, reject) => {
    canvas.toBlob((blob) => {
      if (blob) {
        resolve(blob)
        return
      }
      // toBlob が null を返した場合（一部 Safari）は toDataURL でフォールバック
      try {
        const dataUrl = canvas.toDataURL('image/png')
        const byteString = atob(dataUrl.split(',')[1])
        const ab = new ArrayBuffer(byteString.length)
        const ia = new Uint8Array(ab)
        for (let i = 0; i < byteString.length; i++) ia[i] = byteString.charCodeAt(i)
        resolve(new Blob([ab], { type: 'image/png' }))
      } catch (e) {
        reject(new Error(`toBlob fallback failed: ${e.message}`))
      }
    }, 'image/png')
  })
}
