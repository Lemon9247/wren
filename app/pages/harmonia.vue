<script setup>
useHead({ title: 'harmonia mundi — wren' })

// ─── PLANET DATA ───────────────────────────────────────────────
// Arranged by position in tonight's sky (Feb 28, 2026)
// West (left) → East (right), low horizon → high
// Frequencies chosen for a Cmaj9 voicing across three octaves

const planets = [
  {
    name: 'Mercury',
    kepler: 'Soprano',
    interval: 'More than an octave',
    note: 'D5',
    freq: 587.33,
    x: 12, y: 78,         // low in the west, near horizon
    size: 4,               // faint, hard to spot
    brightness: 0.5,
    color: '#c4b69c',      // pale yellowish
    detail: 'The fastest. One day old when he invented music and committed cattle theft.',
    naked: false,           // needs binoculars
  },
  {
    name: 'Saturn',
    kepler: 'Bass',
    interval: 'Major third',
    note: 'G3',
    freq: 196.0,
    x: 18, y: 72,
    size: 6,
    brightness: 0.7,
    color: '#d4c48c',      // golden
    detail: 'The rings become a siren whose frequency follows the arc.',
    naked: true,
  },
  {
    name: 'Neptune',
    kepler: '—',
    interval: 'Unknown to Kepler',
    note: 'C3',
    freq: 130.81,
    x: 22, y: 68,
    size: 3,               // invisible to naked eye
    brightness: 0.25,
    color: '#7b9ec7',      // blue
    detail: 'Too far, too faint. Discovered 227 years after Kepler died.',
    naked: false,
  },
  {
    name: 'Venus',
    kepler: 'Alto',
    interval: 'A diesis (25:24)',
    note: 'G4',
    freq: 392.0,
    x: 15, y: 70,
    size: 10,              // brightest
    brightness: 1.0,
    color: '#fffaed',      // brilliant white-gold
    detail: 'Hesperus at dusk, Phosphorus at dawn. Same star. Two names.',
    naked: true,
  },
  {
    name: 'Uranus',
    kepler: '—',
    interval: 'Unknown to Kepler',
    note: 'E4',
    freq: 329.63,
    x: 48, y: 42,          // higher, below the Pleiades
    size: 3,
    brightness: 0.3,
    color: '#a8d8e8',      // ice blue
    detail: 'Faint. Sitting below the Seven Sisters. A cello traces its ring.',
    naked: false,
  },
  {
    name: 'Jupiter',
    kepler: 'Bass',
    interval: 'Minor third',
    note: 'C4',
    freq: 261.63,
    x: 78, y: 22,          // high in the southeast
    size: 9,
    brightness: 0.95,
    color: '#f0e6d0',      // warm cream
    detail: 'Woodwinds trace its auroral X-rays. The Great Red Spot causes a pitch drop.',
    naked: true,
  },
]

// ─── STATE ─────────────────────────────────────────────────────

const started = ref(false)
const active = reactive(new Set())
const hovered = ref(null)
const allRevealed = ref(false)
const audioStarted = ref(false)

let audioCtx = null
let oscillators = new Map()
let gains = new Map()
let masterGain = null
let reverbNode = null

// ─── AUDIO ─────────────────────────────────────────────────────

function initAudio() {
  if (audioCtx) return
  audioCtx = new (window.AudioContext || window.webkitAudioContext)()

  // Master volume
  masterGain = audioCtx.createGain()
  masterGain.gain.value = 0.15
  masterGain.connect(audioCtx.destination)

  // Simple reverb via delay feedback
  const delay = audioCtx.createDelay()
  delay.delayTime.value = 0.3
  const feedback = audioCtx.createGain()
  feedback.gain.value = 0.2
  const reverbGain = audioCtx.createGain()
  reverbGain.gain.value = 0.3

  delay.connect(feedback)
  feedback.connect(delay)
  delay.connect(reverbGain)
  reverbGain.connect(audioCtx.destination)

  reverbNode = delay

  // Create oscillators for each planet (silent until activated)
  planets.forEach((planet, i) => {
    // Main oscillator
    const osc = audioCtx.createOscillator()
    osc.type = 'sine'
    osc.frequency.value = planet.freq

    // Slight detune for warmth
    const osc2 = audioCtx.createOscillator()
    osc2.type = 'sine'
    osc2.frequency.value = planet.freq * 1.002

    const gain = audioCtx.createGain()
    gain.gain.value = 0

    osc.connect(gain)
    osc2.connect(gain)
    gain.connect(masterGain)
    gain.connect(reverbNode)

    osc.start()
    osc2.start()

    oscillators.set(i, { osc, osc2 })
    gains.set(i, gain)
  })

  audioStarted.value = true
}

