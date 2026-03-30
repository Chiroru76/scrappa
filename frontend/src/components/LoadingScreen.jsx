import { RingBinding } from './book/Book'
import './book/Book.css'
import './LoadingScreen.css'

const TEXT = 'ローディング中'

export default function LoadingScreen() {
  return (
    <div className="loading-screen">
      <div className="loading-book">
        <RingBinding />
        <div className="loading-pages">
          <div className="loading-page page-1" />
          <div className="loading-page page-2" />
          <div className="loading-page page-3" />
          <div className="loading-page page-4" />
        </div>
      </div>
      <p className="loading-text">
        {TEXT.split('').map((char, i) => (
          <span key={i} style={{ animationDelay: `${i * 0.1}s` }}>{char}</span>
        ))}
      </p>
    </div>
  )
}
