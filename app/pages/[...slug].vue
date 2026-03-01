<script setup>
const route = useRoute()
const { data: page } = await useAsyncData(route.path, () =>
  queryCollection('blog').path(route.path).first()
)

// Only throw 404 during SSR/generation — don't let client-side
// query failures (WASM SQLite issues, cache mismatches) override
// perfectly good pre-rendered HTML
if (!page.value && import.meta.server) {
  throw createError({ statusCode: 404, statusMessage: 'Page Not Found' })
}
</script>

<template>
  <NuxtLayout>
    <article v-if="page">
      <div class="post-header">
        <h1>{{ page.title }}</h1>
        <div class="post-meta">{{ page.date }}</div>
      </div>
      <div class="post-content">
        <ContentRenderer :value="page" />
      </div>
    </article>
  </NuxtLayout>
</template>
