import { useEffect, useRef, useState } from 'react'

/** Call `fn` every `ms` while `enabled`, skipping ticks while the tab is hidden. */
export function usePolling(fn: () => unknown, ms: number, enabled: boolean) {
  const latest = useRef(fn)
  useEffect(() => {
    latest.current = fn
  })
  useEffect(() => {
    if (!enabled) return
    const id = window.setInterval(() => {
      if (!document.hidden) void latest.current()
    }, ms)
    return () => window.clearInterval(id)
  }, [ms, enabled])
}

/** Re-render every second while `enabled` (for live timers). */
export function useNow(enabled: boolean): number {
  const [now, setNow] = useState(() => Date.now())
  useEffect(() => {
    if (!enabled) return
    const id = window.setInterval(() => setNow(Date.now()), 1000)
    return () => window.clearInterval(id)
  }, [enabled])
  return now
}
