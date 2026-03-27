import React from 'react'
import ClipCard from './ClipCard'
import './Page.css'

const CLIPS_PER_PAGE = 12

const Page = React.forwardRef(({ clips = [], pageNumber, onClipClick }, ref) => {
  // 12枚に満たない場合はnullで埋める
  const paddedClips = [
    ...clips,
    ...Array(Math.max(0, CLIPS_PER_PAGE - clips.length)).fill(null)
  ]

  return (
    <div className="page" ref={ref}>
      <div className="page-grid">
        {paddedClips.map((clip, i) => (
          <ClipCard key={clip?.id ?? `empty-${i}`} clip={clip} onOpen={onClipClick} />
        ))}
      </div>
      <div className="page-number">{pageNumber}</div>
    </div>
  )
})

Page.displayName = 'Page'

export default Page
