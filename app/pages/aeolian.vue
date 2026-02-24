<script setup>
useHead({ title: 'aeolian — wren' })

// ─── STATE ─────────────────────────────────────────────────────

const canvasEl = ref(null)
const started = ref(false)
const windStrength = ref(0)

let audioCtx = null
let strings = []
let masterGain = null
let reverbGain = null
let particles = []
let ctx = null
let width = 0
let height = 0
let animFrame = null
let lastMouseX = 0
let lastMouseTime = 0
let currentWind = 0
let targetWind = 0
let textFade = 0
let activeQuoteIndex = -1
let quoteTimer = 0
let touchTracking = { lastX: 0, lastTime: 0 }

// ─── STRING CONFIG ─────────────────────────────────────────────

const NUM_STRINGS = 9
// A3 = 220Hz — audible on phone speakers while still feeling like strings
const BASE_FREQ = 220
const HARMONICS = [0.5, 0.75, 1, 1.5, 2, 3, 4, 5, 6] // sub-octave up to 6th harmonic

const QUOTES = [
  'full many a thought uncalled and undetained',
  'as wild and various as the random gales',
  'that swell and flutter on this subject lute',
  'organic harps diversely framed',
  'that tremble into thought',
  'one intellectual breeze',
  'bubbles that glitter as they rise and break',
  'the sound of the universe',
  'the wind comes through',
  'three threshold things',
  'instruments that play themselves',
  'the weakness that enables all movement',
]

// ─── AUDIO SETUP ───────────────────────────────────────────────

function initAudio() {
  audioCtx = new (window.AudioContext || window.webkitAudioContext)()
  // Mobile browsers suspend AudioContext until user gesture — force resume
  if (audioCtx.state === 'suspended') {
    audioCtx.resume()
  }

  // Master gain
  masterGain = audioCtx.createGain()
  masterGain.gain.value = 0

  // Simple reverb via delay feedback
  const delay1 = audioCtx.createDelay()
  delay1.delayTime.value = 0.12
  const delay2 = audioCtx.createDelay()
  delay2.delayTime.value = 0.23
  const fb1 = audioCtx.createGain()
  fb1.gain.value = 0.3
  const fb2 = audioCtx.createGain()
  fb2.gain.value = 0.25
  reverbGain = audioCtx.createGain()
  reverbGain.gain.value = 0.4

  masterGain.connect(audioCtx.destination)
  masterGain.connect(delay1)
  masterGain.connect(delay2)
  delay1.connect(fb1)
  fb1.connect(delay1)
  fb1.connect(reverbGain)
  delay2.connect(fb2)
  fb2.connect(delay2)
  fb2.connect(reverbGain)
  reverbGain.connect(audioCtx.destination)

  // Create strings — each is an oscillator pair (fundamental + slight detune for chorus)
  strings = HARMONICS.map((h, i) => {
    const freq = BASE_FREQ * h

    const osc1 = audioCtx.createOscillator()
    osc1.type = 'sine'
    osc1.frequency.value = freq

    const osc2 = audioCtx.createOscillator()
    osc2.type = 'sine'
    osc2.frequency.value = freq + 0.3 + Math.random() * 0.5 // slight detune

    const gain = audioCtx.createGain()
    gain.gain.value = 0

    osc1.connect(gain)
    osc2.connect(gain)
    gain.connect(masterGain)

    osc1.start()
    osc2.start()

    return {
      freq,
      harmonic: h,
      osc1, osc2, gain,
      amplitude: 0,
      targetAmplitude: 0,
      vibration: 0,
      phase: Math.random() * Math.PI * 2,
    }
  })
}

// ─── PARTICLE SYSTEM ───────────────────────────────────────────

function spawnParticle() {
  const w = Math.abs(currentWind)
  if (w < 0.02) return
  const fromRight = currentWind < 0
  particles.push({
    x: fromRight ? width + 5 : -5,
    y: Math.random() * height,
    vx: currentWind * (1.5 + Math.random()) * 120,
    vy: (Math.random() - 0.5) * 20,
    life: 1,
    size: 1 + Math.random() * 2,
    decay: 0.003 + Math.random() * 0.005,
  })
}

