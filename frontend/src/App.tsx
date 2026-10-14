import { useEffect, useRef, useState } from 'react'
import { API_URL, api } from './api'
import { ActivityFeedPlaceholder } from './components/Placeholders'
import { ApprovalsPanel } from './components/ApprovalsPanel'
import { CashCard } from './components/CashCard'
import { ConfirmDialog } from './components/ConfirmDialog'
import { Header } from './components/Header'
import { AlertIcon } from './components/Icons'
import { TicketDesk } from './components/TicketDesk'
import { TicketQueue } from './components/TicketQueue'
import { Toasts } from './components/Toasts'
import { money } from './format'
import { useDesk } from './hooks/useDesk'
import { usePolling } from './hooks/usePolling'
import { useTicketActivity } from './hooks/useTicketActivity'
import { useToasts } from './hooks/useToasts'
import type { Proposal, RunInfo, RunSummary } from './types'

const RUN_POLL_MS = 1500
const msg = (e: unknown) => (e instanceof Error ? e.message : String(e))
const without = <T,>(obj: Record<number, T>, key: number) => {
  const copy = { ...obj }
  delete copy[key]
  return copy
}

export default function App() {
  const desk = useDesk()
  const { toasts, push, dismiss } = useToasts()

  // ?ticket=102 opens the desk on that ticket (handy for links and screenshots).
  const [selectedId, setSelectedId] = useState<number | null>(
    () => Number(new URLSearchParams(window.location.search).get('ticket')) || null,
  )
  const [watching, setWatching] = useState<RunInfo | null>(null) // the run we're following live
  const [runInfos, setRunInfos] = useState<Record<string, RunInfo | null>>({}) // finished runs + Boss reports
  const [starting, setStarting] = useState(false)
  const [resolving, setResolving] = useState(false)
  const [resetting, setResetting] = useState(false)
  const [confirmReset, setConfirmReset] = useState(false)
  const [busy, setBusy] = useState<Record<number, 'approve' | 'reject'>>({})
  const [slipErrors, setSlipErrors] = useState<Record<number, string>>({})
  const [operator, setOperator] = useState(() => localStorage.getItem('cc.operator') ?? '')
  const operatorRef = useRef<HTMLInputElement>(null)
  const approvalsRef = useRef<HTMLElement>(null)

  useEffect(() => localStorage.setItem('cc.operator', operator), [operator])

  // Select the first ticket once the queue loads.
  useEffect(() => {
    if (selectedId === null && desk.tickets?.length) setSelectedId(desk.tickets[0].id)
  }, [desk.tickets, selectedId])

  // Pick up a run that is already going (e.g. after reloading the page).
  const activeRunId = desk.health?.active_run ?? null
  useEffect(() => {
    if (!activeRunId || watching?.run_id === activeRunId) return
    api.run(activeRunId).then(setWatching).catch(() => undefined)
  }, [activeRunId, watching?.run_id])

  const running = watching?.status === 'running'

  // Follow the live run until it finishes, then refresh tickets, cash, and approvals.
  usePolling(
    async () => {
      if (!watching) return
      try {
        const r = await api.run(watching.run_id)
        setWatching(r)
        if (r.status === 'running') return
        setRunInfos((m) => ({ ...m, [r.run_id]: r }))
        await desk.refresh()
        const outcome = r.report?.tickets.find((t) => t.ticket_id === r.ticket_id)
        if (r.status === 'failed') push('error', `Run on ticket ${r.ticket_id} stopped`, r.error ?? undefined)
        else if (outcome?.status === 'handled') push('success', `Ticket ${r.ticket_id} resolved`, outcome.summary)
        else push('info', `Ticket ${r.ticket_id} needs you`, 'The agents finished. Check the approvals and the summary.')
      } catch {
        /* the offline banner covers connection problems; keep polling */
      }
    },
    RUN_POLL_MS,
    running,
  )

  const selected = desk.tickets?.find((t) => t.id === selectedId) ?? null
  const currentRun: RunSummary | null =
    watching && watching.ticket_id === selectedId ? watching : (selected?.last_run ?? null)
  const live = running && watching?.ticket_id === selectedId
  const otherRunTicket = running && watching && watching.ticket_id !== selectedId ? watching.ticket_id : null
  const activity = useTicketActivity(selectedId, live)

  // Load the Boss's report for the selected ticket's latest finished run (once).
  const currentRunId = currentRun?.run_id ?? null
  const currentRunStatus = currentRun?.status ?? null
  useEffect(() => {
    if (!currentRunId || currentRunStatus === 'running' || currentRunId in runInfos) return
    api
      .run(currentRunId)
      .then((r) => setRunInfos((m) => ({ ...m, [currentRunId]: r })))
      .catch(() => setRunInfos((m) => ({ ...m, [currentRunId]: null }))) // e.g. backend restarted
  }, [currentRunId, currentRunStatus, runInfos])

  const runInfo = currentRunId ? (watching?.run_id === currentRunId ? watching : runInfos[currentRunId]) : null
  const outcome = runInfo?.report?.tickets.find((t) => t.ticket_id === selectedId) ?? null
  const pendingForTicket = (desk.proposals ?? []).filter((p) => p.status === 'pending' && p.ticket_id === selectedId)

  function needOperator(): boolean {
    if (operator.trim()) return true
    push('error', 'Sign in first', 'Type your name at the top right. Every decision is signed and logged.')
    operatorRef.current?.focus()
    return false
  }

  async function start() {
    if (!selected) return
    setStarting(true)
    try {
      const r = await api.runTicket(selected.id)
      setWatching(r)
      push('info', `Agents are on ticket ${selected.id}`, 'The activity feed updates every second.')
      void desk.refresh()
    } catch (e) {
      push('error', `Couldn't start ticket ${selected.id}`, msg(e))
    } finally {
      setStarting(false)
    }
  }

  async function resolve() {
    if (!selected || !needOperator()) return
    setResolving(true)
    try {
      await api.resolveTicket(selected.id, operator.trim())
      push('success', `Ticket ${selected.id} resolved`, `Signed off by ${operator.trim()}.`)
      await desk.refresh()
      void activity.refresh()
    } catch (e) {
      push('error', `Couldn't resolve ticket ${selected.id}`, msg(e))
    } finally {
      setResolving(false)
    }
  }

  async function approve(p: Proposal) {
    if (!needOperator()) return
    setBusy((b) => ({ ...b, [p.id]: 'approve' }))
    setSlipErrors((e) => without(e, p.id))
    try {
      const r = await api.approve(p.id, operator.trim())
      if (r.kind === 'price_override') push('success', 'Price approved', `${r.change}.`)
      else push('success', `Paid ${money(r.amount)}`, `Checking is now ${money(r.new_balance)}. ${r.change}.`)
      await desk.refresh()
      if (p.ticket_id === selectedId) void activity.refresh()
    } catch (e) {
      setSlipErrors((s) => ({ ...s, [p.id]: msg(e) }))
      push('error', 'Approval refused', msg(e))
      void desk.refresh()
    } finally {
      setBusy((b) => without(b, p.id))
    }
  }

  async function reject(p: Proposal, note: string) {
    if (!needOperator()) return
    setBusy((b) => ({ ...b, [p.id]: 'reject' }))
    setSlipErrors((e) => without(e, p.id))
    try {
      await api.reject(p.id, operator.trim(), note)
      push('success', `Proposal #${p.id} rejected`, 'No cash moved.')
      await desk.refresh()
      if (p.ticket_id === selectedId) void activity.refresh()
    } catch (e) {
      setSlipErrors((s) => ({ ...s, [p.id]: msg(e) }))
      push('error', 'Rejection failed', msg(e))
    } finally {
      setBusy((b) => without(b, p.id))
    }
  }

  async function doReset() {
    setConfirmReset(false)
    setResetting(true)
    try {
      await api.reset(operator.trim() || 'dashboard user')
      setWatching(null)
      setRunInfos({})
      push('success', 'Fresh start', 'The working database is back to its original values.')
      await desk.refresh()
    } catch (e) {
      push('error', 'Reset failed', msg(e))
    } finally {
      setResetting(false)
    }
  }

  return (
    <div className="app">
      <Header
        health={desk.health}
        online={desk.online}
        today={desk.cash?.today}
        operator={operator}
        onOperatorChange={setOperator}
        operatorRef={operatorRef}
        onReset={() => setConfirmReset(true)}
        resetting={resetting}
      />

      {desk.online === false && (
        <div className="banner" role="alert">
          <AlertIcon />
          <div>
            <strong>Can't reach the backend at {API_URL}.</strong> Start it from the <code>backend/</code> folder with{' '}
            <code>uvicorn main:app --reload --port 8000</code>. The desk reconnects on its own.
          </div>
          <button className="btn btn--ghost btn--small" onClick={() => void desk.refresh()}>Retry now</button>
        </div>
      )}

      <main className="layout">
        <TicketQueue
          tickets={desk.tickets}
          selectedId={selectedId}
          runningTicketId={running ? (watching?.ticket_id ?? null) : null}
          onSelect={setSelectedId}
        />

        <div className="desk-col">
          {selected ? (
            <TicketDesk
              ticket={selected}
              currentRunId={currentRun?.run_id ?? null}
              runStatus={currentRun?.status ?? null}
              runStartedAt={currentRun?.started_at ?? null}
              runFinishedAt={currentRun?.finished_at ?? null}
              runError={runInfo?.error ?? null}
              live={live}
              otherRunTicket={otherRunTicket}
              offline={desk.online === false}
              events={activity.events}
              eventsLoading={activity.loading}
              eventsError={activity.error}
              outcome={outcome}
              pending={pendingForTicket}
              starting={starting}
              resolving={resolving}
              onStart={() => void start()}
              onResolve={() => void resolve()}
              onShowApprovals={() => {
                approvalsRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' })
                approvalsRef.current?.focus({ preventScroll: true })
              }}
            />
          ) : (
            <ActivityFeedPlaceholder offline={desk.online === false} />
          )}
        </div>

        <aside className="side">
          <CashCard cash={desk.cash} />
          <ApprovalsPanel
            ref={approvalsRef}
            proposals={desk.proposals}
            cash={desk.cash}
            selectedTicketId={selectedId}
            operator={operator.trim()}
            busy={busy}
            errors={slipErrors}
            onApprove={(p) => void approve(p)}
            onReject={(p, note) => void reject(p, note)}
          />
        </aside>
      </main>

      <footer className="footer">
        Shop data comes from <code>data/campus_customs_new.db</code> through the MCP server · API {API_URL}
      </footer>

      <Toasts toasts={toasts} onDismiss={dismiss} />
      <ConfirmDialog
        open={confirmReset}
        title="Reset the day?"
        body="This copies the original database over the working one: tickets reopen, proposals and payments are cleared, and checking goes back to its starting balance. The audit trail and drafts are kept."
        confirmLabel="Reset working database"
        onConfirm={() => void doReset()}
        onCancel={() => setConfirmReset(false)}
      />
    </div>
  )
}
