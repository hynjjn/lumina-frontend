import { createFileRoute, useNavigate } from '@tanstack/react-router'
import { useMutation } from '@tanstack/react-query'
import { useForm } from 'react-hook-form'
import { api } from '../api/client'
import { setToken } from '../api/token'

export const Route = createFileRoute('/signup')({
  component: Signup,
})

type Form = { email: string; password: string }

function Signup() {
  const navigate = useNavigate()
  const { register, handleSubmit } = useForm<Form>()

  const signup = useMutation({
    mutationFn: async (form: Form) => {
      const { data, error, response } = await api.POST('/auth/signup', { body: form })
      if (error) {
        if (response.status === 409) throw new Error('Email is already registered')
        throw new Error('Signup failed')
      }
      return data
    },
    onSuccess: (data) => {
      setToken(data.access_token)
      navigate({ to: '/' })
    },
  })

  return (
    <div className="mx-auto max-w-sm space-y-6">
      <h1 className="font-serif text-3xl">Sign up</h1>
      <form onSubmit={handleSubmit((f) => signup.mutate(f))} className="space-y-3">
        <input
          {...register('email', { required: true })}
          type="email"
          placeholder="Email"
          className="w-full rounded border border-zinc-300 dark:border-zinc-700 bg-transparent px-3 py-2 text-sm"
        />
        <input
          {...register('password', { required: true, minLength: 8 })}
          type="password"
          placeholder="Password (min 8 chars)"
          className="w-full rounded border border-zinc-300 dark:border-zinc-700 bg-transparent px-3 py-2 text-sm"
        />
        <button
          type="submit"
          disabled={signup.isPending}
          className="w-full rounded bg-purple-600 px-4 py-2 text-sm font-medium text-white hover:bg-purple-700 disabled:opacity-50"
        >
          {signup.isPending ? 'Creating account…' : 'Create account'}
        </button>
        {signup.isError && <p className="text-sm text-red-600">{signup.error.message}</p>}
      </form>
    </div>
  )
}
