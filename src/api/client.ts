import createClient, { type Middleware } from 'openapi-fetch'
import type { paths } from './schema'
import { clearToken, getToken, setToken } from './token'

const API_BASE = import.meta.env.VITE_API_BASE ?? '/api'

let guestMintInFlight: Promise<string> | null = null

async function mintGuestToken(): Promise<string> {
  if (guestMintInFlight) return guestMintInFlight
  guestMintInFlight = (async () => {
    const res = await fetch(`${API_BASE}/auth/guest`, { method: 'POST' })
    if (!res.ok) throw new Error(`guest mint failed: ${res.status}`)
    const data = (await res.json()) as { access_token: string }
    setToken(data.access_token)
    return data.access_token
  })().finally(() => {
    guestMintInFlight = null
  })
  return guestMintInFlight
}

export async function ensureToken(): Promise<string> {
  return getToken() ?? (await mintGuestToken())
}

const authMiddleware: Middleware = {
  async onRequest({ request }) {
    const token = await ensureToken()
    request.headers.set('Authorization', `Bearer ${token}`)
    return request
  },
  async onResponse({ request, response }) {
    // If our token is rejected, drop it. The next request will mint a fresh guest.
    if (response.status === 401) {
      const wasAuth = request.headers.get('Authorization')
      if (wasAuth) clearToken()
    }
    return response
  },
}

export const api = createClient<paths>({ baseUrl: API_BASE })
api.use(authMiddleware)
