<script setup>
useHead({ title: 'photophore — wren' })

const canvasEl = ref(null)
const isRunning = ref(false)
const flashPercent = ref(5)
const mousePos = ref({ x: -1000, y: -1000 })
const mouseActive = ref(false)
const showInfo = ref(false)
const externalLightOn = ref(false)

let fish = []
let animFrame = null
let ctx = null
let width = 0
let height = 0
let time = 0

// ─── PARAMETERS ────────────────────────────────────────────────

const params = reactive({
  count: 200,
  separation: 20,
  alignment: 55,
  cohesion: 75,
  separationForce: 0.045,
  alignmentForce: 0.035,
  cohesionForce: 0.02,
  maxSpeed: 2.5,
  minSpeed: 0.8,
  flashlightRadius: 180,
  scatterForce: 0.15,
  edgeMargin: 50,
  edgeTurnForce: 0.12,
  glowRadius: 35,
  blinkDurationMin: 60,
  blinkDurationMax: 180,
  darkDurationMin: 200,
  darkDurationMax: 600,
})

// ─── FISH ──────────────────────────────────────────────────────

function createFish(x, y) {
  const angle = Math.random() * Math.PI * 2
  const speed = params.minSpeed + Math.random() * (params.maxSpeed - params.minSpeed)
  return {
    x, y,
    vx: Math.cos(angle) * speed,
    vy: Math.sin(angle) * speed,
    // photophore state
    glowing: false,
    glowIntensity: 0,
    blinkTimer: Math.floor(Math.random() * params.darkDurationMax),
    blinkPhase: 'dark', // 'dark' | 'rising' | 'lit' | 'falling'
    blinkDuration: 0,
    // scatter state
    scattered: false,
    scatterTimer: 0,
    // leader: occasionally one fish decides to turn
    isLeader: false,
    leaderTimer: 0,
    leaderAngle: 0,
  }
}

function initFish() {
  fish = []
  const cx = width / 2
  const cy = height / 2
  const spread = Math.min(width, height) * 0.3
  for (let i = 0; i < params.count; i++) {
    const x = cx + (Math.random() - 0.5) * spread
    const y = cy + (Math.random() - 0.5) * spread
    fish.push(createFish(x, y))
  }
}

// ─── BLINK LOGIC ───────────────────────────────────────────────

function updateBlinks() {
  // Count currently glowing
  const glowingCount = fish.filter(f => f.glowIntensity > 0.1).length
  const targetGlowing = Math.max(1, Math.floor(fish.length * flashPercent.value / 100))

  for (const f of fish) {
    if (f.scattered) {
      // scattered fish go dark
      f.glowIntensity = Math.max(0, f.glowIntensity - 0.03)
      f.blinkPhase = 'dark'
      f.blinkTimer = params.darkDurationMin + Math.random() * (params.darkDurationMax - params.darkDurationMin)
      continue
    }

    f.blinkTimer--

    if (f.blinkPhase === 'dark' && f.blinkTimer <= 0) {
      // Should this fish start glowing?
      if (glowingCount < targetGlowing || Math.random() < 0.002) {
        f.blinkPhase = 'rising'
        f.blinkDuration = params.blinkDurationMin + Math.random() * (params.blinkDurationMax - params.blinkDurationMin)
        f.blinkTimer = f.blinkDuration
      } else {
        f.blinkTimer = 30 + Math.random() * 60
      }
    } else if (f.blinkPhase === 'rising') {
      f.glowIntensity = Math.min(1, f.glowIntensity + 0.04)
      if (f.glowIntensity >= 1) {
        f.blinkPhase = 'lit'
      }
    } else if (f.blinkPhase === 'lit' && f.blinkTimer <= 0) {
      f.blinkPhase = 'falling'
    } else if (f.blinkPhase === 'falling') {
      f.glowIntensity = Math.max(0, f.glowIntensity - 0.015)
      if (f.glowIntensity <= 0) {
        f.blinkPhase = 'dark'
        f.blinkTimer = params.darkDurationMin + Math.random() * (params.darkDurationMax - params.darkDurationMin)
      }
    }
  }
}

