// Always shown for now: there is no backend, and the page should say so rather
// than quietly pretend. It is one line because it sits on every screen. Delete
// it the day a real API is connected.
export default function DemoNotice() {
  return (
    <div role="status" className="bg-accent px-4 py-2 text-small text-text">
      <strong>  Front End Progress.</strong> Using made-up information to create front-end of the website.
    </div>
  )
}