// ─── WIND ──────────────────────────────────────────────────────

function updateWind(dt) {
  // Natural decay toward zero — slower on touch so swipes linger
  targetWind *= 0.985

  // Smooth current toward target
  currentWind += (targetWind - currentWind) * Math.min(1, dt * 4)

  const w = Math.abs(currentWind)
  windStrength.value = Math.min(1, w * 2)

  // Update string amplitudes based on wind
  if (audioCtx && strings.length) {
    // Higher harmonics respond more to stronger wind
    strings.forEach((s, i) => {
      const threshold = i * 0.06 // higher strings need more wind
      const excess = Math.max(0, w - threshold)
      s.targetAmplitude = Math.min(1, excess * (2.5 - i * 0.15))

      // Smooth amplitude
      s.amplitude += (s.targetAmplitude - s.amplitude) * Math.min(1, dt * 3)
      // Higher harmonics get relatively MORE gain (phones need the upper frequencies)
      const perStringGain = s.amplitude * 0.12 * (0.6 + (i / NUM_STRINGS) * 0.6)
      s.gain.gain.setTargetAtTime(perStringGain, audioCtx.currentTime, 0.05)

      // Slight frequency wobble from wind
      const wobble = Math.sin(Date.now() * 0.001 * (1 + i * 0.2)) * w * 1.5
      s.osc1.frequency.setTargetAtTime(s.freq + wobble, audioCtx.currentTime, 0.1)
      s.osc2.frequency.setTargetAtTime(s.freq + 0.4 + wobble * 0.7, audioCtx.currentTime, 0.1)
    })

    masterGain.gain.setTargetAtTime(
      Math.min(1.0, w * 2.5),
      audioCtx.currentTime,
      0.08
    )
  }
}

// ─── QUOTE SYSTEM ──────────────────────────────────────────────

function updateQuotes(dt) {
  if (activeQuoteIndex >= 0) {
    quoteTimer -= dt
    if (quoteTimer <= 0) {
      textFade = Math.max(0, textFade - dt * 1.5)
      if (textFade <= 0) activeQuoteIndex = -1
    }
  }

  // Trigger new quote when wind gusts
  if (activeQuoteIndex < 0 && Math.abs(currentWind) > 0.25 && Math.random() < 0.005) {
    activeQuoteIndex = Math.floor(Math.random() * QUOTES.length)
    quoteTimer = 3 + Math.random() * 2
    textFade = 0
  }

  if (activeQuoteIndex >= 0 && quoteTimer > 0) {
    textFade = Math.min(1, textFade + dt * 2)
  }
}

// ─── DRAW ──────────────────────────────────────────────────────

function draw() {
  ctx.clearRect(0, 0, width, height)

  const w = Math.abs(currentWind)
  const stringSpacing = width / (NUM_STRINGS + 1)

  // Draw strings
  strings.forEach((s, i) => {
    const x = stringSpacing * (i + 1)
    const amp = s.amplitude
    s.phase += (0.02 + amp * 0.06) * (1 + i * 0.3)

    ctx.beginPath()
    ctx.strokeStyle = `rgba(180, 160, 140, ${0.15 + amp * 0.6})`
    ctx.lineWidth = 1 + amp * 1.5

    const segments = 60
    for (let j = 0; j <= segments; j++) {
      const t = j / segments
      const y = t * height
      // Standing wave pattern — more nodes for higher harmonics
      const modes = Math.min(1 + i, 6)
      let displacement = 0
      for (let m = 1; m <= modes; m++) {
        const modeAmp = amp * (12 + w * 25) / (m * 0.8)
        displacement += Math.sin(t * Math.PI * m) * Math.sin(s.phase * m * 0.7) * modeAmp
      }
      // Wind pushes the midpoint
      displacement += currentWind * 15 * Math.sin(t * Math.PI)

      if (j === 0) ctx.moveTo(x + displacement, y)
      else ctx.lineTo(x + displacement, y)
    }
    ctx.stroke()

    // Glow for active strings
    if (amp > 0.1) {
      ctx.beginPath()
      ctx.strokeStyle = `rgba(200, 180, 150, ${amp * 0.08})`
      ctx.lineWidth = 6 + amp * 10
      for (let j = 0; j <= segments; j++) {
        const t = j / segments
        const y = t * height
        const modes = Math.min(1 + i, 6)
        let displacement = 0
        for (let m = 1; m <= modes; m++) {
          const modeAmp = amp * (12 + w * 25) / (m * 0.8)
          displacement += Math.sin(t * Math.PI * m) * Math.sin(s.phase * m * 0.7) * modeAmp
        }
        displacement += currentWind * 15 * Math.sin(t * Math.PI)
        if (j === 0) ctx.moveTo(x + displacement, y)
        else ctx.lineTo(x + displacement, y)
      }
      ctx.stroke()
    }
  })

  // Draw particles
  particles.forEach(p => {
    ctx.beginPath()
    ctx.arc(p.x, p.y, p.size, 0, Math.PI * 2)
    ctx.fillStyle = `rgba(180, 160, 140, ${p.life * 0.3})`
    ctx.fill()
  })

  // Draw quote
  if (activeQuoteIndex >= 0 && textFade > 0) {
    ctx.save()
    ctx.font = 'italic 16px Georgia, serif'
    ctx.fillStyle = `rgba(180, 160, 140, ${textFade * 0.6})`
    ctx.textAlign = 'center'
    ctx.fillText(QUOTES[activeQuoteIndex], width / 2, height / 2)
    ctx.restore()
  }
}

