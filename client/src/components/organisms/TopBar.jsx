import { useEffect, useState } from 'react'
import { Link, useLocation } from 'react-router-dom'
import { Menu, Plus, User, UserCircle, X } from 'lucide-react'

export default function TopBar() {
  const [open, setOpen] = useState(false)
  const { pathname } = useLocation()

  // Going anywhere closes the menu.
  useEffect(() => setOpen(false), [pathname])

  useEffect(() => {
    if (!open) return undefined
    const onKey = (event) => event.key === 'Escape' && setOpen(false)
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [open])

  return (
    <header className="sticky top-0 z-30 border-b border-accent bg-surface">
      <div className="flex h-14 items-center gap-3 px-4">
        {/* Phone only: from 768px the tab rail already shows every screen. */}
        <button
          type="button"
          className="-ml-2 flex h-10 w-10 items-center justify-center rounded-xl text-text hover:bg-bg md:hidden"
          aria-label={open ? 'Close menu' : 'Open menu'}
          aria-expanded={open}
          aria-controls="top-menu"
          onClick={() => setOpen((value) => !value)}
        >
          {open ? <X size={22} /> : <Menu size={22} />}
        </button>

        <Link to="/" className="flex-1 font-display text-subheading font-bold text-text">
          ProxyPal<span aria-hidden="true">.</span>
        </Link>

        <Link
          to="/account"
          aria-label="Account"
          className="flex h-9 w-9 items-center justify-center rounded-full bg-accent text-text"
        >
          <User size={18} />
        </Link>
      </div>

      {open && (
        <nav id="top-menu" aria-label="Menu" className="border-t border-accent px-4 py-2 md:hidden">
          <ul>
            <li>
              <Link to="/orders/new" className="flex items-center gap-3 py-3">
                <Plus size={18} className="text-primary" />
                New order
              </Link>
            </li>
            <li>
              <Link to="/account" className="flex items-center gap-3 py-3">
                <UserCircle size={18} className="text-primary" />
                Account
              </Link>
            </li>
          </ul>
        </nav>
      )}
    </header>
  )
}
