import { useState, useEffect } from 'react'
import Page from './Page'
import { useIsMobile } from '../../hooks/useIsMobile'
import './Book.css'

const CLIPS_PER_PAGE = 12

function RingBinding() {
  const coils = Array.from({ length: 34 })
  return (
    <div className="ring-binding">
      {coils.map((_, i) => (
        <div key={i} className="coil" />
      ))}
    </div>
  )
}

function SpreadNavigation({ current, total, onPrev, onNext }) {
  return (
    <div className="spread-navigation">
      <button
        className="nav-btn"
        onClick={onPrev}
        disabled={current === 0}
        style={{ opacity: current === 0 ? 0.3 : 1 }}
      >
        ←
      </button>
      <span className="nav-indicator">{current + 1} / {total}</span>
      <button
        className="nav-btn"
        onClick={onNext}
        disabled={current >= total - 1}
        style={{ opacity: current >= total - 1 ? 0.3 : 1 }}
      >
        →
      </button>
    </div>
  )
}

export default function Book({ clips, onClipClick, onEmptyClick, getLikeData }) {
  const [currentSpread, setCurrentSpread] = useState(0)
  const isMobile = useIsMobile()

  const clipsPerSpread = isMobile ? CLIPS_PER_PAGE : CLIPS_PER_PAGE * 2
  const totalSpreads = Math.max(1, Math.ceil(clips.length / clipsPerSpread))

  // デバイス切り替え時に範囲外にならないよう先頭に戻す
  useEffect(() => {
    setCurrentSpread(0)
  }, [isMobile])

  const spreadStart = currentSpread * clipsPerSpread
  const leftClips  = clips.slice(spreadStart, spreadStart + CLIPS_PER_PAGE)
  const rightClips = isMobile ? [] : clips.slice(spreadStart + CLIPS_PER_PAGE, spreadStart + CLIPS_PER_PAGE * 2)

  const isLastSpread = currentSpread === totalSpreads - 1
  const leftShowEmpty  = isLastSpread && leftClips.length < CLIPS_PER_PAGE
  const rightShowEmpty = !isMobile && isLastSpread && leftClips.length === CLIPS_PER_PAGE && rightClips.length < CLIPS_PER_PAGE

  return (
    <div className="book-container">
      <div className={`notebook-spread${isMobile ? ' notebook-spread--mobile' : ''}`}>
        <Page
          clips={leftClips}
          side={isMobile ? 'mobile' : 'left'}
          showEmptySlot={leftShowEmpty}
          onClipClick={onClipClick}
          onEmptyClick={onEmptyClick}
          getLikeData={getLikeData}
        />
        {!isMobile && <RingBinding />}
        {!isMobile && (
          <Page
            clips={rightClips}
            side="right"
            showEmptySlot={rightShowEmpty}
            onClipClick={onClipClick}
            onEmptyClick={onEmptyClick}
            getLikeData={getLikeData}
          />
        )}
      </div>
      <SpreadNavigation
        current={currentSpread}
        total={totalSpreads}
        onPrev={() => setCurrentSpread(s => s - 1)}
        onNext={() => setCurrentSpread(s => s + 1)}
      />
    </div>
  )
}
