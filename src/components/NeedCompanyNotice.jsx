import { Link } from 'react-router-dom'

/** Empty state when no study company is selected. */
export default function NeedCompanyNotice({ t }) {
  const c = t.companies
  return (
    <section className="need-company">
      <h1 className="need-company__title">{c.needCompanyTitle}</h1>
      <p className="need-company__lead">{c.needCompanyLead}</p>
      <Link to="/dashboard" className="btn btn-primary">
        {c.goHome}
      </Link>
    </section>
  )
}
