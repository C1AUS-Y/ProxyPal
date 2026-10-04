// checks the Supabase login token the client sends and gets the user id from it

import { createRemoteJWKSet, jwtVerify } from 'jose'

const SUPABASE_URL = process.env.SUPABASE_URL

const keys = createRemoteJWKSet(new URL(`${SUPABASE_URL}/auth/v1/.well-known/jwks.json`))

export async function requireAuth(req, res, next) {
  const header = req.headers.authorization ?? ''
  const token = header.startsWith('Bearer ') ? header.slice(7) : null

  if (!token) {
    return res.status(401).json({ error: 'Missing bearer token' })
  }

  try {
    const { payload } = await jwtVerify(token, keys)
    req.userId = payload.sub
    next()
  } catch (error) {
    console.error('token check failed:', error.message)
    res.status(401).json({ error: 'Invalid or expired token' })
  }
}