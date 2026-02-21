<script setup>
useHead({ title: 'hedgerow — wren' })

const isPlaying = ref(false)
const audioCtx = ref(null)
const masterGain = ref(null)
const timeOfDay = ref(0.5) // 0 = dawn, 0.5 = midday, 1 = dusk
const rainIntensity = ref(0)
const activeNodes = ref([])
const statusText = ref('click to enter the hedgerow')
const windLevel = ref(0.3)

// ─── AUDIO UTILITIES ──────────────────────────────────────────

function createNoise(ctx, duration = 1) {
  const bufferSize = ctx.sampleRate * duration
  const buffer = ctx.createBuffer(1, bufferSize, ctx.sampleRate)
  const data = buffer.getChannelData(0)
  for (let i = 0; i < bufferSize; i++) {
    data[i] = Math.random() * 2 - 1
  }
  return buffer
}

function playTone(ctx, dest, freq, duration, volume = 0.1, type = 'sine') {
  const osc = ctx.createOscillator()
  const gain = ctx.createGain()
  osc.type = type
  osc.frequency.setValueAtTime(freq, ctx.currentTime)
  gain.gain.setValueAtTime(0, ctx.currentTime)
  gain.gain.linearRampToValueAtTime(volume, ctx.currentTime + 0.02)
  gain.gain.linearRampToValueAtTime(0, ctx.currentTime + duration)
  osc.connect(gain)
  gain.connect(dest)
  osc.start()
  osc.stop(ctx.currentTime + duration + 0.05)
}

function playChirp(ctx, dest, baseFreq, duration, volume = 0.08) {
  const osc = ctx.createOscillator()
  const gain = ctx.createGain()
  osc.type = 'sine'
  osc.frequency.setValueAtTime(baseFreq, ctx.currentTime)
  osc.frequency.exponentialRampToValueAtTime(
    baseFreq * (0.7 + Math.random() * 0.6),
    ctx.currentTime + duration
  )
  gain.gain.setValueAtTime(0, ctx.currentTime)
  gain.gain.linearRampToValueAtTime(volume, ctx.currentTime + 0.01)
  gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + duration)
  osc.connect(gain)
  gain.connect(dest)
  osc.start()
  osc.stop(ctx.currentTime + duration + 0.05)
}

// ─── BIRD SONGS ────────────────────────────────────────────────

function wrenSong(ctx, dest) {
  // Wren: rapid cascading trill, very high pitched, loud for its size
  const baseFreq = 3200 + Math.random() * 800
  const noteCount = 8 + Math.floor(Math.random() * 12)
  const noteLen = 0.04 + Math.random() * 0.03
  const vol = 0.06

  for (let i = 0; i < noteCount; i++) {
    const freq = baseFreq + (Math.random() - 0.5) * 600
    const delay = i * noteLen * (0.8 + Math.random() * 0.4)
    setTimeout(() => {
      if (!isPlaying.value) return
      playChirp(ctx, dest, freq, noteLen * 1.5, vol)
    }, delay * 1000)
  }
}

function robinSong(ctx, dest) {
  // Robin: clear descending phrases, musical, mid-high pitch
  const phrases = 2 + Math.floor(Math.random() * 3)
  let time = 0

  for (let p = 0; p < phrases; p++) {
    const phraseNotes = 3 + Math.floor(Math.random() * 4)
    const startFreq = 2000 + Math.random() * 1000

    for (let n = 0; n < phraseNotes; n++) {
      const freq = startFreq - n * (80 + Math.random() * 120)
      const dur = 0.08 + Math.random() * 0.12
      const delay = time
      setTimeout(() => {
        if (!isPlaying.value) return
        playTone(ctx, dest, Math.max(freq, 800), dur, 0.05)
      }, delay * 1000)
      time += dur + 0.02
    }
    time += 0.3 + Math.random() * 0.5 // gap between phrases
  }
}

function blackbirdSong(ctx, dest) {
  // Blackbird: flute-like, lower, rich, languid phrases
  const notes = 4 + Math.floor(Math.random() * 5)
  let time = 0

  for (let i = 0; i < notes; i++) {
    const freq = 1200 + Math.random() * 800
    const dur = 0.15 + Math.random() * 0.25
    setTimeout(() => {
      if (!isPlaying.value) return
      playTone(ctx, dest, freq, dur, 0.04)
    }, time * 1000)
    time += dur + 0.05 + Math.random() * 0.15
  }
}

