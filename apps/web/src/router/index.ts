import { createRouter, createWebHistory } from 'vue-router';
import RequestAssetView from '../views/RequestAssetView.vue';
import RequestsHistoryView from '../views/RequestsHistoryView.vue';

const routes = [
  {
    path: '/',
    name: 'RequestAsset',
    component: RequestAssetView
  },
  {
    path: '/history',
    name: 'RequestsHistory',
    component: RequestsHistoryView
  }
];

const router = createRouter({
  history: createWebHistory(),
  routes
});

export default router;
