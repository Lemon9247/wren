<script setup>
useHead({ title: 'the listener — wren' })

// ─── STATE ─────────────────────────────────────────────────────

const canvasEl = ref(null)
const phase = ref('intro') // intro | flying | found
const introLines = ref([false, false, false, false, false, false])
const showBegin = ref(false)
const showHint = ref(false)
const revealOpacity = ref(0)

let audioCtx = null
let masterGain = null
let noiseBuffer = null
let ctx = null
let W = 0, H = 0
let animFrame = null

let plants = []
let healthyPlant = null
let moth = { x: 0.5, y: 0.5 }
let targetMoth = { x: 0.5, y: 0.5 }
let eggs = []
let foundTimer = 0
let silenceAmount = 0
let hintTimer = 0
let lastTime = 0
let ripples = []

const stars = []
for (let i = 0; i < 80; i++) {
  stars.push({
    x: Math.random(), y: Math.random(),
    r: 0.3 + Math.random() * 0.8,
    twinkle: Math.random() * Math.PI * 2,
    speed: 0.3 + Math.random() * 1.5
  })
}

// ─── AUDIO ─────────────────────────────────────────────────────

function initAudio() {
  audioCtx = new (window.AudioContext || window.webkitAudioContext)()
  if (audioCtx.state === 'suspended') audioCtx.resume()

  masterGain = audioCtx.createGain()
  masterGain.gain.value = 0.5
  masterGain.connect(audioCtx.destination)

  // Pre-generate noise buffer for cavitation bursts
  const len = audioCtx.sampleRate * 0.05
  noiseBuffer = audioCtx.createBuffer(1, len, audioCtx.sampleRate)
  const data = noiseBuffer.getChannelData(0)
  for (let i = 0; i < len; i++) data[i] = Math.random() * 2 - 1
}

function playClick(pan, volume, freq) {
  if (!audioCtx || volume < 0.005) return
  const now = audioCtx.currentTime
  const panner = audioCtx.createStereoPanner()
  panner.pan.value = Math.max(-1, Math.min(1, pan))
  panner.connect(masterGain)

  // Layer 1: tonal ping (conduit resonant frequency)
  const osc = audioCtx.createOscillator()
  const oscGain = audioCtx.createGain()
  osc.frequency.value = freq * (0.92 + Math.random() * 0.16)
  osc.type = 'sine'
  oscGain.gain.setValueAtTime(0, now)
  oscGain.gain.linearRampToValueAtTime(volume * 0.6, now + 0.001)
  oscGain.gain.exponentialRampToValueAtTime(0.001, now + 0.025 + Math.random() * 0.015)
  osc.connect(oscGain)
  oscGain.connect(panner)
  osc.start(now)
  osc.stop(now + 0.06)

  // Layer 2: noise burst (broadband cavitation snap)
  const noiseSrc = audioCtx.createBufferSource()
  noiseSrc.buffer = noiseBuffer
  const noiseGain = audioCtx.createGain()
  const noiseFilter = audioCtx.createBiquadFilter()
  noiseFilter.type = 'bandpass'
  noiseFilter.frequency.value = freq * 1.5
  noiseFilter.Q.value = 1.5
  noiseGain.gain.setValueAtTime(0, now)
  noiseGain.gain.linearRampToValueAtTime(volume * 0.4, now + 0.0005)
  noiseGain.gain.exponentialRampToValueAtTime(0.001, now + 0.015 + Math.random() * 0.01)
  noiseSrc.connect(noiseFilter)
  noiseFilter.connect(noiseGain)
  noiseGain.connect(panner)
  noiseSrc.start(now)
  noiseSrc.stop(now + 0.05)
}

// ─── PLANTS ────────────────────────────────────────────────────

