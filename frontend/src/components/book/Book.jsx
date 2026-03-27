import { useState } from 'react'
import Page from './Page'
import './Book.css'

const CLIPS_PER_SPREAD = 24

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

  const totalSpreads = Math.max(1, Math.ceil(clips.length / CLIPS_PER_SPREAD))

  const leftClips  = clips.slice(currentSpread * CLIPS_PER_SPREAD, currentSpread * CLIPS_PER_SPREAD + 12)
  const rightClips = clips.slice(currentSpread * CLIPS_PER_SPREAD + 12, currentSpread * CLIPS_PER_SPREAD + 24)

  // 空スロットは最後のクリップの直後1箇所のみ表示する
  const isLastSpread = currentSpread === totalSpreads - 1
  const leftShowEmpty  = isLastSpread && leftClips.length < 12
  const rightShowEmpty = isLastSpread && leftClips.length === 12 && rightClips.length < 12

  return (
    <div className="book-container">
      <div className="notebook-spread">
        <Page
          clips={leftClips}
          side="left"
          showEmptySlot={leftShowEmpty}
          onClipClick={onClipClick}
          onEmptyClick={onEmptyClick}
          getLikeData={getLikeData}
        />
        <RingBinding />
        <Page
          clips={rightClips}
          side="right"
          showEmptySlot={rightShowEmpty}
          onClipClick={onClipClick}
          onEmptyClick={onEmptyClick}
          getLikeData={getLikeData}
        />
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
