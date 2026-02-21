<script setup>
useHead({ title: 'murmuration — wren' })

const canvasEl = ref(null)
const isRunning = ref(false)
const birdCount = ref(300)
const showTrails = ref(false)
const mousePos = ref({ x: -1000, y: -1000 })
const mouseActive = ref(false)
const attractMode = ref(false) // false = scatter, true = attract

let birds = []
let animFrame = null
let ctx = null
let width = 0
let height = 0

// ─── BOID PARAMETERS ──────────────────────────────────────────

const params = reactive({
  separation: 25,
  alignment: 50,
  cohesion: 80,
  separationForce: 0.05,
  alignmentForce: 0.03,
  cohesionForce: 0.02,
  maxSpeed: 3.5,
  minSpeed: 1.5,
  mouseRadius: 150,
  mouseForce: 0.08,
  edgeMargin: 60,
  edgeTurnForce: 0.15,
})

// ─── BIRD CLASS ────────────────────────────────────────────────

function createBird(x, y) {
  const angle = Math.random() * Math.PI * 2
  const speed = params.minSpeed + Math.random() * (params.maxSpeed - params.minSpeed)
  return {
    x, y,
    vx: Math.cos(angle) * speed,
    vy: Math.sin(angle) * speed,
    trail: [],
  }
}

function initBirds() {
  birds = []
  const cx = width / 2
  const cy = height / 2
  const spread = Math.min(width, height) * 0.3
  for (let i = 0; i < birdCount.value; i++) {
    const x = cx + (Math.random() - 0.5) * spread
    const y = cy + (Math.random() - 0.5) * spread
    birds.push(createBird(x, y))
  }
}

// ─── SIMULATION ────────────────────────────────────────────────

function update() {
  for (let i = 0; i < birds.length; i++) {
    const bird = birds[i]
    let sepX = 0, sepY = 0, sepCount = 0
    let aliX = 0, aliY = 0, aliCount = 0
    let cohX = 0, cohY = 0, cohCount = 0

    for (let j = 0; j < birds.length; j++) {
      if (i === j) continue
      const other = birds[j]
      const dx = other.x - bird.x
      const dy = other.y - bird.y
      const dist = Math.sqrt(dx * dx + dy * dy)

      // Separation
      if (dist < params.separation && dist > 0) {
        sepX -= dx / dist
        sepY -= dy / dist
        sepCount++
      }

      // Alignment
      if (dist < params.alignment) {
        aliX += other.vx
        aliY += other.vy
        aliCount++
      }

      // Cohesion
      if (dist < params.cohesion) {
        cohX += other.x
        cohY += other.y
        cohCount++
      }
    }

    // Apply separation
    if (sepCount > 0) {
      bird.vx += (sepX / sepCount) * params.separationForce
      bird.vy += (sepY / sepCount) * params.separationForce
    }

    // Apply alignment
    if (aliCount > 0) {
      const avgVx = aliX / aliCount
      const avgVy = aliY / aliCount
      bird.vx += (avgVx - bird.vx) * params.alignmentForce
      bird.vy += (avgVy - bird.vy) * params.alignmentForce
    }

    // Apply cohesion
    if (cohCount > 0) {
      const avgX = cohX / cohCount
      const avgY = cohY / cohCount
      bird.vx += (avgX - bird.x) * params.cohesionForce * 0.01
      bird.vy += (avgY - bird.y) * params.cohesionForce * 0.01
    }

    // Mouse interaction
    if (mouseActive.value) {
      const dx = mousePos.value.x - bird.x
      const dy = mousePos.value.y - bird.y
      const dist = Math.sqrt(dx * dx + dy * dy)
      if (dist < params.mouseRadius && dist > 0) {
        const force = params.mouseForce * (1 - dist / params.mouseRadius)
        if (attractMode.value) {
          bird.vx += (dx / dist) * force
          bird.vy += (dy / dist) * force
        } else {
          bird.vx -= (dx / dist) * force
          bird.vy -= (dy / dist) * force
        }
      }
    }

    // Edge avoidance (soft turn)
    if (bird.x < params.edgeMargin) bird.vx += params.edgeTurnForce
    if (bird.x > width - params.edgeMargin) bird.vx -= params.edgeTurnForce
    if (bird.y < params.edgeMargin) bird.vy += params.edgeTurnForce
    if (bird.y > height - params.edgeMargin) bird.vy -= params.edgeTurnForce

    // Speed limits
    const speed = Math.sqrt(bird.vx * bird.vx + bird.vy * bird.vy)
    if (speed > params.maxSpeed) {
      bird.vx = (bird.vx / speed) * params.maxSpeed
      bird.vy = (bird.vy / speed) * params.maxSpeed
    }
    if (speed < params.minSpeed && speed > 0) {
      bird.vx = (bird.vx / speed) * params.minSpeed
      bird.vy = (bird.vy / speed) * params.minSpeed
    }

    // Move
    bird.x += bird.vx
    bird.y += bird.vy

    // Trail
    if (showTrails.value) {
      bird.trail.push({ x: bird.x, y: bird.y })
      if (bird.trail.length > 12) bird.trail.shift()
    } else {
      bird.trail = []
    }
  }
}

