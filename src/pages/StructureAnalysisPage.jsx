import { Navigate } from 'react-router-dom'
import DashShell from '../components/DashShell'
import StructureAnalysis from '../components/StructureAnalysis'
import { useLandingLang } from '../hooks/useLandingLang'
import { getSessionUser } from '../services/authStore'
import '../styles/landing-base.css'
import '../styles/landing-extra.css'
import '../styles/financial.css'

export default function StructureAnalysisPage() {
  const { t, lang } = useLandingLang()
  const user = getSessionUser()
  if (!user) return <Navigate to="/login" replace />

  return (
    <DashShell user={user} showSidebar activeSidebar="structure">
      <StructureAnalysis user={user} t={t} lang={lang} />
    </DashShell>
  )
}
