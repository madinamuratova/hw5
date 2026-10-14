import { useCallback, useEffect, useState } from 'react'
import { api } from '../api'
import type { Cash, Health, Proposal, Ticket } from '../types'
import { usePolling } from './usePolling'

/** Everything on the desk that isn't a single ticket's activity: health, tickets, cash, proposals. */
export function useDesk() {
  const [health, setHealth] = useState<Health | null>(null)
  const [tickets, setTickets] = useState<Ticket[] | null>(null)
  const [cash, setCash] = useState<Cash | null>(null)
  const [proposals, setProposals] = useState<Proposal[] | null>(null)
  const [online, setOnline] = useState<boolean | null>(null) // null = still connecting
  const [error, setError] = useState<string | null>(null)

  const refresh = useCallback(async () => {
    try {
      const [h, t, c, p] = await Promise.all([api.health(), api.tickets(), api.cash(), api.approvals('all')])
      setHealth(h)
      setTickets(t)
      setCash(c)
      setProposals(p)
      setOnline(true)
      setError(null)
    } catch (e) {
      setOnline(false)
      setError(e instanceof Error ? e.message : String(e))
    }
  }, [])

  useEffect(() => {
    void refresh()
  }, [refresh])

  // Keep the desk fresh (e.g. if someone runs the CLI or approves elsewhere).
  usePolling(refresh, 6000, true)

  return { health, tickets, cash, proposals, online, error, refresh }
}
