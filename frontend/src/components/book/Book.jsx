import HTMLFlipBook from 'react-pageflip'
import Page from './Page'
import './Book.css'

const CLIPS_PER_PAGE = 12

export default function Book({ clips, onClipClick }) {
  // クリップを12枚ずつのページに分割
  const pages = []
  for (let i = 0; i < Math.max(clips.length, 1); i += CLIPS_PER_PAGE) {
    pages.push(clips.slice(i, i + CLIPS_PER_PAGE))
  }

  return (
    <div className="book-wrapper">
      <HTMLFlipBook
        width={380}
        height={540}
        size="fixed"
        minWidth={300}
        maxWidth={500}
        showCover={false}
        mobileScrollSupport={true}
        className="flip-book"
      >
        {pages.map((pageClips, index) => (
          <Page
            key={index}
            clips={pageClips}
            pageNumber={index + 1}
            onClipClick={onClipClick}
          />
        ))}
      </HTMLFlipBook>
    </div>
  )
}
