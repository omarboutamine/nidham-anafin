import { Document, HeadingLevel, Packer, Paragraph, TextRun } from 'docx'
import { saveAs } from 'file-saver'
import JSZip from 'jszip'
import * as XLSX from 'xlsx'
import { legalFormLabel, wilayaLabel } from '../config/companyOptions'
import { BILAN_SECTIONS, n, TCR_INPUTS } from '../config/financialTemplates'
import { resolveRowLabel } from '../config/labelI18n'
import { researchExportCopy } from '../config/researchExportI18n'
import { buildStructureMetricInfo } from '../config/structureMetricReadings'
import { listYears, loadFinancial } from './financialStore'
import { computeStructureMetrics } from './structureMetrics'

function slugify(name) {
  return String(name || 'entreprise')
    .replace(/[^\w\u0600-\u06ff\-]+/gi, '_')
    .replace(/_+/g, '_')
    .replace(/^_|_$/g, '')
    .slice(0, 48) || 'entreprise'
}

function rowKey(row) {
  return row.id || `${row.section}|${row.number}|${row.labelFr || ''}|${row.labelAr || ''}`
}

function sectionLabel(sectionKey, lang) {
  const s = BILAN_SECTIONS[sectionKey]
  if (!s) return sectionKey || ''
  return lang === 'ar' ? s.ar : s.fr
}

function gatherYears(userId, companyId) {
  const years = listYears(userId, companyId)
  return years
    .map((year) => {
      const data = loadFinancial(userId, year, companyId)
      const metrics = computeStructureMetrics(data.bilanRows)
      return {
        year,
        bilanRows: data.bilanRows || [],
        tcrAmounts: data.tcrAmounts || {},
        metrics,
      }
    })
    .filter((y) => !y.metrics.empty)
}

function buildBilanMatrix(yearPacks) {
  const order = []
  const seen = new Set()
  for (const pack of yearPacks) {
    for (const row of pack.bilanRows) {
      const key = rowKey(row)
      if (seen.has(key)) continue
      seen.add(key)
      order.push({ key, row })
    }
  }

  return order.map(({ key, row }) => {
    const amounts = {}
    for (const pack of yearPacks) {
      const match = pack.bilanRows.find((r) => rowKey(r) === key)
      amounts[pack.year] = match ? n(match.amount) : null
    }
    return { key, row, amounts }
  })
}

function buildExcelBuffer(company, yearPacks, lang) {
  const c = researchExportCopy[lang === 'fr' ? 'fr' : 'ar']
  const years = yearPacks.map((y) => y.year)
  const wb = XLSX.utils.book_new()

  const identity = [
    [c.field, c.value],
    [c.companyName, company.name || ''],
    [c.legalForm, legalFormLabel(company.legalForm, lang)],
    [c.wilaya, company.wilaya ? wilayaLabel(company.wilaya, lang) : ''],
    [c.nif, company.nif || ''],
    [c.nis, company.nis || ''],
    [c.rc, company.rc || ''],
    [c.capital, company.capitalSocial || ''],
    [c.activity, company.activity || ''],
    [c.address, company.address || ''],
    [c.yearsCovered, years.join(' · ')],
    [c.exportedAt, new Date().toISOString()],
  ]
  XLSX.utils.book_append_sheet(wb, XLSX.utils.aoa_to_sheet(identity), c.identitySheet)

  const bilanMatrix = buildBilanMatrix(yearPacks)
  const bilanAoa = [[c.section, c.account, c.label, ...years]]
  for (const item of bilanMatrix) {
    bilanAoa.push([
      sectionLabel(item.row.section, lang),
      item.row.number || '',
      resolveRowLabel(item.row, lang),
      ...years.map((y) => (item.amounts[y] == null || item.amounts[y] === 0 ? item.amounts[y] ?? '' : item.amounts[y])),
    ])
  }
  XLSX.utils.book_append_sheet(wb, XLSX.utils.aoa_to_sheet(bilanAoa), c.bilanSheet)

  const tcrAoa = [[c.label, ...years]]
  for (const input of TCR_INPUTS) {
    tcrAoa.push([
      lang === 'ar' ? input.labelAr : input.labelFr,
      ...yearPacks.map((pack) => {
        const raw = pack.tcrAmounts?.[input.id]
        if (raw == null || String(raw).trim() === '') return ''
        return n(raw)
      }),
    ])
  }
  XLSX.utils.book_append_sheet(wb, XLSX.utils.aoa_to_sheet(tcrAoa), c.tcrSheet)

  const ratioDefs = [
    ['liquidity', c.liquidity, c.liquidityFormula, (m) => m.liquidity],
    ['frng', c.frng, c.frngFormula, (m) => m.frng],
    ['bfr', c.bfr, c.bfrFormula, (m) => m.bfr],
    ['treasury', c.treasury, c.treasuryFormula, (m) => m.tresorerie],
    ['totalActif', c.totalActif, '', (m) => m.totalActif],
    ['totalPassif', c.totalPassif, '', (m) => m.totalPassif],
    ['shareCourant', c.shareCourant, '', (m) => m.shareCourant],
    ['shareNonCourant', c.shareNonCourant, '', (m) => m.shareNonCourant],
    ['shareEquity', c.shareEquity, '', (m) => m.shareEquity],
    ['shareDebt', c.shareDebt, '', (m) => m.shareDebt],
  ]
  const ratiosAoa = [[c.indicator, c.formula, ...years]]
  for (const [, label, formula, getter] of ratioDefs) {
    ratiosAoa.push([label, formula, ...yearPacks.map((pack) => {
      const v = getter(pack.metrics)
      return v == null || Number.isNaN(v) ? '' : v
    })])
  }
  XLSX.utils.book_append_sheet(wb, XLSX.utils.aoa_to_sheet(ratiosAoa), c.ratiosSheet)

  return XLSX.write(wb, { bookType: 'xlsx', type: 'array' })
}

