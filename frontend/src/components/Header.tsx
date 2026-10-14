import type { RefObject } from 'react'
import { deskDate } from '../format'
import type { Health } from '../types'
import { PenIcon, ResetIcon, Spinner } from './Icons'

interface Props {
  health: Health | null
  online: boolean | null
  today: string | undefined
  operator: string
  onOperatorChange: (name: string) => void
  operatorRef: RefObject<HTMLInputElement | null>
  onReset: () => void
  resetting: boolean
}

export function Header({ health, online, today, operator, onOperatorChange, operatorRef, onReset, resetting }: Props) {
  const status = online === null ? 'connecting' : online ? 'live' : 'offline'
  return (
    <header className="topbar">
      <div className="brand">
        <span className="brand__mark" aria-hidden="true">CC</span>
        <div>
          <div className="brand__name">Campus Customs</div>
          <div className="brand__sub">Operations Desk</div>
        </div>
      </div>

      <div className="topbar__meta">
        <div className="meta-item">
          <span className="meta-item__label">Desk date</span>
          <span className="meta-item__value">{deskDate(today)}</span>
        </div>
        <div className="meta-item">
          <span className="meta-item__label">Agents</span>
          <span className="meta-item__value mono">{health?.model ?? '—'}</span>
        </div>
        <div className={`conn conn--${status}`} role="status" aria-live="polite">
          <span className="conn__dot" />
          {status === 'live' ? 'Backend live' : status === 'offline' ? 'Backend offline' : 'Connecting…'}
        </div>
      </div>

      <div className="topbar__actions">
        <label className="operator">
          <PenIcon width={15} height={15} />
          <span className="sr-only">Your name for approvals</span>
          <input
            ref={operatorRef}
            value={operator}
            onChange={(e) => onOperatorChange(e.target.value)}
            placeholder="Your name to sign"
            maxLength={60}
          />
        </label>
        <button className="btn btn--ghost" onClick={onReset} disabled={resetting || !online} title="Copy the original database over the working one">
          {resetting ? <Spinner size={14} /> : <ResetIcon width={15} height={15} />}
          Reset day
        </button>
      </div>
    </header>
  )
}
