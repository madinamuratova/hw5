import { useCallback, useEffect, useRef, useState } from 'react'
import { api } from '../api'
import type { AgentEvent } from '../types'
import { usePolling } from './usePolling'

const LIVE_POLL_MS = 1200

/**
 * The audit-trail events for one ticket (GET /api/events?ticket_id=…).
 * Loads the history once, then — while `live` — asks only for new events using `since`.
 */
export function useTicketActivity(ticketId: number | null, live: boolean) {
  const [events, setEvents] = useState<AgentEvent[]>([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const next = useRef(0)
  const wasLive = useRef(live)

  const append = useCallback((incoming: AgentEvent[]) => {
    if (!incoming.length) return
    setEvents((prev) => {
      const seen = new Set(prev.map((e) => e.id))
      return [...prev, ...incoming.filter((e) => !seen.has(e.id))]
    })
  }, [])

  useEffect(() => {
    if (ticketId === null) return
    let cancelled = false
    setEvents([])
    setLoading(true)
    setError(null)
    api
      .events({ ticketId })
      .then((page) => {
        if (cancelled) return
        setEvents(page.events)
        next.current = page.next_since
      })
      .catch((e) => !cancelled && setError(e instanceof Error ? e.message : String(e)))
      .finally(() => !cancelled && setLoading(false))
    return () => {
      cancelled = true
    }
  }, [ticketId])

  const pollNew = useCallback(async () => {
    if (ticketId === null) return
    try {
      const page = await api.events({ ticketId, since: next.current })
      append(page.events)
      next.current = page.next_since
      setError(null)
    } catch (e) {
      setError(e instanceof Error ? e.message : String(e))
    }
  }, [ticketId, append])

  usePolling(pollNew, LIVE_POLL_MS, live && ticketId !== null)

  // One last fetch right after a run ends, so the final report and human decisions show up.
  useEffect(() => {
    if (wasLive.current && !live) void pollNew()
    wasLive.current = live
  }, [live, pollNew])

  return { events, loading, error, refresh: pollNew }
}