function p(text, opts = {}) {
  return new Paragraph({
    spacing: { after: 200 },
    ...opts,
    children: [
      new TextRun({
        text: String(text || ''),
        rightToLeft: opts.rtl === true,
        bold: opts.bold === true,
        size: opts.size || 22,
      }),
    ],
  })
}

function heading(text, rtl) {
  return new Paragraph({
    heading: HeadingLevel.HEADING_1,
    spacing: { before: 280, after: 160 },
    children: [new TextRun({ text, bold: true, size: 28, rightToLeft: rtl })],
  })
}

function subheading(text, rtl) {
  return new Paragraph({
    heading: HeadingLevel.HEADING_2,
    spacing: { before: 220, after: 120 },
    children: [new TextRun({ text, bold: true, size: 24, rightToLeft: rtl })],
  })
}

async function buildWordBlob(company, yearPacks, lang) {
  const c = researchExportCopy[lang === 'fr' ? 'fr' : 'ar']
  const rtl = lang === 'ar'
  const children = [
    heading(c.docTitle, rtl),
    p(c.docIntro, { rtl }),
    heading(c.docIdentity, rtl),
    p(`${c.companyName}: ${company.name || '—'}`, { rtl }),
    p(`${c.legalForm}: ${legalFormLabel(company.legalForm, lang)}`, { rtl }),
    p(`${c.wilaya}: ${company.wilaya ? wilayaLabel(company.wilaya, lang) : '—'}`, { rtl }),
    p(`${c.nif}: ${company.nif || '—'}`, { rtl }),
    p(`${c.nis}: ${company.nis || '—'}`, { rtl }),
    p(`${c.rc}: ${company.rc || '—'}`, { rtl }),
    p(`${c.capital}: ${company.capitalSocial || '—'}`, { rtl }),
    p(`${c.activity}: ${company.activity || '—'}`, { rtl }),
    p(`${c.address}: ${company.address || '—'}`, { rtl }),
    p(`${c.yearsCovered}: ${yearPacks.map((y) => y.year).join(' · ')}`, { rtl }),
    heading(c.docMethod, rtl),
    p(c.docMethodBody, { rtl }),
    p(c.docReferExcel, { rtl, bold: true }),
    heading(c.docReadings, rtl),
  ]

  for (const pack of [...yearPacks].reverse()) {
    children.push(subheading(`${c.docYear} ${pack.year}`, rtl))
    const overview = buildStructureMetricInfo('overview', pack.metrics, lang).verdict
    const liquidity = buildStructureMetricInfo('liquidity', pack.metrics, lang).verdict
    const frng = buildStructureMetricInfo('frng', pack.metrics, lang).verdict
    const bfr = buildStructureMetricInfo('bfr', pack.metrics, lang).verdict
    const treasury = buildStructureMetricInfo('treasuryNet', pack.metrics, lang).verdict
    children.push(p(overview, { rtl }))
    children.push(p(liquidity, { rtl }))
    children.push(p(frng, { rtl }))
    children.push(p(bfr, { rtl }))
    children.push(p(treasury, { rtl }))
  }

  children.push(p(c.docClosing, { rtl }))

  const doc = new Document({
    sections: [
      {
        properties: {
          page: {
            margin: { top: 720, bottom: 720, left: 720, right: 720 },
          },
        },
        children,
      },
    ],
  })
  return Packer.toBlob(doc)
}

/**
 * Download a research ZIP: Excel+Word in Arabic and French for one company.
 * Years appear as adjacent columns in Excel sheets.
 */
export async function downloadCompanyResearchPack(userId, company) {
  if (!company?.id) throw new Error('NO_COMPANY')
  const yearPacks = gatherYears(userId, company.id)
  if (!yearPacks.length) throw new Error('EMPTY_DATA')

  const stamp = new Date().toISOString().slice(0, 10)
  const base = slugify(company.name)
  const zip = new JSZip()

  const excelAr = buildExcelBuffer(company, yearPacks, 'ar')
  const excelFr = buildExcelBuffer(company, yearPacks, 'fr')
  const wordAr = await buildWordBlob(company, yearPacks, 'ar')
  const wordFr = await buildWordBlob(company, yearPacks, 'fr')

  zip.file(`${base}_donnees_AR_${stamp}.xlsx`, excelAr)
  zip.file(`${base}_donnees_FR_${stamp}.xlsx`, excelFr)
  zip.file(`${base}_lecture_AR_${stamp}.docx`, wordAr)
  zip.file(`${base}_lecture_FR_${stamp}.docx`, wordFr)

  const blob = await zip.generateAsync({ type: 'blob' })
  saveAs(blob, `anafin_recherche_${base}_${stamp}.zip`)
  return { years: yearPacks.length, files: 4 }
}
