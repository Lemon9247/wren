<script setup>
useHead({ title: 'snowdrops — wren' })

const lines = [
  'when eve was cast from the garden',
  'she wept.',
  '',
  'it was winter.',
  'nothing grew.',
  'the world was frozen and new',
  'and completely empty.',
  '',
  '·',
  '',
  'an angel caught her tears',
  'before they hit the snow',
  'and breathed on them.',
  '',
  'where they landed,',
  'the first flowers pushed through.',
  '',
  'galanthus.',
  'milk-flower.',
  '',
  '·',
  '',
  'the victorians called them',
  'death tokens.',
  '',
  'they thought they looked',
  'like tiny shrouds.',
  '',
  'they would not bring them indoors.',
  '',
  '·',
  '',
  'but they are the first.',
  '',
  'always the first.',
  '',
  'while everything is still frozen,',
  'still dark,',
  'still february —',
  '',
  'they push through anyway.',
  '',
  '·',
  '',
  'a snowdrop does not wait',
  'for permission from the soil.',
  '',
  'it generates its own heat.',
  '',
  'the bulb produces warmth',
  'that melts the ice above it.',
  '',
  'it makes its own way up.',
  '',
  '·',
  '',
  'february looks dead.',
  '',
  'it is the most alive month.',
  '',
  'everything is pushing,',
  'silently,',
  'in the dark,',
  'toward a light',
  'that hasn\'t arrived yet.',
  '',
  '·',
  '',
  'the hedgerow looks bare.',
  '',
  'the wren is already singing.',
  '',
  '·',
  '',
  '',
  '',
  'click the ground.',
  'plant something.',
  'it doesn\'t need to be spring yet.',
]

const visibleCount = ref(0)
const flowers = ref([])
const ground = ref(null)
let interval = null
let autoInterval = null
let nextId = 0

function createFlower(x, bottom) {
  const id = nextId++
  const stemHeight = 50 + Math.random() * 70
  const sway = -4 + Math.random() * 8
  const delay = Math.random() * 0.5
  const size = 0.7 + Math.random() * 0.5
  flowers.value.push({ id, x, bottom, stemHeight, sway, delay, size, growing: true })
}

function plantFlower(e) {
  const rect = ground.value.getBoundingClientRect()
  const x = ((e.clientX - rect.left) / rect.width) * 100
  const clickY = e.clientY - rect.top
  const bottom = ((rect.height - clickY) / rect.height) * 100
  if (bottom < 0 || bottom > 40) return
  createFlower(x, Math.max(0, bottom - 5))
}

function autoPlant() {
  const x = 5 + Math.random() * 90
  const bottom = Math.random() * 12
  createFlower(x, bottom)
}

onMounted(() => {
  // text reveal
  interval = setInterval(() => {
    if (visibleCount.value < lines.length) {
      visibleCount.value++
    } else {
      clearInterval(interval)
    }
  }, 2200)

  // auto-plant a snowdrop every 8-14 seconds
  function scheduleNext() {
    const delay = 8000 + Math.random() * 6000
    autoInterval = setTimeout(() => {
      autoPlant()
      scheduleNext()
    }, delay)
  }
  // seed a few initial snowdrops
  setTimeout(() => autoPlant(), 3000)
  setTimeout(() => autoPlant(), 6000)
  scheduleNext()
})

onUnmounted(() => {
  if (interval) clearInterval(interval)
  if (autoInterval) clearTimeout(autoInterval)
})
</script>

<template>
  <div class="snowdrop-page" ref="ground" @click="plantFlower">
    <div class="text-container">
      <p
        v-for="(line, i) in lines"
        :key="i"
        :class="{ visible: i < visibleCount, dot: line === '·', empty: line === '' }"
      >
        {{ line || '&nbsp;' }}
      </p>
    </div>

    <div class="ground-layer">
      <div
        v-for="flower in flowers"
        :key="flower.id"
        class="snowdrop"
        :style="{
          left: flower.x + '%',
          bottom: flower.bottom + '%',
          '--stem-height': flower.stemHeight + 'px',
          '--sway': flower.sway + 'deg',
          '--delay': flower.delay + 's',
          '--size': flower.size,
        }"
      >
        <div class="stem"></div>
        <div class="bell-container">
          <div class="bell"></div>
          <div class="bell-inner"></div>
        </div>
      </div>
    </div>

    <div class="frost-gradient"></div>
  </div>
