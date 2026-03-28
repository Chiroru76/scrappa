import { RingBinding } from './Book'
import './Book.css'
import './BookCover.css'

export default function BookCover({ userName, onOpen }) {
  return (
    <div className="cover-container">
      <div className="cover-spread">
        <RingBinding />
        <div className="cover-page">
          <p className="cover-title">{userName}のスクラップブック</p>
          <button className="cover-open-btn" onClick={onOpen}>開く</button>
        </div>
      </div>
    </div>
  )
}
