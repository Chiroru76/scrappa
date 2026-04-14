/**
 * S3 画像をバックエンドプロキシ経由で Blob として取得する
 * MIMEタイプを image/jpeg に明示して iOS Safari の読み込み失敗を防ぐ
 */
async function fetchImageBlob(url) {
  const isS3 = url.includes('s3.amazonaws.com') || url.includes('s3.ap-northeast')
  const fetchUrl = isS3
    ? `/api/image-proxy/?url=${encodeURIComponent(url)}`
    : url

  const resp = await fetch(fetchUrl)
  if (!resp.ok) throw new Error(`fetch failed: ${resp.status}`)

  const raw = await resp.blob()
  // S3 が application/octet-stream を返す場合に備えて MIME を強制指定
  const mimeType = raw.type.startsWith('image/') ? raw.type : 'image/jpeg'
  return mimeType === raw.type ? raw : new Blob([raw], { type: mimeType })
}

/**
 * Blob から ImageBitmap を生成する（<img> タグを経由しない）
 * createImageBitmap は iOS Safari 15.4+ でサポート
 * フォールバックとして <img> + blob URL も用意
 */
async function blobToDrawable(blob) {
  if (typeof createImageBitmap === 'function') {
    return await createImageBitmap(blob)
  }
  // フォールバック: blob URL → <img>
  const blobUrl = URL.createObjectURL(blob)
  return new Promise((resolve, reject) => {
    const img = new Image()
    img.onload = () => { URL.revokeObjectURL(blobUrl); resolve(img) }
    img.onerror = () => { URL.revokeObjectURL(blobUrl); reject(new Error('image load failed')) }
    img.src = blobUrl
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
  // 750px: iOS Safari のメモリ制限に収まりつつ SNS 投稿に十分な解像度
  const SIZE = 750
  const SIDE_PAD = 45
  const TOP_PAD = 45
  const BOTTOM_PAD = 138
  const IMG_AREA_W = SIZE - SIDE_PAD * 2
  const IMG_AREA_H = SIZE - TOP_PAD - BOTTOM_PAD

  // <img> タグを経由せず Blob → ImageBitmap で Canvas に描画
  const blob = await fetchImageBlob(clip.image_url)
  const drawable = await blobToDrawable(blob)

  const canvas = document.createElement('canvas')
  canvas.width = SIZE
  canvas.height = SIZE
  const ctx = canvas.getContext('2d')
  if (!ctx) throw new Error('canvas context unavailable')

  // 白背景
  ctx.fillStyle = '#ffffff'
  ctx.fillRect(0, 0, SIZE, SIZE)

  // contain: 縦横比を保ちつつ IMG_AREA に収める
  const srcW = drawable.width ?? drawable.naturalWidth
  const srcH = drawable.height ?? drawable.naturalHeight
  const scale = Math.min(IMG_AREA_W / srcW, IMG_AREA_H / srcH)
  const drawW = srcW * scale
  const drawH = srcH * scale
  const drawX = SIDE_PAD + (IMG_AREA_W - drawW) / 2
  const drawY = TOP_PAD + (IMG_AREA_H - drawH) / 2
  ctx.drawImage(drawable, drawX, drawY, drawW, drawH)

  // ImageBitmap はメモリ解放が必要
  if (drawable.close) drawable.close()

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
    canvas.toBlob((outputBlob) => {
      if (outputBlob) { resolve(outputBlob); return }
      // toBlob が null を返す場合（一部 Safari）は toDataURL でフォールバック
      try {
        const dataUrl = canvas.toDataURL('image/png')
        const bin = atob(dataUrl.split(',')[1])
        const ab = new ArrayBuffer(bin.length)
        const ia = new Uint8Array(ab)
        for (let i = 0; i < bin.length; i++) ia[i] = bin.charCodeAt(i)
        resolve(new Blob([ab], { type: 'image/png' }))
      } catch (e) {
        reject(new Error(`toBlob fallback failed: ${e.message}`))
      }
    }, 'image/png')
  })
}
