import { useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { supabase } from '../lib/supabase'
import headerLogo from '../assets/headerlogo.png'
import { RingBinding } from '../components/book/Book'
import '../components/book/Book.css'
import './LandingPage.css'

function GoogleIcon() {
  return (
    <svg viewBox="0 0 24 24" width="20" height="20" style={{ flexShrink: 0 }}>
      <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
      <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
      <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l3.66-2.84z"/>
      <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
    </svg>
  )
}

export default function LandingPage() {
  const navigate = useNavigate()

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (session) navigate('/home')
    })
  }, [navigate])

  const handleGoogleLogin = async () => {
    await supabase.auth.signInWithOAuth({
      provider: 'google',
      options: { redirectTo: `${window.location.origin}/auth/callback` }
    })
  }

  return (
    <div className="lp">
      {/* ── Hero ── */}
      <section className="lp-hero">
        <div className="lp-notebook-cover">
          <RingBinding />
          <div className="lp-cover-content">
            <img src={headerLogo} alt="Scrappa" className="lp-logo" />
            <p className="lp-catchcopy">切り取って、集めて、私になる。</p>
            <p className="lp-desc">
              日常の一部を切り取り、それらを一冊の
              <br />ノートに収集していくデジタルスクラップブック
            </p>
            <button className="lp-google-btn" onClick={handleGoogleLogin}>
              <GoogleIcon />
              Google でログイン
            </button>
          </div>
        </div>
      </section>

      {/* ── Concept ── */}
      <section className="lp-section lp-concept">
        <h2 className="lp-section-title">
          アナログの温かさ × デジタルの便利さ
        </h2>
        <p className="lp-section-sub">
          かつて雑誌やチラシの切り抜きをノートに貼って収集していたように、
          <br />
          スマホで撮った日常の写真を切り取り、一冊のノートに収集していく。
        </p>
        <div className="lp-concept-grid">
          <div className="lp-concept-card">
            <div className="lp-concept-label analog">アナログ</div>
            <ul>
              <li>リングノートの質感</li>
              <li>写真を切り抜く感覚</li>
              <li>ページをめくる体験</li>
              <li>自分だけのノートに育てる</li>
            </ul>
          </div>
          <div className="lp-concept-plus">×</div>
          <div className="lp-concept-card">
            <div className="lp-concept-label digital">デジタル</div>
            <ul>
              <li>スマホで即保存</li>
              <li>正方形トリミング</li>
              <li>いつでも見返せる</li>
              <li>フレンドとゆるく共有</li>
            </ul>
          </div>
        </div>
      </section>

      {/* ── Features ── */}
      <section className="lp-section lp-features">
        <h2 className="lp-section-title">Scrappaでできること</h2>
        <div className="lp-features-grid">
          <div className="lp-feature-card">
            <div className="lp-feature-num">01</div>
            <h3 className="lp-feature-title">記憶の蓄積</h3>
            <p className="lp-feature-body">
              写真全体ではなく「気になった部分だけ」を切り取り、それらを蓄積していく。
              ページをめくるたびに、あのとき・あの場所・あの記憶が戻ってくる。
            </p>
          </div>
          <div className="lp-feature-card">
            <div className="lp-feature-num">02</div>
            <h3 className="lp-feature-title">自分のコレクション</h3>
            <p className="lp-feature-body">
              テーマを決めて収集できる。集まるほどに達成感があり、自分だけのブックが育っていく感覚。
              コレクションとしての楽しさもScrappaの魅力の一つ。
            </p>
          </div>
          <div className="lp-feature-card">
            <div className="lp-feature-num">03</div>
            <h3 className="lp-feature-title">偶発的な発見</h3>
            <p className="lp-feature-body">
              収集してきたクリップ同士に、関係性・共通点が見えてくる。
              その偶発的な発見が、自分の感性や好きを知るきっかけになる。
            </p>
          </div>
          <div className="lp-feature-card">
            <div className="lp-feature-num">04</div>
            <h3 className="lp-feature-title">フレンドとゆるく共有</h3>
            <p className="lp-feature-body">
              フレンドのブックをのぞいたり、いいねを送ったり。
              発信ではなく「見せ合う」ゆるいつながり。
            </p>
          </div>
        </div>
      </section>

      {/* ── How to use ── */}
      <section className="lp-section lp-howto">
        <h2 className="lp-section-title">使い方</h2>
        <div className="lp-steps">
          <div className="lp-step">
            <div className="lp-step-num">1</div>
            <div className="lp-step-body">
              <h3>気になるものを撮る</h3>
              <p>
                日常生活の中で目に入ったお菓子のパッケージ、カフェのインテリア、気になるロゴ。なんでもOK。
              </p>
            </div>
          </div>
          <div className="lp-step-arrow">↓</div>
          <div className="lp-step">
            <div className="lp-step-num">2</div>
            <div className="lp-step-body">
              <h3>気になる部分だけトリミング</h3>
              <p>写真の一部分だけを正方形に切り取る。</p>
            </div>
          </div>
          <div className="lp-step-arrow">↓</div>
          <div className="lp-step">
            <div className="lp-step-num">3</div>
            <div className="lp-step-body">
              <h3>スクラップブックに保存</h3>
              <p>
                自分だけのスクラップブックに収集したクリップが蓄積されていく。整理は不要。
              </p>
            </div>
          </div>
          <div className="lp-step-arrow">↓</div>
          <div className="lp-step">
            <div className="lp-step-num">4</div>
            <div className="lp-step-body">
              <h3>見返して、自分を見つける</h3>
              <p>
                ふと見返したとき、集めたものから自分の感性や好きが見えてくる。
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* ── CTA ── */}
      <section className="lp-cta">
        <p className="lp-cta-copy">自分だけのスクラップブックを作ろう</p>
        <button className="lp-google-btn" onClick={handleGoogleLogin}>
          <GoogleIcon />
          Google でログイン
        </button>
      </section>

      <footer className="lp-footer">
        <p>© 2026 Scrappa</p>
      </footer>
    </div>
  );
}
