import { useRef, useCallback } from 'react'

export function useSwipe({ onSwipeLeft, onSwipeRight, threshold = 50 }) {
  const startX = useRef(null)
  const startY = useRef(null)

  const onTouchStart = useCallback((e) => {
    startX.current = e.touches[0].clientX
    startY.current = e.touches[0].clientY
  }, [])

  const onTouchEnd = useCallback((e) => {
    if (startX.current === null) return
    const deltaX = e.changedTouches[0].clientX - startX.current
    const deltaY = e.changedTouches[0].clientY - startY.current

    startX.current = null
    startY.current = null

    // 縦方向の移動が横方向の2倍以上あればスクロールとみなしてスワイプ無視
    // （比率を厳しくすることでドラッグ後の誤スワイプを防ぐ）
    if (Math.abs(deltaY) > Math.abs(deltaX) * 0.5) return

    if (deltaX < -threshold) onSwipeLeft?.()
    else if (deltaX > threshold) onSwipeRight?.()
  }, [onSwipeLeft, onSwipeRight, threshold])

  return { onTouchStart, onTouchEnd }
}
