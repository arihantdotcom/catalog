import type { PDFDocumentProxy } from 'pdfjs-dist'

export type PdfInfo = {
  title?: string
  author?: string
  subject?: string
  keywords: string[]
  pages: number
  creator?: string
  producer?: string
  created?: string
  modified?: string
}

function parsePdfDate(raw: unknown): string | undefined {
  if (typeof raw !== 'string') return undefined
  const m = raw.match(/^D:(\d{4})(\d{2})?(\d{2})?(\d{2})?(\d{2})?(\d{2})?/)
  if (!m) return undefined
  const [, year, month = '01', day = '01', hour = '00', minute = '00', second = '00'] = m
  const date = new Date(Date.UTC(+year, +month - 1, +day, +hour, +minute, +second))
  return Number.isNaN(date.getTime()) ? undefined : date.toISOString()
}

function splitKeywords(raw: unknown): string[] {
  if (typeof raw !== 'string' || !raw.trim()) return []
  return raw
    .split(/[,;]/)
    .map((k) => k.trim())
    .filter(Boolean)
}

function textField(raw: unknown): string | undefined {
  return typeof raw === 'string' && raw.trim() ? raw.trim() : undefined
}

export async function extractPdfInfoFromDocument(pdf: PDFDocumentProxy): Promise<PdfInfo | null> {
  try {
    const { info } = await pdf.getMetadata()
    const fields = info as Record<string, unknown>
    return {
      title: textField(fields.Title),
      author: textField(fields.Author),
      subject: textField(fields.Subject),
      keywords: splitKeywords(fields.Keywords),
      pages: pdf.numPages,
      creator: textField(fields.Creator),
      producer: textField(fields.Producer),
      created: parsePdfDate(fields.CreationDate),
      modified: parsePdfDate(fields.ModDate)
    }
  } catch {
    return null
  }
}

export function pdfInfoToMetadata(info: PdfInfo): string {
  const out: Record<string, string | number | string[]> = { pages: info.pages }
  if (info.title) out.title = info.title
  if (info.author) out.author = info.author
  if (info.subject) out.subject = info.subject
  if (info.keywords.length > 0) out.keywords = info.keywords
  if (info.creator) out.creator = info.creator
  if (info.producer) out.producer = info.producer
  if (info.created) out.created = info.created
  if (info.modified) out.modified = info.modified
  return JSON.stringify(out, null, 2)
}

export type MetadataSummary = {
  title?: string
  author?: string
  pages?: number
  year?: string
}

export function parseMetadataSummary(raw: string, fileName: string): MetadataSummary {
  let meta: Record<string, unknown>
  try {
    meta = JSON.parse(raw) as Record<string, unknown>
  } catch {
    return {}
  }
  const summary: MetadataSummary = {}
  const title = typeof meta.title === 'string' ? meta.title.trim() : ''
  const name = fileName.replace(/\.[^.]+$/, '')
  if (title && title.toLowerCase() !== name.toLowerCase()) summary.title = title
  if (typeof meta.author === 'string' && meta.author.trim()) summary.author = meta.author.trim()
  if (typeof meta.pages === 'number' && meta.pages > 0) summary.pages = meta.pages
  if (typeof meta.created === 'string' && /^\d{4}/.test(meta.created)) {
    summary.year = meta.created.slice(0, 4)
  }
  return summary
}