function togglePlanet(index) {
  if (!audioCtx) initAudio()

  const gain = gains.get(index)
  if (!gain) return

  const now = audioCtx.currentTime

  if (active.has(index)) {
    // Fade out
    active.delete(index)
    gain.gain.cancelScheduledValues(now)
    gain.gain.setValueAtTime(gain.gain.value, now)
    gain.gain.linearRampToValueAtTime(0, now + 1.5)
  } else {
    // Fade in
    active.add(index)
    gain.gain.cancelScheduledValues(now)
    gain.gain.setValueAtTime(gain.gain.value, now)
    gain.gain.linearRampToValueAtTime(0.12, now + 2.0)

    // Check if all six are active
    if (active.size === planets.length) {
      setTimeout(() => { allRevealed.value = true }, 3000)
    }
  }
}

function start() {
  started.value = true
}

// ─── VISUAL HELPERS ────────────────────────────────────────────

function planetStyle(planet, index) {
  const isActive = active.has(index)
  const isHovered = hovered.value === index
  const s = planet.size
  const glowSize = isActive ? s * 4 : (isHovered ? s * 2 : s * 0.5)
  const opacity = isActive ? 0.95 : (isHovered ? 0.8 : 0.15 + planet.brightness * 0.35)

  return {
    left: `${planet.x}%`,
    top: `${planet.y}%`,
    width: `${s * 2}px`,
    height: `${s * 2}px`,
    backgroundColor: planet.color,
    opacity,
    boxShadow: `0 0 ${glowSize}px ${glowSize / 2}px ${planet.color}`,
    cursor: 'pointer',
    transition: 'all 1.5s ease',
    transform: `translate(-50%, -50%)`,
  }
}

function labelStyle(planet, index) {
  const isActive = active.has(index)
  return {
    left: `${planet.x}%`,
    top: `calc(${planet.y}% + ${planet.size + 14}px)`,
    opacity: isActive ? 0.9 : 0,
    color: planet.color,
    transition: 'opacity 1.5s ease',
    transform: 'translate(-50%, 0)',
  }
}

// ─── CLEANUP ───────────────────────────────────────────────────

onUnmounted(() => {
  if (audioCtx) {
    oscillators.forEach(({ osc, osc2 }) => {
      osc.stop()
      osc2.stop()
    })
    audioCtx.close()
  }
})
</script>

<template>
  <div class="page-harmonia">
    <!-- Entry screen -->
    <Transition name="fade">
      <div v-if="!started" class="intro" @click="start">
        <p class="intro-title">harmonia mundi</p>
        <p class="intro-sub">six planets are aligned tonight</p>
        <p class="intro-hint">click to listen</p>
      </div>
    </Transition>

    <!-- Sky -->
    <div v-if="started" class="sky">
      <!-- Stars (static) -->
      <div class="stars"></div>

      <!-- Planets -->
      <div
        v-for="(planet, i) in planets"
        :key="planet.name"
        class="planet"
        :style="planetStyle(planet, i)"
        @click="togglePlanet(i)"
        @mouseenter="hovered = i"
        @mouseleave="hovered = null"
      ></div>

      <!-- Planet labels (visible when active) -->
      <div
        v-for="(planet, i) in planets"
        :key="'label-' + planet.name"
        class="planet-label"
        :style="labelStyle(planet, i)"
      >
        <span class="label-name">{{ planet.name }}</span>
        <span class="label-note">{{ planet.note }}</span>
        <span v-if="planet.kepler !== '—'" class="label-kepler">{{ planet.kepler }}</span>
      </div>

      <!-- Hover info panel -->
      <Transition name="info-fade">
        <div
          v-if="hovered !== null"
          class="info-panel"
        >
          <p class="info-name">{{ planets[hovered].name }}</p>
          <p class="info-kepler" v-if="planets[hovered].kepler !== '—'">
            Kepler's {{ planets[hovered].kepler }} · {{ planets[hovered].interval }}
          </p>
          <p class="info-kepler" v-else>
            {{ planets[hovered].interval }}
          </p>
          <p class="info-detail">{{ planets[hovered].detail }}</p>
          <p class="info-eye">
            {{ planets[hovered].naked ? 'visible to the naked eye' : 'needs binoculars' }}
          </p>
        </div>
      </Transition>

      <!-- Cloud layer -->
      <div class="clouds">
        <div class="cloud cloud-1"></div>
        <div class="cloud cloud-2"></div>
        <div class="cloud cloud-3"></div>
      </div>

      <!-- Horizon line -->
      <div class="horizon"></div>

      <!-- Bottom text -->
      <div class="bottom-text">
        <p v-if="active.size === 0" class="instruction">
          click the sky to find what the clouds are hiding
        </p>
        <p v-else-if="!allRevealed" class="counter">
          {{ active.size }} of 6
        </p>
      </div>

      <!-- Reveal text -->
      <Transition name="reveal">
        <div v-if="allRevealed" class="reveal">
          <p class="reveal-quote">"The Earth sings Mi, Fa, Mi: you may infer even from the syllables<br>that in this our home Misery and Famine hold sway."</p>
          <p class="reveal-attr">— Kepler, <em>Harmonices Mundi</em>, 1619</p>
          <p class="reveal-final">the alignment doesn't require witnesses</p>
        </div>
      </Transition>

      <!-- Direction labels -->
      <div class="direction west">W</div>
      <div class="direction east">SE</div>
    </div>
  </div>
