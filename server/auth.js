// checks the Supabase login token the client sends and gets the user id from it

import { createRemoteJWKSet, jwtVerify } from 'jose'

const SUPABASE_URL = process.env.SUPABASE_URL

if (!SUPABASE_URL) {
  console.error('SUPABASE_URL is not set, add it to server/.env')
  process.exit(1)
}

const keys = createRemoteJWKSet(new URL(`${SUPABASE_URL}/auth/v1/.well-known/jwks.json`))

export async function requireAuth(request, response, next) {
  const header = request.headers.authorization ?? ''
  const token = header.startsWith('Bearer ') ? header.slice(7) : null

  if (!token) {
    return response.status(401).json({ error: 'Missing bearer token' })
  }

  try {
    const { payload } = await jwtVerify(token, keys)
    request.userId = payload.sub
    next()
  } catch (error) {
    console.error('token check failed:', error.message)
    response.status(401).json({ error: 'Invalid or expired token' })
  }
}