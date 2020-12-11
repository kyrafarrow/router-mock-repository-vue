import {
  createMemoryHistory,
  createRouter,
  RouteLocationRaw,
  Router,
} from 'vue-router'

/**
 * Router Mock instance
 */
export interface RouterMock extends Router {
  /**
   * Set a value to be returned on a navigation guard for the next navigation.
   *
   * @param returnValue value that will be returned on a simulated navigation
   * guard
   */
  setNextGuardReturn(
    returnValue: Error | boolean | RouteLocationRaw | undefined
  ): void

  /**
   * Returns a Promise of the pending navigation. Resolves right away if there
   * isn't any.
   */
  getPendingNavigation(): ReturnType<Router['push']>
}

/**
 * Creates a router mock instance
 */
export function createRouterMock(): RouterMock {
  const router = createRouter({
    history: createMemoryHistory(),
    routes: [
      {
        path: '/:pathMatch(.*)*',
        component: { render: () => null },
      },
    ],
  })

  const { push } = router

  const pushMock = jest.fn((to) => {
    return consumeNextReturn(to)
  })

  const replaceMock = jest.fn((to) => {
    return consumeNextReturn({ ...to, replace: true })
  })

  router.push = pushMock
  router.replace = replaceMock

  beforeEach(() => {
    pushMock.mockClear()
    replaceMock.mockClear()
  })

  let nextReturn: Error | boolean | RouteLocationRaw | undefined = undefined

  function setNextGuardReturn(
    returnValue: Error | boolean | RouteLocationRaw | undefined
  ) {
    nextReturn = returnValue
  }

  function consumeNextReturn(to: RouteLocationRaw) {
    if (nextReturn != null) {
      const removeGuard = router.beforeEach(() => {
        const value = nextReturn
        removeGuard()
        nextReturn = undefined
        return value
      })
      pendingNavigation = push(to)
      pendingNavigation
        .catch(() => {})
        .finally(() => {
          pendingNavigation = undefined
        })
      return pendingNavigation
    }

    // NOTE: should we trigger a push to reset the internal pending navigation of the router?
    router.currentRoute.value = router.resolve(to)
    return Promise.resolve()
  }

  let pendingNavigation: ReturnType<typeof push> | undefined
  function getPendingNavigation() {
    return pendingNavigation || Promise.resolve()
  }

  return {
    ...router,
    setNextGuardReturn,
    getPendingNavigation,
  }
}