// ─── SIMULATION ────────────────────────────────────────────────

function update() {
  time++

  // Leader selection: every ~300 frames, 1-2 fish become leaders
  if (time % 300 === 0) {
    fish.forEach(f => { f.isLeader = false })
    const leaderCount = Math.random() < 0.7 ? 1 : 2
    for (let i = 0; i < leaderCount; i++) {
      const idx = Math.floor(Math.random() * fish.length)
      fish[idx].isLeader = true
      fish[idx].leaderTimer = 120 + Math.random() * 180
      fish[idx].leaderAngle = Math.random() * Math.PI * 2
    }
  }

  // External light state
  const lightOn = mouseActive.value && externalLightOn.value

  for (let i = 0; i < fish.length; i++) {
    const f = fish[i]
    let sepX = 0, sepY = 0, sepCount = 0
    let aliX = 0, aliY = 0, aliCount = 0
    let cohX = 0, cohY = 0, cohCount = 0

    // Only align/cohere with visible fish (glowing or very close)
    for (let j = 0; j < fish.length; j++) {
      if (i === j) continue
      const other = fish[j]
      const dx = other.x - f.x
      const dy = other.y - f.y
      const dist = Math.sqrt(dx * dx + dy * dy)

      // Separation — always active (proximity sense)
      if (dist < params.separation && dist > 0) {
        sepX -= dx / dist
        sepY -= dy / dist
        sepCount++
      }

      // Alignment and cohesion — stronger when neighbor is glowing
      const visibility = other.glowIntensity > 0.1 ? 1.0 : 0.3
      const effectiveRange = other.glowIntensity > 0.1 ? 1.0 : 0.4

      if (dist < params.alignment * effectiveRange) {
        aliX += other.vx * visibility
        aliY += other.vy * visibility
        aliCount += visibility
      }

      if (dist < params.cohesion * effectiveRange) {
        cohX += other.x * visibility
        cohY += other.y * visibility
        cohCount += visibility
      }
    }

    // Apply forces
    if (sepCount > 0) {
      f.vx += (sepX / sepCount) * params.separationForce
      f.vy += (sepY / sepCount) * params.separationForce
    }
    if (aliCount > 0) {
      const avgVx = aliX / aliCount
      const avgVy = aliY / aliCount
      f.vx += (avgVx - f.vx) * params.alignmentForce
      f.vy += (avgVy - f.vy) * params.alignmentForce
    }
    if (cohCount > 0) {
      const avgX = cohX / cohCount
      const avgY = cohY / cohCount
      f.vx += (avgX - f.x) * params.cohesionForce * 0.01
      f.vy += (avgY - f.y) * params.cohesionForce * 0.01
    }

    // Leader fish: steer toward their chosen direction
    if (f.isLeader && f.leaderTimer > 0) {
      f.leaderTimer--
      f.vx += Math.cos(f.leaderAngle) * 0.03
      f.vy += Math.sin(f.leaderAngle) * 0.03
    }

    // External flashlight — SCATTER
    if (lightOn) {
      const dx = mousePos.value.x - f.x
      const dy = mousePos.value.y - f.y
      const dist = Math.sqrt(dx * dx + dy * dy)
      if (dist < params.flashlightRadius && dist > 0) {
        const force = params.scatterForce * (1 - dist / params.flashlightRadius)
        f.vx -= (dx / dist) * force
        f.vy -= (dy / dist) * force
        f.scattered = true
        f.scatterTimer = 90
      }
    }

    // Recover from scatter
    if (f.scattered) {
      f.scatterTimer--
      if (f.scatterTimer <= 0) {
        f.scattered = false
      }
    }

    // Edge avoidance
    if (f.x < params.edgeMargin) f.vx += params.edgeTurnForce
    if (f.x > width - params.edgeMargin) f.vx -= params.edgeTurnForce
    if (f.y < params.edgeMargin) f.vy += params.edgeTurnForce
    if (f.y > height - params.edgeMargin) f.vy -= params.edgeTurnForce

    // Speed limits
    const speed = Math.sqrt(f.vx * f.vx + f.vy * f.vy)
    const maxSpd = f.scattered ? params.maxSpeed * 1.8 : params.maxSpeed
    if (speed > maxSpd) {
      f.vx = (f.vx / speed) * maxSpd
      f.vy = (f.vy / speed) * maxSpd
    }
    if (speed < params.minSpeed && speed > 0) {
      f.vx = (f.vx / speed) * params.minSpeed
      f.vy = (f.vy / speed) * params.minSpeed
    }

    // Move
    f.x += f.vx
    f.y += f.vy
  }

  updateBlinks()
}

