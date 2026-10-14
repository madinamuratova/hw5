import { useEffect, useRef, useState } from 'react'

/** Smoothly glides from the previous value to the new one (used for the cash balance). */
export function useAnimatedNumber(value: number | undefined, duration = 900): number | undefined {
  const [shown, setShown] = useState(value)
  const from = useRef(value)

  useEffect(() => {
    if (value === undefined) return
    const start = from.current ?? value
    if (start === value) {
      setShown(value)
      return
    }
    const reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches
    if (reduce) {
      from.current = value
      setShown(value)
      return
    }
    const t0 = performance.now()
    let frame = 0
    const tick = (t: number) => {
      const p = Math.min(1, (t - t0) / duration)
      const eased = 1 - Math.pow(1 - p, 3)
      setShown(start + (value - start) * eased)
      if (p < 1) frame = requestAnimationFrame(tick)
      else from.current = value
    }
    frame = requestAnimationFrame(tick)
    return () => {
      cancelAnimationFrame(frame)
      from.current = value
    }
  }, [value, duration])

  return shown
}
