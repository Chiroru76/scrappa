import ClipCard from './ClipCard'
import './Page.css'

export default function Page({ clips = [], side, showEmptySlot, onClipClick, onEmptyClick }) {
  const paddedClips = showEmptySlot ? [...clips, null] : clips

  return (
    <div className={`page page-${side}`}>
      <div className="page-grid">
        {paddedClips.map((clip, i) => (
          <ClipCard
            key={clip?.id ?? `empty-${i}`}
            clip={clip}
            onOpen={onClipClick}
            onEmptyClick={onEmptyClick}
          />
        ))}
      </div>
    </div>
  )
}