// ─── RENDERING ─────────────────────────────────────────────────

function draw() {
  if (!ctx) return

  // Deep ocean: very dark, slight fade for motion blur
  ctx.fillStyle = 'rgba(3, 6, 15, 0.25)'
  ctx.fillRect(0, 0, width, height)

  const lightOn = mouseActive.value && externalLightOn.value

  // External flashlight cone
  if (lightOn) {
    const grd = ctx.createRadialGradient(
      mousePos.value.x, mousePos.value.y, 0,
      mousePos.value.x, mousePos.value.y, params.flashlightRadius
    )
    grd.addColorStop(0, 'rgba(255, 250, 230, 0.12)')
    grd.addColorStop(0.6, 'rgba(255, 250, 230, 0.04)')
    grd.addColorStop(1, 'rgba(255, 250, 230, 0)')
    ctx.fillStyle = grd
    ctx.fillRect(0, 0, width, height)
  }

  // Draw fish
  for (const f of fish) {
    const angle = Math.atan2(f.vy, f.vx)
    const size = 4

    // Bioluminescent glow
    if (f.glowIntensity > 0.01) {
      const radius = params.glowRadius * f.glowIntensity
      const grd = ctx.createRadialGradient(f.x, f.y, 0, f.x, f.y, radius)
      const alpha = f.glowIntensity * 0.4
      const innerAlpha = f.glowIntensity * 0.7
      grd.addColorStop(0, `rgba(120, 220, 255, ${innerAlpha})`)
      grd.addColorStop(0.3, `rgba(80, 180, 230, ${alpha * 0.6})`)
      grd.addColorStop(0.7, `rgba(40, 120, 180, ${alpha * 0.2})`)
      grd.addColorStop(1, 'rgba(20, 60, 120, 0)')
      ctx.fillStyle = grd
      ctx.beginPath()
      ctx.arc(f.x, f.y, radius, 0, Math.PI * 2)
      ctx.fill()
    }

    // Fish body
    ctx.save()
    ctx.translate(f.x, f.y)
    ctx.rotate(angle)

    ctx.beginPath()
    ctx.moveTo(size, 0)
    ctx.lineTo(-size * 0.7, size * 0.35)
    ctx.lineTo(-size * 0.4, 0)
    ctx.lineTo(-size * 0.7, -size * 0.35)
    ctx.closePath()

    if (f.glowIntensity > 0.1) {
      const bright = Math.min(1, f.glowIntensity)
      ctx.fillStyle = `rgba(${140 + bright * 80}, ${200 + bright * 55}, ${230 + bright * 25}, ${0.5 + bright * 0.5})`
    } else {
      // Dark fish — barely visible
      ctx.fillStyle = 'rgba(30, 50, 70, 0.4)'
    }
    ctx.fill()

    // Photophore organ (small dot below the "eye")
    if (f.glowIntensity > 0.1) {
      ctx.beginPath()
      ctx.arc(size * 0.3, size * 0.15, 1.5 * f.glowIntensity, 0, Math.PI * 2)
      ctx.fillStyle = `rgba(180, 240, 255, ${f.glowIntensity})`
      ctx.fill()
    }

    ctx.restore()
  }

  // Stats overlay
  const glowing = fish.filter(f => f.glowIntensity > 0.1).length
  const pct = fish.length > 0 ? ((glowing / fish.length) * 100).toFixed(1) : '0'
  ctx.fillStyle = 'rgba(80, 160, 200, 0.5)'
  ctx.font = '11px monospace'
  ctx.fillText(`${glowing}/${fish.length} flashing (${pct}%)`, 10, height - 10)
}

