import { useState } from 'react'
import { api } from '../api.js'

const TEMPLATE = `#include <stdio.h>

int main() {
    printf("Hello from C!\\n");
    return 0;
}`

export default function Compiler() {
  const [code, setCode] = useState(TEMPLATE)
  const [stdin, setStdin] = useState('')
  const [result, setResult] = useState(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  const handleTab = (e) => {
    if (e.key !== 'Tab') return
    e.preventDefault()
    const { selectionStart, selectionEnd, value } = e.target
    const next = value.slice(0, selectionStart) + '    ' + value.slice(selectionEnd)
    setCode(next)
    requestAnimationFrame(() => {
      e.target.selectionStart = e.target.selectionEnd = selectionStart + 4
    })
  }

  const run = async () => {
    setLoading(true)
    setError('')
    setResult(null)
    try {
      const data = await api.post('/compile', { code, stdin })
      setResult(data)
    } catch (err) {
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }

  const compileFailed = result?.compile && result.compile.code !== 0
  const exitCode = compileFailed ? result.compile.code : result?.run?.code

  return (
    <section className="page page-wide">
      <div className="page-header">
        <h1 className="page-title">C Compiler</h1>
        <button className="btn btn-primary" onClick={run} disabled={loading}>
          {loading ? 'Compiling…' : '▶ Run'}
        </button>
      </div>

      {error && <p className="error">{error}</p>}

      <div className="compiler-grid">
        <div className="compiler-editor">
          <div className="compiler-editor-bar">
            <span className="compiler-filename">main.c</span>
          </div>
          <textarea
            className="compiler-code"
            value={code}
            onChange={(e) => setCode(e.target.value)}
            onKeyDown={handleTab}
            spellCheck="false"
            autoComplete="off"
            wrap="off"
          />
        </div>

        <div className="compiler-side">
          <label className="compiler-stdin-label">
            Program Input (stdin)
            <textarea
              className="compiler-stdin"
              rows={4}
              value={stdin}
              onChange={(e) => setStdin(e.target.value)}
              placeholder="Optional input for the program…"
              spellCheck="false"
            />
          </label>

          <div className="compiler-output-wrap">
            <div className="compiler-output-bar">
              <span>Output</span>
              {result && (
                <span className={`compiler-exit exit-${exitCode === 0 ? 'ok' : 'bad'}`}>
                  {compileFailed ? 'compile error' : `exit ${exitCode ?? '?'}`}
                </span>
              )}
            </div>
            <pre className={`compiler-output${compileFailed ? ' is-error' : ''}`}>
              {!result && (loading ? 'Running…' : 'Run your code to see the output here.')}
              {result && (compileFailed ? result.compile.output : result.run.output)}
            </pre>
          </div>
        </div>
      </div>
    </section>
  )
}