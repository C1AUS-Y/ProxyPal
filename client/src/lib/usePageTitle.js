import { useEffect } from 'react'

// A single-page app never reloads, so the tab title has to be set by hand or it
// says the same thing on every screen.
export default function usePageTitle(title) {
  useEffect(() => {
    document.title = title ? `${title} - ProxyPal` : 'ProxyPal'
  }, [title])
}
