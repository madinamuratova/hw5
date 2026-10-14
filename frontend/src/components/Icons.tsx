// Small line icons (stroke = currentColor) so they pick up the surrounding text colour.
import type { SVGProps } from 'react'

type P = SVGProps<SVGSVGElement>
const base = (props: P) => ({
  width: 18,
  height: 18,
  viewBox: '0 0 24 24',
  fill: 'none',
  stroke: 'currentColor',
  strokeWidth: 1.7,
  strokeLinecap: 'round' as const,
  strokeLinejoin: 'round' as const,
  'aria-hidden': true,
  ...props,
})

export const TeeIcon = (p: P) => (
  <svg {...base(p)}><path d="M8 4 4 6.5l1.8 3.6L8 9v11h8V9l2.2 1.1L20 6.5 16 4a4 4 0 0 1-8 0z" /></svg>
)
export const KeyIcon = (p: P) => (
  <svg {...base(p)}><circle cx="8" cy="15" r="4" /><path d="m11 12 9-9M17 6l2 2M15 8l2 2" /></svg>
)
export const TagIcon = (p: P) => (
  <svg {...base(p)}><path d="M3 12V4h8l10 10-8 8z" /><circle cx="7.5" cy="8" r="1.2" /></svg>
)
export const CheckIcon = (p: P) => (
  <svg {...base(p)}><path d="m5 12.5 4.5 4.5L19 7.5" /></svg>
)
export const ArrowIcon = (p: P) => (
  <svg {...base(p)}><path d="M5 12h14M13 6l6 6-6 6" /></svg>
)
export const ToolIcon = (p: P) => (
  <svg {...base(p)}><path d="M14.5 5.5a4 4 0 0 0 4.9 4.9L11 18.8a2.1 2.1 0 0 1-3-3l8.4-8.4a4 4 0 0 1-1.9-1.9z" /></svg>
)
export const PlayIcon = (p: P) => (
  <svg {...base(p)}><path d="M8 5.5v13l10-6.5z" /></svg>
)
export const ResetIcon = (p: P) => (
  <svg {...base(p)}><path d="M4 12a8 8 0 1 0 2.4-5.7M4 4v4h4" /></svg>
)
export const AlertIcon = (p: P) => (
  <svg {...base(p)}><path d="M12 4 2.8 19h18.4z" /><path d="M12 10v4M12 16.8v.2" /></svg>
)
export const CloseIcon = (p: P) => (
  <svg {...base(p)}><path d="m6 6 12 12M18 6 6 18" /></svg>
)
export const PenIcon = (p: P) => (
  <svg {...base(p)}><path d="m15 5 4 4L8 20H4v-4z" /></svg>
)

export function Spinner({ size = 16 }: { size?: number }) {
  return <span className="spinner" style={{ width: size, height: size }} role="status" aria-label="Loading" />
}

export function TicketTypeIcon({ icon, ...p }: { icon: 'tee' | 'key' | 'tag' } & P) {
  if (icon === 'tee') return <TeeIcon {...p} />
  if (icon === 'key') return <KeyIcon {...p} />
  return <TagIcon {...p} />
}