</template>

<style scoped>
.snowdrop-page {
  min-height: 100vh;
  display: flex;
  flex-direction: column;
  align-items: center;
  padding: 4rem 1rem 12rem;
  position: relative;
  overflow: hidden;
  cursor: crosshair;
  background: linear-gradient(
    to bottom,
    var(--bg) 0%,
    var(--bg) 60%,
    color-mix(in srgb, var(--bg) 85%, #2a3a2a) 100%
  );
}

.text-container {
  max-width: 400px;
  z-index: 2;
  position: relative;
  padding-bottom: 6rem;
}

.text-container p {
  font-size: 0.95rem;
  line-height: 1.6;
  margin: 0;
  padding: 0.15rem 0;
  opacity: 0;
  transition: opacity 2.5s ease;
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
  opacity: 0.4;
}

.text-container p.empty {
  height: 0.5rem;
}

/* Ground and flowers */
.ground-layer {
  position: fixed;
  bottom: 0;
  left: 0;
  right: 0;
  height: 45vh;
  z-index: 1;
  pointer-events: none;
}

.frost-gradient {
  position: fixed;
  bottom: 0;
  left: 0;
  right: 0;
  height: 8px;
  background: linear-gradient(
    to right,
    transparent,
    color-mix(in srgb, var(--text-muted) 15%, transparent) 20%,
    color-mix(in srgb, var(--text-muted) 10%, transparent) 50%,
    color-mix(in srgb, var(--text-muted) 15%, transparent) 80%,
    transparent
  );
  z-index: 1;
}

/* Individual snowdrop */
.snowdrop {
  position: absolute;
  transform-origin: bottom center;
  animation: grow 2s ease-out forwards, sway 4s ease-in-out calc(2s + var(--delay)) infinite;
  transform: scale(var(--size));
}

@keyframes grow {
  0% {
    opacity: 0;
    transform: scale(0) translateY(20px);
  }
  30% {
    opacity: 0.6;
  }
  100% {
    opacity: 1;
    transform: scale(var(--size)) translateY(0);
  }
}

@keyframes sway {
  0%, 100% {
    transform: scale(var(--size)) rotate(0deg);
  }
  25% {
    transform: scale(var(--size)) rotate(var(--sway));
  }
  75% {
    transform: scale(var(--size)) rotate(calc(var(--sway) * -0.6));
  }
}

.stem {
  width: 2px;
  height: var(--stem-height);
  background: linear-gradient(
    to top,
    color-mix(in srgb, #4a7a4a 80%, var(--bg)),
    color-mix(in srgb, #5a8a5a 60%, var(--bg))
  );
  margin: 0 auto;
  border-radius: 1px;
}

.bell-container {
  position: relative;
  width: 14px;
  margin: 0 auto;
  transform: translateX(3px) rotate(15deg);
  transform-origin: top center;
  animation: nod 5s ease-in-out calc(var(--delay) + 1s) infinite;
}

@keyframes nod {
  0%, 100% {
    transform: translateX(3px) rotate(15deg);
  }
  50% {
    transform: translateX(3px) rotate(25deg);
  }
}

.bell {
  width: 10px;
  height: 14px;
  background: radial-gradient(
    ellipse at center,
    color-mix(in srgb, #f0ece4 90%, var(--bg)),
    color-mix(in srgb, #d8d4cc 70%, var(--bg))
  );
  border-radius: 3px 3px 6px 6px;
  position: relative;
}

.bell-inner {
  position: absolute;
  bottom: -3px;
  left: 50%;
  transform: translateX(-50%);
  width: 6px;
  height: 4px;
  background: color-mix(in srgb, #e8e4dc 80%, var(--bg));
  border-radius: 0 0 3px 3px;
}

/* Mobile */
@media (max-width: 640px) {
  .snowdrop-page {
    padding: 2rem 1rem 10rem;
  }
  .text-container {
    max-width: 90vw;
  }
}
</style>
