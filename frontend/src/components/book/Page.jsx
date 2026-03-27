import ClipCard from './ClipCard'
import './Page.css'

const CLIPS_PER_PAGE = 12

export default function Page({ clips = [], pageNumber, side, onClipClick, onEmptyClick }) {
  const paddedClips = [
    ...clips,
    ...Array(Math.max(0, CLIPS_PER_PAGE - clips.length)).fill(null)
  ]

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
      <div className="page-number">{pageNumber}</div>
    </div>
  )
}
