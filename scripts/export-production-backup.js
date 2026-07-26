/**
 * Paste this in the browser console on https://financial-analyses.netlify.app/
 * while logged in — it downloads a JSON backup of all Nidham localStorage data.
 */
;(() => {
  const data = {}
  for (let i = 0; i < localStorage.length; i += 1) {
    const key = localStorage.key(i)
    if (
      key &&
      (key === 'anafin_users' ||
        key === 'anafin_session' ||
        key === 'nidham-anafin-lang' ||
        key.startsWith('anafin_companies_') ||
        key.startsWith('anafin_financial_'))
    ) {
      data[key] = localStorage.getItem(key)
    }
  }
  const backup = {
    version: 1,
    app: 'nidham-anafin',
    exportedAt: new Date().toISOString(),
    data,
  }
  const blob = new Blob([JSON.stringify(backup, null, 2)], { type: 'application/json' })
  const a = document.createElement('a')
  a.href = URL.createObjectURL(blob)
  a.download = `nidham-anafin-backup-${new Date().toISOString().slice(0, 10)}.json`
  a.click()
  console.log('Backup downloaded. Keys:', Object.keys(data))
})()
