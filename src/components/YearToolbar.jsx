import { useState } from 'react'
import { addYear, listYears, removeYear, setActiveYear } from '../services/financialStore'

export default function YearToolbar({ userId, activeYear, onYearChange, t, getYearTemplate }) {
  const f = t.financial
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
    if (years.length <= 1) {
      setError(f.yearKeepOne)
      return
    }
    const store = removeYear(userId, activeYear)
    setError('')
    refresh(store.activeYear)
  }

  return (
    <div className="year-toolbar">
      <label className="year-toolbar__label">
        {f.exercise}
        <select
          className="fin-input year-toolbar__select"
          value={activeYear}
          onChange={(e) => handleSelect(e.target.value)}
        >
          {years.map((y) => (
            <option key={y} value={y}>
              {y}
            </option>
          ))}
        </select>
      </label>

      <form className="year-toolbar__add" onSubmit={handleAdd}>
        <input
          className="fin-input year-toolbar__draft"
          inputMode="numeric"
          maxLength={4}
          placeholder={f.yearPlaceholder}
          value={draft}
          onChange={(e) => setDraft(e.target.value.replace(/\D/g, '').slice(0, 4))}
          aria-label={f.addYear}
        />
        <button type="submit" className="btn btn-ghost btn-sm">
          {f.addYear}
        </button>
      </form>

      <button type="button" className="btn btn-ghost btn-sm year-toolbar__remove" onClick={handleRemove}>
        {f.removeYear}
      </button>

      {error && (
        <span className="year-toolbar__error" role="alert">
          {error}
        </span>
      )}
    </div>
  )
}
