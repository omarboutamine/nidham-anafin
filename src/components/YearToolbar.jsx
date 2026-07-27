import { useState } from 'react'
import { useLandingLang } from '../hooks/useLandingLang'
import { addYear, listYears, removeYear, setActiveYear } from '../services/financialStore'

export default function YearToolbar({
  userId,
  activeYear,
  onYearChange,
  t,
  getYearTemplate,
  /** Only financial statements pages may create/delete years. */
  allowYearManage = false,
}) {
  const f = t.financial
  const { dir } = useLandingLang()
  const [years, setYears] = useState(() => listYears(userId))
  const [draft, setDraft] = useState('')
  const [error, setError] = useState('')

  const refresh = (storeYear) => {
    setYears(listYears(userId))
    onYearChange(storeYear)
  }

  const handleSelect = (year) => {
    setActiveYear(userId, year)
    setError('')
    refresh(year)
  }

  const handleAdd = (e) => {
    e.preventDefault()
    if (!allowYearManage) return
    setError('')
    const y = draft.trim()
    try {
      const sourceData = typeof getYearTemplate === 'function' ? getYearTemplate() : null
      addYear(userId, y, undefined, sourceData || undefined)
      setDraft('')
      refresh(y)
    } catch {
      setError(f.yearInvalid)
    }
  }

  const handleRemove = () => {
    if (!allowYearManage) return
    if (years.length <= 1) {
      setError(f.yearKeepOne)
      return
    }
    const store = removeYear(userId, activeYear)
    setError('')
    refresh(store.activeYear)
  }

  return (
    <div className={`year-toolbar ${allowYearManage ? '' : 'year-toolbar--select-only'}`.trim()} dir={dir}>
      <div className="year-toolbar__block">
        <span className="year-toolbar__caption">{f.exercise}</span>
        <div className="year-toolbar__years" role="tablist" aria-label={f.exercise} dir={dir}>
          {years.map((y) => {
            const selected = String(y) === String(activeYear)
            return (
              <button
                key={y}
                type="button"
                role="tab"
                aria-selected={selected}
                className={`year-chip ${selected ? 'is-active' : ''}`}
                onClick={() => handleSelect(y)}
              >
                {y}
              </button>
            )
          })}
        </div>
      </div>

      {allowYearManage && (
        <div className="year-toolbar__actions">
          <form className="year-toolbar__add" onSubmit={handleAdd}>
            <input
              className="year-toolbar__draft"
              inputMode="numeric"
              maxLength={4}
              placeholder={f.yearPlaceholder}
              value={draft}
              onChange={(e) => setDraft(e.target.value.replace(/\D/g, '').slice(0, 4))}
              aria-label={f.addYear}
            />
            <button type="submit" className="year-toolbar__btn year-toolbar__btn--accent" title={f.addYear}>
              <span aria-hidden="true">+</span>
              <span className="year-toolbar__btn-text">{f.addYear}</span>
            </button>
          </form>

          <button
            type="button"
            className="year-toolbar__btn year-toolbar__btn--muted"
            onClick={handleRemove}
            title={f.removeYear}
          >
            <span className="year-toolbar__btn-text">{f.removeYear}</span>
          </button>
        </div>
      )}

      {error && (
        <span className="year-toolbar__error" role="alert">
          {error}
        </span>
      )}
    </div>
  )
}
