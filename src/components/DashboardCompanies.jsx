import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { LEGAL_FORM_OPTIONS, WILAYA_OPTIONS, legalFormLabel, wilayaLabel } from '../config/companyOptions'
import {
  addCompany,
  getActiveCompanyId,
  listCompanies,
  removeCompany,
  setActiveCompany,
} from '../services/companyStore'

const EMPTY_FORM = {
  name: '',
  legalForm: 'sarl',
  nif: '',
  nis: '',
  rc: '',
  capitalSocial: '',
  activity: '',
  wilaya: '',
  address: '',
}

export default function DashboardCompanies({ user, t, lang }) {
  const c = t.companies
  const [companies, setCompanies] = useState(() => listCompanies(user.id))
  const [activeId, setActiveId] = useState(() => getActiveCompanyId(user.id))
  const [form, setForm] = useState(EMPTY_FORM)
  const [error, setError] = useState('')
  const [flash, setFlash] = useState('')

  useEffect(() => {
    setCompanies(listCompanies(user.id))
    setActiveId(getActiveCompanyId(user.id))
  }, [user.id])

  const refresh = () => {
    setCompanies(listCompanies(user.id))
    setActiveId(getActiveCompanyId(user.id))
  }

  const onChange = (key) => (e) => {
    setForm((prev) => ({ ...prev, [key]: e.target.value }))
    setError('')
  }

  const handleAdd = (e) => {
    e.preventDefault()
    setError('')
    setFlash('')
    try {
      const created = addCompany(user.id, form)
      setForm(EMPTY_FORM)
      refresh()
      setFlash(c.addedFlash.replace('{name}', created.name))
      window.setTimeout(() => setFlash(''), 2200)
    } catch (err) {
      if (err?.message === 'NAME_REQUIRED') setError(c.nameRequired)
      else setError(c.addFailed)
    }
  }

  const handleSelect = (companyId) => {
    setActiveCompany(user.id, companyId)
    refresh()
  }

  const handleRemove = (companyId, name) => {
    const ok = window.confirm(c.removeConfirm.replace('{name}', name))
    if (!ok) return
    removeCompany(user.id, companyId)
    refresh()
  }

  return (
    <section className="dash-home-panel company-home">
      <p className="dash-kicker">{c.kicker}</p>
      <h1 className="dash-title">{c.title}</h1>

      {companies.length > 0 && (
        <div className="company-list-block">
          <ul className="company-list">
            {companies.map((co) => {
              const isActive = co.id === activeId
              return (
                <li key={co.id} className={`company-card ${isActive ? 'is-active' : ''}`}>
                  <div className="company-card__main">
                    <strong className="company-card__name">{co.name}</strong>
                    <span className="company-card__meta">
                      {legalFormLabel(co.legalForm, lang)}
                      {co.wilaya ? ` · ${wilayaLabel(co.wilaya, lang)}` : ''}
                      {co.nif ? ` · NIF ${co.nif}` : ''}
                    </span>
                    {isActive && <span className="company-card__badge">{c.activeBadge}</span>}
                  </div>
                  <div className="company-card__actions">
                    {!isActive && (
                      <button type="button" className="btn btn-primary btn-sm" onClick={() => handleSelect(co.id)}>
                        {c.select}
                      </button>
                    )}
                    {isActive && (
                      <Link to="/dashboard/bilan" className="btn btn-primary btn-sm">
                        {c.openBilan}
                      </Link>
                    )}
                    <button
                      type="button"
                      className="btn btn-ghost btn-sm"
                      onClick={() => handleRemove(co.id, co.name)}
                    >
                      {c.remove}
                    </button>
                  </div>
                </li>
              )
            })}
          </ul>
        </div>
      )}

      <div className="company-form-block">
        <h2 className="company-block-title">{c.formTitle}</h2>
        <p className="company-block-hint">{c.formHint}</p>

        <form className="company-form" onSubmit={handleAdd}>
          <div className="company-form__grid">
            <label className="company-field company-field--wide">
              <span>{c.name}</span>
              <input
                className="fin-input"
                required
                value={form.name}
                onChange={onChange('name')}
                placeholder={c.namePlaceholder}
              />
            </label>

            <label className="company-field">
              <span>{c.legalForm}</span>
              <select className="fin-input" value={form.legalForm} onChange={onChange('legalForm')}>
                {LEGAL_FORM_OPTIONS.map((opt) => (
                  <option key={opt.value} value={opt.value}>
                    {lang === 'fr' ? opt.fr : opt.ar}
                  </option>
                ))}
              </select>
            </label>

            <label className="company-field">
              <span>{c.wilaya}</span>
              <select className="fin-input" value={form.wilaya} onChange={onChange('wilaya')}>
                <option value="">{c.wilayaPlaceholder}</option>
                {WILAYA_OPTIONS.map((w) => (
                  <option key={w.code} value={w.code}>
                    {w.code} — {lang === 'fr' ? w.fr : w.ar}
                  </option>
                ))}
              </select>
            </label>

            <label className="company-field">
              <span>{c.nif}</span>
              <input className="fin-input" value={form.nif} onChange={onChange('nif')} placeholder={c.nifHint} />
            </label>

            <label className="company-field">
              <span>{c.nis}</span>
              <input className="fin-input" value={form.nis} onChange={onChange('nis')} placeholder={c.nisHint} />
            </label>

            <label className="company-field">
              <span>{c.rc}</span>
              <input className="fin-input" value={form.rc} onChange={onChange('rc')} placeholder={c.rcHint} />
            </label>

            <label className="company-field">
              <span>{c.capital}</span>
              <input
                className="fin-input"
                value={form.capitalSocial}
                onChange={onChange('capitalSocial')}
                placeholder={c.capitalHint}
                inputMode="decimal"
              />
            </label>

            <label className="company-field company-field--wide">
              <span>{c.activity}</span>
              <input
                className="fin-input"
                value={form.activity}
                onChange={onChange('activity')}
                placeholder={c.activityPlaceholder}
              />
            </label>

            <label className="company-field company-field--wide">
              <span>{c.address}</span>
              <input
                className="fin-input"
                value={form.address}
                onChange={onChange('address')}
                placeholder={c.addressPlaceholder}
              />
            </label>
          </div>

          {error && (
            <p className="company-form__error" role="alert">
              {error}
            </p>
          )}
          {flash && (
            <p className="company-form__flash" role="status">
              {flash}
            </p>
          )}

          <div className="company-form__actions">
            <button type="submit" className="btn btn-primary">
              {c.addSubmit}
            </button>
          </div>
        </form>
      </div>
    </section>
  )
}
