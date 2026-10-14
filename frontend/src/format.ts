const usd = new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' })

export const money = (n: number) => usd.format(n)

/** "2026-08-31" -> "Mon, Aug 31, 2026" without timezone shifts. */
export function deskDate(iso: string | undefined): string {
  if (!iso) return '—'
  const [y, m, d] = iso.slice(0, 10).split('-').map(Number)
  return new Date(y, m - 1, d).toLocaleDateString('en-US', {
    weekday: 'short',
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  })
}

export function clock(iso: string): string {
  return new Date(iso).toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit', second: '2-digit' })
}

export function elapsed(fromIso: string, toIso?: string | null): string {
  const ms = (toIso ? new Date(toIso).getTime() : Date.now()) - new Date(fromIso).getTime()
  const s = Math.max(0, Math.round(ms / 1000))
  return `${Math.floor(s / 60)}:${String(s % 60).padStart(2, '0')}`
}

export const TICKET_TYPES: Record<string, { label: string; icon: 'tee' | 'key' | 'tag' }> = {
  customer_order: { label: 'Customer order', icon: 'tee' },
  rent_notice: { label: 'Rent notice', icon: 'key' },
  price_override: { label: 'Price override', icon: 'tag' },
}

export function ticketType(type: string) {
  return TICKET_TYPES[type] ?? { label: type.replace(/_/g, ' '), icon: 'tag' as const }
}

/** Compact one-line version of a tool call: check_stock(CC-TEE-WHITE, S) */
export function toolSignature(tool: string, args: Record<string, unknown>): string {
  const vals = Object.entries(args)
    .filter(([k, v]) => v !== null && v !== undefined && v !== '' && k !== 'reason' && k !== 'body')
    .map(([, v]) => (typeof v === 'string' && v.length > 28 ? `${v.slice(0, 26)}…` : String(v)))
  return `${tool}(${vals.join(', ')})`
}

type ProposalLike = { kind: string; ref_id: number; qty: number | null; sku: string | null; size: string | null; amount: number; unit_price?: number | null }

export function proposalTitle(p: ProposalLike) {
  if (p.kind === 'rent') return `Rent · lease ${p.ref_id}`
  if (p.kind === 'invoice') return `Invoice #${p.ref_id}`
  if (p.kind === 'price_override') return `Price · ${p.qty} × ${p.sku} ${p.size}`
  return `Restock · ${p.qty} × ${p.sku} ${p.size}`
}

/** What a proposal is worth: cash for payments/purchases, the unit price for a price override. */
export function proposalValue(p: ProposalLike) {
  return p.kind === 'price_override' ? `${money(p.unit_price ?? 0)} each` : money(p.amount)
}

/** The audit trail shortens long text as "... (+146 chars)"; show that as a plain ellipsis. */
export const tidy = (text: string) => text.replace(/\.\.\. \(\+\d+ chars\)$/, '…')