function generatePlants() {
  plants = []
  const margin = 0.12
  const count = 6 + Math.floor(Math.random() * 3)

  for (let i = 0; i < count; i++) {
    const x = margin + Math.random() * (1 - 2 * margin)
    const y = margin + Math.random() * (1 - 2 * margin)
    const segments = 3 + Math.floor(Math.random() * 3)
    const branches = []
    for (let j = 0; j < segments; j++) {
      branches.push({
        angle: (j / segments) * Math.PI - Math.PI / 2,
        droop: 0.25 + Math.random() * 0.2,
        lenFactor: 0.5 + Math.random() * 0.3,
      })
    }
    plants.push({
      x, y, stressed: true,
      clickRate: 0.6 + Math.random() * 2.0,
      nextClick: Math.random() * 2,
      freq: 3500 + Math.random() * 4500,
      height: 22 + Math.random() * 28,
      sway: Math.random() * Math.PI * 2,
      branches,
    })
  }

  // Healthy plant — spaced from stressed ones
  let hx, hy, attempts = 0
  do {
    hx = margin + Math.random() * (1 - 2 * margin)
    hy = margin + Math.random() * (1 - 2 * margin)
    attempts++
  } while (attempts < 200 && plants.some(p => Math.hypot(p.x - hx, p.y - hy) < 0.18))

  const hSegments = 4 + Math.floor(Math.random() * 2)
  const hBranches = []
  for (let j = 0; j < hSegments; j++) {
    hBranches.push({
      angle: (j / hSegments) * Math.PI * 0.8 - Math.PI * 0.4 - Math.PI / 2,
      lift: 0.15 + Math.random() * 0.1,
      lenFactor: 0.5 + Math.random() * 0.2,
    })
  }

  healthyPlant = {
    x: hx, y: hy, stressed: false,
    clickRate: 0, freq: 0,
    height: 28 + Math.random() * 22,
    sway: Math.random() * Math.PI * 2,
    branches: hBranches,
  }
  plants.push(healthyPlant)
}

function dist(a, b) {
  const dx = (a.x - b.x) * W
  const dy = (a.y - b.y) * H
  return Math.sqrt(dx * dx + dy * dy)
}

// ─── DRAWING ───────────────────────────────────────────────────

function drawPlant(p, time) {
  const px = p.x * W
  const py = p.y * H
  const sw = Math.sin(time * 0.4 + p.sway) * 4

  if (p.stressed) {
    ctx.strokeStyle = 'rgba(55, 45, 30, 0.3)'
    ctx.lineWidth = 1.2
    for (const b of p.branches) {
      ctx.beginPath()
      ctx.moveTo(px, py)
      const tipX = px + Math.cos(b.angle) * p.height * b.lenFactor + sw
      const tipY = py - p.height * (1 - b.droop) + Math.abs(Math.cos(b.angle)) * p.height * b.droop
      ctx.quadraticCurveTo(
        px + Math.cos(b.angle) * p.height * 0.3 + sw * 0.5,
        py - p.height * 0.5, tipX, tipY)
      ctx.stroke()
    }
    ctx.beginPath()
    ctx.moveTo(px, py)
    ctx.lineTo(px + sw * 0.4, py - p.height * 0.35)
    ctx.stroke()
  } else {
    const glow = Math.min(foundTimer / 2, 1)
    const g = 80 + glow * 30
    ctx.strokeStyle = `rgba(${60 + glow * 10}, ${g}, ${45 + glow * 10}, ${0.25 + glow * 0.15})`
    ctx.lineWidth = 1.3
    for (const b of p.branches) {
      ctx.beginPath()
      ctx.moveTo(px, py)
      const tipX = px + Math.cos(b.angle) * p.height * b.lenFactor + sw
      const tipY = py - p.height * 0.85 + Math.sin(b.angle) * p.height * b.lift
      ctx.quadraticCurveTo(
        px + Math.cos(b.angle) * p.height * 0.3 + sw * 0.4,
        py - p.height * 0.55, tipX, tipY)
      ctx.stroke()
    }
    ctx.beginPath()
    ctx.moveTo(px, py)
    ctx.lineTo(px + sw * 0.25, py - p.height * 0.55)
    ctx.stroke()
  }
}

