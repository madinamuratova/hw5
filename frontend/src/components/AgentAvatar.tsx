import { agentMeta } from '../agents'
import type { AgentState } from '../activity'

export function AgentAvatar({ agent, size = 32, state }: { agent: string; size?: number; state?: AgentState }) {
  const meta = agentMeta(agent)
  return (
    <span
      className={`avatar${state ? ` avatar--${state}` : ''}`}
      style={{ width: size, height: size, background: meta.color, fontSize: size * 0.36, ['--ring' as string]: meta.color }}
      title={meta.role ? `${meta.name} · ${meta.role}` : meta.name}
      aria-hidden="true"
    >
      {meta.initials}
    </span>
  )
}
