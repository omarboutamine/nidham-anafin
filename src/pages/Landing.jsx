import { useState } from 'react'
import { Link } from 'react-router-dom'
import SiteLogo from '../components/SiteLogo'
import StudentRegisterModal from '../components/StudentRegisterModal'
import { SITE_BRAND } from '../config/siteBrand'
import { useLandingLang } from '../hooks/useLandingLang'
import '../styles/landing-base.css'
import '../styles/landing-extra.css'

export default function Landing() {
  const { lang, setLang, t, dir } = useLandingLang()
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false)
  const [registerOpen, setRegisterOpen] = useState(false)

  const openRegister = () => {
    setMobileMenuOpen(false)
    setRegisterOpen(true)
  }

  return (
    <div className={`landing landing--${lang}`} dir={dir}>
      <header className="header landing-header">
        <div className="header-inner">
          <Link to="/" className="logo">
            <SiteLogo />
          </Link>
          <button
            type="button"
            className="menu-toggle"
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            aria-label={t.menuAria}
          >
            <span></span>
            <span></span>
            <span></span>
          </button>
          <nav className={`nav landing-nav ${mobileMenuOpen ? 'open' : ''}`}>
            <a href="#features" onClick={() => setMobileMenuOpen(false)}>
              {t.nav.services}
            </a>
            <a href="#about" onClick={() => setMobileMenuOpen(false)}>
              {t.nav.about}
            </a>
            <a href="#cta" onClick={() => setMobileMenuOpen(false)}>
              {t.nav.contact}
            </a>
            <Link to="/login" className="nav-link-login" onClick={() => setMobileMenuOpen(false)}>
              {t.nav.login}
            </Link>
            <button type="button" onClick={openRegister} className="btn btn-primary btn-sm landing-nav-cta">
              {t.nav.register}
            </button>
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
          </nav>
        </div>
      </header>

      <section className="ticker-wrap landing-ticker" aria-label={t.tickerAria}>
        <div className="ticker">
          <div className="ticker-track">
            {[...t.ticker, ...t.ticker].map((item, i) => (
              <div key={`${item.label}-${i}`} className="ticker-item">
                <span className="ticker-symbol">{item.label}</span>
                <span className="ticker-value">{item.value}</span>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="hero">
        <div className="hero-bg">
          <div className="hero-grid"></div>
          <div className="hero-glow"></div>
        </div>
        <div className="hero-inner">
          <p className="hero-badge">{t.heroBadge}</p>
          <h1 className="hero-title">
            {t.heroTitle}
            <br />
            <span className="hero-title-accent">{t.heroTitleAccent}</span>
          </h1>
          <p className="hero-desc">{t.heroDesc}</p>
          <div className="hero-cta">
            <button type="button" className="btn btn-primary btn-lg" onClick={openRegister}>
              {t.heroRegister}
            </button>
            <Link to="/login" className="btn btn-ghost btn-lg">
              {t.heroLogin}
            </Link>
          </div>
        </div>
      </section>

      <section id="features" className="section features">
        <div className="container">
          <h2 className="section-title">{t.servicesTitle}</h2>
          <p className="section-desc">{t.servicesDesc}</p>
          <div className="features-grid features-grid--services">
            {t.services.map((f) => (
              <article key={f.title} className="feature-card">
                <div className="feature-icon" aria-hidden="true">
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8">
                    <path d="M4 19V5M4 19h16M8 15l3-4 3 2 4-6" strokeLinecap="round" strokeLinejoin="round" />
                  </svg>
                </div>
                <h3 className="feature-title">{f.title}</h3>
                <p className="feature-desc">{f.desc}</p>
              </article>
            ))}
          </div>
        </div>
      </section>

      <section id="about" className="section about-section">
        <div className="container">
          <div className="about-intro">
            <h2 className="section-title">{t.aboutTitle}</h2>
            <p className="section-desc about-lead">{t.aboutLead}</p>
          </div>
          <div className="about-grid">
            {t.aboutHighlights.map((item) => (
              <article key={item.value} className="about-card">
                <span className="about-card-value">{item.value}</span>
                <h3 className="about-card-label">{item.label}</h3>
                <p className="about-card-detail">{item.detail}</p>
              </article>
            ))}
          </div>
        </div>
      </section>

      <section id="cta" className="section cta">
        <div className="container">
          <div className="cta-card">
            <h2 className="cta-title">{t.ctaTitle}</h2>
            <p className="cta-desc">{t.ctaDesc}</p>
            <button type="button" onClick={openRegister} className="btn btn-primary btn-lg">
              {t.ctaButton}
            </button>
          </div>
        </div>
      </section>

      <footer className="footer">
        <div className="container">
          <div className="footer-inner">
            <div className="footer-brand">
              <SiteLogo />
              <p className="footer-tagline">
                {t.footerTagline} — {SITE_BRAND.domain}
              </p>
            </div>
            <div className="footer-links">
              <a href="#features">{t.nav.services}</a>
              <a href="#about">{t.nav.about}</a>
              <Link to="/login">{t.nav.login}</Link>
              <button type="button" onClick={openRegister} className="footer-link-btn">
                {t.nav.register}
              </button>
            </div>
          </div>
          <div className="footer-bottom">
            <p>
              © {new Date().getFullYear()} {SITE_BRAND.name} — {t.footerTagline}. {t.footerRights}
            </p>
          </div>
        </div>
      </footer>

      <StudentRegisterModal
        open={registerOpen}
        onClose={() => setRegisterOpen(false)}
        t={t}
        dir={dir}
      />
    </div>
  )
}