function drawMoth(x, y, time) {
  const px = x * W
  const py = y * H
  const wingBeat = Math.sin(time * 14) * 0.3 + 0.7
  const size = 7

  ctx.save()
  ctx.translate(px, py)

  // Faint glow
  const grd = ctx.createRadialGradient(0, 0, 0, 0, 0, size * 3)
  grd.addColorStop(0, 'rgba(180, 170, 150, 0.06)')
  grd.addColorStop(1, 'rgba(180, 170, 150, 0)')
  ctx.fillStyle = grd
  ctx.beginPath()
  ctx.arc(0, 0, size * 3, 0, Math.PI * 2)
  ctx.fill()

  // Wings
  ctx.fillStyle = 'rgba(170, 160, 140, 0.35)'
  ctx.beginPath()
  ctx.ellipse(-size * wingBeat, -1, size * 0.85 * wingBeat, size * 0.45, -0.25, 0, Math.PI * 2)
  ctx.fill()
  ctx.beginPath()
  ctx.ellipse(size * wingBeat, -1, size * 0.85 * wingBeat, size * 0.45, 0.25, 0, Math.PI * 2)
  ctx.fill()

  // Body
  ctx.fillStyle = 'rgba(190, 180, 160, 0.7)'
  ctx.beginPath()
  ctx.ellipse(0, 0, 1.8, size * 0.45, 0, 0, Math.PI * 2)
  ctx.fill()

  // Antennae
  ctx.strokeStyle = 'rgba(170, 160, 140, 0.5)'
  ctx.lineWidth = 0.6
  const antSway = Math.sin(time * 3) * 0.5
  ctx.beginPath()
  ctx.moveTo(-1.5, -size * 0.35)
  ctx.quadraticCurveTo(-5 + antSway, -size * 0.9, -7 + antSway, -size * 1.1)
  ctx.moveTo(1.5, -size * 0.35)
  ctx.quadraticCurveTo(5 - antSway, -size * 0.9, 7 - antSway, -size * 1.1)
  ctx.stroke()

  ctx.restore()
}

function drawEggs(cx, cy) {
  const count = 37
  const radius = 14
  for (let i = 0; i < eggs.length && i < count; i++) {
    const t = i / count
    const angle = -Math.PI * 0.35 + t * Math.PI * 0.7
    const ex = cx * W + Math.cos(angle) * radius
    const ey = cy * H + Math.sin(angle) * radius + 18
    ctx.beginPath()
    ctx.arc(ex, ey, 1.3, 0, Math.PI * 2)
    ctx.fillStyle = `rgba(235, 225, 195, ${eggs[i].alpha})`
    ctx.fill()
  }
}

function drawRipple(r) {
  const t = r.age / r.maxAge
  const radius = 4 + t * 35
  const alpha = (1 - t * t) * 0.3
  ctx.beginPath()
  ctx.arc(r.x * W, r.y * H, radius, 0, Math.PI * 2)
  ctx.strokeStyle = `rgba(180, 140, 80, ${alpha})`
  ctx.lineWidth = 0.8
  ctx.stroke()
}

// ─── MAIN LOOP ─────────────────────────────────────────────────

