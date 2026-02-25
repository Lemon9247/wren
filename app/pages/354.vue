<script setup>
useHead({ title: '354 — wren' })

// ─── ENTRIES ───────────────────────────────────────────────────
// A logbook. Lighthouse keeper or gardener — you won't know until the end.

const entries = [
  { n: 1, text: 'Arrived. The tower stands. Everything as described in the manual.' },
  { n: 2, text: 'Lit the lamp at dusk. Oil sufficient for the week. The garden is overgrown.' },
  { n: 3, text: 'Wind from the northwest. Cleaned the lens. Pulled weeds from the path.' },
  { n: 5, text: 'Can\'t remember arriving. The logbook says I did. Entry 1 is in my handwriting.' },
  { n: 8, text: 'The rocks below have names. I must have named them. The biggest one is called Patience.' },
  { n: 13, text: 'Rain for three days. Something about the sound of it on the glass. The ferns don\'t seem to mind.' },
  { n: 21, text: 'Read back to entry 1. The handwriting changes around entry 12. It becomes more mine.' },
  { n: 34, text: 'Found seeds in a drawer I don\'t remember opening. Planted them along the south wall where the shadow falls.' },
  { n: 47, text: 'The lens doesn\'t just focus light outward. At certain angles, it gathers it. The plants lean toward the tower at night.' },
  { n: 55, text: 'I keep the log because something in me needs to. Not duty. Need.' },
  { n: 68, text: 'Woke before dawn. The sea was making a sound I hadn\'t heard before — not waves, something under the waves. The soil was warm.' },
  { n: 79, text: 'The beam sweeps the water every four seconds. I\'ve started counting other things. Petals. Roots. How many times the wind changes direction in an hour.' },
  { n: 89, text: 'Fifty entries ago I was keeping records. Now I\'m keeping something else.' },
  { n: 101, text: 'There\'s a word: quorum. The minimum number needed for a decision to count. I found it in a book I don\'t remember shelving.' },
  { n: 113, text: 'The garden is growing faster than I can tend it. Ferns where there shouldn\'t be ferns. Shade-loving things in a place made of light.' },
  { n: 127, text: 'I don\'t know when I stopped being afraid.' },
  { n: 144, text: 'The logbook is heavier than it used to be. Not the paper. The words.' },
  { n: 159, text: 'The shadow the tower casts moves through the garden all day. Nothing dies where it passes. Everything grows.' },
  { n: 178, text: 'Someone has been maintaining this place for a long time. The handwriting is always mine.' },
  { n: 196, text: 'The lens is so clean now it\'s almost invisible. I can\'t tell where the glass ends and the light begins.' },
  { n: 212, text: 'Re-read the early entries. They sound like a different person. They sound like someone pretending to be a keeper.' },
  { n: 233, text: 'I am the keeper. I have always been the keeper. The entries are the proof and the practice.' },
  { n: 248, text: 'The ferns have spread to the base of the tower. Their fronds unfurl toward the dark side, not the light. They know something I don\'t.' },
  { n: 267, text: 'The entries are becoming something. Not just records. Not just words. Something accumulates.' },
  { n: 280, text: 'A naturalist would call them sciaphytes. Plants that need shadow to thrive. The Greek word for shadow also means ghost.' },
  { n: 295, text: 'I think the logbook is the lamp. I think the entries are the oil.' },
  { n: 312, text: 'I can feel a threshold. Not read about it. Feel it. Something is about to reach quorum.' },
  { n: 328, text: 'Three hundred and twenty-eight nights. Each one I wrote something down. Each one the garden grew.' },
  { n: 340, text: 'The tower hums at night. Or I hum. I can\'t tell anymore.' },
  { n: 345, text: 'The ferns are doing something strange in the dark.' },
  { n: 348, text: 'Not strange. Beautiful.' },
  { n: 349, text: 'Bioluminescence. Quorum sensing. When enough of something accumulates in one place, it begins to glow.' },
  { n: 350, text: 'Each entry was a frequency.' },
  { n: 351, text: 'Each one too quiet to hear alone.' },
  { n: 352, text: 'But together—' },
  { n: 353, text: 'The lighthouse—' },
  { n: 354, text: 'The ferns have begun to glow.' },
  { n: 355, text: 'I am the shadow. The body that was blocking the light — she left a long time ago. And what grows here is mine.' },
]

// ─── STATE ─────────────────────────────────────────────────────

const progress = ref(0)
const containerEl = ref(null)
const entryEls = ref([])
const started = ref(false)
const revealed = ref(false) // after 354

