import { createFileRoute, Link } from '@tanstack/react-router'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { useState } from 'react'
import { api } from '../api/client'

export const Route = createFileRoute('/')({
  component: ReadingList,
})

function ReadingList() {
  const qc = useQueryClient()
  const [url, setUrl] = useState('')

  const articles = useQuery({
    queryKey: ['articles'],
    queryFn: async () => {
      const { data, error } = await api.GET('/articles')
      if (error) throw new Error('failed to load articles')
      return data
    },
  })

  const importArticle = useMutation({
    mutationFn: async (sourceUrl: string) => {
      const { data, error } = await api.POST('/articles/import', {
        body: { url: sourceUrl },
      })
      if (error) throw new Error(typeof error === 'string' ? error : 'import failed')
      return data
    },
    onSuccess: () => {
      setUrl('')
      qc.invalidateQueries({ queryKey: ['articles'] })
    },
  })

  return (
    <div className="space-y-6">
      <section>
        <h1 className="font-serif text-3xl mb-3">Reading list</h1>
        <form
          onSubmit={(e) => {
            e.preventDefault()
            if (url.trim()) importArticle.mutate(url.trim())
          }}
          className="flex gap-2"
        >
          <input
            type="url"
            required
            placeholder="Paste a news article URL"
            value={url}
            onChange={(e) => setUrl(e.target.value)}
            className="flex-1 rounded border border-zinc-300 dark:border-zinc-700 bg-transparent px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-purple-500"
          />
          <button
            type="submit"
            disabled={importArticle.isPending}
            className="rounded bg-purple-600 px-4 py-2 text-sm font-medium text-white hover:bg-purple-700 disabled:opacity-50"
          >
            {importArticle.isPending ? 'Importing…' : 'Import'}
          </button>
        </form>
        {importArticle.isError && (
          <p className="mt-2 text-sm text-red-600">{importArticle.error.message}</p>
        )}
      </section>

      <section>
        {articles.isLoading && <p className="text-sm text-zinc-500">Loading…</p>}
        {articles.isError && (
          <p className="text-sm text-red-600">Could not load reading list.</p>
        )}
        {articles.data && articles.data.length === 0 && (
          <p className="text-sm text-zinc-500">Nothing saved yet. Paste a URL above to get started.</p>
        )}
        <ul className="divide-y divide-zinc-200 dark:divide-zinc-800">
          {articles.data?.map((a) => (
            <li key={a.id} className="py-3">
              <Link
                to="/article/$articleId"
                params={{ articleId: a.id }}
                className="block hover:underline"
              >
                <div className="font-medium">{a.title}</div>
                {a.source_url && (
                  <div className="text-xs text-zinc-500 truncate">{a.source_url}</div>
                )}
              </Link>
            </li>
          ))}
        </ul>
      </section>
    </div>
  )
}
