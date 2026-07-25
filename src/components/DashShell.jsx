import { useEffect, useRef, useState } from 'react'
import { Link, NavLink, useNavigate } from 'react-router-dom'
import SiteLogo from './SiteLogo'
import { useLandingLang } from '../hooks/useLandingLang'
import { logout } from '../services/authStore'

export default function DashShell({ user, children, showSidebar = false, activeSidebar }) {
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
    <div className={`dash-page ${showSidebar ? 'dash-page--with-sidebar' : ''}`} dir={dir}>
      <header className="dash-header">
        <div className="dash-header__start">
          <Link to="/dashboard" className="dash-logo">
            <SiteLogo />
          </Link>
          <nav className="dash-header-nav" aria-label={d.statementsNav}>
            <NavLink to="/dashboard" end className={({ isActive }) => `dash-header-nav__link ${isActive ? 'is-active' : ''}`}>
              {d.home}
            </NavLink>
            <NavLink
              to="/dashboard/bilan"
              className={({ isActive }) => `dash-header-nav__link ${isActive ? 'is-active' : ''}`}
            >
              {d.bilan}
            </NavLink>
            <NavLink
              to="/dashboard/tcr"
              className={({ isActive }) => `dash-header-nav__link ${isActive ? 'is-active' : ''}`}
            >
              {d.tcr}
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

      <div className={`dash-body ${showSidebar ? 'dash-body--split' : ''}`}>
        {showSidebar && (
          <aside className="dash-sidebar" aria-label={d.sidebarAria}>
            <div className="dash-sidebar__head">
              <span className="dash-sidebar__badge">{d.sidebarBadge}</span>
              <p className="dash-sidebar__title">{d.sidebarTitle}</p>
            </div>
            <nav className="dash-sidebar__nav">
              <NavLink
                to="/dashboard/analyse-structure"
                className={({ isActive }) =>
                  `dash-sidebar__item ${isActive || activeSidebar === 'structure' ? 'is-active' : ''}`
                }
              >
                <span className="dash-sidebar__icon" aria-hidden="true">
                  <svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" strokeWidth="1.8">
                    <path d="M4 19V5" />
                    <path d="M4 19h16" />
                    <path d="M8 16V10" />
                    <path d="M12 16V7" />
                    <path d="M16 16v-4" />
                  </svg>
                </span>
                <span className="dash-sidebar__text">
                  <span className="dash-sidebar__item-label">{d.structureAnalysis}</span>
                  <span className="dash-sidebar__item-desc">{d.structureAnalysisDesc}</span>
                </span>
              </NavLink>
            </nav>
          </aside>
        )}
        <main className="dash-main">{children}</main>
      </div>
    </div>
  )
}
