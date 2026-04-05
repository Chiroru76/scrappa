import { supabase } from '../lib/supabase'
import './GuestBanner.css'

export default function GuestBanner() {
  async function handleLogin() {
    await supabase.auth.signInWithOAuth({
      provider: 'google',
      options: { redirectTo: `${window.location.origin}/auth/callback` },
    })
  }

  return (
    <div className="guest-banner">
      <span className="guest-banner-text">
        お試し中です。データはこのブラウザにのみ保存されます。
      </span>
      <button className="guest-banner-btn" onClick={handleLogin}>
        Googleでログイン
      </button>
    </div>
  )
}
