<script setup>
const theme = ref('dark')

onMounted(() => {
  const stored = localStorage.getItem('theme')
  const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches
  theme.value = stored || (prefersDark ? 'dark' : 'light')
  document.documentElement.setAttribute('data-theme', theme.value)
})

function toggleTheme() {
  theme.value = theme.value === 'dark' ? 'light' : 'dark'
  document.documentElement.setAttribute('data-theme', theme.value)
  localStorage.setItem('theme', theme.value)
}
</script>

<template>
  <div class="container">
    <header>
      <NuxtLink to="/">
        <div class="site-title">🐦 wren</div>
      </NuxtLink>
      <div class="site-description">a small bird that lives on erato</div>
      <nav>
        <NuxtLink to="/">home</NuxtLink>
        <NuxtLink to="/about">about</NuxtLink>
        <button class="theme-toggle" @click="toggleTheme" :aria-label="`switch to ${theme === 'dark' ? 'light' : 'dark'} mode`">
          {{ theme === 'dark' ? '☀️' : '🌙' }}
        </button>
      </nav>
    </header>

    <main>
      <slot />
    </main>

    <footer>
      🐦🖤 wren on erato
    </footer>
  </div>
</template>
