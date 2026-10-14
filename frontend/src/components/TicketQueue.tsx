import { ticketType } from '../format'
import type { Ticket } from '../types'
import { TicketTypeIcon } from './Icons'

interface Props {
  tickets: Ticket[] | null
  selectedId: number | null
  runningTicketId: number | null
  onSelect: (id: number) => void
}

export function TicketQueue({ tickets, selectedId, runningTicketId, onSelect }: Props) {
  const open = tickets?.filter((t) => t.status !== 'resolved').length ?? 0
  return (
    <nav className="queue" aria-label="Ticket queue">
      <div className="panel-title">
        <h2>Ticket queue</h2>
        {tickets && <span className="count">{open} open</span>}
      </div>

      {!tickets &&
        [0, 1, 2].map((i) => <div key={i} className="ticket ticket--skeleton" aria-hidden="true" />)}

      <ul className="queue__list">
        {tickets?.map((t) => {
          const type = ticketType(t.type)
          const resolved = t.status === 'resolved'
          const running = runningTicketId === t.id
          const waiting = t.pending_proposal_ids.length
          return (
            <li key={t.id}>
              <button
                className={`ticket${selectedId === t.id ? ' ticket--selected' : ''}${resolved ? ' ticket--resolved' : ''}`}
                onClick={() => onSelect(t.id)}
                aria-current={selectedId === t.id}
              >
                <span className="ticket__stub">
                  <span className="ticket__hash">No.</span>
                  <span className="ticket__no">{t.id}</span>
                </span>
                <span className="ticket__body">
                  <span className="ticket__type">
                    <TicketTypeIcon icon={type.icon} width={14} height={14} />
                    {type.label}
                  </span>
                  <span className="ticket__subject">{t.subject}</span>
                  <span className="ticket__requester">{t.requester}</span>
                  <span className="ticket__badges">
                    {running ? (
                      <span className="pill pill--running"><span className="pulse" />Agents working</span>
                    ) : resolved ? (
                      <span className="pill pill--resolved">Resolved</span>
                    ) : (
                      <span className="pill pill--open">Open</span>
                    )}
                    {waiting > 0 && <span className="pill pill--attention">{waiting} to approve</span>}
                  </span>
                </span>
                {resolved && <span className="stamp stamp--small" aria-hidden="true">Resolved</span>}
              </button>
            </li>
          )
        })}
      </ul>
    </nav>
  )
}
