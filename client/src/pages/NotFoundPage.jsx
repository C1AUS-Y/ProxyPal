import Button from '../components/atoms/Button.jsx'
import usePageTitle from '../lib/usePageTitle.js'

export default function NotFoundPage() {
  usePageTitle('Not found')

  return (
    <div className="flex flex-col items-center gap-3 py-16 text-center">
      <p
        aria-hidden="true"
        className="rise bg-gradient-to-b from-text to-text/5 bg-clip-text text-[96px] font-bold leading-none tracking-tighter text-transparent"
      >
        404
      </p>
      <h1 className="rise text-heading font-bold" style={{ '--i': 1 }}>
        Page not found
      </h1>
      <p className="rise text-primary" style={{ '--i': 2 }}>
        That address does not match anything in ProxyPal.
      </p>
      <div className="rise mt-2" style={{ '--i': 3 }}>
        <Button to="/">Back to home</Button>
      </div>
    </div>
  )
}