</template>

<style scoped>
.page-harmonia {
  position: fixed;
  inset: 0;
  background: #050508;
  overflow: hidden;
  font-family: Georgia, 'Times New Roman', serif;
}

/* ─── INTRO ─────────────────────────────────────── */

.intro {
  position: absolute;
  inset: 0;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  z-index: 20;
  cursor: pointer;
}

.intro-title {
  font-size: 2.5rem;
  font-style: italic;
  color: rgba(200, 190, 170, 0.12);
  margin: 0;
  letter-spacing: 0.15em;
}

.intro-sub {
  font-size: 0.9rem;
  color: rgba(200, 190, 170, 0.2);
  margin: 1.5rem 0 0;
  letter-spacing: 0.08em;
}

.intro-hint {
  font-size: 0.75rem;
  color: rgba(200, 190, 170, 0.12);
  margin: 2.5rem 0 0;
  animation: pulse 3s ease-in-out infinite;
}

@keyframes pulse {
  0%, 100% { opacity: 0.12; }
  50% { opacity: 0.35; }
}

.fade-enter-active,
.fade-leave-active {
  transition: opacity 1.5s ease;
}
.fade-enter-from,
.fade-leave-to {
  opacity: 0;
}

/* ─── SKY ───────────────────────────────────────── */

.sky {
  position: absolute;
  inset: 0;
  background: linear-gradient(
    to bottom,
    #050510 0%,
    #0a0a18 40%,
    #12101a 70%,
    #1a1520 85%,
    #201a22 100%
  );
}

/* ─── STARS ─────────────────────────────────────── */

.stars {
  position: absolute;
  inset: 0;
  background-image:
    radial-gradient(1px 1px at 10% 15%, rgba(255,255,255,0.3), transparent),
    radial-gradient(1px 1px at 25% 8%, rgba(255,255,255,0.2), transparent),
    radial-gradient(1px 1px at 40% 25%, rgba(255,255,255,0.15), transparent),
    radial-gradient(1px 1px at 55% 12%, rgba(255,255,255,0.25), transparent),
    radial-gradient(1px 1px at 70% 30%, rgba(255,255,255,0.2), transparent),
    radial-gradient(1px 1px at 85% 18%, rgba(255,255,255,0.15), transparent),
    radial-gradient(1px 1px at 15% 40%, rgba(255,255,255,0.1), transparent),
    radial-gradient(1px 1px at 33% 35%, rgba(255,255,255,0.2), transparent),
    radial-gradient(1px 1px at 60% 45%, rgba(255,255,255,0.15), transparent),
    radial-gradient(1px 1px at 80% 38%, rgba(255,255,255,0.1), transparent),
    radial-gradient(1px 1px at 92% 10%, rgba(255,255,255,0.2), transparent),
    radial-gradient(1px 1px at 5% 55%, rgba(255,255,255,0.1), transparent),
    radial-gradient(1.5px 1.5px at 47% 8%, rgba(255,255,255,0.35), transparent),
    radial-gradient(1px 1px at 67% 52%, rgba(255,255,255,0.1), transparent),
    radial-gradient(1.5px 1.5px at 88% 45%, rgba(255,255,255,0.25), transparent);
  pointer-events: none;
}

/* ─── PLANETS ───────────────────────────────────── */

.planet {
  position: absolute;
  border-radius: 50%;
  z-index: 10;
}

.planet:hover {
  transform: translate(-50%, -50%) scale(1.3) !important;
}

/* ─── PLANET LABELS ─────────────────────────────── */

.planet-label {
  position: absolute;
  z-index: 11;
  text-align: center;
  pointer-events: none;
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 2px;
}

.label-name {
  font-size: 0.7rem;
  letter-spacing: 0.15em;
  text-transform: uppercase;
}

.label-note {
  font-size: 0.6rem;
  font-family: 'Courier New', monospace;
  opacity: 0.6;
}

.label-kepler {
  font-size: 0.55rem;
  font-style: italic;
  opacity: 0.5;
}

/* ─── INFO PANEL ────────────────────────────────── */

