import { useEffect, useRef, useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import SiteLogo from './SiteLogo'
import { useLandingLang } from '../hooks/useLandingLang'
import { logout } from '../services/authStore'

export default function DashShell({ user, children, activeNav }) {
  const { t, dir, lang, setLang } = useLandingLang()
  const navigate = useNavigate()
  const d = t.dashboard
  const [menuOpen, setMenuOpen] = useState(false)
  const menuRef = useRef(null)

  useEffect(() => {
    if (!menuOpen) return undefined
    const onDoc = (e) => {
      if (menuRef.current && !menuRef.current.contains(e.target)) setMenuOpen(false)
    }
    const onKey = (e) => {
      if (e.key === 'Escape') setMenuOpen(false)
    }
    document.addEventListener('mousedown', onDoc)
    window.addEventListener('keydown', onKey)
    return () => {
      document.removeEventListener('mousedown', onDoc)
      window.removeEventListener('keydown', onKey)
    }
  }, [menuOpen])

  const handleLogout = () => {
    logout()
    navigate('/', { replace: true })
  }

  return (
    <div className="dash-page" dir={dir}>
      <header className="dash-header">
        <Link to="/dashboard" className="dash-logo">
          <SiteLogo />
        </Link>
        <div className="dash-header-actions">
          <div className="landing-lang-switch" role="group" aria-label={t.langSwitchLabel}>
            <button
              type="button"
              className={`landing-lang-btn ${lang === 'ar' ? 'active' : ''}`}
              onClick={() => setLang('ar')}
              aria-pressed={lang === 'ar'}
            >
              العربية
            </button>
            <button
              type="button"
              className={`landing-lang-btn ${lang === 'fr' ? 'active' : ''}`}
              onClick={() => setLang('fr')}
              aria-pressed={lang === 'fr'}
            >
              Français
            </button>
          </div>

          <div className="dash-user-menu" ref={menuRef}>
            <button
              type="button"
              className={`dash-user-chip dash-user-chip--btn ${menuOpen ? 'is-open' : ''}`}
              aria-haspopup="menu"
              aria-expanded={menuOpen}
              onClick={() => setMenuOpen((v) => !v)}
            >
              {user.fullName}
              <span className="dash-user-caret" aria-hidden="true">
                ▾
              </span>
            </button>
            {menuOpen && (
              <div className="dash-user-dropdown" role="menu">
                <Link
                  to="/dashboard/profile"
                  role="menuitem"
                  className="dash-user-dropdown__item"
                  onClick={() => setMenuOpen(false)}
                >
                  {d.personalData}
                </Link>
                <button
                  type="button"
                  role="menuitem"
                  className="dash-user-dropdown__item dash-user-dropdown__item--danger"
                  onClick={handleLogout}
                >
                  {d.logout}
                </button>
              </div>
            )}
          </div>
        </div>
      </header>

      {activeNav != null && (
        <nav className="dash-subnav" aria-label={d.statementsNav}>
          <Link
            to="/dashboard"
            className={`dash-subnav__link ${activeNav === 'home' ? 'is-active' : ''}`}
          >
            {d.home}
          </Link>
          <Link
            to="/dashboard/bilan"
            className={`dash-subnav__link ${activeNav === 'bilan' ? 'is-active' : ''}`}
          >
            Bilan
          </Link>
          <Link
            to="/dashboard/tcr"
            className={`dash-subnav__link ${activeNav === 'tcr' ? 'is-active' : ''}`}
          >
            TCR
          </Link>
        </nav>
      )}

      <main className="dash-main">{children}</main>
    </div>
  )
}
