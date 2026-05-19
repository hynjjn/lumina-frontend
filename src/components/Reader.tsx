import { Children, cloneElement, isValidElement, useMemo, type ReactNode } from 'react'
import ReactMarkdown, { type Components } from 'react-markdown'
import remarkGfm from 'remark-gfm'
import { GlossableWord } from './GlossableWord'

interface ReaderProps {
  content: string
  articleId: string
}

export function Reader({ content, articleId }: ReaderProps) {
  const { sentences, wordToSentence } = useMemo(() => buildSentenceMap(content), [content])

  const cursor = { n: 0 }
  cursor.n = 0

  const tokenizeString = (text: string, baseKey: string): ReactNode[] => {
    const wordSeg = new Intl.Segmenter('en', { granularity: 'word' })
    const out: ReactNode[] = []
    let i = 0
    for (const seg of wordSeg.segment(text)) {
      const key = `${baseKey}-${i++}`
      if (seg.isWordLike && /[A-Za-z]/.test(seg.segment)) {
        const sIdx =
          wordToSentence[cursor.n] ?? Math.max(0, sentences.length - 1)
        cursor.n++
        out.push(
          <GlossableWord
            key={key}
            word={seg.segment}
            context={sentences[sIdx] ?? ''}
            articleId={articleId}
          />,
        )
      } else {
        out.push(<span key={key}>{seg.segment}</span>)
      }
    }
    return out
  }

  const tokenizeChildren = (children: ReactNode, baseKey: string): ReactNode => {
    return Children.map(children, (child, idx) => {
      if (typeof child === 'string') {
        return tokenizeString(child, `${baseKey}-s${idx}`)
      }
      if (isValidElement(child)) {
        // Links, code (inline + block), and pre pass through untouched.
        if (child.type === 'a' || child.type === 'code' || child.type === 'pre') return child
        const props = child.props as { children?: ReactNode }
        const nested = tokenizeChildren(props.children, `${baseKey}-e${idx}`)
        return cloneElement(child, { key: `${baseKey}-e${idx}` }, nested)
      }
      return child
    })
  }

  const wrap = <T extends keyof React.JSX.IntrinsicElements>(Tag: T) => {
    const Wrapped = ({ children }: { children?: ReactNode }) => {
      const Component = Tag as unknown as React.ElementType
      return <Component>{tokenizeChildren(children, Tag)}</Component>
    }
    Wrapped.displayName = `MarkdownGloss(${Tag})`
    return Wrapped
  }

  const components: Components = {
    p: wrap('p'),
    h1: wrap('h1'),
    h2: wrap('h2'),
    h3: wrap('h3'),
    h4: wrap('h4'),
    h5: wrap('h5'),
    h6: wrap('h6'),
    li: wrap('li'),
    blockquote: wrap('blockquote'),
  }

  return (
    <div className="prose prose-zinc dark:prose-invert max-w-none font-serif leading-relaxed prose-p:my-6 prose-headings:mt-10 prose-headings:mb-4">
      <ReactMarkdown remarkPlugins={[remarkGfm]} components={components}>
        {content}
      </ReactMarkdown>
    </div>
  )
}

function buildSentenceMap(content: string): {
  sentences: string[]
  wordToSentence: number[]
} {
  // Strip Markdown syntax so sentence/word segmentation sees prose only.
  const stripped = content
    .replace(/```[\s\S]*?```/g, ' ') // fenced code blocks
    .replace(/!\[([^\]]*)\]\([^)]*\)/g, '$1') // images: keep alt text
    .replace(/\[([^\]]+)\]\([^)]*\)/g, '$1') // links: keep text
    .replace(/^\s{0,3}#{1,6}\s+/gm, '') // heading markers
    .replace(/^\s{0,3}>\s?/gm, '') // blockquote markers
    .replace(/^\s*[-*+]\s+/gm, '') // unordered list markers
    .replace(/^\s*\d+\.\s+/gm, '') // ordered list markers
    .replace(/`([^`]+)`/g, '$1') // inline code
    .replace(/(\*\*|__)(.+?)\1/g, '$2') // bold
    .replace(/(\*|_)(.+?)\1/g, '$2') // italic
    .replace(/~~(.+?)~~/g, '$1') // strikethrough

  const sentenceSeg = new Intl.Segmenter('en', { granularity: 'sentence' })
  const wordSeg = new Intl.Segmenter('en', { granularity: 'word' })

  const sentences: string[] = []
  const sentenceEnds: number[] = []
  for (const s of sentenceSeg.segment(stripped)) {
    sentences.push(s.segment.trim())
    sentenceEnds.push(s.index + s.segment.length)
  }

  const wordToSentence: number[] = []
  let sIdx = 0
  for (const seg of wordSeg.segment(stripped)) {
    if (!(seg.isWordLike && /[A-Za-z]/.test(seg.segment))) continue
    while (sIdx < sentenceEnds.length - 1 && seg.index >= sentenceEnds[sIdx]) sIdx++
    wordToSentence.push(sIdx)
  }

  return { sentences, wordToSentence }
}