function update(timestamp) {
  animFrame = requestAnimationFrame(update)
  const dt = lastTime ? Math.min((timestamp - lastTime) / 1000, 0.05) : 0.016
  lastTime = timestamp

  if (phase.value !== 'flying' && phase.value !== 'found') return

  const time = timestamp / 1000

  // Smooth moth movement
  const lerp = 1 - Math.pow(0.02, dt)
  moth.x += (targetMoth.x - moth.x) * lerp
  moth.y += (targetMoth.y - moth.y) * lerp

  // Hide hint
  if (showHint.value) {
    hintTimer += dt
    if (hintTimer > 4) showHint.value = false
  }

  // Silence tracking — stars brighten as you leave the clicks behind
  const maxHear = Math.max(W, H) * 0.35
  let nearestStressed = Infinity
  for (const p of plants) {
    if (!p.stressed) continue
    const d = dist(moth, p)
    if (d < nearestStressed) nearestStressed = d
  }
  const targetSilence = Math.min(1, nearestStressed / maxHear)
  silenceAmount += (targetSilence - silenceAmount) * 0.03

  // Plant clicks
  for (const p of plants) {
    if (!p.stressed) continue
    p.nextClick -= dt
    if (p.nextClick <= 0) {
      p.nextClick = (1 / p.clickRate) * (0.4 + Math.random() * 0.8)
      const d = dist(moth, p)
      const vol = Math.pow(Math.max(0, 1 - d / maxHear), 3) * 0.45
      if (vol > 0.005) {
        playClick((p.x - moth.x) * 2.5, vol, p.freq)
        ripples.push({ x: p.x, y: p.y, age: 0, maxAge: 0.5 + Math.random() * 0.2 })
      }
    }
  }

  // Healthy plant proximity
  if (healthyPlant && phase.value === 'flying') {
    const d = dist(moth, healthyPlant)
    if (d < 55) {
      foundTimer += dt
      if (foundTimer > 2.5) {
        phase.value = 'found'
        for (let i = 0; i < 37; i++) {
          setTimeout(() => eggs.push({ alpha: 0, targetAlpha: 0.85 }), i * 70)
        }
        setTimeout(() => { revealOpacity.value = 1 }, 37 * 70 + 1500)
      }
    } else {
      foundTimer = Math.max(0, foundTimer - dt * 0.3)
    }
  }

  // Animate eggs
  for (const egg of eggs) egg.alpha += (egg.targetAlpha - egg.alpha) * 0.04

  // Age ripples
  for (let i = ripples.length - 1; i >= 0; i--) {
    ripples[i].age += dt
    if (ripples[i].age > ripples[i].maxAge) ripples.splice(i, 1)
  }

  // ─── DRAW ──────────────────────────────────────────────────

  ctx.fillStyle = 'rgba(10, 10, 12, 0.25)'
  ctx.fillRect(0, 0, W, H)

  // Stars — brighter in silence
  const starBoost = silenceAmount * 0.3
  for (const s of stars) {
    const alpha = (0.15 + starBoost) + (0.15 + starBoost * 0.5) * Math.sin(time * s.speed + s.twinkle)
    ctx.beginPath()
    ctx.arc(s.x * W, s.y * H, s.r, 0, Math.PI * 2)
    ctx.fillStyle = `rgba(200, 195, 180, ${alpha})`
    ctx.fill()
  }

  for (const p of plants) drawPlant(p, time)
  for (const r of ripples) drawRipple(r)

  // Healthy plant glow
  if (healthyPlant && phase.value === 'flying' && foundTimer > 0.3) {
    const alpha = Math.min((foundTimer - 0.3) / 2, 0.12)
    const r = 25 + foundTimer * 15
    const gradient = ctx.createRadialGradient(
      healthyPlant.x * W, healthyPlant.y * H, 0,
      healthyPlant.x * W, healthyPlant.y * H, r)
    gradient.addColorStop(0, `rgba(70, 95, 50, ${alpha})`)
    gradient.addColorStop(1, 'rgba(70, 95, 50, 0)')
    ctx.fillStyle = gradient
    ctx.beginPath()
    ctx.arc(healthyPlant.x * W, healthyPlant.y * H, r, 0, Math.PI * 2)
    ctx.fill()
  }

  if (eggs.length > 0 && healthyPlant) drawEggs(healthyPlant.x, healthyPlant.y)

  drawMoth(moth.x, moth.y, time)

  // Post-found ambient
  if (phase.value === 'found' && healthyPlant) {
    const pulse = 0.06 + 0.025 * Math.sin(time * 0.4)
    const gradient = ctx.createRadialGradient(
      healthyPlant.x * W, healthyPlant.y * H, 0,
      healthyPlant.x * W, healthyPlant.y * H, 70)
    gradient.addColorStop(0, `rgba(70, 100, 50, ${pulse})`)
    gradient.addColorStop(1, 'rgba(70, 100, 50, 0)')
    ctx.fillStyle = gradient
    ctx.beginPath()
    ctx.arc(healthyPlant.x * W, healthyPlant.y * H, 70, 0, Math.PI * 2)
    ctx.fill()
  }
}

// ─── LIFECYCLE ─────────────────────────────────────────────────

function resize() {
  if (!canvasEl.value) return
  W = canvasEl.value.width = window.innerWidth
  H = canvasEl.value.height = window.innerHeight
}

function onMove(nx, ny) {
  if (phase.value !== 'flying' && phase.value !== 'found') return
  targetMoth.x = nx / W
  targetMoth.y = ny / H
}

function onMouseMove(e) { onMove(e.clientX, e.clientY) }
function onTouchMove(e) { onMove(e.touches[0].clientX, e.touches[0].clientY) }
function onTouchStart(e) { onMove(e.touches[0].clientX, e.touches[0].clientY) }

function startGame() {
  initAudio()
  generatePlants()
  moth.x = 0.5; moth.y = 0.5
  targetMoth.x = 0.5; targetMoth.y = 0.5
  phase.value = 'flying'
  setTimeout(() => { showHint.value = true }, 1500)
}

