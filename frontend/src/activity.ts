// Pure helpers that turn raw audit events into what the desk shows.
import { TEAM } from './agents'
import type { AgentEvent } from './types'

export type AgentState = 'idle' | 'working' | 'done' | 'stopped'

/** Split a ticket's events into the current run (and anything after it) vs. earlier activity. */
export function splitByRun(events: AgentEvent[], currentRunId: string | null) {
  if (!currentRunId) return { earlier: events, current: [] as AgentEvent[] }
  const startId = events.find((e) => e.run_id === currentRunId)?.id
  if (startId === undefined) return { earlier: events, current: [] as AgentEvent[] }
  return { earlier: events.filter((e) => e.id < startId), current: events.filter((e) => e.id >= startId) }
}

export function runEvents(events: AgentEvent[], runId: string | null) {
  return runId ? events.filter((e) => e.run_id === runId) : []
}

/** Who has been asked, who is still working, who has reported back. */
export function rosterStates(events: AgentEvent[], runFinished: boolean): Record<string, AgentState> {
  const states: Record<string, AgentState> = {}
  for (const a of TEAM) {
    const starts = events.filter((e) => e.agent === a.name && e.phase === 'agent_start').length
    const finals = events.filter((e) => e.agent === a.name && e.phase === 'final_output').length
    states[a.name] = starts === 0 ? 'idle' : finals >= starts ? 'done' : runFinished ? 'stopped' : 'working'
  }
  return states
}

/** Each agent's final words for this run (an agent may be asked more than once). */
export function agentSummaries(events: AgentEvent[]): Record<string, string[]> {
  const out: Record<string, string[]> = {}
  for (const e of events) {
    if (e.phase === 'final_output' && e.said) (out[e.agent] ??= []).push(e.said)
  }
  return out
}

/** "Received task: Task from Boss about ticket 102:\nFor ticket 102…" -> "For ticket 102…" */
export function cleanTask(action: string): string {
  return action
    .replace(/^Received task:\s*/, '')
    .replace(/^Task from [^:\n]+?(?: about ticket \d+)?:\s*/, '')
    .trim()
}

/** The task text that started each specialist, keyed by the agent_start event id. */
export function tasksByStart(events: AgentEvent[]): Map<number, string> {
  const map = new Map<number, string>()
  events.forEach((e, i) => {
    if (e.phase !== 'agent_start' || e.depth === 0) return
    const task = events.slice(i + 1).find((n) => n.agent === e.agent && n.depth === e.depth && n.phase === 'task_received')
    if (task) map.set(e.id, cleanTask(task.action))
  })
  return map
}

/** Events worth showing in the story view (the raw view shows everything). */
export function isStoryEvent(e: AgentEvent): boolean {
  switch (e.phase) {
    case 'system_start':
    case 'system_end':
    case 'system_error':
    case 'agent_start':
    case 'final_output':
    case 'error':
    case 'approval_decision':
    case 'ticket_resolved':
    case 'reset':
      return true
    case 'model_response':
      // "Gave its final answer" with no words is shown by the final_output row instead.
      return Boolean(e.delegated || e.used_tool || e.said)
    default:
      return false
  }
}
