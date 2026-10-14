// Thin client for the FastAPI backend. Every call goes straight to the API (CORS is enabled there).
import type {
  ApproveResult,
  Cash,
  EventsPage,
  Health,
  Proposal,
  RunInfo,
  Ticket,
} from './types'

export const API_URL = (import.meta.env.VITE_API_URL as string | undefined)?.replace(/\/$/, '') ?? 'http://localhost:8000'

export class ApiError extends Error {
  status: number
  constructor(status: number, message: string) {
    super(message)
    this.status = status
  }
}

async function request<T>(path: string, init?: RequestInit): Promise<T> {
  let res: Response
  try {
    res = await fetch(`${API_URL}${path}`, {
      ...init,
      headers: init?.body ? { 'Content-Type': 'application/json' } : undefined,
    })
  } catch {
    throw new ApiError(0, `Can't reach the backend at ${API_URL}. Is uvicorn running?`)
  }
  if (!res.ok) {
    let detail = `${res.status} ${res.statusText}`
    try {
      const body = await res.json()
      if (typeof body.detail === 'string') detail = body.detail
      else if (Array.isArray(body.detail)) detail = body.detail.map((d: { msg?: string }) => d.msg).join('; ')
    } catch {
      /* not JSON */
    }
    throw new ApiError(res.status, detail)
  }
  return res.json() as Promise<T>
}

const post = <T>(path: string, body?: unknown) =>
  request<T>(path, { method: 'POST', body: body === undefined ? undefined : JSON.stringify(body) })

export const api = {
  health: () => request<Health>('/api/health'),
  tickets: () => request<Ticket[]>('/api/tickets'),
  runTicket: (id: number) => post<RunInfo>(`/api/tickets/${id}/run`),
  resolveTicket: (id: number, resolvedBy: string) =>
    post<{ ok: boolean; status: string }>(`/api/tickets/${id}/resolve`, { resolved_by: resolvedBy }),
  run: (runId: string) => request<RunInfo>(`/api/runs/${runId}`),
  events: (params: { ticketId?: number; since?: number; limit?: number }) => {
    const q = new URLSearchParams()
    if (params.ticketId !== undefined) q.set('ticket_id', String(params.ticketId))
    if (params.since !== undefined) q.set('since', String(params.since))
    q.set('limit', String(params.limit ?? 500))
    return request<EventsPage>(`/api/events?${q}`)
  },
  approvals: (status: 'pending' | 'all' = 'all') => request<Proposal[]>(`/api/approvals?status=${status}`),
  approve: (id: number, approvedBy: string) =>
    post<ApproveResult>(`/api/approvals/${id}/approve`, { approved_by: approvedBy }),
  reject: (id: number, rejectedBy: string, note: string) =>
    post<{ ok: boolean }>(`/api/approvals/${id}/reject`, { rejected_by: rejectedBy, note }),
  cash: () => request<Cash>('/api/cash'),
  reset: (requestedBy: string) => post<{ ok: boolean; message: string }>('/api/reset', { requested_by: requestedBy }),
}
