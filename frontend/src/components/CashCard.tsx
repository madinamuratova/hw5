import { useEffect, useRef, useState } from 'react'
import { useAnimatedNumber } from '../hooks/useAnimatedNumber'
import { deskDate, money } from '../format'
import type { Cash } from '../types'

export function CashCard({ cash }: { cash: Cash | null }) {
  const shown = useAnimatedNumber(cash?.balance)
  const prev = useRef<number | undefined>(undefined)
  const [delta, setDelta] = useState<number | null>(null)

  // Flash the change for a few seconds whenever the balance moves (e.g. after an approval).
  useEffect(() => {
    if (cash === null) return
    if (prev.current !== undefined && prev.current !== cash.balance) {
      setDelta(cash.balance - prev.current)
      const t = window.setTimeout(() => setDelta(null), 4500)
      prev.current = cash.balance
      return () => window.clearTimeout(t)
    }
    prev.current = cash.balance
  }, [cash])

  if (!cash) {
    return (
      <section className="card cash" aria-busy="true">
        <div className="cash__label">Checking</div>
        <div className="skeleton skeleton--number" />
      </section>
    )
  }

  const pendingShare = cash.balance > 0 ? Math.min(1, cash.pending_total / cash.balance) : 0
  const overCommitted = cash.pending_total > cash.balance

  return (
    <section className="card cash" aria-label="Checking account">
      <div className="cash__top">
        <div className="cash__label">Checking account</div>
        <div className="cash__asof">as of {deskDate(cash.as_of)}</div>
      </div>
      <div className={`cash__balance${delta !== null ? ' cash__balance--changed' : ''}`} aria-live="polite">
        {money(shown ?? cash.balance)}
        {delta !== null && (
          <span className={`cash__delta${delta > 0 ? ' cash__delta--up' : ''}`}>{delta > 0 ? '+' : '−'}{money(Math.abs(delta))}</span>
        )}
      </div>

      <div className="meter" aria-hidden="true">
        <span className="meter__free" style={{ width: `${(1 - pendingShare) * 100}%` }} />
        <span className={`meter__pending${overCommitted ? ' meter__pending--over' : ''}`} style={{ width: `${pendingShare * 100}%` }} />
      </div>
      <dl className="cash__rows">
        <div>
          <dt>Waiting for approval</dt>
          <dd>{cash.pending_total ? money(cash.pending_total) : '—'}</dd>
        </div>
        <div>
          <dt>If everything is approved</dt>
          <dd className={cash.balance_if_all_pending_approved < 0 ? 'neg' : ''}>{money(cash.balance_if_all_pending_approved)}</dd>
        </div>
      </dl>

      <div className="ledger">
        <div className="ledger__title">Payments</div>
        {cash.recent_payments.length === 0 ? (
          <p className="muted small">No payments yet. Cash only moves when you approve a proposal.</p>
        ) : (
          <ul>
            {cash.recent_payments.map((p) => (
              <li key={p.id}>
                <span>
                  <strong className="ledger__kind">{p.kind}</strong> #{p.ref_id}
                  <span className="muted small"> · approved by {p.approved_by}</span>
                </span>
                <span className="ledger__amount">−{money(p.amount)}</span>
              </li>
            ))}
          </ul>
        )}
        <p className="ledger__note">Revenue isn't modeled, so cash only goes out.</p>
      </div>
    </section>
  )
}
