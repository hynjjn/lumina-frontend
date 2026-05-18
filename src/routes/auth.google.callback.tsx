import { createFileRoute, useNavigate } from '@tanstack/react-router'
import { useEffect, useRef } from 'react'
import { api } from '../api/client'
import { setToken } from '../api/token'

type Search = { code?: string; state?: string }

export const Route = createFileRoute('/auth/google/callback')({
  validateSearch: (s: Record<string, unknown>): Search => ({
    code: typeof s.code === 'string' ? s.code : undefined,
    state: typeof s.state === 'string' ? s.state : undefined,
  }),
  component: GoogleCallback,
})

function GoogleCallback() {
  const navigate = useNavigate()
  const { code, state } = Route.useSearch()
  const ran = useRef(false)

  useEffect(() => {
    if (ran.current) return
    ran.current = true
    if (!code || !state) {
      navigate({ to: '/login' })
      return
    }
    ;(async () => {
      const { data, error } = await api.GET('/auth/google/callback', {
        params: { query: { code, state } },
      })
      if (error || !data) {
        navigate({ to: '/login' })
        return
      }
      setToken(data.access_token)
      navigate({ to: '/' })
    })()
  }, [code, state, navigate])

  return <p className="text-sm text-zinc-500">Finishing sign-in…</p>
}
