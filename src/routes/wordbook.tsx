import { createFileRoute } from '@tanstack/react-router'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { api } from '../api/client'

export const Route = createFileRoute('/wordbook')({
  component: Wordbook,
})

function Wordbook() {
  const qc = useQueryClient()

  const entries = useQuery({
    queryKey: ['wordbook'],
    queryFn: async () => {
      const { data, error } = await api.GET('/wordbook')
      if (error) throw new Error('failed to load wordbook')
      return data
    },
  })

  const remove = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await api.DELETE('/wordbook/{entry_id}', {
        params: { path: { entry_id: id } },
      })
      if (error) throw new Error('delete failed')
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ['wordbook'] }),
  })

  return (
    <div className="space-y-4">
      <h1 className="font-serif text-3xl">Wordbook</h1>
      {entries.isLoading && <p className="text-sm text-zinc-500">Loading…</p>}
      {entries.data && entries.data.length === 0 && (
        <p className="text-sm text-zinc-500">
          No saved words yet. Click words in the reader (coming soon) to add them.
        </p>
      )}
      <ul className="divide-y divide-zinc-200 dark:divide-zinc-800">
        {entries.data?.map((e) => (
          <li key={e.id} className="py-3 flex items-start gap-4">
            {e.image_url && (
              <img
                src={e.image_url}
                alt={e.word}
                loading="lazy"
                className="h-16 w-16 rounded object-cover bg-zinc-100 dark:bg-zinc-800"
              />
            )}
            <div className="flex-1 min-w-0">
              <div className="font-medium">{e.word}</div>
              {e.context && (
                <div className="text-xs text-zinc-500 italic mt-1 truncate">“{e.context}”</div>
              )}
              {(e.definition_en || e.definition_ko) && (
                <div className="text-sm mt-1 space-y-0.5">
                  {e.definition_en && <p>{e.definition_en}</p>}
                  {e.definition_ko && <p className="text-zinc-500">{e.definition_ko}</p>}
                </div>
              )}
            </div>
            <button
              onClick={() => remove.mutate(e.id)}
              className="text-xs text-red-600 hover:underline"
            >
              Remove
            </button>
          </li>
        ))}
      </ul>
    </div>
  )
}
