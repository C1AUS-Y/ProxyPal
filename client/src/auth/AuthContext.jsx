// keeps track of who's logged in across the whole app, so any page can ask
// "is someone logged in" without re-checking supabase every time

// this just wraps supabase's own session handling, it doesn't store passwords
// or anything itself

import { createContext, useContext, useEffect, useState } from 'react'
import { supabase } from '../lib/supabaseClient.js'

const AuthContext = createContext(null)

export function AuthProvider({ children }) {
  const [session, setSession] = useState(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    // check if there's already a logged-in session (e.g. refreshed the page)
    supabase.auth.getSession().then(({ data }) => {
      setSession(data.session)
      setLoading(false)
    })

    // keep session in sync whenever it changes (login, logout, token refresh)
    const { data: listener } = supabase.auth.onAuthStateChange((_event, newSession) => {
      setSession(newSession)
    })

    return () => listener.subscription.unsubscribe()
  }, [])

  const value = {
    session,
    user: session?.user ?? null,
    loading,
    signUp: (email, password, fullName) =>
      supabase.auth.signUp({
        email,
        password,
        options: { data: { full_name: fullName } },
      }),
    signIn: (email, password) =>
      supabase.auth.signInWithPassword({ email, password }),
    signOut: () => supabase.auth.signOut(),
  }

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}

export function useAuth() {
  return useContext(AuthContext)
}
