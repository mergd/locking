import { createRouter as createTanStackRouter } from '@tanstack/react-router'
import { routeTree } from './routeTree.gen'

let router: ReturnType<typeof createTanStackRouter> | undefined

export function getRouter() {
  if (!router) {
    router = createTanStackRouter({
      routeTree,
      defaultPreload: 'intent',
      scrollRestoration: true,
    })
  }
  return router
}

declare module '@tanstack/react-router' {
  interface Register {
    router: Awaited<ReturnType<typeof getRouter>>
  }
}
