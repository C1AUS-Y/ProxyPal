import { Check } from 'lucide-react'

//darkest means recently placed, lightest means delivered / almost complete.
const STYLES = {
  delivered: 'bg-text text-surface',
  'in transit': 'bg-text/[0.12] text-text',
  shipped: 'bg-text/[0.07] text-text',
  ordered: 'text-primary ring-1 ring-inset ring-text/15',
}

export default function StatusBadge({ status }) {
  const key = status?.toLowerCase()
  const style = STYLES[key] ?? STYLES.ordered

  return (
    <span
      className={`inline-flex items-center gap-1.5 whitespace-nowrap rounded-full px-2.5 py-1 text-[12px] font-semibold ${style}`}
    >
      {key === 'delivered' ? (
        <Check size={12} strokeWidth={3} aria-hidden="true" />
      ) : (
        <span aria-hidden="true" className="relative flex h-1.5 w-1.5">
          {key === 'in transit' && <span className="ping-soft absolute inset-0 rounded-full bg-current" />}
          <span className="relative h-1.5 w-1.5 rounded-full bg-current" />
        </span>
      )}
      {status}
    </span>
  )
}
