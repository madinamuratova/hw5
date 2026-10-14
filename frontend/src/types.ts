// Shapes returned by the FastAPI backend (backend/main.py).

export type RunStatus = 'running' | 'finished' | 'failed' | 'unknown'

export interface RunSummary {
  run_id: string
  status: RunStatus
  started_at: string
  finished_at: string | null
}

export interface Ticket {
  id: number
  type: string
  requester: string
  subject: string
  sku: string | null
  size: string | null
  qty: number | null
  lease_id: number | null
  invoice_id: number | null
  status: string // 'open' | 'resolved'
  notes: string | null
  created_at: string
  pending_proposal_ids: number[]
  last_run: RunSummary | null
}

export interface TicketOutcome {
  ticket_id: number
  status: 'handled' | 'waiting_on_human' | 'blocked'
  summary: string
  actions_taken: string[]
  human_decisions_needed: string[]
}

export interface ShiftReport {
  shop_date: string
  tickets: TicketOutcome[]
  payments_made: string[]
  drafts_saved: string[]
  notes: string[]
}

export interface Usage {
  requests: number
  tool_calls: number
  input_tokens: number
  output_tokens: number
}

export interface RunInfo extends RunSummary {
  ticket_id: number
  report: ShiftReport | null
  error: string | null
  usage: Usage | null
}

export interface ToolCall {
  tool: string
  args: Record<string, unknown>
}

export interface AgentEvent {
  id: number
  timestamp: string
  run_id: string
  ticket_id?: number | null
  agent: string // 'Boss' | 'Inventory' | ... | 'Human' | 'System'
  depth: number
  called_by: string | null
  step: number | null
  phase: string
  action: string
  said?: string | null
  delegated: boolean
  delegated_to?: string[]
  delegation_tasks?: string[]
  used_tool: boolean
  tools_called?: ToolCall[]
  tool_results?: { tool: string; result: string }[]
  tokens?: { input: number; output: number }
  usage?: Usage
  ok?: boolean
}

export interface EventsPage {
  events: AgentEvent[]
  next_since: number
  active_run: string | null
}

export interface Proposal {
  id: number
  kind: 'invoice' | 'rent' | 'purchase' | 'price_override'
  ref_id: number
  sku: string | null
  size: string | null
  qty: number | null
  unit_price: number | null // price_override only
  amount: number // cash that leaves the account if approved (0 for price_override)
  account: string
  ticket_id: number | null
  reason: string | null
  proposed_by: string
  status: 'pending' | 'approved' | 'rejected'
  created_at: string
  decided_by: string | null
  decided_at: string | null
  payment_id: number | null
  note: string | null
}

export interface Payment {
  id: number
  kind: string
  ref_id: number
  amount: number
  account: string
  paid_at: string
  approved_by: string
}

export interface Cash {
  account: string
  balance: number
  as_of: string
  today: string
  pending_total: number
  balance_if_all_pending_approved: number
  recent_payments: Payment[]
}

export interface Health {
  ok: boolean
  model: string
  database: string
  active_run: string | null
}

export interface ApproveResult {
  ok: boolean
  proposal_id: number
  payment_id: number
  kind: string
  amount: number
  unit_price?: number
  new_balance: number
  approved_by: string
  change: string
  order_draft?: number
}
