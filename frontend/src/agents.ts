// Who's who on the desk. Colours are muted, natural tones so five voices can share one feed.

export interface AgentMeta {
  name: string
  key: string // the id the backend uses in delegations
  role: string
  initials: string
  color: string
}

export const TEAM: AgentMeta[] = [
  { name: 'Boss', key: 'boss', role: 'Shift manager', initials: 'B', color: '#3d4a5c' },
  { name: 'Inventory', key: 'inventory', role: 'Stock & suppliers', initials: 'In', color: '#5b7b5e' },
  { name: 'Accounting', key: 'accounting', role: 'Cash & payments', initials: 'Ac', color: '#a8731f' },
  { name: 'Facilities', key: 'facilities', role: 'Lease & landlord', initials: 'Fa', color: '#a4553f' },
  { name: 'Customer Service', key: 'customer_service', role: 'Customer replies', initials: 'CS', color: '#3f6f8f' },
]

const OTHERS: Record<string, AgentMeta> = {
  Human: { name: 'You', key: 'human', role: 'Human approver', initials: '✓', color: '#22262a' },
  System: { name: 'Desk', key: 'system', role: 'System', initials: '·', color: '#8a8f94' },
}

export function agentMeta(nameOrKey: string): AgentMeta {
  return (
    TEAM.find((a) => a.name === nameOrKey || a.key === nameOrKey) ??
    OTHERS[nameOrKey] ?? { name: nameOrKey, key: nameOrKey, role: '', initials: nameOrKey.slice(0, 2), color: '#8a8f94' }
  )
}
