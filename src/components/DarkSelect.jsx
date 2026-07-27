import { useEffect, useId, useRef, useState } from 'react'

/**
 * Custom dark select — native <option> menus stay light on Windows.
 * options: [{ value, label, disabled? }]
 */
export default function DarkSelect({
  value,
  onChange,
  options = [],
  required = false,
  disabled = false,
  className = '',
  'aria-label': ariaLabel,
  name,
}) {
  const [open, setOpen] = useState(false)
  const rootRef = useRef(null)
  const listId = useId()
  const selected = options.find((o) => String(o.value) === String(value))
  const label = selected?.label ?? ''

  useEffect(() => {
    if (!open) return undefined
    const onDoc = (e) => {
      if (!rootRef.current?.contains(e.target)) setOpen(false)
    }
    const onKey = (e) => {
      if (e.key === 'Escape') setOpen(false)
    }
    document.addEventListener('mousedown', onDoc)
    document.addEventListener('keydown', onKey)
    return () => {
      document.removeEventListener('mousedown', onDoc)
      document.removeEventListener('keydown', onKey)
    }
  }, [open])

  const pick = (opt) => {
    if (opt.disabled) return
    onChange?.({ target: { value: opt.value, name } })
    setOpen(false)
  }

  return (
    <div className={`dark-select ${open ? 'is-open' : ''} ${className}`.trim()} ref={rootRef}>
      <button
        type="button"
        className="dark-select__trigger"
        aria-haspopup="listbox"
        aria-expanded={open}
        aria-controls={listId}
        aria-label={ariaLabel}
        disabled={disabled}
        onClick={() => !disabled && setOpen((v) => !v)}
      >
        <span className={`dark-select__value ${!selected || selected.value === '' ? 'is-placeholder' : ''}`}>
          {label || '—'}
        </span>
        <span className="dark-select__chevron" aria-hidden="true" />
      </button>

      {required && (
        <input
          className="dark-select__native"
          tabIndex={-1}
          aria-hidden="true"
          required
          value={value ?? ''}
          onChange={() => {}}
        />
      )}

      {open && (
        <ul id={listId} className="dark-select__menu" role="listbox" aria-activedescendant={undefined}>
          {options.map((opt) => {
            const active = String(opt.value) === String(value)
            return (
              <li key={`${opt.value}::${opt.label}`} role="option" aria-selected={active}>
                <button
                  type="button"
                  className={`dark-select__option ${active ? 'is-active' : ''} ${opt.disabled ? 'is-disabled' : ''}`}
                  disabled={opt.disabled}
                  onClick={() => pick(opt)}
                >
                  {opt.label}
                </button>
              </li>
            )
          })}
        </ul>
      )}
    </div>
  )
}