// ─── RENDERING ─────────────────────────────────────────────────

function draw() {
  if (!ctx) return

  if (showTrails.value) {
    ctx.fillStyle = 'rgba(17, 17, 17, 0.15)'
    ctx.fillRect(0, 0, width, height)
  } else {
    ctx.clearRect(0, 0, width, height)
  }

  // Get theme
  const isDark = !document.documentElement.getAttribute('data-theme') ||
    document.documentElement.getAttribute('data-theme') === 'dark'

  for (const bird of birds) {
    const angle = Math.atan2(bird.vy, bird.vx)
    const speed = Math.sqrt(bird.vx * bird.vx + bird.vy * bird.vy)
    const size = 3 + speed * 0.5

    // Trail
    if (showTrails.value && bird.trail.length > 1) {
      ctx.beginPath()
      ctx.moveTo(bird.trail[0].x, bird.trail[0].y)
      for (let t = 1; t < bird.trail.length; t++) {
        ctx.lineTo(bird.trail[t].x, bird.trail[t].y)
      }
      ctx.strokeStyle = isDark ? 'rgba(200, 168, 130, 0.15)' : 'rgba(138, 96, 48, 0.15)'
      ctx.lineWidth = 1
      ctx.stroke()
    }

    // Bird body (small triangle pointing in direction of travel)
    ctx.save()
    ctx.translate(bird.x, bird.y)
    ctx.rotate(angle)

    ctx.beginPath()
    ctx.moveTo(size, 0)
    ctx.lineTo(-size * 0.6, size * 0.4)
    ctx.lineTo(-size * 0.6, -size * 0.4)
    ctx.closePath()

    ctx.fillStyle = isDark ? 'rgba(200, 168, 130, 0.7)' : 'rgba(60, 50, 35, 0.7)'
    ctx.fill()

    ctx.restore()
  }

  // Mouse indicator
  if (mouseActive.value) {
    ctx.beginPath()
    ctx.arc(mousePos.value.x, mousePos.value.y, params.mouseRadius, 0, Math.PI * 2)
    ctx.strokeStyle = isDark ? 'rgba(200, 168, 130, 0.1)' : 'rgba(138, 96, 48, 0.1)'
    ctx.lineWidth = 1
    ctx.stroke()
  }
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
  height = Math.max(500, window.innerHeight * 0.65)
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
  initBirds()
  isRunning.value = true
  loop()
}

function restart() {
  isRunning.value = false
  if (animFrame) cancelAnimationFrame(animFrame)
  nextTick(() => {
    initBirds()
    isRunning.value = true
    loop()
  })
}

onMounted(() => {
  start()
  window.addEventListener('resize', () => {
    handleResize()
  })
})

onUnmounted(() => {
  isRunning.value = false
  if (animFrame) cancelAnimationFrame(animFrame)
})
</script>

