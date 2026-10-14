import { useMemo } from 'react'
import { rosterStates, runEvents, splitByRun } from '../activity'
import { useNow } from '../hooks/usePolling'
import { clock, elapsed, proposalTitle, proposalValue, ticketType } from '../format'
import type { AgentEvent, Proposal, RunStatus, Ticket, TicketOutcome } from '../types'
import { ActivityFeed } from './ActivityFeed'
import { AgentRoster } from './AgentRoster'
import { AgentSummaries } from './AgentSummaries'
import { AlertIcon, CheckIcon, PlayIcon, Spinner, TicketTypeIcon } from './Icons'

interface Props {
  ticket: Ticket
  currentRunId: string | null
  runStatus: RunStatus | null
  runStartedAt: string | null
  runFinishedAt: string | null
  runError: string | null
  live: boolean
  otherRunTicket: number | null
  offline: boolean
  events: AgentEvent[]
  eventsLoading: boolean
  eventsError: string | null
  outcome: TicketOutcome | null
  pending: Proposal[]
  starting: boolean
  resolving: boolean
  onStart: () => void
  onResolve: () => void
  onShowApprovals: () => void
}

export function TicketDesk(p: Props) {
  const { ticket, live } = p
  useNow(live) // tick the elapsed timer while running
  const type = ticketType(ticket.type)
  const resolved = ticket.status === 'resolved'
  const finished = p.runStatus === 'finished' || p.runStatus === 'failed'
  const thisRun = useMemo(() => runEvents(p.events, p.currentRunId), [p.events, p.currentRunId])
  const { current } = useMemo(() => splitByRun(p.events, p.currentRunId), [p.events, p.currentRunId])
  const states = useMemo(() => rosterStates(thisRun, !live), [thisRun, live])

  const facts: [string, string][] = []
  if (ticket.sku) facts.push(['SKU', ticket.sku])
  if (ticket.size) facts.push(['Size', ticket.size])
  if (ticket.qty !== null) facts.push(['Qty', String(ticket.qty)])
  if (ticket.lease_id !== null) facts.push(['Lease', `#${ticket.lease_id}`])
  if (ticket.invoice_id !== null) facts.push(['Invoice', `#${ticket.invoice_id}`])

  let startLabel = p.currentRunId ? 'Run agents again' : 'Start agent team'
  let startHint = 'The Boss reads the ticket and delegates to the right specialists.'
  if (resolved) startHint = 'Resolved. Reset the day to work it again.'
  else if (p.offline) startHint = 'Waiting for the backend to come back…'
  else if (p.otherRunTicket !== null) startHint = `Ticket ${p.otherRunTicket} is being worked on. One run at a time keeps cash checks honest.`
  if (live) startLabel = 'Agents working'

  const canResolve = !resolved && !live && finished && p.pending.length === 0
  // The live proposal list is the truth for approvals; the Boss's report was written before any decision.
  const decisions = (p.outcome?.human_decisions_needed ?? []).filter((d) => !/proposal\s*#?\d+/i.test(d))

  return (
    <section className="desk" aria-label={`Ticket ${ticket.id}`}>
      <article className={`card ticket-card${resolved ? ' ticket-card--resolved' : ''}`}>
        <div className="ticket-card__stub">
          <span>No.</span>
          <strong>{ticket.id}</strong>
        </div>
        <div className="ticket-card__main">
          <div className="ticket-card__type">
            <TicketTypeIcon icon={type.icon} width={16} height={16} /> {type.label}
            <span className="dot-sep">·</span>
            <span className="muted">opened {clock(ticket.created_at)}</span>
          </div>
          <h1 className="ticket-card__title">{ticket.subject}</h1>
          <p className="ticket-card__from">from <strong>{ticket.requester}</strong></p>
          {ticket.notes && <blockquote className="ticket-card__notes">{ticket.notes}</blockquote>}
          {facts.length > 0 && (
            <dl className="facts">
              {facts.map(([k, v]) => (
                <div key={k}><dt>{k}</dt><dd>{v}</dd></div>
              ))}
            </dl>
          )}

          <div className="actionbar">
            <button
              className="btn btn--primary"
              onClick={p.onStart}
              disabled={resolved || live || p.starting || p.otherRunTicket !== null || p.offline}
            >
              {live || p.starting ? <Spinner size={15} /> : <PlayIcon width={15} height={15} />}
              {p.starting ? 'Starting…' : startLabel}
              {live && p.runStartedAt && <span className="btn__timer">{elapsed(p.runStartedAt)}</span>}
            </button>
            {!resolved && finished && !live && (
              <button
                className="btn btn--secondary"
                onClick={p.onResolve}
                disabled={!canResolve || p.resolving || p.offline}
                title={p.pending.length ? 'Approve or reject the pending proposal first' : 'Mark this ticket resolved'}
              >
                {p.resolving ? <Spinner size={15} /> : <CheckIcon width={15} height={15} />}
                Mark resolved
              </button>
            )}
            <span className="actionbar__hint">{startHint}</span>
          </div>
        </div>
        {resolved && <span className="stamp" aria-label="Resolved">Resolved</span>}
      </article>

      {p.runStatus === 'failed' && (
        <div className="callout callout--error" role="alert">
          <AlertIcon /> <div><strong>The run stopped early.</strong> {p.runError ?? 'See the activity log for details.'}</div>
        </div>
      )}

      {!resolved && p.runStatus === 'finished' && !live && (
        <div className="callout callout--waiting">
          <div className="callout__title">Waiting on you</div>
          <ul>
            {p.pending.map((x) => (
              <li key={x.id}>
                <button className="link" onClick={p.onShowApprovals}>
                  Proposal #{x.id} · {proposalTitle(x)} · {proposalValue(x)}
                </button>{' '}
                needs your approval or rejection.
              </li>
            ))}
            {decisions.map((d, i) => <li key={i}>{d}</li>)}
            {!p.pending.length && !decisions.length && (
              <li>Nothing is waiting. Mark it resolved, or run the agents again.</li>
            )}
          </ul>
          {p.runFinishedAt && p.runStartedAt && (
            <p className="callout__meta">Last run took {elapsed(p.runStartedAt, p.runFinishedAt)}.</p>
          )}
        </div>
      )}

      <AgentRoster states={states} runFinished={finished && !live} />
      <ActivityFeed events={p.events} currentRunId={p.currentRunId} live={live} loading={p.eventsLoading} error={p.eventsError} />
      <AgentSummaries events={current} outcome={p.outcome} finished={finished && !live} />
    </section>
  )
}
