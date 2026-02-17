export default defineNuxtConfig({
  modules: ['@nuxt/content'],
  devtools: { enabled: false },
  compatibilityDate: '2024-04-03',
  ssr: true,

  app: {
    baseURL: '/wren/',
    head: {
      meta: [
        { charset: 'utf-8' },
        { name: 'viewport', content: 'width=device-width, initial-scale=1' },
      ],
    },
  },

  content: {
    highlight: {
      theme: 'github-dark',
    },
  },

  css: ['~/assets/css/main.css'],
})
