import { useEffect, useRef, useState } from 'react'
import { Link, NavLink, useNavigate } from 'react-router-dom'
import SiteLogo from './SiteLogo'
import { useLandingLang } from '../hooks/useLandingLang'
import { logout } from '../services/authStore'
import { getActiveCompany } from '../services/companyStore'
import { ANALYSIS_MODULES } from '../services/analysisEngine'

const ICONS = {
  chart: (
    <svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" strokeWidth="1.8">
      <path d="M4 19V5" />
      <path d="M4 19h16" />
      <path d="M8 16V10" />
      <path d="M12 16V7" />
      <path d="M16 16v-4" />
    </svg>
  ),
  pulse: (
    <svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" strokeWidth="1.8">
      <path d="M3 12h4l2-6 4 12 2-6h6" />
    </svg>
  ),
  drop: (
    <svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" strokeWidth="1.8">
      <path d="M12 3s6 6.5 6 11a6 6 0 1 1-12 0c0-4.5 6-11 6-11z" />
    </svg>
  ),
  shield: (
    <svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" strokeWidth="1.8">
      <path d="M12 3l8 3v6c0 5-3.5 8.5-8 10-4.5-1.5-8-5-8-10V6l8-3z" />
    </svg>
  ),
  trend: (
    <svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" strokeWidth="1.8">
      <path d="M4 18l6-6 4 4 6-8" />
      <path d="M14 8h6v6" />
    </svg>
  ),
  cycle: (
    <svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" strokeWidth="1.8">
      <path d="M4 12a8 8 0 0 1 13.5-5.8" />
      <path d="M20 12a8 8 0 0 1-13.5 5.8" />
      <path d="M17 4v4h4" />
      <path d="M7 20v-4H3" />
    </svg>
  ),
  layers: (
    <svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" strokeWidth="1.8">
      <path d="M12 3l9 5-9 5-9-5 9-5z" />
      <path d="M3 13l9 5 9-5" />
      <path d="M3 17l9 5 9-5" />
    </svg>
  ),
  score: (
    <svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" strokeWidth="1.8">
      <circle cx="12" cy="12" r="8" />
      <path d="M12 8v4l3 2" />
    </svg>
  ),
  timeline: (
    <svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" strokeWidth="1.8">
      <path d="M4 6h16" />
      <path d="M4 12h10" />
      <path d="M4 18h13" />
      <circle cx="18" cy="12" r="2" />
      <circle cx="20" cy="18" r="2" />
    </svg>
  ),
}

export default function DashShell({ user, children, showSidebar = false, activeSidebar }) {
  const { t, dir, lang, setLang } = useLandingLang()
  const navigate = useNavigate()
  const d = t.dashboard
  const navLabels = t.modules?.nav || {}
  const [menuOpen, setMenuOpen] = useState(false)
  const menuRef = useRef(null)
  const [activeCompany, setActiveCompanyState] = useState(() => getActiveCompany(user.id))

  useEffect(() => {
    setActiveCompanyState(getActiveCompany(user.id))
  }, [user.id])

  useEffect(() => {
    const sync = () => setActiveCompanyState(getActiveCompany(user.id))
    window.addEventListener('focus', sync)
    window.addEventListener('anafin:company-changed', sync)
    return () => {
      window.removeEventListener('focus', sync)
      window.removeEventListener('anafin:company-changed', sync)
    }
  }, [user.id])

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
          <Link to="/dashboard" className="dash-company-chip" title={d.studying}>
            <span className="dash-company-chip__label">{d.studying}</span>
            <strong>{activeCompany?.name || d.noCompanyShort}</strong>
          </Link>
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
                {user.role === 'superadmin' && (
                  <Link
                    to="/dashboard/admin/users"
                    role="menuitem"
                    className="dash-user-dropdown__item"
                    onClick={() => setMenuOpen(false)}
                  >
                    {d.adminUsers}
                  </Link>
                )}
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
            <nav className="dash-sidebar__nav">
              {ANALYSIS_MODULES.map((mod) => (
                <NavLink
                  key={mod.id}
                  to={mod.path}
                  className={({ isActive }) =>
                    `dash-sidebar__item ${isActive || activeSidebar === mod.id ? 'is-active' : ''}`
                  }
                >
                  <span className="dash-sidebar__icon" aria-hidden="true">
                    {ICONS[mod.icon] || ICONS.chart}
                  </span>
                  <span className="dash-sidebar__text">
                    <span className="dash-sidebar__item-label">
                      {navLabels[mod.id] || (mod.id === 'structure' ? d.structureAnalysis : mod.id)}
                    </span>
                  </span>
                </NavLink>
              ))}
            </nav>
          </aside>
        )}
        <main className="dash-main">{children}</main>
      </div>
    </div>
  )
}
