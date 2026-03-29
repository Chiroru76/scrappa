import { useState, useEffect } from 'react'
import { DndContext, closestCenter, PointerSensor, TouchSensor, useSensor, useSensors } from '@dnd-kit/core'
import { arrayMove } from '@dnd-kit/sortable'
import Page from './Page'
import { useIsMobile } from '../../hooks/useIsMobile'
import { useSwipe } from '../../hooks/useSwipe'
import './Book.css'

const CLIPS_PER_PAGE = 12

export function RingBinding() {
  const coils = Array.from({ length: 34 })
  return (
    <div className="ring-binding">
      {coils.map((_, i) => (
        <div key={i} className="coil" />
      ))}
    </div>
  )
}

function SpreadNavigation({ current, total, onPrev, onNext, onShowCover }) {
  return (
    <div className="spread-navigation">
      {onShowCover && (
        <button className="nav-cover-btn" onClick={onShowCover}>
          表紙へ
        </button>
      )}
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

export default function Book({ clips, onClipClick, onEmptyClick, getLikeData, onShowCover, onClipsReorder }) {
  const [currentSpread, setCurrentSpread] = useState(0)
  const isMobile = useIsMobile()

  const sortable = !!onClipsReorder

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 8 } }),
    useSensor(TouchSensor, { activationConstraint: { delay: 200, tolerance: 5 } })
  )

  function handleDragEnd(event) {
    const { active, over } = event
    if (!over || active.id === over.id) return

    const oldIndex = clips.findIndex(c => c.id === active.id)
    const newIndex = clips.findIndex(c => c.id === over.id)
    if (oldIndex === -1 || newIndex === -1) return

    // ページをまたぐ移動は許可しない
    if (clips[oldIndex].page !== clips[newIndex].page) return

    const reordered = arrayMove(clips, oldIndex, newIndex)
    // 同じページ内の position を再採番
    const page = clips[oldIndex].page
    let posCounter = 0
    const updated = reordered.map(clip => {
      if (clip.page === page) return { ...clip, position: posCounter++ }
      return clip
    })
    onClipsReorder(updated)
  }

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

  // モバイル: 奇数ページ(0,2,4...)はリングが右、偶数ページ(1,3,5...)はリングが左
  const mobileRingOnRight = isMobile && currentSpread % 2 === 0

  const swipeHandlers = useSwipe({
    onSwipeLeft:  () => setCurrentSpread(s => Math.min(s + 1, totalSpreads - 1)),
    onSwipeRight: () => setCurrentSpread(s => Math.max(s - 1, 0)),
  })

  return (
    <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={handleDragEnd}>
      <div className="book-container">
        <div
          className={`notebook-spread${isMobile ? ' notebook-spread--mobile' : ''}`}
          {...(isMobile ? swipeHandlers : {})}
        >
          {isMobile && !mobileRingOnRight && <RingBinding />}
          <Page
            clips={leftClips}
            side={isMobile ? (mobileRingOnRight ? 'left' : 'right') : 'left'}
            showEmptySlot={leftShowEmpty}
            onClipClick={onClipClick}
            onEmptyClick={onEmptyClick}
            getLikeData={getLikeData}
            sortable={sortable}
          />
          {isMobile && mobileRingOnRight && <RingBinding />}
          {!isMobile && <RingBinding />}
          {!isMobile && (
            <Page
              clips={rightClips}
              side="right"
              showEmptySlot={rightShowEmpty}
              onClipClick={onClipClick}
              onEmptyClick={onEmptyClick}
              getLikeData={getLikeData}
              sortable={sortable}
            />
          )}
        </div>
        <SpreadNavigation
          current={currentSpread}
          total={totalSpreads}
          onPrev={() => setCurrentSpread(s => s - 1)}
          onNext={() => setCurrentSpread(s => s + 1)}
          onShowCover={onShowCover}
        />
      </div>
    </DndContext>
  )
}
