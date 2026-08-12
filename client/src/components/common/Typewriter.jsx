import { useEffect, useState } from 'react'

const TAGS = { h1: 'h1', h2: 'h2', p: 'p', span: 'span' }

export default function Typewriter({ text = '', tag = 'h1', speed = 45, startDelay = 0, className = '' }) {
  const [count, setCount] = useState(0)
  const [started, setStarted] = useState(false)

  useEffect(() => {
    const timer = setTimeout(() => setStarted(true), startDelay)
    return () => clearTimeout(timer)
  }, [startDelay])

  useEffect(() => {
    if (!started || count >= text.length) return
    const timer = setTimeout(() => setCount((c) => c + 1), speed)
    return () => clearTimeout(timer)
  }, [count, started, text, speed])

  const Tag = TAGS[tag] ?? 'h1'

  return (
    <Tag className={`${className} typewriter`.trim()}>
      <span className="typewriter-text">{text.slice(0, count)}</span>
      <span className="typewriter-caret" aria-hidden="true" />
    </Tag>
  )
}