import './ClipCard.css'

export default function ClipCard({ clip, onOpen, onEmptyClick, likeData }) {
  if (!clip) {
    return (
      <div className="clip-card empty" onClick={onEmptyClick}>
        <span className="empty-plus">+</span>
      </div>
    )
  }

  return (
    <div className="clip-card" onClick={() => onOpen && onOpen(clip)}>
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
