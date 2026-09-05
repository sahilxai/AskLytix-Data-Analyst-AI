import { useEffect, useRef } from 'react'

export default function ParticleCanvas() {
  const canvasRef = useRef(null)

  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas) return

    const ctx = canvas.getContext('2d')
    if (!ctx) return

    let width = window.innerWidth
    let height = window.innerHeight
    let dpr = window.devicePixelRatio || 1
    let mouse = { x: -1000, y: -1000, active: false }
    let particles = []
    let animationFrameId = null

    // Luminous AskLytix Theme Colors (Vibrant Electric Cyan-Blue)
    // Matches the slate-900 background with high-contrast, luminous stars & webs
    const THEME_R = 96
    const THEME_G = 165
    const THEME_B = 250
    const THEME_GLOW = '#38bdf8' // Electric Sky/Cyan Glow
    const ACCENT_R = 56
    const ACCENT_G = 189
    const ACCENT_B = 248

    function initCanvas() {
      dpr = window.devicePixelRatio || 1
      width = window.innerWidth
      height = window.innerHeight
      canvas.width = Math.floor(width * dpr)
      canvas.height = Math.floor(height * dpr)
      canvas.style.width = `${width}px`
      canvas.style.height = `${height}px`
      ctx.setTransform(1, 0, 0, 1, 0, 0)
      ctx.scale(dpr, dpr)

      const count = Math.min(Math.max(Math.floor((width * height) / 26000), 20), 55)
      particles = []
      for (let i = 0; i < count; i++) {
        const isBright = Math.random() > 0.65
        particles.push({
          x: Math.random() * width,
          y: Math.random() * height,
          vx: (Math.random() - 0.5) * 0.11,
          vy: (Math.random() - 0.5) * 0.11,
          radius: isBright ? Math.random() * 1.0 + 2.0 : Math.random() * 0.9 + 1.4,
          baseAlpha: isBright ? Math.random() * 0.25 + 0.65 : Math.random() * 0.25 + 0.45,
          pulse: Math.random() * Math.PI * 2,
          pulseSpeed: Math.random() * 0.010 + 0.005,
          isBright
        })
      }
    }

    initCanvas()

    const handleResize = () => {
      initCanvas()
    }

    let orientationTimeout = null
    const handleOrientation = () => {
      if (orientationTimeout) clearTimeout(orientationTimeout)
      orientationTimeout = setTimeout(initCanvas, 180)
    }

    const handlePointerMove = (e) => {
      mouse.x = e.clientX
      mouse.y = e.clientY
      mouse.active = true
    }

    const handlePointerLeave = () => {
      mouse.active = false
      mouse.x = -1000
      mouse.y = -1000
    }

    const handlePointerUp = () => {
      if (window.matchMedia('(pointer: coarse)').matches) {
        mouse.active = false
        mouse.x = -1000
        mouse.y = -1000
      }
    }

    window.addEventListener('resize', handleResize)
    window.addEventListener('orientationchange', handleOrientation)
    window.addEventListener('pointermove', handlePointerMove)
    window.addEventListener('pointerleave', handlePointerLeave)
    window.addEventListener('pointerup', handlePointerUp)

    const maxDist = 125
    const mouseMaxDist = 160

    function renderParticles() {
      ctx.clearRect(0, 0, width, height)
      const pLen = particles.length

      for (let i = 0; i < pLen; i++) {
        const p = particles[i]
        p.x += p.vx
        p.y += p.vy

        // Smooth Floating & Soft Border Bounce
        if (p.x < 0) { p.x = 0; p.vx *= -1; }
        else if (p.x > width) { p.x = width; p.vx *= -1; }
        if (p.y < 0) { p.y = 0; p.vy *= -1; }
        else if (p.y > height) { p.y = height; p.vy *= -1; }

        // Interactive Mouse Physics: Magnetic Attraction & High-Vis Connection Line
        if (mouse.active) {
          const dx = mouse.x - p.x
          const dy = mouse.y - p.y
          const distToMouse = Math.sqrt(dx * dx + dy * dy)
          if (distToMouse < mouseMaxDist && distToMouse > 15) {
            const force = (1 - distToMouse / mouseMaxDist) * 0.0035
            p.vx += dx * force
            p.vy += dy * force
            p.vx *= 0.985
            p.vy *= 0.985

            const lineAlpha = (1 - distToMouse / mouseMaxDist) * 0.52
            ctx.beginPath()
            ctx.moveTo(p.x, p.y)
            ctx.lineTo(mouse.x, mouse.y)
            ctx.strokeStyle = `rgba(${ACCENT_R}, ${ACCENT_G}, ${ACCENT_B}, ${lineAlpha.toFixed(3)})`
            ctx.lineWidth = 1.15
            ctx.shadowColor = THEME_GLOW
            ctx.shadowBlur = 4
            ctx.stroke()
            ctx.shadowBlur = 0
          }
        }

        // Inter-Dot Connections with Enhanced Luminance & Crisp Lines
        for (let j = i + 1; j < pLen; j++) {
          const p2 = particles[j]
          const dx = p.x - p2.x
          const dy = p.y - p2.y
          const dist = Math.sqrt(dx * dx + dy * dy)

          if (dist < maxDist) {
            const lineAlpha = (1 - dist / maxDist) * 0.38
            ctx.beginPath()
            ctx.moveTo(p.x, p.y)
            ctx.lineTo(p2.x, p2.y)
            ctx.strokeStyle = `rgba(${THEME_R}, ${THEME_G}, ${THEME_B}, ${lineAlpha.toFixed(3)})`
            ctx.lineWidth = 0.95
            ctx.stroke()
          }
        }

        // Draw Dot with Vibrant Glow & Dynamic Pulsation
        p.pulse += p.pulseSpeed
        const currentAlpha = p.baseAlpha + Math.sin(p.pulse) * 0.18
        const clampedAlpha = Math.max(0.35, Math.min(1.0, currentAlpha))

        ctx.beginPath()
        ctx.arc(p.x, p.y, p.radius, 0, Math.PI * 2)
        ctx.fillStyle = `rgba(${p.isBright ? ACCENT_R : THEME_R}, ${p.isBright ? ACCENT_G : THEME_G}, ${p.isBright ? ACCENT_B : THEME_B}, ${clampedAlpha.toFixed(3)})`
        ctx.shadowColor = THEME_GLOW
        ctx.shadowBlur = p.isBright ? 6.5 : 3.5
        ctx.fill()
        ctx.shadowBlur = 0
      }

      animationFrameId = requestAnimationFrame(renderParticles)
    }

    animationFrameId = requestAnimationFrame(renderParticles)

    return () => {
      if (animationFrameId) cancelAnimationFrame(animationFrameId)
      if (orientationTimeout) clearTimeout(orientationTimeout)
      window.removeEventListener('resize', handleResize)
      window.removeEventListener('orientationchange', handleOrientation)
      window.removeEventListener('pointermove', handlePointerMove)
      window.removeEventListener('pointerleave', handlePointerLeave)
      window.removeEventListener('pointerup', handlePointerUp)
    }
  }, [])

  return (
    <canvas
      id="particle-canvas"
      ref={canvasRef}
      style={{
        position: 'fixed',
        inset: 0,
        width: '100vw',
        height: '100vh',
        pointerEvents: 'none',
        zIndex: 0,
      }}
    />
  )
}
