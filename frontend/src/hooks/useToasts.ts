import { useCallback, useRef, useState } from 'react'
import type { Toast } from '../components/Toasts'

export function useToasts() {
  const [toasts, setToasts] = useState<Toast[]>([])
  const nextId = useRef(1)

  const dismiss = useCallback((id: number) => setToasts((ts) => ts.filter((t) => t.id !== id)), [])

  const push = useCallback(
    (kind: Toast['kind'], title: string, body?: string) => {
      const id = nextId.current++
      setToasts((ts) => [...ts.slice(-3), { id, kind, title, body }])
      window.setTimeout(() => dismiss(id), kind === 'error' ? 9000 : 5500)
    },
    [dismiss],
  )

  return { toasts, push, dismiss }
}
