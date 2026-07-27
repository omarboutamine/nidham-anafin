import { useEffect, useId, useRef, useState } from 'react'

/**
 * ! button: hover = live verdict only; click = explain + academic cases + verdict.
 */
export default function MetricInfo({
  title,
  explanation,
  cases,
  verdict,
  /** @deprecated use verdict */
  reading,
  /** @deprecated use explanation */
  formula,
  sectionLabels,
  closeLabel = 'OK',
}) {
  const [open, setOpen] = useState(false)
  const dialogRef = useRef(null)
  const tipId = useId()

  const live = verdict || reading || ''
  const explain = explanation || formula || ''
  const academic = cases || ''
  const labels = {
    explain: sectionLabels?.explain || 'Explanation',
    cases: sectionLabels?.cases || 'Cases',
    verdict: sectionLabels?.verdict || 'Result',
  }

  useEffect(() => {
    if (!open) return undefined
    const onKey = (e) => {
      if (e.key === 'Escape') setOpen(false)
    }
    document.addEventListener('keydown', onKey)
    const prev = document.body.style.overflow
    document.body.style.overflow = 'hidden'
    dialogRef.current?.focus()
    return () => {
      document.removeEventListener('keydown', onKey)
      document.body.style.overflow = prev
    }
  }, [open])

  return (
    <span className="metric-info">
      <button
        type="button"
        className="metric-info__btn"
        aria-label={title}
        aria-describedby={tipId}
        onClick={() => setOpen(true)}
      >
        !
        <span id={tipId} role="tooltip" className="metric-info__tooltip">
          {live || title}
        </span>
      </button>

      {open && (
        <div className="metric-info-modal" role="presentation" onClick={() => setOpen(false)}>
          <div
            className="metric-info-modal__dialog"
            role="dialog"
            aria-modal="true"
            aria-labelledby={`${tipId}-title`}
            tabIndex={-1}
            ref={dialogRef}
            onClick={(e) => e.stopPropagation()}
          >
            <h3 id={`${tipId}-title`} className="metric-info-modal__title">
              {title}
            </h3>

            {explain && (
              <div className="metric-info-modal__block">
                <h4>{labels.explain}</h4>
                <p>{explain}</p>
              </div>
            )}

            {academic && (
              <div className="metric-info-modal__block">
                <h4>{labels.cases}</h4>
                <p className="metric-info-modal__cases">{academic}</p>
              </div>
            )}

            {live && (
              <div className="metric-info-modal__block metric-info-modal__block--verdict">
                <h4>{labels.verdict}</h4>
                <p>{live}</p>
              </div>
            )}

            <button type="button" className="btn btn-primary metric-info-modal__close" onClick={() => setOpen(false)}>
              {closeLabel}
            </button>
          </div>
        </div>
      )}
    </span>
  )
}