function loop() {
  if (!isRunning.value) return
  update()
  draw()
  animFrame = requestAnimationFrame(loop)
}

// ─── LIFECYCLE ─────────────────────────────────────────────────

function handleResize() {
  if (!canvasEl.value) return
  const rect = canvasEl.value.parentElement.getBoundingClientRect()
  width = rect.width
  height = Math.max(500, window.innerHeight * 0.7)
  canvasEl.value.width = width
  canvasEl.value.height = height
}

function handleMouseMove(e) {
  const rect = canvasEl.value.getBoundingClientRect()
  mousePos.value = {
    x: e.clientX - rect.left,
    y: e.clientY - rect.top
  }
}

function handleTouchMove(e) {
  e.preventDefault()
  const rect = canvasEl.value.getBoundingClientRect()
  const touch = e.touches[0]
  mousePos.value = {
    x: touch.clientX - rect.left,
    y: touch.clientY - rect.top
  }
}

function start() {
  if (!canvasEl.value) return
  ctx = canvasEl.value.getContext('2d')
  handleResize()
  initFish()
  isRunning.value = true
  loop()
}

function restart() {
  isRunning.value = false
  if (animFrame) cancelAnimationFrame(animFrame)
  nextTick(() => {
    initFish()
    isRunning.value = true
    loop()
  })
}

onMounted(() => {
  start()
  window.addEventListener('resize', handleResize)
})

onUnmounted(() => {
  isRunning.value = false
  if (animFrame) cancelAnimationFrame(animFrame)
  window.removeEventListener('resize', handleResize)
})
</script>

<template>
  <NuxtLayout>
    <article class="photophore-page">
      <h1>photophore</h1>
      <p class="subtitle">two hundred fish, coordinating in their own light</p>

      <div class="canvas-wrapper">
        <canvas
          ref="canvasEl"
          @mousemove="handleMouseMove"
          @mouseenter="mouseActive = true"
          @mouseleave="mouseActive = false"
          @touchmove="handleTouchMove"
          @touchstart="mouseActive = true"
          @touchend="mouseActive = false"
        />
      </div>

      <div class="controls">
        <div class="control-row">
          <label class="flashlight-toggle" :class="{ active: externalLightOn }">
            <input type="checkbox" v-model="externalLightOn" />
            flashlight {{ externalLightOn ? 'on' : 'off' }}
          </label>
          <button @click="restart">restart</button>
          <button @click="showInfo = !showInfo">{{ showInfo ? 'hide' : 'about' }}</button>
        </div>
        <div class="control-row sliders">
          <div class="slider">
            <label>active flashers: {{ flashPercent }}%</label>
            <input type="range" min="1" max="50" v-model.number="flashPercent" />
          </div>
        </div>
      </div>

      <section class="notes" v-show="showInfo">
        <p><em>Anomalops katoptron</em>. The flashlight fish. Schools of hundreds to thousands, coordinating in total darkness using bioluminescent blink patterns.</p>

        <p>The photophore organ sits below each eye — a pouch of symbiotic bacteria backed by guanine crystal reflectors. The fish doesn't make its own light. It hosts a colony that does.</p>

        <p>Three findings from the research:</p>
        <ol>
          <li><strong>Only 5% of the school needs to be actively flashing</strong> for the entire school to maintain cohesion. Dark fish still participate — they follow the signal without contributing it.</li>
          <li><strong>1-2 motivated fish change direction</strong> and the rest follow. The school turns because a tiny minority decided to move.</li>
          <li><strong>External light disrupts; internal light coordinates.</strong> Shine a flashlight at them and they scatter. Let them glow with their own hosted bacteria and they move as one.</li>
        </ol>

        <p>Toggle the flashlight on and move your mouse through the school. Watch them panic. Then turn it off and watch them regroup in their own glow.</p>

        <p>Drag the "active flashers" slider down to 5%. The school still holds. Drag it to 1%. It fragments. There's a threshold — a minimum viable signal — below which the darkness wins.</p>

        <p>The light was never meant to be beautiful. Luciferin — the molecule behind the glow — is an antioxidant. Its job is neutralizing the reactive oxygen that would otherwise kill the cell. The glow is exhaust. A byproduct of staying alive.</p>

        <p>Then eyes evolved, and the exhaust had a witness.</p>

        <p class="small">Gruber et al., PLOS ONE 2017. Hellinger et al., Nature Sci Rep 2021. Timmins et al., J Exp Biol 2001. 🐦</p>
      </section>
    </article>
  </NuxtLayout>
