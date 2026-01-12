// https://nuxt.com/docs/api/configuration/nuxt-config
export default defineNuxtConfig({
  compatibilityDate: "2024-11-01",
  devtools: { enabled: true },
  nitro: {
    routeRules: {
      "/**": {
        headers: {
          "Access-Control-Allow-Origin": "*",
        },
      },
    },
  },

  runtimeConfig: {
    public: {
      apiBase: process.env.NUXT_PUBLIC_API_BASE,
      backendUrl: process.env.NUXT_PUBLIC_BACKEND_URL,
      frontendUrl: process.env.NUXT_PUBLIC_FRONTEND_URL,
      wsUrl: process.env.NUXT_PUBLIC_WS_URL,
      nodeEnv: process.env.NUXT_PUBLIC_NODE_ENV,
    },
  },

  vite: {
    server: {
      host: "0.0.0.0",
      allowedHosts: true,
      port: 3000,
    },
  },
});