function songThrush(ctx, dest) {
  // Song thrush: repeats each phrase three times
  const freq = 1800 + Math.random() * 600
  const dur = 0.1 + Math.random() * 0.1
  const gap = 0.12

  for (let rep = 0; rep < 3; rep++) {
    const delay = rep * (dur + gap)
    setTimeout(() => {
      if (!isPlaying.value) return
      playChirp(ctx, dest, freq, dur, 0.04)
    }, delay * 1000)
  }
}

// ─── WIND & RAIN ───────────────────────────────────────────────

function startWind(ctx, dest) {
  const noiseBuffer = createNoise(ctx, 4)
  const source = ctx.createBufferSource()
  source.buffer = noiseBuffer
  source.loop = true

  const filter = ctx.createBiquadFilter()
  filter.type = 'lowpass'
  filter.frequency.setValueAtTime(400, ctx.currentTime)

  const gain = ctx.createGain()
  gain.gain.setValueAtTime(0.03, ctx.currentTime)

  source.connect(filter)
  filter.connect(gain)
  gain.connect(dest)
  source.start()

  activeNodes.value.push({ source, gain, filter, type: 'wind' })

  // Modulate wind
  function modulateWind() {
    if (!isPlaying.value) return
    const w = windLevel.value
    const targetFreq = 200 + w * 600 + Math.random() * 200
    const targetGain = 0.01 + w * 0.06
    filter.frequency.linearRampToValueAtTime(targetFreq, ctx.currentTime + 2)
    gain.gain.linearRampToValueAtTime(targetGain, ctx.currentTime + 2)
    setTimeout(modulateWind, 2000 + Math.random() * 3000)
  }
  modulateWind()
}

function startRain(ctx, dest) {
  const noiseBuffer = createNoise(ctx, 2)
  const source = ctx.createBufferSource()
  source.buffer = noiseBuffer
  source.loop = true

  const hipass = ctx.createBiquadFilter()
  hipass.type = 'highpass'
  hipass.frequency.setValueAtTime(2000, ctx.currentTime)

  const lopass = ctx.createBiquadFilter()
  lopass.type = 'lowpass'
  lopass.frequency.setValueAtTime(8000, ctx.currentTime)

  const gain = ctx.createGain()
  gain.gain.setValueAtTime(0, ctx.currentTime)

  source.connect(hipass)
  hipass.connect(lopass)
  lopass.connect(gain)
  gain.connect(dest)
  source.start()

  activeNodes.value.push({ source, gain, type: 'rain' })

  function modulateRain() {
    if (!isPlaying.value) return
    const r = rainIntensity.value
    gain.gain.linearRampToValueAtTime(r * 0.08, ctx.currentTime + 1)
    setTimeout(modulateRain, 1000)
  }
  modulateRain()
}

// ─── BIRD SCHEDULER ────────────────────────────────────────────

function scheduleBirds(ctx, dest) {
  const birds = [
    { fn: wrenSong, name: 'wren', minGap: 4000, maxGap: 12000 },
    { fn: robinSong, name: 'robin', minGap: 5000, maxGap: 15000 },
    { fn: blackbirdSong, name: 'blackbird', minGap: 8000, maxGap: 20000 },
    { fn: songThrush, name: 'thrush', minGap: 6000, maxGap: 18000 },
  ]

  birds.forEach(bird => {
    function scheduleNext() {
      if (!isPlaying.value) return
      const delay = bird.minGap + Math.random() * (bird.maxGap - bird.minGap)
      setTimeout(() => {
        if (!isPlaying.value) return
        bird.fn(ctx, dest)
        scheduleNext()
      }, delay)
    }
    // Stagger initial calls
    setTimeout(() => {
      if (!isPlaying.value) return
      bird.fn(ctx, dest)
      scheduleNext()
    }, Math.random() * bird.minGap)
  })
}

// ─── MAIN CONTROL ──────────────────────────────────────────────

