import { useEffect, useRef } from 'react'

const SNIPPETS = [
  '$ sudo apt update',
  '$ sudo apt upgrade',
  './install.sh',
  'git clone',
  'git push origin main',
  'npm run dev',
  'docker compose up',
  'systemctl status',
  'chmod +x script.sh',
  '#include <stdio.h>',
  'int main() {}',
  'cat /etc/os-release',
  'while(true) { code(); }',
  '01001001 01001110',
]

const COLORS = ['#57f287', '#4f8cff', '#ffd479', '#e6e9ef']
const FONT_FAMILY = "Consolas, Menlo, 'Courier New', monospace"
const CURSOR_RADIUS = 190
const PUSH_STRENGTH = 95
const MAX_SNIPPETS = 34
const EDGE_PAD = 60

export default function CodeBackground() {
  const canvasRef = useRef(null)

  useEffect(() => {
    const canvas = canvasRef.current
    const ctx = canvas.getContext('2d')
    const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches

    let rafId = 0
    let running = true
    let width = 0
    let height = 0
    let snippets = []
    const cursor = { x: -9999, y: -9999, active: false }
    let last = performance.now()

    const rand = (a, b) => a + Math.random() * (b - a)

    const makeSnippet = () => {
      const speed = rand(3, 12)
      const angle = rand(0, Math.PI * 2)
      const size = rand(10, 16)
      const text = SNIPPETS[Math.floor(Math.random() * SNIPPETS.length)]
      const baseAlpha = rand(0.08, 0.17)
      const snippet = {
        text,
        color: COLORS[Math.floor(Math.random() * COLORS.length)],
        size,
        w: 0,
        rx: rand(0, width),
        ry: rand(0, height),
        x: rand(0, width),
        y: rand(0, height),
        vx: Math.cos(angle) * speed,
        vy: Math.sin(angle) * speed,
        rot: rand(-0.06, 0.06),
        restAngle: rand(-0.06, 0.06),
        alpha: baseAlpha,
        baseAlpha,
        spinDir: Math.random() < 0.5 ? -1 : 1,
        swayFreq: rand(0.25, 0.6),
        swayAmp: rand(4, 10),
        phase: rand(0, Math.PI * 2),
      }
      ctx.font = `500 ${size}px ${FONT_FAMILY}`
      snippet.w = ctx.measureText(text).width
      return snippet
    }

    const spawn = () => {
      const count = Math.min(
        MAX_SNIPPETS,
        Math.max(12, Math.round(Math.sqrt(width * height) / 26))
      )
      snippets = Array.from({ length: count }, makeSnippet)
    }

    const resize = () => {
      const dpr = Math.min(window.devicePixelRatio || 1, 2)
      width = window.innerWidth
      height = window.innerHeight
      canvas.width = Math.round(width * dpr)
      canvas.height = Math.round(height * dpr)
      canvas.style.width = `${width}px`
      canvas.style.height = `${height}px`
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0)
      spawn()
      if (reduceMotion) draw()
    }

    const draw = () => {
      ctx.clearRect(0, 0, width, height)
      for (const s of snippets) {
        ctx.globalAlpha = s.alpha
        ctx.fillStyle = s.color
        ctx.font = `500 ${s.size}px ${FONT_FAMILY}`
        ctx.save()
        ctx.translate(s.x, s.y)
        ctx.rotate(s.rot)
        ctx.fillText(s.text, -s.w / 2, s.size * 0.35)
        ctx.restore()
      }
      ctx.globalAlpha = 1
    }

    const frame = (now) => {
      const dt = Math.min(0.05, (now - last) / 1000)
      last = now
      const t = now / 1000

      for (const s of snippets) {
        // slow idle drift, wrapped at the edges
        s.rx += s.vx * dt
        s.ry += s.vy * dt
        if (s.rx < -EDGE_PAD || s.rx > width + EDGE_PAD) { s.vx = -s.vx; s.rx = Math.min(Math.max(s.rx, -EDGE_PAD), width + EDGE_PAD) }
        if (s.ry < -EDGE_PAD || s.ry > height + EDGE_PAD) { s.vy = -s.vy; s.ry = Math.min(Math.max(s.ry, -EDGE_PAD), height + EDGE_PAD) }

        // gentle floating sway
        const swayX = Math.sin(t * s.swayFreq + s.phase) * s.swayAmp
        const swayY = Math.cos(t * s.swayFreq * 0.75 + s.phase) * s.swayAmp * 0.7

        // cursor repulsion + brightness
        let boost = 0
        let pushX = 0
        let pushY = 0
        if (cursor.active) {
          const dx = cursor.x - s.x
          const dy = cursor.y - s.y
          const d = Math.hypot(dx, dy)
          if (d < CURSOR_RADIUS && d > 0.001) {
            const falloff = 1 - d / CURSOR_RADIUS
            const force = falloff * falloff * PUSH_STRENGTH
            pushX = -(dx / d) * force
            pushY = -(dy / d) * force
            boost = falloff * falloff
          }
        }

        // smooth ease back to (rest + sway + push) — no spring, no jitter
        s.x += (s.rx + swayX + pushX - s.x) * 0.06
        s.y += (s.ry + swayY + pushY - s.y) * 0.06
        s.rot += (s.restAngle + boost * 0.18 * s.spinDir - s.rot) * 0.1
        s.alpha += (s.baseAlpha + boost * 0.35 - s.alpha) * 0.1
      }

      draw()
      if (running) rafId = requestAnimationFrame(frame)
    }

    const onPointerMove = (e) => { cursor.x = e.clientX; cursor.y = e.clientY; cursor.active = true }
    const onPointerDown = (e) => { cursor.x = e.clientX; cursor.y = e.clientY; cursor.active = true }
    const onPointerLeave = () => { cursor.active = false }
    const onVisibility = () => {
      running = !document.hidden
      if (running && !reduceMotion) {
        last = performance.now()
        rafId = requestAnimationFrame(frame)
      }
    }

    resize()
    if (reduceMotion) {
      draw()
    } else {
      last = performance.now()
      rafId = requestAnimationFrame(frame)
    }

    window.addEventListener('resize', resize)
    window.addEventListener('pointermove', onPointerMove, { passive: true })
    window.addEventListener('pointerdown', onPointerDown, { passive: true })
    document.documentElement.addEventListener('pointerleave', onPointerLeave)
    document.addEventListener('visibilitychange', onVisibility)

    return () => {
      cancelAnimationFrame(rafId)
      window.removeEventListener('resize', resize)
      window.removeEventListener('pointermove', onPointerMove)
      window.removeEventListener('pointerdown', onPointerDown)
      document.documentElement.removeEventListener('pointerleave', onPointerLeave)
      document.removeEventListener('visibilitychange', onVisibility)
    }
  }, [])

  return <canvas className="code-rain" ref={canvasRef} aria-hidden="true" />
}