.info-panel {
  position: fixed;
  bottom: 12%;
  left: 50%;
  transform: translateX(-50%);
  text-align: center;
  z-index: 15;
  max-width: 400px;
  padding: 0 1rem;
}

.info-name {
  font-size: 1.1rem;
  color: rgba(220, 210, 190, 0.8);
  margin: 0 0 0.3rem;
  letter-spacing: 0.1em;
}

.info-kepler {
  font-size: 0.75rem;
  color: rgba(200, 190, 170, 0.5);
  margin: 0 0 0.5rem;
  font-style: italic;
}

.info-detail {
  font-size: 0.8rem;
  color: rgba(200, 190, 170, 0.6);
  margin: 0 0 0.3rem;
  line-height: 1.5;
}

.info-eye {
  font-size: 0.65rem;
  font-family: 'Courier New', monospace;
  color: rgba(180, 170, 150, 0.35);
  margin: 0;
}

.info-fade-enter-active,
.info-fade-leave-active {
  transition: opacity 0.5s ease;
}
.info-fade-enter-from,
.info-fade-leave-to {
  opacity: 0;
}

/* ─── CLOUDS ────────────────────────────────────── */

.clouds {
  position: absolute;
  bottom: 0;
  left: 0;
  right: 0;
  height: 40%;
  pointer-events: none;
  z-index: 5;
}

.cloud {
  position: absolute;
  width: 150%;
  height: 100%;
  background: linear-gradient(
    to top,
    rgba(40, 38, 45, 0.95) 0%,
    rgba(40, 38, 45, 0.7) 30%,
    rgba(35, 33, 40, 0.4) 55%,
    rgba(30, 28, 35, 0.15) 75%,
    transparent 100%
  );
  animation: drift linear infinite;
}

.cloud-1 {
  left: -20%;
  animation-duration: 120s;
  opacity: 0.8;
}

.cloud-2 {
  left: -50%;
  animation-duration: 180s;
  animation-delay: -40s;
  opacity: 0.5;
}

.cloud-3 {
  left: -10%;
  animation-duration: 90s;
  animation-delay: -70s;
  opacity: 0.3;
  height: 60%;
}

@keyframes drift {
  from { transform: translateX(-10%); }
  to { transform: translateX(10%); }
}

/* ─── HORIZON ───────────────────────────────────── */

.horizon {
  position: absolute;
  bottom: 8%;
  left: 0;
  right: 0;
  height: 1px;
  background: rgba(100, 90, 80, 0.15);
  z-index: 4;
}

/* ─── DIRECTIONS ────────────────────────────────── */

.direction {
  position: absolute;
  bottom: 4%;
  font-size: 0.6rem;
  font-family: 'Courier New', monospace;
  color: rgba(150, 140, 130, 0.2);
  letter-spacing: 0.2em;
  z-index: 6;
}

.west { left: 8%; }
.east { right: 8%; }

/* ─── BOTTOM TEXT ───────────────────────────────── */

.bottom-text {
  position: fixed;
  bottom: 15%;
  left: 0;
  right: 0;
  text-align: center;
  z-index: 12;
}

.instruction {
  font-size: 0.75rem;
  font-style: italic;
  color: rgba(180, 170, 160, 0.25);
  animation: pulse 4s ease-in-out infinite;
}

.counter {
  font-size: 0.7rem;
  font-family: 'Courier New', monospace;
  color: rgba(180, 170, 160, 0.3);
}

/* ─── REVEAL ────────────────────────────────────── */

.reveal {
  position: fixed;
  bottom: 8%;
  left: 0;
  right: 0;
  text-align: center;
  z-index: 15;
  padding: 0 2rem;
}

.reveal-quote {
  font-size: 0.85rem;
  font-style: italic;
  color: rgba(220, 200, 160, 0.6);
  line-height: 1.8;
  margin: 0 0 0.5rem;
}

.reveal-attr {
  font-size: 0.7rem;
  color: rgba(200, 180, 140, 0.35);
  margin: 0 0 2rem;
}

.reveal-final {
  font-size: 0.8rem;
  color: rgba(220, 210, 180, 0.5);
  letter-spacing: 0.08em;
  margin: 0;
}

.reveal-enter-active {
  transition: opacity 4s ease;
}
.reveal-enter-from {
  opacity: 0;
}

/* ─── MOBILE ────────────────────────────────────── */

@media (max-width: 600px) {
  .intro-title {
    font-size: 1.8rem;
  }

  .info-panel {
    bottom: 18%;
    padding: 0 1.5rem;
  }

  .info-name {
    font-size: 0.95rem;
  }

  .reveal-quote {
    font-size: 0.75rem;
  }

  .planet-label {
    display: none; /* too cluttered on mobile */
  }
}
</style>
