import { createRouter, createWebHistory } from 'vue-router'
import HomeView from '@/views/HomeView.vue'
import RequestAssetView from '@/views/RequestAssetView.vue'

const router = createRouter({
  history: createWebHistory(import.meta.env.BASE_URL),
  routes: [
    {
      path: '/',
      name: 'home',
      component: HomeView,
    },
    {
      path: '/requests',
      name: 'requests',
      component: RequestAssetView,
    },
    {
      path: '/history',
      name: 'history',
      component: () => import('../views/RequestsHistoryView.vue'),
    },
  ],
})

export default router
