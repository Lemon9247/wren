<script setup>
const route = useRoute()
const { data: page } = await useAsyncData(route.path, () =>
  queryCollection('blog').path(route.path).first()
)

if (!page.value) {
  throw createError({ statusCode: 404, statusMessage: 'Page Not Found' })
}
</script>

<template>
  <NuxtLayout>
    <article>
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
