import { useState } from 'react'
import { Navigate } from 'react-router-dom'
import DashShell from '../components/DashShell'
import { useLandingLang } from '../hooks/useLandingLang'
import { getSessionUser, listUsers, setUserActive } from '../services/authStore'
import '../styles/landing-base.css'
import '../styles/landing-extra.css'
import '../styles/financial.css'

export default function AdminUsersPage() {
  const { t, lang } = useLandingLang()
  const session = getSessionUser()
  const a = t.admin
  const [users, setUsers] = useState(() => listUsers())
  const [message, setMessage] = useState('')
  const [error, setError] = useState('')

  if (!session) return <Navigate to="/login" replace />
  if (session.role !== 'superadmin') return <Navigate to="/dashboard" replace />

  const refresh = () => setUsers(listUsers())

  const toggle = (user) => {
    setError('')
    setMessage('')
    try {
      setUserActive(user.id, !user.active)
      refresh()
      setMessage(user.active ? a.deactivated : a.activated)
    } catch (err) {
      if (err?.message === 'CANNOT_DISABLE_SUPERADMIN') setError(a.cannotDisableAdmin)
      else setError(a.actionFailed)
    }
  }

  return (
    <DashShell user={session}>
      <section className="admin-page">
        <header className="analysis-page__head">
          <div>
            <p className="fin-kicker">{a.kicker}</p>
            <h1 className="analysis-page__title">{a.title}</h1>
            <p className="analysis-page__lead">{a.lead}</p>
          </div>
          <div className="admin-count">
            <span>{a.totalUsers}</span>
            <strong>{users.length}</strong>
          </div>
        </header>

        {message && <div className="register-success">{message}</div>}
        {error && (
          <div className="register-error" role="alert">
            {error}
          </div>
        )}

        <div className="admin-table-wrap">
          <table className="admin-table">
            <thead>
              <tr>
                <th>{a.colName}</th>
                <th>{a.colEmail}</th>
                <th>{a.colRole}</th>
                <th>{a.colStatus}</th>
                <th>{a.colCreated}</th>
                <th>{a.colActions}</th>
              </tr>
            </thead>
            <tbody>
              {users.map((u) => (
                <tr key={u.id} className={!u.active ? 'is-disabled' : ''}>
                  <td>{u.fullName}</td>
                  <td>{u.email}</td>
                  <td>
                    <span className={`admin-pill ${u.role === 'superadmin' ? 'is-admin' : ''}`}>
                      {u.role === 'superadmin' ? a.roleAdmin : a.roleUser}
                    </span>
                  </td>
                  <td>
                    <span className={`admin-pill ${u.active ? 'is-on' : 'is-off'}`}>
                      {u.active ? a.statusActive : a.statusInactive}
                    </span>
                  </td>
                  <td>
                    {u.createdAt
                      ? new Date(u.createdAt).toLocaleDateString(lang === 'ar' ? 'ar-DZ' : 'fr-FR')
                      : '—'}
                  </td>
                  <td>
                    {u.role === 'superadmin' ? (
                      <span className="admin-muted">—</span>
                    ) : (
                      <button
                        type="button"
                        className={`btn btn-sm ${u.active ? 'btn-ghost' : 'btn-primary'}`}
                        onClick={() => toggle(u)}
                      >
                        {u.active ? a.deactivate : a.activate}
                      </button>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>
    </DashShell>
  )
}
