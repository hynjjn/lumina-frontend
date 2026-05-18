import { useState } from 'react'
import {
  FloatingPortal,
  autoUpdate,
  flip,
  offset,
  shift,
  useClick,
  useDismiss,
  useFloating,
  useInteractions,
  useRole,
} from '@floating-ui/react'
import { useGloss, useSaveToWordbook } from '../api/gloss'

interface Props {
  word: string
  context: string
  articleId: string
}

export function GlossableWord({ word, context, articleId }: Props) {
  const [open, setOpen] = useState(false)

  const { refs, floatingStyles, context: fCtx } = useFloating({
    open,
    onOpenChange: setOpen,
    placement: 'top',
    middleware: [offset(8), flip(), shift({ padding: 8 })],
    whileElementsMounted: autoUpdate,
  })

  const click = useClick(fCtx)
  const dismiss = useDismiss(fCtx)
  const role = useRole(fCtx, { role: 'dialog' })
  const { getReferenceProps, getFloatingProps } = useInteractions([click, dismiss, role])

  const gloss = useGloss(word, context, open)
  const save = useSaveToWordbook()

  return (
    <>
      <span
        ref={refs.setReference}
        {...getReferenceProps()}
        className="cursor-pointer rounded-sm decoration-dotted decoration-zinc-400 underline-offset-4 hover:bg-purple-100/60 hover:underline dark:hover:bg-purple-900/30"
      >
        {word}
      </span>
      {open && (
        <FloatingPortal>
          <div
            ref={refs.setFloating}
            style={floatingStyles}
            {...getFloatingProps()}
            className="z-50 w-80 rounded-lg border border-zinc-200 bg-white p-3 text-sm shadow-lg dark:border-zinc-800 dark:bg-zinc-900"
          >
            <div className="flex items-baseline justify-between gap-2">
              <span className="font-serif text-base font-medium">{word}</span>
              {gloss.data?.part_of_speech && (
                <span className="text-xs italic text-zinc-500">{gloss.data.part_of_speech}</span>
              )}
            </div>

            {gloss.isLoading && (
              <p className="mt-2 text-xs text-zinc-500">Looking up…</p>
            )}
            {gloss.isError && (
              <p className="mt-2 text-xs text-red-600">Couldn’t look this up.</p>
            )}

            {gloss.data && (
              <div className="mt-2 space-y-2">
                {gloss.data.definitions_en.length > 0 && (
                  <ol className="list-decimal space-y-0.5 pl-4 text-zinc-800 dark:text-zinc-200">
                    {gloss.data.definitions_en.map((d, i) => (
                      <li key={i}>{d}</li>
                    ))}
                  </ol>
                )}
                {gloss.data.definition_ko && (
                  <p className="text-zinc-600 dark:text-zinc-400">{gloss.data.definition_ko}</p>
                )}
                {gloss.data.examples.length > 0 && (
                  <ul className="space-y-0.5 border-l-2 border-zinc-200 pl-2 text-xs italic text-zinc-500 dark:border-zinc-700">
                    {gloss.data.examples.map((ex, i) => (
                      <li key={i}>{ex}</li>
                    ))}
                  </ul>
                )}
              </div>
            )}

            <div className="mt-3 flex items-center justify-end gap-2 border-t border-zinc-100 pt-2 dark:border-zinc-800">
              {save.isSuccess ? (
                <span className="text-xs text-emerald-600">Saved ✓</span>
              ) : save.isError ? (
                <span className="text-xs text-red-600">Save failed</span>
              ) : (
                <button
                  type="button"
                  disabled={!gloss.data || save.isPending}
                  onClick={() =>
                    save.mutate({
                      word,
                      context,
                      articleId,
                      definitionEn: gloss.data?.definitions_en[0] ?? null,
                      definitionKo: gloss.data?.definition_ko ?? null,
                    })
                  }
                  className="rounded bg-purple-600 px-2.5 py-1 text-xs font-medium text-white hover:bg-purple-700 disabled:opacity-50"
                >
                  {save.isPending ? 'Saving…' : 'Save to wordbook'}
                </button>
              )}
            </div>
          </div>
        </FloatingPortal>
      )}
    </>
  )
}
