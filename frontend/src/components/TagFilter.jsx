import './TagFilter.css'

export default function TagFilter({ tags, selectedTag, onSelect }) {
  return (
    <div className="tag-filter">
      <button
        className={`tag-btn ${selectedTag === null ? 'active' : ''}`}
        onClick={() => onSelect(null)}
      >
        すべて
      </button>
      {tags.map((tag) => (
        <button
          key={tag.id}
          className={`tag-btn ${selectedTag === tag.name ? 'active' : ''}`}
          onClick={() => onSelect(tag.name)}
        >
          {tag.name}
          <span className="tag-count">{tag.clip_count}</span>
        </button>
      ))}
    </div>
  )
}
