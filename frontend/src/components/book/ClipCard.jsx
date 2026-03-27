import './ClipCard.css'

export default function ClipCard({ clip, onOpen }) {
  if (!clip) return <div className="clip-card empty" />

  return (
    <div className="clip-card" onClick={() => onOpen(clip)}>
      <img src={clip.image_url} alt="" className="clip-image" />
      {clip.tags && clip.tags.length > 0 && (
        <div className="clip-tags">
          {clip.tags.map((tag) => (
            <span key={tag} className="clip-tag">{tag}</span>
          ))}
        </div>
      )}
    </div>
  )
}
