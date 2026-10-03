// login and signup screen

import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import Button from '../components/atoms/Button.jsx'
import Input from '../components/atoms/Input.jsx'
import { useAuth } from '../auth/AuthContext.jsx'

export default function LoginPage() {
  const { signIn, signUp } = useAuth()
  const navigate = useNavigate()

  const [mode, setMode] = useState('login') // 'login' or 'signup'
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [fullName, setFullName] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  async function handleSubmit(event) {
    event.preventDefault()
    setError('')
    setLoading(true)

    const { error: authError } =
      mode === 'login'
        ? await signIn(email, password)
        : await signUp(email, password, fullName)

    setLoading(false)

    if (authError) {
      setError(authError.message)
      return
    }

    if (mode === 'signup') {
      // if email confirmation is turned on in supabase, there's no session yet
      setError('Account created. Check your email to confirm, then log in.')
      setMode('login')
      return
    }

    navigate('/')
  }

  return (
    <div className="relative flex min-h-screen items-center justify-center overflow-hidden px-4 py-10">
      <div aria-hidden="true" className="pointer-events-none absolute inset-0">
        <div className="dots absolute inset-0" />
      </div>

      <form
        onSubmit={handleSubmit}
        className="glass rise relative flex w-full max-w-sm flex-col gap-4 rounded-4xl p-7 shadow-float ring-1 ring-text/[0.08]"
      >
        <span
          aria-hidden="true"
          className="pop flex h-14 w-14 items-center justify-center rounded-[18px] bg-text font-display text-[26px] font-bold text-surface shadow-pop"
        >
          P
        </span>

        <div>
          <h1 className="text-heading font-bold text-text">ProxyPal</h1>
          <p className="text-small text-primary">
            {mode === 'login' ? 'Log in to your account' : 'Create an account'}
          </p>
        </div>

        {mode === 'signup' && (
          <div className="pop">
            <Input
              label="Full name"
              type="text"
              value={fullName}
              onChange={(e) => setFullName(e.target.value)}
              required
            />
          </div>
        )}

        <Input
          label="Email"
          type="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          required
        />

        <Input
          label="Password"
          type="password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          minLength={6}
          required
        />

        {error && (
          <p role="alert" className="pop rounded-2xl bg-text/[0.06] px-4 py-3 text-small text-text">
            {error}
          </p>
        )}

        <Button type="submit" disabled={loading} className="mt-1 w-full">
          {loading ? 'Please wait...' : mode === 'login' ? 'Log in' : 'Sign up'}
        </Button>

        <button
          type="button"
          onClick={() => {
            setMode(mode === 'login' ? 'signup' : 'login')
            setError('')
          }}
          className="press text-small font-medium text-primary hover:text-text"
        >
          {mode === 'login' ? "Don't have an account? Sign up" : 'Already have an account? Log in'}
        </button>
      </form>
    </div>
  )
}