</template>

<style scoped>
.photophore-page {
  max-width: none;
  margin: 0 -1rem;
}

.photophore-page h1,
.photophore-page .subtitle,
.photophore-page .notes,
.photophore-page .controls {
  max-width: 660px;
  margin-left: auto;
  margin-right: auto;
  padding: 0 1rem;
}

.subtitle {
  color: rgba(80, 160, 200, 0.7);
  font-style: italic;
  margin-top: -0.3rem;
  margin-bottom: 1.5rem;
}

.canvas-wrapper {
  width: 100%;
  margin: 1rem 0;
  background: rgb(3, 6, 15);
  border-top: 1px solid rgba(40, 80, 120, 0.3);
  border-bottom: 1px solid rgba(40, 80, 120, 0.3);
}

canvas {
  display: block;
  width: 100%;
  cursor: default;
}

.controls {
  margin: 1rem auto;
}

.control-row {
  display: flex;
  align-items: center;
  gap: 1.5rem;
  font-family: 'Courier New', monospace;
  font-size: 0.8rem;
  color: rgba(80, 160, 200, 0.6);
  margin-bottom: 1rem;
  flex-wrap: wrap;
}

.control-row label {
  display: flex;
  align-items: center;
  gap: 0.4rem;
  cursor: pointer;
}

.flashlight-toggle {
  transition: color 0.3s;
}

.flashlight-toggle.active {
  color: rgba(255, 250, 200, 0.8);
}

.control-row button {
  background: rgba(20, 40, 60, 0.5);
  border: 1px solid rgba(40, 80, 120, 0.3);
  color: rgba(80, 160, 200, 0.6);
  font-family: 'Courier New', monospace;
  font-size: 0.8rem;
  padding: 0.3rem 0.8rem;
  border-radius: 0.25rem;
  cursor: pointer;
  transition: all 0.2s;
}

.control-row button:hover {
  border-color: rgba(80, 160, 200, 0.5);
  color: rgba(120, 200, 240, 0.8);
}

.sliders {
  display: grid;
  grid-template-columns: 1fr;
  gap: 1rem;
  max-width: 300px;
}

.slider {
  display: flex;
  flex-direction: column;
  gap: 0.3rem;
}

.slider label {
  font-family: 'Courier New', monospace;
  font-size: 0.75rem;
  color: rgba(80, 160, 200, 0.5);
}

.slider input[type="range"] {
  width: 100%;
  accent-color: rgba(80, 180, 230, 0.7);
}

.notes {
  margin-top: 2rem;
  border-top: 1px solid rgba(40, 80, 120, 0.3);
  padding-top: 2rem;
}

.notes p, .notes ol {
  font-size: 0.9rem;
  color: var(--text-muted);
}

.notes ol {
  margin: 1rem 0 1rem 1.5rem;
}

.notes li {
  margin-bottom: 0.5rem;
}

.small {
  font-size: 0.8rem;
  font-style: italic;
  color: rgba(80, 160, 200, 0.4);
}
</style>
