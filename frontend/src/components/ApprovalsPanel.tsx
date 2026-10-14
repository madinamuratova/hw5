import { forwardRef, useState } from 'react'
import { agentMeta } from '../agents'
import { clock, money, proposalTitle, proposalValue } from '../format'
import type { Cash, Proposal } from '../types'
import { AgentAvatar } from './AgentAvatar'
import { AlertIcon, CheckIcon, CloseIcon, Spinner } from './Icons'

interface Props {
  proposals: Proposal[] | null
  cash: Cash | null
  selectedTicketId: number | null
  operator: string
  busy: Record<number, 'approve' | 'reject'>
  errors: Record<number, string>
  onApprove: (p: Proposal) => void
  onReject: (p: Proposal, note: string) => void
}

export const ApprovalsPanel = forwardRef<HTMLElement, Props>(function ApprovalsPanel(props, ref) {
  const { proposals, selectedTicketId } = props
  const pending = (proposals ?? [])
    .filter((p) => p.status === 'pending')
    .sort((a, b) => Number(b.ticket_id === selectedTicketId) - Number(a.ticket_id === selectedTicketId) || a.id - b.id)
  const decided = (proposals ?? []).filter((p) => p.status !== 'pending').reverse()

  return (
    <section className="card approvals" aria-label="Approvals" ref={ref} tabIndex={-1}>
      <div className="card__head">
        <h3>Approvals</h3>
        {pending.length > 0 && <span className="count count--attention">{pending.length} waiting</span>}
      </div>

      {proposals === null && <div className="skeleton skeleton--slip" />}
      {proposals !== null && pending.length === 0 && (
        <p className="muted small approvals__empty">
          Nothing to sign. When an agent proposes a payment or purchase, it lands here, and only your approval moves cash.
        </p>
      )}

      <ul className="slips">
        {pending.map((p) => (
          <Slip key={p.id} p={p} {...props} highlight={p.ticket_id === selectedTicketId} />
        ))}
      </ul>

      {decided.length > 0 && (
        <details className="history">
          <summary>Decided · {decided.length}</summary>
          <ul>
            {decided.map((p) => (
              <li key={p.id}>
                <span className={`pill pill--${p.status}`}>{p.status}</span>
                <span>#{p.id} · {proposalTitle(p)} · {proposalValue(p)}</span>
                <span className="muted small">{p.decided_by}</span>
              </li>
            ))}
          </ul>
        </details>
      )}
    </section>
  )
})

function Slip({ p, cash, operator, busy, errors, onApprove, onReject, highlight }: Props & { p: Proposal; highlight: boolean }) {
  const [rejecting, setRejecting] = useState(false)
  const [note, setNote] = useState('')
  const by = agentMeta(p.proposed_by)
  const isPrice = p.kind === 'price_override'
  const after = cash && !isPrice ? cash.balance - p.amount : null
  const short = after !== null && after < 0
  const state = busy[p.id]

  return (
    <li className={`slip${highlight ? ' slip--highlight' : ''}`}>
      <div className="slip__head">
        <span className="slip__title">{proposalTitle(p)}</span>
        {p.ticket_id !== null && <span className="tag">Ticket {p.ticket_id}</span>}
      </div>
      <div className="slip__amount">{proposalValue(p)}</div>
      <div className="slip__by">
        <AgentAvatar agent={by.name} size={20} />
        Proposed by {by.name} · {clock(p.created_at)} · from {p.account}
      </div>
      {p.reason && <p className="slip__reason">{p.reason}</p>}

      {isPrice && <div className="slip__after">No cash moves: this only sets the price a customer is quoted.</div>}
      {after !== null && (
        <div className={`slip__after${short ? ' slip__after--short' : ''}`}>
          {short ? (
            <><AlertIcon width={14} height={14} /> Not enough cash: {money(cash!.balance)} available.</>
          ) : (
            <>Checking after approval: <strong>{money(after)}</strong></>
          )}
        </div>
      )}

      <div className="slip__sign">
        <span className="slip__sign-label">Approved by</span>
        <span className={`slip__signature${operator ? '' : ' slip__signature--empty'}`}>
          {operator || 'add your name at the top'}
        </span>
      </div>

      {errors[p.id] && <p className="inline-error"><AlertIcon width={14} height={14} /> {errors[p.id]}</p>}

      {rejecting ? (
        <div className="slip__reject">
          <input value={note} onChange={(e) => setNote(e.target.value)} placeholder="Why? (optional)" aria-label="Rejection note" />
          <button className="btn btn--danger btn--small" disabled={!!state} onClick={() => onReject(p, note)}>
            {state === 'reject' ? <Spinner size={13} /> : <CloseIcon width={13} height={13} />} Confirm reject
          </button>
          <button className="btn btn--ghost btn--small" onClick={() => setRejecting(false)} disabled={!!state}>Cancel</button>
        </div>
      ) : (
        <div className="slip__actions">
          <button className="btn btn--primary btn--small" disabled={!!state || short} onClick={() => onApprove(p)}>
            {state === 'approve' ? <Spinner size={13} /> : <CheckIcon width={13} height={13} />}
            {state === 'approve' ? (isPrice ? 'Saving…' : 'Paying…') : isPrice ? 'Approve price' : `Approve ${money(p.amount)}`}
          </button>
          <button className="btn btn--ghost btn--small" disabled={!!state} onClick={() => setRejecting(true)}>Reject</button>
        </div>
      )}
    </li>
  )
}