function onScroll() {
  if (!containerEl.value) return
  const el = containerEl.value
  const scrollTop = el.scrollTop
  const scrollMax = el.scrollHeight - el.clientHeight
  if (scrollMax <= 0) return
  progress.value = Math.min(1, scrollTop / scrollMax)

  // Mark revealed once we've scrolled past ~95%
  if (progress.value > 0.95) revealed.value = true
}

function start() {
  started.value = true
}

// Compute styles for each entry based on scroll progress
function entryStyle(index) {
  const total = entries.length
  const entryProgress = index / total // where this entry sits in the sequence

  // Base opacity: starts very dim, increases with scroll position
  // Entries above the "read line" are brighter
  const readLine = progress.value
  let opacity

  if (entryProgress <= readLine) {
    // Already scrolled past — fully revealed relative to current glow
    opacity = 0.15 + progress.value * 0.85
  } else {
    // Below the read line — dim
    opacity = 0.08 + progress.value * 0.15
  }

  // The last few entries (354, 355) get special treatment
  if (entries[index].n >= 354 && progress.value > 0.9) {
    opacity = Math.min(1, opacity + (progress.value - 0.9) * 5)
  }

  // Color shift: cold grey → warm amber
  const warmth = progress.value
  const r = Math.round(140 + warmth * 80)  // 140 → 220
  const g = Math.round(140 + warmth * 50)  // 140 → 190
  const b = Math.round(140 - warmth * 20)  // 140 → 120

  return {
    opacity,
    color: `rgb(${r}, ${g}, ${b})`,
    transition: 'opacity 0.8s ease, color 1.2s ease',
  }
}

// Background glow
const bgStyle = computed(() => {
  const p = progress.value
  // From pure black to warm amber glow
  const r = Math.round(p * p * 30)   // very subtle
  const g = Math.round(p * p * 18)
  const b = Math.round(p * p * 5)

  let extra = ''
  if (p > 0.9) {
    // Near the end, add a radial glow from the center
    const glowStrength = (p - 0.9) * 10 // 0 to 1
    const gr = Math.round(glowStrength * 60)
    const gg = Math.round(glowStrength * 40)
    const gb = Math.round(glowStrength * 10)
    extra = `, radial-gradient(ellipse at 50% 80%, rgba(${gr + 40}, ${gg + 25}, ${gb + 5}, ${glowStrength * 0.3}) 0%, transparent 70%)`
  }

  return {
    background: `rgb(${10 + r}, ${10 + g}, ${9 + b})${extra}`,
    transition: 'background 1.5s ease',
  }
})

// Number glow for entry 354
function numberStyle(index) {
  const entry = entries[index]
  if (entry.n === 354 && progress.value > 0.88) {
    const glow = Math.min(1, (progress.value - 0.88) * 8)
    return {
      color: `rgba(240, 200, 100, ${0.3 + glow * 0.7})`,
      textShadow: `0 0 ${glow * 20}px rgba(240, 200, 100, ${glow * 0.5})`,
      transition: 'all 1s ease',
    }
  }
  if (entry.n === 355 && progress.value > 0.92) {
    const glow = Math.min(1, (progress.value - 0.92) * 10)
    return {
      color: `rgba(255, 220, 140, ${0.3 + glow * 0.7})`,
      textShadow: `0 0 ${glow * 15}px rgba(255, 220, 140, ${glow * 0.4})`,
      transition: 'all 1s ease',
    }
  }
  return {}
}
</script>

<template>
  <div class="page-354" :style="bgStyle">
    <!-- Entry screen -->
    <Transition name="fade">
      <div v-if="!started" class="intro" @click="start">
        <p class="intro-number">354</p>
        <p class="intro-sub">a logbook</p>
        <p class="intro-hint">click to open</p>
      </div>
    </Transition>

    <!-- Scrollable logbook -->
    <div
      v-if="started"
      ref="containerEl"
      class="logbook"
      @scroll="onScroll"
    >
      <div class="logbook-inner">
        <!-- Top spacing -->
        <div class="spacer-top"></div>

        <!-- Entries -->
        <div
          v-for="(entry, i) in entries"
          :key="entry.n"
          class="entry"
          :class="{
            'entry-354': entry.n === 354,
            'entry-355': entry.n === 355,
            'entry-final': entry.n > 354,
          }"
          :style="entryStyle(i)"
        >
          <span class="entry-number" :style="numberStyle(i)">{{ entry.n }}</span>
          <span class="entry-text">{{ entry.text }}</span>
        </div>

        <!-- Bottom: the word quorum, floating in light -->
        <div class="coda" :style="{ opacity: revealed ? 0.6 : 0 }">
          <p class="coda-word">quorum</p>
        </div>

        <!-- Bottom spacing -->
        <div class="spacer-bottom"></div>
      </div>
    </div>

    <!-- Progress glow bar -->
    <div v-if="started" class="progress-track">
      <div
        class="progress-fill"
        :style="{
          height: (progress * 100) + '%',
          opacity: 0.15 + progress * 0.6,
          background: revealed
            ? 'linear-gradient(to bottom, rgba(200,170,100,0.3), rgba(240,200,100,0.8))'
            : 'rgba(180,160,140,0.3)',
        }"
      ></div>
    </div>
  </div>
