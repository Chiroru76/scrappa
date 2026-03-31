import { useNavigate } from 'react-router-dom'
import './LegalPage.css'

export default function PrivacyPage() {
  const navigate = useNavigate()

  return (
    <div className="legal-page">
      <header className="legal-header">
        <button className="legal-back-btn" onClick={() => navigate(-1)}>
          ← 戻る
        </button>
      </header>

      <div className="legal-content">
        <h1>プライバシーポリシー</h1>
        <p className="legal-updated">最終更新日：2026年3月31日</p>

        <p>
          島貫千晴（以下「運営者」）は、「Scrappa」（以下「本サービス」）におけるユーザーの個人情報の取り扱いについて、以下のとおりプライバシーポリシーを定めます。
        </p>

        <h2>第1条（収集する情報）</h2>
        <p>本サービスでは以下の情報を収集します。</p>
        <ul>
          <li>Googleアカウントから取得する情報（メールアドレス、表示名、プロフィール画像URL）</li>
          <li>ユーザーがアップロードした画像データ</li>
          <li>ユーザーが設定したタグ、メモ、スクラップブックのカスタマイズ情報</li>
          <li>お問い合わせフォームから送信された情報（氏名、メールアドレス、件名、内容）</li>
        </ul>

        <h2>第2条（情報の利用目的）</h2>
        <p>収集した情報は以下の目的で利用します。</p>
        <ul>
          <li>本サービスの提供・運営・改善</li>
          <li>ユーザー認証およびアカウント管理</li>
          <li>お問い合わせへの対応</li>
          <li>サービスの不正利用防止</li>
        </ul>

        <h2>第3条（第三者への提供）</h2>
        <p>
          運営者は、法令に基づく場合を除き、ユーザーの個人情報を事前の同意なく第三者に提供しません。
        </p>

        <h2>第4条（利用する外部サービス）</h2>
        <p>本サービスは以下の外部サービスを利用しています。</p>
        <ul>
          <li><strong>Google OAuth</strong>：ユーザー認証のため</li>
          <li><strong>Supabase</strong>：データの保存・管理のため</li>
          <li><strong>Amazon S3</strong>：画像データの保存のため</li>
          <li><strong>Vercel</strong>：フロントエンドのホスティングのため</li>
        </ul>
        <p>各サービスのプライバシーポリシーについては、各社のウェブサイトをご参照ください。</p>

        <h2>第5条（データの保管・削除）</h2>
        <p>
          収集したデータはサービス提供に必要な期間保管します。アカウントを削除した場合、関連するデータは速やかに削除されます。
        </p>

        <h2>第6条（セキュリティ）</h2>
        <p>
          運営者は個人情報の漏洩・紛失・不正アクセスを防ぐため、適切なセキュリティ対策を講じます。ただし、インターネット上での完全な安全性を保証するものではありません。
        </p>

        <h2>第7条（ポリシーの変更）</h2>
        <p>
          本ポリシーは必要に応じて変更される場合があります。重要な変更がある場合はサービス上でお知らせします。
        </p>

        <h2>第8条（お問い合わせ）</h2>
        <p>
          個人情報の取り扱いに関するお問い合わせは、本サービス内の<a href="/contact">お問い合わせフォーム</a>よりご連絡ください。
        </p>
      </div>
    </div>
  )
}
