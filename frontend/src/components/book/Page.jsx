import { SortableContext, rectSortingStrategy } from '@dnd-kit/sortable'
import ClipCard from './ClipCard'
import './Page.css'

export default function Page({ clips = [], side, showEmptySlot, onClipClick, onEmptyClick, getLikeData, sortable = false }) {
  const paddedClips = showEmptySlot ? [...clips, null] : clips
  const clipIds = clips.filter(Boolean).map(c => c.id)

  return (
    <SortableContext items={clipIds} strategy={rectSortingStrategy}>
      <div className={`page page-${side}`}>
        <div className="page-grid">
          {paddedClips.map((clip, i) => (
            <ClipCard
              key={clip?.id ?? `empty-${i}`}
              clip={clip}
              onOpen={onClipClick}
              onEmptyClick={onEmptyClick}
              likeData={clip && getLikeData ? getLikeData(clip) : undefined}
              sortable={sortable}
            />
          ))}
        </div>
      </div>
    </SortableContext>
  )
}