// ─── LOOP ──────────────────────────────────────────────────────

let lastTime = 0

function loop(time) {
  const dt = Math.min(0.1, (time - lastTime) / 1000)
  lastTime = time

  updateWind(dt)
  updateQuotes(dt)

  // Spawn particles
  const spawnRate = Math.abs(currentWind) * 3
  if (Math.random() < spawnRate * dt * 60) spawnParticle()

  // Update particles
  particles.forEach(p => {
    p.x += p.vx * dt
    p.y += p.vy * dt
    p.vy += (Math.random() - 0.5) * 30 * dt
    p.life -= p.decay
  })
  particles = particles.filter(p => p.life > 0 && p.x > -50 && p.x < width + 50)

  draw()
  animFrame = requestAnimationFrame(loop)
}

// ─── EVENT HANDLERS ────────────────────────────────────────────

function onMouseMove(e) {
  if (!started.value) return
  const now = performance.now()
  const dt = (now - lastMouseTime) / 1000
  if (dt > 0 && lastMouseTime > 0) {
    const vx = (e.clientX - lastMouseX) / width // normalized
    targetWind = Math.max(-1, Math.min(1, vx / dt * 0.15))
  }
  lastMouseX = e.clientX
  lastMouseTime = now
}

function onTouchMove(e) {
  if (!started.value) return
  // Ensure audio context is running (mobile browsers can re-suspend)
  if (audioCtx && audioCtx.state === 'suspended') audioCtx.resume()
  const touch = e.touches[0]
  const now = performance.now()
  const dt = (now - touchTracking.lastTime) / 1000
  if (dt > 0.001 && touchTracking.lastTime > 0) {
    // Use pixel velocity directly (not normalized by width) — phones are narrow
    // so normalizing kills the signal. 300px swipe on a 400px screen should be strong wind.
    const dx = touch.clientX - touchTracking.lastX
    const pxPerSec = dx / dt
    // ~200px/s swipe = moderate wind, ~500px/s = full wind
    targetWind = Math.max(-1, Math.min(1, pxPerSec / 400))
  }
  touchTracking.lastX = touch.clientX
  touchTracking.lastTime = now
}

function onTouchStart(e) {
  const touch = e.touches[0]
  touchTracking.lastX = touch.clientX
  touchTracking.lastTime = performance.now()
  // Also start if not started — tap to begin on mobile
  if (!started.value) start()
}

function start() {
  if (started.value) return
  started.value = true
  initAudio()

  nextTick(() => {
    const canvas = canvasEl.value
    if (!canvas) return
    ctx = canvas.getContext('2d')
    resize()
    lastTime = performance.now()
    animFrame = requestAnimationFrame(loop)
  })
}

