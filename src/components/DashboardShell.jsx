import { useEffect, useRef, useState } from 'react'
import { Link, NavLink, useNavigate } from 'react-router-dom'
import SiteLogo from './SiteLogo'
import { useLandingLang } from '../hooks/useLandingLang'
import { getSessionUser, logout } from '../services/authStore'

export default function DashboardShell({ children, title }) {
  const { t, dir, lang, setLang } = useLandingLang()
  const navigate = useNavigate()
  const user = getSessionUser()
  const d = t.dashboard
  const [menuOpen, setMenuOpen] = useState(false)
  const menuRef = useRef(null)

  useEffect(() => {
    const onDoc = (e) => {
      if (!menuRef.current?.contains(e.target)) setMenuOpen(false)
    }
    document.addEventListener('mousedown', onDoc)
    return () => document.removeEventListener('mousedown', onDoc)
  }, [])

  if (!user) return null

  const handleLogout = () => {
    logout()
    navigate('/', { replace: true })
  }

  return (
    <div className="dash-page" dir={dir}>
      <header className="dash-header">
        <div className="dash-header-start">
          <Link to="/dashboard" className="dash-logo">
            <SiteLogo />
          </Link>
          <nav className="dash-nav" aria-label={d.navAria}>
            <NavLink to="/dashboard/scf" className={({ isActive }) => `dash-nav-link ${isActive ? 'active' : ''}`}>
              SCF
            </NavLink>
            <NavLink to="/dashboard/bilan" className={({ isActive }) => `dash-nav-link ${isActive ? 'active' : ''}`}>
              {d.navBilan}
            </NavLink>
            <NavLink to="/dashboard/tcr" className={({ isActive }) => `dash-nav-link ${isActive ? 'active' : ''}`}>
              TCR
            </NavLink>
          </nav>
        </div>

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
              onClick={() => setMenuOpen((v) => !v)}
              aria-expanded={menuOpen}
              aria-haspopup="menu"
            >
              {user.fullName}
              <span className="dash-user-caret" aria-hidden="true">
                ▾
              </span>
            </button>
            {menuOpen && (
              <div className="dash-user-dropdown" role="menu">
                <button
                  type="button"
                  role="menuitem"
                  onClick={() => {
                    setMenuOpen(false)
                    navigate('/dashboard/profile')
                  }}
                >
                  {d.personalData}
                </button>
                <button
                  type="button"
                  role="menuitem"
                  className="dash-user-dropdown__danger"
                  onClick={handleLogout}
                >
                  {d.logout}
                </button>
              </div>
            )}
          </div>
        </div>
      </header>

      <main className="dash-main">
        {title ? <h1 className="dash-page-title">{title}</h1> : null}
        {children}
      </main>
    </div>
  )
}
