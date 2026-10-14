import type { AgentState } from '../activity'
import { TEAM } from '../agents'
import { AgentAvatar } from './AgentAvatar'

const LABEL: Record<AgentState, string> = {
  idle: 'Standing by',
  working: 'Working…',
  done: 'Reported',
  stopped: 'Stopped',
}

/** Who's at the desk for this run: working agents breathe, finished ones get a check. */
export function AgentRoster({ states, runFinished }: { states: Record<string, AgentState>; runFinished: boolean }) {
  return (
    <ul className="roster" aria-label="Agent team">
      {TEAM.map((a) => {
        const state = states[a.name] ?? 'idle'
        const label = state === 'idle' && runFinished ? 'Not needed' : LABEL[state]
        return (
          <li key={a.name} className={`roster__item roster__item--${state}`}>
            <AgentAvatar agent={a.name} size={38} state={state} />
            <span className="roster__name">{a.name}</span>
            <span className="roster__state">{label}</span>
          </li>
        )
      })}
    </ul>
  )
}
