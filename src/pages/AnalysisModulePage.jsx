import { Navigate, useParams } from 'react-router-dom'
import AnalysisModule from '../components/AnalysisModule'
import DashShell from '../components/DashShell'
import { getSessionUser } from '../services/authStore'
import { ANALYSIS_MODULES } from '../services/analysisEngine'
import '../styles/landing-base.css'
import '../styles/landing-extra.css'
import '../styles/financial.css'

const VALID = new Set(
  ANALYSIS_MODULES.filter((m) => !['structure', 'deepReading', 'stats'].includes(m.id)).map((m) => m.id),
)

const ROUTE_TO_ID = {
  cockpit: 'cockpit',
  liquidite: 'liquidity',
  solvabilite: 'solvency',
  rentabilite: 'profitability',
  activite: 'activity',
  dupont: 'dupont',
  score: 'score',
  tendances: 'trends',
}

export default function AnalysisModulePage() {
  const { moduleSlug } = useParams()
  const user = getSessionUser()
  const moduleId = ROUTE_TO_ID[moduleSlug] || moduleSlug

  if (!user) return <Navigate to="/login" replace />
  if (!VALID.has(moduleId)) {
    return <Navigate to="/dashboard/analyse/cockpit" replace />
  }

  return (
    <DashShell user={user} showSidebar activeSidebar={moduleId}>
      <AnalysisModule user={user} moduleId={moduleId} />
    </DashShell>
  )
}
