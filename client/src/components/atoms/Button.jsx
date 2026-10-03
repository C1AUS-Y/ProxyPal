import { Link } from 'react-router-dom'

const BASE =
  'press inline-flex select-none items-center justify-center gap-2 rounded-full px-5 py-3 text-body font-semibold disabled:pointer-events-none disabled:opacity-40'

const VARIANTS = {
  primary: 'bg-text text-surface shadow-pop hover:opacity-90',
  accent: 'bg-text/[0.07] text-text hover:bg-text/[0.12]',
  ghost: 'text-primary hover:bg-text/[0.06] hover:text-text',
}

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
