import { useMemo } from 'react'
import { GlossableWord } from './GlossableWord'

type Token =
  | { kind: 'word'; text: string; sentenceIdx: number; key: string }
  | { kind: 'text'; text: string; key: string }
  | { kind: 'break'; key: string }

interface ReaderProps {
  content: string
  articleId: string
}

export function Reader({ content, articleId }: ReaderProps) {
  const { tokens, sentences } = useMemo(() => tokenize(content), [content])
  return (
    <div className="prose prose-zinc dark:prose-invert max-w-none font-serif leading-relaxed">
      {tokens.map((t) => {
        if (t.kind === 'break') return <br key={t.key} />
        if (t.kind === 'text') return <span key={t.key}>{t.text}</span>
        return (
          <GlossableWord
            key={t.key}
            word={t.text}
            context={sentences[t.sentenceIdx] ?? ''}
            articleId={articleId}
          />
        )
      })}
    </div>
  )
}

function tokenize(content: string): { tokens: Token[]; sentences: string[] } {
  const sentenceSeg = new Intl.Segmenter('en', { granularity: 'sentence' })
  const wordSeg = new Intl.Segmenter('en', { granularity: 'word' })

  const sentences: string[] = []
  const sentenceRanges: Array<{ start: number; end: number; idx: number }> = []
  for (const s of sentenceSeg.segment(content)) {
    const idx = sentences.length
    sentences.push(s.segment.trim())
    sentenceRanges.push({ start: s.index, end: s.index + s.segment.length, idx })
  }

  const findSentence = (offset: number): number => {
    // Sentence ranges are sorted; linear is fine for typical article sizes.
    for (const r of sentenceRanges) if (offset >= r.start && offset < r.end) return r.idx
    return Math.max(0, sentenceRanges.length - 1)
  }

  const tokens: Token[] = []
  let keyN = 0
  // Split on hard breaks first so paragraphs render as <br/>.
  const lines = content.split(/(\n)/)
  let offset = 0
  for (const line of lines) {
    if (line === '\n') {
      tokens.push({ kind: 'break', key: `b${keyN++}` })
      offset += 1
      continue
    }
    for (const seg of wordSeg.segment(line)) {
      const absOffset = offset + seg.index
      if (seg.isWordLike && /[A-Za-z]/.test(seg.segment)) {
        tokens.push({
          kind: 'word',
          text: seg.segment,
          sentenceIdx: findSentence(absOffset),
          key: `w${keyN++}`,
        })
      } else {
        tokens.push({ kind: 'text', text: seg.segment, key: `t${keyN++}` })
      }
    }
    offset += line.length
  }
  return { tokens, sentences }
}