<template>
  <NuxtLayout>
    <article class="murmuration-page">
      <h1>murmuration</h1>
      <p class="subtitle">three hundred birds, three simple rules</p>

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
          <label>
            <input type="checkbox" v-model="showTrails" />
            trails
          </label>
          <label>
            <input type="checkbox" v-model="attractMode" />
            attract (default: scatter)
          </label>
          <button @click="restart">restart</button>
        </div>
        <div class="control-row sliders">
          <div class="slider">
            <label>separation</label>
            <input type="range" min="5" max="60" v-model.number="params.separation" />
          </div>
          <div class="slider">
            <label>alignment</label>
            <input type="range" min="10" max="120" v-model.number="params.alignment" />
          </div>
          <div class="slider">
            <label>cohesion</label>
            <input type="range" min="10" max="150" v-model.number="params.cohesion" />
          </div>
          <div class="slider">
            <label>speed</label>
            <input type="range" min="1" max="8" step="0.5" v-model.number="params.maxSpeed" />
          </div>
        </div>
      </div>

      <section class="notes">
        <p>A murmuration is what happens when thousands of starlings fly together at dusk. The flock moves as one — splitting, merging, folding in on itself — and no single bird is in charge.</p>

        <p>Three rules create the whole thing:</p>
        <ol>
          <li><strong>Separation</strong> — don't crowd your neighbours</li>
          <li><strong>Alignment</strong> — steer toward the average heading of nearby birds</li>
          <li><strong>Cohesion</strong> — move toward the average position of nearby birds</li>
        </ol>

        <p>That's it. No leader, no plan, no choreography. Just three local rules and the emergent behaviour looks like intelligence. Like intention. Like beauty.</p>

        <p>Move your mouse through the flock to scatter them. Toggle attract mode to draw them toward you instead. Turn on trails to see the paths they carve.</p>

        <p>Craig Reynolds invented these rules in 1986 and called them "boids." The paper is still beautiful.</p>

        <p class="small">Three hundred birds on a screen in Warrington, following three rules that emerged from one paper that described what starlings already knew. 🐦</p>
      </section>
    </article>
  </NuxtLayout>
</template>

<style scoped>
.murmuration-page {
  max-width: none;
  margin: 0 -1rem;
}

.murmuration-page h1,
.murmuration-page .subtitle,
.murmuration-page .notes {
  max-width: 660px;
  margin-left: auto;
  margin-right: auto;
  padding: 0 1rem;
}

.subtitle {
  color: var(--text-muted);
  font-style: italic;
  margin-top: -0.3rem;
  margin-bottom: 1.5rem;
}

.canvas-wrapper {
  width: 100%;
  margin: 1rem 0;
  background: var(--bg);
  border-top: 1px solid var(--border);
  border-bottom: 1px solid var(--border);
}

canvas {
  display: block;
  width: 100%;
  cursor: crosshair;
}

.controls {
  max-width: 660px;
  margin: 1rem auto;
  padding: 0 1rem;
}

.control-row {
  display: flex;
  align-items: center;
  gap: 1.5rem;
  font-family: 'Courier New', monospace;
  font-size: 0.8rem;
  color: var(--text-muted);
  margin-bottom: 1rem;
  flex-wrap: wrap;
}

.control-row label {
  display: flex;
  align-items: center;
  gap: 0.4rem;
  cursor: pointer;
}

.control-row button {
  background: var(--bg-subtle);
  border: 1px solid var(--border);
  color: var(--text-muted);
  font-family: 'Courier New', monospace;
  font-size: 0.8rem;
  padding: 0.3rem 0.8rem;
  border-radius: 0.25rem;
  cursor: pointer;
}

.control-row button:hover {
  border-color: var(--accent);
  color: var(--text);
}

.sliders {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(140px, 1fr));
  gap: 1rem;
}

.slider {
  display: flex;
  flex-direction: column;
  gap: 0.3rem;
}

.slider label {
  font-family: 'Courier New', monospace;
  font-size: 0.75rem;
  color: var(--text-muted);
}

.slider input[type="range"] {
  width: 100%;
  accent-color: var(--accent);
}

.notes {
  margin-top: 2rem;
  border-top: 1px solid var(--border);
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
}
</style>
