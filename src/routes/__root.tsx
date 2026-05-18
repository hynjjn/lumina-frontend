import { Link, Outlet, createRootRouteWithContext } from '@tanstack/react-router'
import type { QueryClient } from '@tanstack/react-query'

export const Route = createRootRouteWithContext<{ queryClient: QueryClient }>()({
  component: RootLayout,
})

function RootLayout() {
  return (
    <div className="min-h-full flex flex-col">
      <header className="border-b border-zinc-200 dark:border-zinc-800">
        <nav className="mx-auto flex max-w-3xl items-center justify-between px-4 py-3">
          <Link to="/" className="font-serif text-xl tracking-tight">
            Lumina
          </Link>
          <div className="flex gap-4 text-sm">
            <Link to="/" className="hover:underline" activeProps={{ className: 'font-medium' }}>
              Reading list
            </Link>
            <Link to="/wordbook" className="hover:underline" activeProps={{ className: 'font-medium' }}>
              Wordbook
            </Link>
            <Link to="/login" className="hover:underline" activeProps={{ className: 'font-medium' }}>
              Login
            </Link>
          </div>
        </nav>
      </header>
      <main className="mx-auto w-full max-w-3xl flex-1 px-4 py-6">
        <Outlet />
      </main>
    </div>
  )
}
