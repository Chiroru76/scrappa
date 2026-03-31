import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import api from '../lib/api'
import './LegalPage.css'

export default function ContactPage() {
  const navigate = useNavigate()
  const [form, setForm] = useState({ name: '', email: '', subject: '', body: '' })
  const [status, setStatus] = useState(null) // null | 'sending' | 'success' | 'error'

  function handleChange(e) {
    setForm(prev => ({ ...prev, [e.target.name]: e.target.value }))
  }

  async function handleSubmit(e) {
    e.preventDefault()
    setStatus('sending')
    try {
      await api.post('/contact', form)
      setStatus('success')
      setForm({ name: '', email: '', subject: '', body: '' })
    } catch {
      setStatus('error')
    }
  }

  return (
    <div className="legal-page">
      <header className="legal-header">
        <button className="legal-back-btn" onClick={() => navigate(-1)}>
          ← 戻る
        </button>
      </header>

      <div className="legal-content">
        <h1>お問い合わせ</h1>
        <p>
          ご意見・ご要望・不具合のご報告などは、以下のフォームよりお送りください。
          内容を確認の上、ご登録のメールアドレスへご返信いたします。
        </p>

        {status === 'success' ? (
          <div className="contact-success">
            お問い合わせを受け付けました。内容を確認の上、ご連絡いたします。
          </div>
        ) : (
          <form className="contact-form" onSubmit={handleSubmit}>
            <div className="contact-field">
              <label htmlFor="name">お名前</label>
              <input
                id="name"
                name="name"
                type="text"
                value={form.name}
                onChange={handleChange}
                required
                placeholder="山田 太郎"
              />
            </div>
            <div className="contact-field">
              <label htmlFor="email">メールアドレス</label>
              <input
                id="email"
                name="email"
                type="email"
                value={form.email}
                onChange={handleChange}
                required
                placeholder="example@email.com"
              />
            </div>
            <div className="contact-field">
              <label htmlFor="subject">件名</label>
              <input
                id="subject"
                name="subject"
                type="text"
                value={form.subject}
                onChange={handleChange}
                required
                placeholder="お問い合わせの件名"
              />
            </div>
            <div className="contact-field">
              <label htmlFor="body">お問い合わせ内容</label>
              <textarea
                id="body"
                name="body"
                value={form.body}
                onChange={handleChange}
                required
                placeholder="お問い合わせ内容をご記入ください"
              />
            </div>
            {status === 'error' && (
              <div className="contact-error">
                送信に失敗しました。しばらく経ってから再度お試しください。
              </div>
            )}
            <button
              type="submit"
              className="contact-submit-btn"
              disabled={status === 'sending'}
            >
              {status === 'sending' ? '送信中...' : '送信する'}
            </button>
          </form>
        )}
      </div>
    </div>
  )
}
