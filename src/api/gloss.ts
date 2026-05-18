import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { api } from './client'

export function useGloss(word: string, context: string, enabled: boolean) {
  return useQuery({
    queryKey: ['gloss', word.toLowerCase(), context],
    enabled: enabled && word.length > 0,
    staleTime: 5 * 60_000,
    queryFn: async () => {
      const { data, error } = await api.POST('/gloss', {
        body: { word, context: context || null },
      })
      if (error) throw new Error('gloss failed')
      return data
    },
  })
}

interface SaveArgs {
  word: string
  context: string
  articleId: string
  definitionEn: string | null
  definitionKo: string | null
}

export function useSaveToWordbook() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: async (args: SaveArgs) => {
      const { data, error } = await api.POST('/wordbook', {
        body: {
          word: args.word,
          context: args.context || null,
          article_id: args.articleId,
          definition_en: args.definitionEn,
          definition_ko: args.definitionKo,
        },
      })
      if (error) throw new Error('save failed')
      return data
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ['wordbook'] }),
  })
}
