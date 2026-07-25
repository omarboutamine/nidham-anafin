import { Navigate } from 'react-router-dom'
import BilanManual from '../components/BilanManual'
import DashShell from '../components/DashShell'
import { useLandingLang } from '../hooks/useLandingLang'
import { getSessionUser } from '../services/authStore'
import '../styles/landing-base.css'
import '../styles/landing-extra.css'
import '../styles/financial.css'

export default function BilanPage() {
  const { t, lang } = useLandingLang()
  const user = getSessionUser()
  if (!user) return <Navigate to="/login" replace />

  return (
    <DashShell user={user}>
      <BilanManual user={user} t={t} lang={lang} />
    </DashShell>
  )
}
