import { createFileRoute, useNavigate } from '@tanstack/react-router'
import { useMutation } from '@tanstack/react-query'
import { useForm } from 'react-hook-form'
import { api } from '../api/client'
import { setToken } from '../api/token'

export const Route = createFileRoute('/login')({
  component: Login,
})

type Form = { email: string; password: string }

function Login() {
  const navigate = useNavigate()
  const { register, handleSubmit, formState } = useForm<Form>()

  const login = useMutation({
    mutationFn: async (form: Form) => {
      const { data, error } = await api.POST('/auth/login', { body: form })
      if (error) throw new Error('Invalid email or password')
      return data
    },
    onSuccess: (data) => {
      setToken(data.access_token)
      navigate({ to: '/' })
    },
  })

  const googleLogin = useMutation({
    mutationFn: async () => {
      const { data, error } = await api.GET('/auth/google/login')
      if (error) throw new Error('google login init failed')
      return data
    },
    onSuccess: (data) => {
      window.location.href = data.url
    },
  })

  return (
    <div className="mx-auto max-w-sm space-y-6">
      <h1 className="font-serif text-3xl">Log in</h1>
      <form onSubmit={handleSubmit((f) => login.mutate(f))} className="space-y-3">
        <input
          {...register('email', { required: true })}
          type="email"
          placeholder="Email"
          className="w-full rounded border border-zinc-300 dark:border-zinc-700 bg-transparent px-3 py-2 text-sm"
        />
        <input
          {...register('password', { required: true })}
          type="password"
          placeholder="Password"
          className="w-full rounded border border-zinc-300 dark:border-zinc-700 bg-transparent px-3 py-2 text-sm"
        />
        <button
          type="submit"
          disabled={formState.isSubmitting || login.isPending}
          className="w-full rounded bg-purple-600 px-4 py-2 text-sm font-medium text-white hover:bg-purple-700 disabled:opacity-50"
        >
          {login.isPending ? 'Logging in…' : 'Log in'}
        </button>
        {login.isError && <p className="text-sm text-red-600">{login.error.message}</p>}
      </form>

      <div className="text-center text-xs text-zinc-500">or</div>

      <button
        onClick={() => googleLogin.mutate()}
        disabled={googleLogin.isPending}
        className="w-full rounded border border-zinc-300 dark:border-zinc-700 px-4 py-2 text-sm hover:bg-zinc-50 dark:hover:bg-zinc-900"
      >
        Continue with Google
      </button>

      <p className="text-center text-sm text-zinc-500">
        No account?{' '}
        <a href="/signup" className="underline">
          Sign up
        </a>
      </p>
    </div>
  )
}