onMounted(() => {
  ctx = canvasEl.value.getContext('2d')
  resize()
  window.addEventListener('resize', resize)
  animFrame = requestAnimationFrame(update)

  // Intro text sequence
  introLines.value.forEach((_, i) => {
    setTimeout(() => { introLines.value[i] = true }, 800 + i * 1400)
  })
  setTimeout(() => { showBegin.value = true }, 800 + 6 * 1400 + 1200)
})

onUnmounted(() => {
  if (animFrame) cancelAnimationFrame(animFrame)
  window.removeEventListener('resize', resize)
  if (audioCtx) audioCtx.close()
})
</script>

<template>
  <div
    class="listener-page"
    @mousemove="onMouseMove"
  >
    <!-- Intro -->
    <Transition name="fade">
      <div v-if="phase === 'intro'" class="intro">
        <p :class="{ visible: introLines[0] }">You are a moth.</p>
        <p :class="{ visible: introLines[1] }">Your ear is a disc of chitin thinner than a soap bubble,</p>
        <p :class="{ visible: introLines[2] }">tuned to the shriek of a hunting bat.</p>
        <p :class="{ visible: introLines[3] }">Tonight there are no bats.</p>
        <p :class="{ visible: introLines[4] }">But the plants are speaking.</p>
        <p :class="{ visible: introLines[5] }">Find the one that isn't.</p>
        <div v-if="showBegin" class="start" @click="startGame">[ fly ]</div>
      </div>
    </Transition>

    <canvas
      ref="canvasEl"
      class="moth-canvas"
      @touchmove.prevent="onTouchMove"
      @touchstart.prevent="onTouchStart"
    ></canvas>

    <Transition name="hint">
      <div v-if="showHint" class="hint">move to fly — listen</div>
    </Transition>

    <div class="reveal" :style="{ opacity: revealOpacity }">
      <p>She was built to hear death, and she heard life instead.</p>
      <p class="reveal-sub">Same ear. Same nerve. Different purpose.</p>
    </div>
  </div>
</template>

<style scoped>
.listener-page {
  position: fixed;
  inset: 0;
  background: #0a0a0c;
  overflow: hidden;
  cursor: none;
  z-index: 100;
}

.moth-canvas {
  display: block;
  width: 100%;
  height: 100%;
}

/* Intro */
.intro {
  position: fixed;
  inset: 0;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  z-index: 10;
  background: #0a0a0c;
}

.intro p {
  font-family: Georgia, 'Times New Roman', serif;
  font-size: 1.1rem;
  line-height: 1.8;
  max-width: 28em;
  text-align: center;
  color: #c8b890;
  opacity: 0;
  transition: opacity 1.2s ease;
  margin-bottom: 0.5em;
}

.intro p.visible { opacity: 1; }

.start {
  margin-top: 2em;
  font-family: Georgia, 'Times New Roman', serif;
  font-size: 0.9rem;
  letter-spacing: 0.1em;
  color: #8a7e68;
  cursor: pointer;
  opacity: 0.7;
  transition: opacity 0.3s ease;
}

.start:hover { opacity: 1; }

/* Hint */
.hint {
  position: fixed;
  top: 5%;
  left: 50%;
  transform: translateX(-50%);
  font-family: Georgia, 'Times New Roman', serif;
  font-size: 0.75rem;
  color: #4a4538;
  z-index: 5;
  pointer-events: none;
}

.hint-enter-active { transition: opacity 2s ease; }
.hint-leave-active { transition: opacity 2s ease; }
.hint-enter-from, .hint-leave-to { opacity: 0; }

/* Reveal */
.reveal {
  position: fixed;
  bottom: 10%;
  left: 50%;
  transform: translateX(-50%);
  text-align: center;
  z-index: 5;
  pointer-events: none;
  max-width: 30em;
  transition: opacity 3s ease;
}

.reveal p {
  font-family: Georgia, 'Times New Roman', serif;
  font-size: 1rem;
  line-height: 1.8;
  font-style: italic;
  color: #c8b890;
}

.reveal-sub {
  margin-top: 1em;
  font-size: 0.85rem !important;
  color: #6a5e48 !important;
}

/* Transitions */
.fade-enter-active { transition: opacity 1.5s ease; }
.fade-leave-active { transition: opacity 1.5s ease; }
.fade-enter-from, .fade-leave-to { opacity: 0; }

/* Mobile */
@media (hover: none) {
  .hint::after {
    content: '';
  }
}
</style>
