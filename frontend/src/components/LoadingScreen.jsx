import './LoadingScreen.css'

const TEXT = 'ローディング中'
const RING_IMAGE = 'https://scrappa-images.s3.ap-northeast-1.amazonaws.com/images/notering.png'

export default function LoadingScreen() {
  return (
    <div className="loading-screen">
      <div className="loading-book">
        <img src={RING_IMAGE} alt="" className="loading-ring" />
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
