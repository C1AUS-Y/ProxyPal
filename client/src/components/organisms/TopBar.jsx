import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { useAuth } from '../../auth/AuthContext.jsx'
import { getDisplayName } from '../../lib/profile.js'

export default function TopBar() {
  const { user } = useAuth()
  const [scrolled, setScrolled] = useState(false)

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 4)
    onScroll()
    window.addEventListener('scroll', onScroll, { passive: true })
    return () => window.removeEventListener('scroll', onScroll)
  }, [])

  const initial = getDisplayName(user).trim().charAt(0).toUpperCase() || 'P'

  return (
    <header
      className={`sticky top-0 z-30 border-b bg-bg/70 pt-[env(safe-area-inset-top)] backdrop-blur-xl backdrop-saturate-150 transition-colors duration-300 md:pl-28 ${
        scrolled ? 'border-text/10' : 'border-transparent'
      }`}
    >
      <div className="mx-auto flex h-14 w-full max-w-5xl items-center gap-3 px-4">
        <Link to="/" className="press flex flex-1 items-center gap-2.5">
          <span
            aria-hidden="true"
            className="flex h-8 w-8 items-center justify-center rounded-[10px] bg-text font-display text-[16px] font-bold text-surface shadow-pop"
          >
            P
          </span>
          <span className="font-display text-subheading font-bold tracking-tight">ProxyPal</span>
        </Link>

        <Link
          to="/account"
          aria-label="Account"
          className="press flex h-9 w-9 items-center justify-center rounded-full bg-text text-small font-bold text-surface shadow-pop ring-2 ring-surface transition duration-300 ease-spring hover:scale-110"
        >
          {initial}
        </Link>
      </div>
    </header>
  )
}
