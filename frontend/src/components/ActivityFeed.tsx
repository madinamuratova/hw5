import { useEffect, useMemo, useRef, useState } from 'react'
import { isStoryEvent, splitByRun, tasksByStart } from '../activity'
import { agentMeta } from '../agents'
import { clock, tidy, toolSignature } from '../format'
import type { AgentEvent } from '../types'
import { AgentAvatar } from './AgentAvatar'
import { AlertIcon, ArrowIcon, CheckIcon, Spinner, ToolIcon } from './Icons'

interface Props {
  events: AgentEvent[]
  currentRunId: string | null
  live: boolean
  loading: boolean
  error: string | null
}

export function ActivityFeed({ events, currentRunId, live, loading, error }: Props) {
  const [raw, setRaw] = useState(false)
  const scroller = useRef<HTMLDivElement>(null)
  const { earlier, current } = useMemo(() => splitByRun(events, currentRunId), [events, currentRunId])
  const tasks = useMemo(() => tasksByStart(events), [events])
  const shown = raw ? current : current.filter(isStoryEvent)
  const earlierShown = raw ? earlier : earlier.filter(isStoryEvent)

  // Follow new events while a run is live, unless the reader has scrolled up.
  useEffect(() => {
    const el = scroller.current
    if (!el || !live) return
    if (el.scrollHeight - el.scrollTop - el.clientHeight < 160) el.scrollTop = el.scrollHeight
  }, [shown.length, live])

  return (
    <section className="card feed" aria-label="Agent activity">
      <div className="card__head">
        <h3>
          Agent activity
          {live && (
            <span className="live-tag">
              <span className="pulse" /> Live
            </span>
          )}
        </h3>
        <div className="segmented" role="group" aria-label="Detail level">
          <button aria-pressed={!raw} onClick={() => setRaw(false)}>Story</button>
          <button aria-pressed={raw} onClick={() => setRaw(true)}>Every step</button>
        </div>
      </div>

      <div className="feed__scroll" ref={scroller} aria-live={live ? 'polite' : 'off'}>
        {error && <p className="inline-error"><AlertIcon width={15} height={15} /> {error}</p>}
        {loading && !events.length && <p className="muted center"><Spinner /> Loading activity…</p>}

        {earlierShown.length > 0 && (
          <details className="earlier">
            <summary>Earlier activity on this ticket · {earlierShown.length} events</summary>
            <ol className="events">
              {earlierShown.map((e) => <EventRow key={e.id} e={e} task={tasks.get(e.id)} />)}
            </ol>
          </details>
        )}

        {shown.length === 0 && !loading && (
          <div className="feed__empty">
            {live ? (
              <><Spinner /> The Boss is picking up this ticket…</>
            ) : (
              <>No run since the last reset. Start the agent team to watch them work here.</>
            )}
          </div>
        )}

        <ol className="events">
          {shown.map((e) => <EventRow key={e.id} e={e} task={tasks.get(e.id)} />)}
          {live && shown.length > 0 && (
            <li className="event event--typing" aria-hidden="true"><span className="dots"><i /><i /><i /></span></li>
          )}
        </ol>
      </div>
    </section>
  )
}

function EventRow({ e, task }: { e: AgentEvent; task?: string }) {
  const meta = agentMeta(e.agent)
  const style = { ['--depth' as string]: e.depth, ['--agent' as string]: meta.color }

  if (e.phase === 'system_start') {
    return <li className="event-divider"><span>Run started · {clock(e.timestamp)}</span></li>
  }
  if (e.phase === 'system_end') {
    const u = e.usage
    return (
      <li className="event-divider event-divider--end">
        <span>
          Run finished · {clock(e.timestamp)}
          {u && ` · ${u.requests} model calls · ${u.tool_calls} tool calls · ${Math.round((u.input_tokens + u.output_tokens) / 1000)}k tokens`}
        </span>
      </li>
    )
  }
  if (e.phase === 'system_error' || e.phase === 'error') {
    return (
      <li className="event event--error" style={style}>
        <AlertIcon />
        <div className="event__body"><strong>{e.agent === 'System' ? 'Run stopped' : `${meta.name} failed`}</strong> {e.action}</div>
      </li>
    )
  }

  const header = (verb: string) => (
    <div className="event__head">
      <span className="event__who" style={{ color: meta.color }}>{meta.name}</span>
      <span className="event__verb">{verb}</span>
      <time className="event__time">{clock(e.timestamp)}</time>
    </div>
  )

  if (e.agent === 'Human') {
    return (
      <li className={`event event--human${e.ok === false ? ' event--refused' : ''}`} style={style}>
        <AgentAvatar agent="Human" size={28} />
        <div className="event__body">
          {header(e.phase === 'ticket_resolved' ? 'ticket decision' : e.phase === 'reset' ? 'reset' : 'approval')}
          <p className="event__text">{e.ok === false ? <AlertIcon width={14} height={14} /> : <CheckIcon width={14} height={14} />} {e.action}</p>
        </div>
      </li>
    )
  }

  let content
  if (e.phase === 'agent_start') {
    content = (
      <>
        {header(e.called_by ? `joined · asked by ${e.called_by}` : 'picked up the ticket')}
        {task && <blockquote className="event__task">{tidy(task)}</blockquote>}
      </>
    )
  } else if (e.phase === 'final_output') {
    content = (
      <>
        {header('reported back')}
        {e.said && <p className="event__report">{tidy(e.said)}</p>}
      </>
    )
  } else if (e.phase === 'model_response') {
    content = (
      <>
        {header(e.delegated ? 'delegated' : e.used_tool ? 'used tools' : 'said')}
        {e.said && <p className="event__said">“{tidy(e.said)}”</p>}
        {!!e.delegated_to?.length && (
          <ul className="chips">
            {e.delegated_to.map((to, i) => (
              <li key={i} className="chip chip--delegate" style={{ ['--agent' as string]: agentMeta(to).color }}>
                <ArrowIcon width={13} height={13} /> {agentMeta(to).name}
                {e.delegation_tasks?.[i] && <span className="chip__note">{tidy(e.delegation_tasks[i])}</span>}
              </li>
            ))}
          </ul>
        )}
        {!!e.tools_called?.length && (
          <ul className="chips">
            {e.tools_called.map((t, i) => (
              <li key={i} className="chip chip--tool" title={JSON.stringify(t.args, null, 1)}>
                <ToolIcon width={12} height={12} /> {toolSignature(t.tool, t.args)}
              </li>
            ))}
          </ul>
        )}
      </>
    )
  } else {
    // Raw-only steps: model requests (with tool results), task received, etc.
    content = (
      <>
        {header(e.phase.replace(/_/g, ' '))}
        <p className="event__raw">{e.action}</p>
        {e.tool_results?.map((r, i) => (
          <pre key={i} className="event__result"><b>{r.tool}</b> → {r.result}</pre>
        ))}
      </>
    )
  }

  return (
    <li className={`event event--${e.phase}${e.depth > 0 ? ' event--nested' : ''}`} style={style}>
      <AgentAvatar agent={e.agent} size={28} />
      <div className="event__body">{content}</div>
    </li>
  )
}
