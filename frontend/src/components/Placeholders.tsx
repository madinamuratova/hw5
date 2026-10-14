import { Spinner } from './Icons'

/** What the centre column shows before any ticket is loaded. */
export function ActivityFeedPlaceholder({ offline }: { offline: boolean }) {
  return (
    <section className="desk">
      <div className="card placeholder">
        {offline ? (
          <p className="muted">The desk will fill in as soon as the backend is reachable.</p>
        ) : (
          <p className="muted"><Spinner /> Opening the desk…</p>
        )}
      </div>
    </section>
  )
}
