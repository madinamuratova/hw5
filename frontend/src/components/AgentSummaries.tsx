import { agentSummaries } from '../activity'
import { TEAM } from '../agents'
import { tidy } from '../format'
import type { AgentEvent, TicketOutcome } from '../types'
import { AgentAvatar } from './AgentAvatar'

const OUTCOME: Record<TicketOutcome['status'], string> = {
  handled: 'Handled',
  waiting_on_human: 'Waiting on you',
  blocked: 'Blocked',
}

/** One card per agent: what each of them concluded on the selected ticket's latest run. */
export function AgentSummaries({ events, outcome, finished }: { events: AgentEvent[]; outcome: TicketOutcome | null; finished: boolean }) {
  const said = agentSummaries(events)
  if (!events.length) return null

  return (
    <section className="card" aria-label="What each agent did">
      <div className="card__head">
        <h3>What each agent did</h3>
        {!finished && <span className="muted small">Filling in as agents report back…</span>}
      </div>

      <div className="summaries">
        {TEAM.map((a) => {
          const lines = said[a.name] ?? []
          const isBoss = a.name === 'Boss'
          if (!lines.length && !(isBoss && outcome)) {
            return (
              <article key={a.name} className="summary summary--empty">
                <AgentAvatar agent={a.name} size={26} />
                <div>
                  <h4>{a.name}</h4>
                  <p>{finished ? 'Not needed for this ticket.' : 'Not involved yet.'}</p>
                </div>
              </article>
            )
          }
          return (
            <article key={a.name} className={`summary${isBoss ? ' summary--boss' : ''}`} style={{ ['--agent' as string]: a.color }}>
              <AgentAvatar agent={a.name} size={26} />
              <div>
                <h4>
                  {a.name} <span className="summary__role">{a.role}</span>
                  {isBoss && outcome && <span className={`pill pill--outcome-${outcome.status}`}>{OUTCOME[outcome.status]}</span>}
                </h4>
                {isBoss && outcome ? (
                  <>
                    <p>{outcome.summary}</p>
                    {outcome.actions_taken.length > 0 && (
                      <ul className="summary__list">{outcome.actions_taken.map((x, i) => <li key={i}>{x}</li>)}</ul>
                    )}
                  </>
                ) : (
                  lines.map((l, i) => <p key={i}>{tidy(l)}</p>)
                )}
              </div>
            </article>
          )
        })}
      </div>
    </section>
  )
}
