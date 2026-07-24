import { Link } from 'react-router-dom'
import SiteLogo from '../components/SiteLogo'
import { useLandingLang } from '../hooks/useLandingLang'
import '../styles/landing-base.css'
import '../styles/landing-extra.css'

export default function Login() {
  const { t, dir } = useLandingLang()

  return (
    <div className="login-page" dir={dir}>
      <div className="login-bg">
        <div className="login-grid" />
      </div>
      <div className="login-container">
        <div className="login-card">
          <Link to="/" className="login-logo">
            <SiteLogo />
          </Link>
          <h1 className="login-title">{t.nav.login}</h1>
          <p className="login-soon">{t.loginSoon}</p>
          <Link to="/" className="btn btn-primary btn-lg">
            {t.nav.register}
          </Link>
        </div>
      </div>
    </div>
  )
}