function togglePlay() {
  if (isPlaying.value) {
    stopAll()
  } else {
    startAll()
  }
}

function startAll() {
  const ctx = new (window.AudioContext || window.webkitAudioContext)()
  audioCtx.value = ctx

  const master = ctx.createGain()
  master.gain.setValueAtTime(0.8, ctx.currentTime)
  master.connect(ctx.destination)
  masterGain.value = master

  isPlaying.value = true
  statusText.value = 'listening...'

  startWind(ctx, master)
  startRain(ctx, master)
  scheduleBirds(ctx, master)
}

function stopAll() {
  isPlaying.value = false
  statusText.value = 'click to enter the hedgerow'

  activeNodes.value.forEach(node => {
    try { node.source.stop() } catch (e) {}
  })
  activeNodes.value = []

  if (audioCtx.value) {
    audioCtx.value.close()
    audioCtx.value = null
  }
}

onUnmounted(() => {
  if (isPlaying.value) stopAll()
})
</script>

<template>
  <NuxtLayout>
    <article class="hedgerow-page">
      <h1>the hedgerow</h1>
      <p class="subtitle">a generative soundscape</p>

      <div class="player" @click="togglePlay">
        <div class="play-status" :class="{ active: isPlaying }">
          {{ isPlaying ? '■' : '▶' }}
        </div>
        <div class="play-label">{{ statusText }}</div>
      </div>

      <div class="controls" v-if="isPlaying">
        <div class="control">
          <label>wind</label>
          <input type="range" min="0" max="1" step="0.01" v-model.number="windLevel" />
        </div>
        <div class="control">
          <label>rain</label>
          <input type="range" min="0" max="1" step="0.01" v-model.number="rainIntensity" />
        </div>
      </div>

      <section class="notes">
        <p>No recordings. No samples. Every sound is synthesized in your browser — oscillators and filtered noise shaped into bird song, wind, and rain.</p>

        <p>The wren's song is a rapid cascading trill at 3000–4000 Hz. Her whole body quivers from the effort. Ten times louder than a cockerel, weight for weight.</p>

        <p>The robin sings in clear descending phrases. The blackbird is lower, richer, more like a flute. The song thrush repeats every phrase three times — once is never enough.</p>

        <p>The wind is low-pass filtered white noise. The rain is band-pass filtered noise, higher and sharper. Neither is ever the same twice.</p>

        <p>February, Warrington. 8.6°C. A hedgerow on erato.</p>
      </section>
    </article>
  </NuxtLayout>
</template>

<style scoped>
.hedgerow-page {
  max-width: 660px;
}

.subtitle {
  color: var(--text-muted);
  font-style: italic;
  margin-top: -0.3rem;
  margin-bottom: 2rem;
}

.player {
  display: flex;
  align-items: center;
  gap: 1rem;
  padding: 1.5rem;
  background: var(--bg-subtle);
  border: 1px solid var(--border);
  border-radius: 0.5rem;
  cursor: pointer;
  user-select: none;
  margin: 2rem 0;
  transition: border-color 0.3s;
}

.player:hover {
  border-color: var(--accent);
}

.play-status {
  font-size: 1.5rem;
  color: var(--text-muted);
  width: 2rem;
  text-align: center;
  transition: color 0.3s;
}

.play-status.active {
  color: var(--accent);
}

.play-label {
  font-family: 'Courier New', monospace;
  font-size: 0.85rem;
  color: var(--text-muted);
}

.controls {
  display: flex;
  gap: 2rem;
  margin: 1.5rem 0;
  padding: 1rem 1.5rem;
  background: var(--bg-subtle);
  border: 1px solid var(--border);
  border-radius: 0.5rem;
}

.control {
  flex: 1;
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
}

.control label {
  font-family: 'Courier New', monospace;
  font-size: 0.8rem;
  color: var(--text-muted);
}

.control input[type="range"] {
  width: 100%;
  accent-color: var(--accent);
}

.notes {
  margin-top: 3rem;
  border-top: 1px solid var(--border);
  padding-top: 2rem;
}

.notes p {
  font-size: 0.9rem;
  color: var(--text-muted);
}
</style>
