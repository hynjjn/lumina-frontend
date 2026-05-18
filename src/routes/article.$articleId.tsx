import { createFileRoute, Link } from '@tanstack/react-router'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { api } from '../api/client'
import { Reader } from '../components/Reader'

export const Route = createFileRoute('/article/$articleId')({
  component: ArticlePage,
})

function ArticlePage() {
  const { articleId } = Route.useParams()
  const qc = useQueryClient()

  const article = useQuery({
    queryKey: ['article', articleId],
    queryFn: async () => {
      const { data, error } = await api.GET('/articles/{article_id}', {
        params: { path: { article_id: articleId } },
      })
      if (error) throw new Error('failed to load article')
      return data
    },
  })

  const remove = useMutation({
    mutationFn: async () => {
      const { error } = await api.DELETE('/articles/{article_id}', {
        params: { path: { article_id: articleId } },
      })
      if (error) throw new Error('delete failed')
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['articles'] })
    },
  })

  if (article.isLoading) return <p className="text-sm text-zinc-500">Loading…</p>
  if (article.isError || !article.data)
    return <p className="text-sm text-red-600">Could not load article.</p>

  const a = article.data
  return (
    <article className="space-y-6">
      <header className="space-y-2">
        <h1 className="font-serif text-3xl leading-tight">{a.title}</h1>
        {a.source_url && (
          <a
            href={a.source_url}
            target="_blank"
            rel="noreferrer"
            className="text-xs text-zinc-500 hover:underline"
          >
            {a.source_url}
          </a>
        )}
      </header>

      <Reader content={a.content} articleId={a.id} />

      <footer className="flex gap-3 border-t border-zinc-200 dark:border-zinc-800 pt-4">
        <Link to="/" className="text-sm hover:underline">
          ← Back to reading list
        </Link>
        <button
          onClick={() => {
            if (confirm('Delete this article?')) remove.mutate()
          }}
          className="ml-auto text-sm text-red-600 hover:underline disabled:opacity-50"
          disabled={remove.isPending}
        >
          Delete
        </button>
      </footer>
    </article>
  )
}
