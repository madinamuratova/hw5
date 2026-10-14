import { CheckIcon, AlertIcon, CloseIcon } from './Icons'

export interface Toast {
  id: number
  kind: 'success' | 'error' | 'info'
  title: string
  body?: string
}

export function Toasts({ toasts, onDismiss }: { toasts: Toast[]; onDismiss: (id: number) => void }) {
  return (
    <div className="toasts" role="region" aria-live="polite" aria-label="Notifications">
      {toasts.map((t) => (
        <div key={t.id} className={`toast toast--${t.kind}`} role={t.kind === 'error' ? 'alert' : 'status'}>
          {t.kind === 'error' ? <AlertIcon width={17} height={17} /> : <CheckIcon width={17} height={17} />}
          <div className="toast__text">
            <strong>{t.title}</strong>
            {t.body && <span>{t.body}</span>}
          </div>
          <button className="toast__close" onClick={() => onDismiss(t.id)} aria-label="Dismiss">
            <CloseIcon width={14} height={14} />
          </button>
        </div>
      ))}
    </div>
  )
}
