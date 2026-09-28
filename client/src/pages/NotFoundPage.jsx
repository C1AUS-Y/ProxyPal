import Button from '../components/atoms/Button.jsx'
import usePageTitle from '../lib/usePageTitle.js'

export default function NotFoundPage() {
  usePageTitle('Not found')

  return (
    <div className="flex flex-col items-start gap-4">
      <h1 className="text-heading font-bold">Page not found</h1>
      <p className="text-primary">That address does not match anything in ProxyPal.</p>
      <Button to="/">Back to home</Button>
    </div>
  )
}