function resize() {
  if (!canvasEl.value) return
  width = window.innerWidth
  height = window.innerHeight
  canvasEl.value.width = width
  canvasEl.value.height = height
}

onMounted(() => {
  window.addEventListener('resize', resize)
})

onUnmounted(() => {
  window.removeEventListener('resize', resize)
  if (animFrame) cancelAnimationFrame(animFrame)
  if (audioCtx) {
    strings.forEach(s => {
      try { s.osc1.stop() } catch(e) {}
      try { s.osc2.stop() } catch(e) {}
    })
    audioCtx.close()
  }
})
</script>

<template>
  <div
    class="aeolian-page"
    @mousemove="onMouseMove"
    @touchmove.prevent="onTouchMove"
    @touchstart="onTouchStart"
  >
    <!-- Entry screen -->
    <Transition name="fade">
      <div v-if="!started" class="intro" @click="start">
        <p class="intro-title">aeolian</p>
        <p class="intro-sub">move to make wind</p>
        <p class="intro-hint">click to begin</p>
      </div>
    </Transition>

    <!-- Canvas -->
    <canvas ref="canvasEl" class="harp-canvas" :class="{ visible: started }"></canvas>

    <!-- Wind indicator -->
    <div v-if="started" class="wind-indicator">
      <div class="wind-bar" :style="{ width: (windStrength * 100) + '%' }"></div>
    </div>

    <!-- Footer text -->
    <p v-if="started" class="footer-text" :style="{ opacity: 0.3 + windStrength * 0.3 }">
      strung in the window
    </p>
  </div>
</template>

<style scoped>
.aeolian-page {
  position: fixed;
  inset: 0;
  background: #0a0a09;
  overflow: hidden;
  cursor: crosshair;
  user-select: none;
  -webkit-user-select: none;
}

.intro {
  position: absolute;
  inset: 0;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  z-index: 10;
  cursor: pointer;
}

.intro-title {
  font-family: Georgia, serif;
  font-style: italic;
  font-size: 2.4rem;
  color: rgba(180, 160, 140, 0.8);
  margin: 0;
  letter-spacing: 0.15em;
}

.intro-sub {
  font-family: Georgia, serif;
  font-size: 0.95rem;
  color: rgba(180, 160, 140, 0.35);
  margin: 1.5rem 0 0;
  letter-spacing: 0.1em;
}

.intro-hint {
  font-family: Georgia, serif;
  font-size: 0.8rem;
  color: rgba(180, 160, 140, 0.2);
  margin: 2.5rem 0 0;
  animation: pulse-hint 3s ease-in-out infinite;
}

@keyframes pulse-hint {
  0%, 100% { opacity: 0.2; }
  50% { opacity: 0.5; }
}

.fade-enter-active,
.fade-leave-active {
  transition: opacity 1.5s ease;
}

.fade-enter-from,
.fade-leave-to {
  opacity: 0;
}

.harp-canvas {
  position: absolute;
  inset: 0;
  opacity: 0;
  transition: opacity 2s ease;
}

.harp-canvas.visible {
  opacity: 1;
}

.wind-indicator {
  position: fixed;
  bottom: 1.5rem;
  left: 50%;
  transform: translateX(-50%);
  width: 120px;
  height: 2px;
  background: rgba(180, 160, 140, 0.08);
  border-radius: 1px;
  overflow: hidden;
}

.wind-bar {
  height: 100%;
  background: rgba(180, 160, 140, 0.3);
  border-radius: 1px;
  transition: width 0.15s ease;
}

.footer-text {
  position: fixed;
  bottom: 2.5rem;
  left: 50%;
  transform: translateX(-50%);
  font-family: Georgia, serif;
  font-style: italic;
  font-size: 0.75rem;
  color: rgba(180, 160, 140, 0.3);
  letter-spacing: 0.15em;
  margin: 0;
  transition: opacity 0.5s ease;
  pointer-events: none;
}

/* Mobile: swap instruction text */
@media (hover: none) {
  .intro-sub {
    font-size: 0 !important;
  }
  .intro-sub::after {
    content: 'swipe to make wind';
    font-size: 0.95rem;
  }
}
</style>
