import { Link } from 'react-router-dom'

const BASE =
  'inline-flex items-center justify-center gap-2 rounded-xl px-4 py-2.5 text-body font-bold transition-colors disabled:cursor-not-allowed disabled:opacity-50'

const VARIANTS = {
  primary: 'bg-primary text-surface shadow-md hover:bg-text',
  accent: 'bg-accent text-text shadow-md hover:bg-accent/70',
  ghost: 'text-primary hover:bg-accent/60',
}

// Renders a <Link> when given `to` (navigation) and a <button> otherwise
// (an action). Both look the same.
export default function Button({ variant = 'primary', to, type = 'button', className = '', children, ...rest }) {
  const classes = `${BASE} ${VARIANTS[variant] ?? VARIANTS.primary} ${className}`

  if (to) {
    return (
      <Link to={to} className={classes} {...rest}>
        {children}
      </Link>
    )
  }

  return (
    <button type={type} className={classes} {...rest}>
      {children}
    </button>
  )
}
