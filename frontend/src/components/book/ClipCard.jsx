import { useSortable } from '@dnd-kit/sortable'
import { CSS } from '@dnd-kit/utilities'
import './ClipCard.css'

export default function ClipCard({ clip, onOpen, onEmptyClick, likeData, sortable = false }) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } =
    useSortable({ id: clip?.id ?? 'empty', disabled: !clip || !sortable })

  if (!clip) {
    return (
      <div className="clip-card empty" onClick={onEmptyClick}>
        <span className="empty-plus">+</span>
      </div>
    )
  }

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.4 : 1,
    cursor: sortable ? (isDragging ? 'grabbing' : 'grab') : 'pointer',
    zIndex: isDragging ? 10 : undefined,
  }

  return (
    <div
      ref={setNodeRef}
      style={style}
      className={`clip-card${isDragging ? ' dragging' : ''}`}
      onClick={() => !isDragging && onOpen && onOpen(clip)}
      {...attributes}
      {...listeners}
    >
      <img src={clip.image_url} alt="" className="clip-image" />
      {clip.tags && clip.tags.length > 0 && (
        <div className="clip-tags">
          {clip.tags.map((tag) => (
            <span key={tag} className="clip-tag">{tag}</span>
          ))}
        </div>
      )}
      {likeData && (
        <button
          className={`clip-like-btn ${likeData.liked ? 'liked' : ''}`}
          onClick={(e) => { e.stopPropagation(); likeData.onToggle(clip) }}
        >
          ♥ {likeData.like_count}
        </button>
      )}
    </div>
  )
}
