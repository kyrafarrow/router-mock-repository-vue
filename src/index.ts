import {
  createRouter,
  createWebHashHistory,
  routeLocationKey,
  RouteLocationNormalizedLoaded,
  Router,
  routerKey,
} from 'vue-router'
import { config, VueWrapper } from '@vue/test-utils'
import { computed, ComputedRef, reactive, Ref } from 'vue'

export function routerMockPlugin(wrapper: VueWrapper<any>) {
  const router = createMockedRouter()

  // console.log('plugins', config.global.plugins)
  // config.global.plugins.push(router)
  console.log('hey')

  addGlobalInjections(router)

  return {}
}

export function addGlobalInjections(router: Router) {
  const route = createReactiveRouteLocation(router.currentRoute)

  config.global.provide[routerKey as any] = router
  config.global.provide[routeLocationKey as any] = route

  // console.log({ route })

  config.global.mocks.$router = router
  config.global.mocks.$route = route

  config.global.stubs.RouterLink = true
  config.global.stubs.RouterView = true

  return { router, route }
}

export function createMockedRouter() {
  const router = createRouter({
    history: createWebHashHistory(),
    routes: [
      {
        path: '/:pathMatch(.*)*',
        component: { render: () => null },
      },
    ],
  })

  const pushMock = jest.fn((to) => {
    router.currentRoute.value = router.resolve(to)
    // resolve pending navigation failure
    return Promise.resolve()
  })

  const replaceMock = jest.fn((to) => {
    router.currentRoute.value = router.resolve(to)
    // resolve pending navigation failure
    return Promise.resolve()
  })

  router.push = pushMock
  router.replace = replaceMock

  beforeEach(() => {
    pushMock.mockClear()
    replaceMock.mockClear()
  })

  return router
}

function createReactiveRouteLocation(
  route: Ref<RouteLocationNormalizedLoaded>
): RouteLocationNormalizedLoaded {
  return reactive(
    Object.keys(route.value).reduce(
      (newRoute, key) => {
        // @ts-ignore
        newRoute[key] = computed(() => route.value[key])
        return newRoute
      },
      {} as {
        [k in keyof RouteLocationNormalizedLoaded]: ComputedRef<
          RouteLocationNormalizedLoaded[k]
        >
      }
    )
  ) as RouteLocationNormalizedLoaded
}
