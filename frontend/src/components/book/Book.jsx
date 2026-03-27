import { useState } from 'react'
import Page from './Page'
import './Book.css'

const CLIPS_PER_SPREAD = 24

function RingBinding() {
  const rings = Array.from({ length: 12 })
  return (
    <div className="ring-binding">
      {rings.map((_, i) => (
        <div key={i} className="ring">
          <div className="ring-top" />
          <div className="ring-bottom" />
        </div>
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

export default function Book({ clips, onClipClick, onEmptyClick }) {
  const [currentSpread, setCurrentSpread] = useState(0)

  const totalSpreads = Math.max(1, Math.ceil(clips.length / CLIPS_PER_SPREAD))

  const leftClips  = clips.slice(currentSpread * CLIPS_PER_SPREAD, currentSpread * CLIPS_PER_SPREAD + 12)
  const rightClips = clips.slice(currentSpread * CLIPS_PER_SPREAD + 12, currentSpread * CLIPS_PER_SPREAD + 24)

  return (
    <div className="book-container">
      <div className="notebook-spread">
        <Page
          clips={leftClips}
          pageNumber={currentSpread * 2 + 1}
          side="left"
          onClipClick={onClipClick}
          onEmptyClick={onEmptyClick}
        />
        <RingBinding />
        <Page
          clips={rightClips}
          pageNumber={currentSpread * 2 + 2}
          side="right"
          onClipClick={onClipClick}
          onEmptyClick={onEmptyClick}
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
