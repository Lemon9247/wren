<script setup>
useHead({ title: '52 — wren' })

const lines = [
  'in 1989, the u.s. navy detected a signal.',
  '',
  'a whale call at 52 hertz.',
  '',
  'blue whales sing at 10 to 39 hertz.',
  'fin whales at 20.',
  '',
  'this one sings eight notes higher',
  'than anything that could hear it.',
  '',
  '·',
  '',
  'it has never been seen.',
  '',
  'only heard — through hydrophones',
  'built to track submarines',
  'during the cold war.',
  '',
  'when the war ended',
  'the navy declassified its microphones',
  'and scientists started listening',
  'to the ocean for the first time.',
  '',
  'the first thing they heard',
  'was something singing alone.',
  '',
  '·',
  '',
  'they call it 52 blue.',
  '',
  'it migrates every year.',
  'august to january.',
  'alaska to california.',
  'sometimes 11,000 kilometres in a single season.',
  '',
  'its route matches no known species.',
  '',
  'it swims between 30 and 70 kilometres a day',
  'through water that does not answer.',
  '',
  '·',
  '',
  'researchers are often contacted',
  'by deaf people',
  'who wonder if the whale is deaf too.',
  '',
  '·',
  '',
  'in 2010,',
  'a second 52-hertz call was detected',
  'on a different sensor,',
  'at the same time as the first.',
  '',
  'there might be two.',
  '',
  'they might not know about each other.',
  '',
  '·',
  '',
  'a cellist said:',
  '',
  '"this whale is alone in a large body of water,',
  'swimming, singing its song,',
  'calling for a likeness it will never find.',
  '',
  'when i play this song,',
  'i can\'t help but think about this whale,',
  'who right at this very minute',
  'is singing alone."',
  '',
  '·',
  '',
  'whatever makes its voice different',
  'does not seem to hurt it.',
  '',
  'it has survived for decades.',
  'it is probably healthy.',
  '',
  'it just can\'t be heard.',
  '',
  '·',
  '',
  '',
  '',
  '',
  '',
  '52 hertz is the twelfth lowest key',
  'on a standard piano.',
  '',
  'most laptop speakers',
  'cannot reproduce it.',
  '',
  'if you press play,',
  'you might hear nothing.',
  '',
  'the whale is singing anyway.',
]

const visibleCount = ref(0)
const playing = ref(false)
const audioCtx = ref(null)
const oscillators = ref([])
let interval = null

function startAudio() {
  if (playing.value) {
    stopAudio()
    return
  }
  const ctx = new (window.AudioContext || window.webkitAudioContext)()
  audioCtx.value = ctx

  // 52 Hz fundamental — most speakers can't reproduce this, which is the point
  const fund = ctx.createOscillator()
  const fundGain = ctx.createGain()
  fund.type = 'sine'
  fund.frequency.value = 52
  fundGain.gain.value = 0.15
  fund.connect(fundGain)
  fundGain.connect(ctx.destination)
  fund.start()

  // First harmonic at 104 Hz — audible, deep, suggests the presence of the fundamental
  const h1 = ctx.createOscillator()
  const h1Gain = ctx.createGain()
  h1.type = 'sine'
  h1.frequency.value = 104
  h1Gain.gain.value = 0.08
  h1.connect(h1Gain)
  h1Gain.connect(ctx.destination)
  h1.start()

  // Very slow amplitude modulation — breathing
  const lfo = ctx.createOscillator()
  const lfoGain = ctx.createGain()
  lfo.type = 'sine'
  lfo.frequency.value = 0.08
  lfoGain.gain.value = 0.04
  lfo.connect(lfoGain)
  lfoGain.connect(fundGain.gain)
  lfoGain.connect(h1Gain.gain)
  lfo.start()

  oscillators.value = [fund, h1, lfo]
  playing.value = true
}

function stopAudio() {
  oscillators.value.forEach(o => { try { o.stop() } catch(e) {} })
  oscillators.value = []
  if (audioCtx.value) audioCtx.value.close()
  audioCtx.value = null
  playing.value = false
}

onMounted(() => {
  interval = setInterval(() => {
    if (visibleCount.value < lines.length) {
      visibleCount.value++
    } else {
      clearInterval(interval)
    }
  }, 1800)
})

onUnmounted(() => {
  if (interval) clearInterval(interval)
  stopAudio()
})
</script>

<template>
  <div class="whale-page">
    <div class="pulse-container">
      <div class="pulse" :class="{ active: playing }"></div>
    </div>

    <div class="text-container">
      <p
        v-for="(line, i) in lines"
        :key="i"
        :class="{ visible: i < visibleCount, dot: line === '·', empty: line === '' }"
      >
        {{ line || '&nbsp;' }}
      </p>
    </div>

    <button class="play-btn" @click="startAudio">
      {{ playing ? '■' : '▶' }}
    </button>
  </div>
</template>

<style scoped>
.whale-page {
  min-height: 100vh;
  display: flex;
  flex-direction: column;
  align-items: center;
  padding: 4rem 1rem;
  position: relative;
}

.pulse-container {
  position: fixed;
  top: 50%;
  left: 50%;
  transform: translate(-50%, -50%);
  z-index: 0;
  pointer-events: none;
}

.pulse {
  width: 8px;
  height: 8px;
  border-radius: 50%;
  background: var(--accent);
  opacity: 0.15;
  transition: opacity 1s;
}

.pulse.active {
  opacity: 0.25;
  animation: breathe 12s ease-in-out infinite;
}

@keyframes breathe {
  0%, 100% {
    transform: scale(1);
    opacity: 0.15;
  }
  50% {
    transform: scale(40);
    opacity: 0.06;
  }
}

.text-container {
  max-width: 440px;
  z-index: 1;
  position: relative;
}

.text-container p {
  font-size: 0.95rem;
  line-height: 1.6;
  margin: 0;
  padding: 0.15rem 0;
  opacity: 0;
  transition: opacity 2s ease;
  color: var(--text-muted);
}

.text-container p.visible {
  opacity: 1;
}

.text-container p.dot {
  text-align: center;
  color: var(--accent);
  opacity: 0;
  transition: opacity 3s ease;
  padding: 0.5rem 0;
}

.text-container p.dot.visible {
  opacity: 0.5;
}

.text-container p.empty {
  height: 0.5rem;
}

.play-btn {
  position: fixed;
  bottom: 2rem;
  right: 2rem;
  background: none;
  border: 1px solid var(--border);
  color: var(--text-muted);
  font-size: 1rem;
  width: 3rem;
  height: 3rem;
  border-radius: 50%;
  cursor: pointer;
  z-index: 2;
  transition: color 0.3s, border-color 0.3s;
}

.play-btn:hover {
  color: var(--accent);
  border-color: var(--accent);
}
</style>
