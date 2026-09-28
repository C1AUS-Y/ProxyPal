// Four shades, darkest = furthest along. Straight from the design reference.
const STYLES = {
  delivered: 'bg-text text-surface',
  'in transit': 'bg-primary text-surface',
  shipped: 'bg-accent text-text',
  ordered: 'bg-surface text-text ring-1 ring-accent',
}

export default function StatusBadge({ status }) {
  const style = STYLES[status?.toLowerCase()] ?? STYLES.ordered

  return (
    <span className={`inline-flex whitespace-nowrap rounded-lg px-3 py-1 text-small font-medium ${style}`}>
      {status}
    </span>
  )
}