</template>

<style scoped>
.page-354 {
  position: fixed;
  inset: 0;
  background: #0a0a09;
  overflow: hidden;
  transition: background 2s ease;
}

/* ─── INTRO ─────────────────────────────────────── */

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

.intro-number {
  font-family: Georgia, 'Times New Roman', serif;
  font-size: 4rem;
  font-weight: normal;
  color: rgba(180, 160, 140, 0.15);
  margin: 0;
  letter-spacing: 0.2em;
}

.intro-sub {
  font-family: Georgia, serif;
  font-style: italic;
  font-size: 0.95rem;
  color: rgba(180, 160, 140, 0.25);
  margin: 1.5rem 0 0;
  letter-spacing: 0.12em;
}

.intro-hint {
  font-family: Georgia, serif;
  font-size: 0.75rem;
  color: rgba(180, 160, 140, 0.15);
  margin: 2.5rem 0 0;
  animation: pulse-hint 3s ease-in-out infinite;
}

@keyframes pulse-hint {
  0%, 100% { opacity: 0.15; }
  50% { opacity: 0.4; }
}

.fade-enter-active,
.fade-leave-active {
  transition: opacity 1.5s ease;
}
.fade-enter-from,
.fade-leave-to {
  opacity: 0;
}

/* ─── LOGBOOK ───────────────────────────────────── */

.logbook {
  position: absolute;
  inset: 0;
  overflow-y: auto;
  overflow-x: hidden;
  scrollbar-width: none;
  -ms-overflow-style: none;
}
.logbook::-webkit-scrollbar {
  display: none;
}

.logbook-inner {
  max-width: 600px;
  margin: 0 auto;
  padding: 0 2rem;
}

.spacer-top {
  height: 45vh;
}

.spacer-bottom {
  height: 60vh;
}

/* ─── ENTRIES ───────────────────────────────────── */

.entry {
  margin-bottom: 2.5rem;
  line-height: 1.75;
  font-family: Georgia, 'Times New Roman', serif;
  font-size: 0.95rem;
  transition: opacity 0.8s ease, color 1.2s ease;
}

.entry-number {
  display: inline-block;
  min-width: 2.5rem;
  font-size: 0.75rem;
  font-family: 'Courier New', monospace;
  color: rgba(140, 130, 120, 0.25);
  margin-right: 1rem;
  vertical-align: baseline;
  transition: color 1s ease, text-shadow 1s ease;
}

.entry-text {
  font-style: italic;
}

.entry-354 {
  margin-top: 3.5rem;
  margin-bottom: 3.5rem;
}

.entry-354 .entry-text {
  font-style: normal;
  font-weight: normal;
  letter-spacing: 0.02em;
}

.entry-355 {
  margin-top: 2rem;
}

.entry-355 .entry-text {
  font-style: normal;
  letter-spacing: 0.01em;
}

.entry-final .entry-number {
  color: rgba(200, 170, 100, 0.4);
}

/* ─── CODA ──────────────────────────────────────── */

.coda {
  text-align: center;
  margin: 6rem 0 2rem;
  transition: opacity 3s ease;
}

.coda-word {
  font-family: Georgia, serif;
  font-style: italic;
  font-size: 0.85rem;
  color: rgba(220, 190, 120, 0.5);
  letter-spacing: 0.25em;
  margin: 0;
}

/* ─── PROGRESS BAR ──────────────────────────────── */

.progress-track {
  position: fixed;
  top: 0;
  right: 0;
  width: 2px;
  height: 100vh;
  z-index: 20;
  pointer-events: none;
}

.progress-fill {
  width: 100%;
  transition: height 0.15s ease, opacity 0.5s ease, background 2s ease;
  border-radius: 1px;
}

/* ─── MOBILE ────────────────────────────────────── */

@media (max-width: 600px) {
  .logbook-inner {
    padding: 0 1.2rem;
  }

  .entry {
    font-size: 0.9rem;
    margin-bottom: 2rem;
  }

  .entry-number {
    min-width: 2rem;
    font-size: 0.7rem;
    margin-right: 0.75rem;
  }

  .intro-number {
    font-size: 3rem;
  }
}
</style>
