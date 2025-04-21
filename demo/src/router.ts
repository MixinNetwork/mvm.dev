import { createRouter, createWebHistory } from 'vue-router';
import Register from './components/Register.vue';
import Transfer from './components/Transfer.vue';
import Deposit from './components/Deposit.vue';

const router = createRouter({
  history: createWebHistory(),
  routes: [
    {
      path: '/',
      component: Register,
    },
    {
      path: '/transfer',
      component: Transfer,
    },
    {
      path: '/deposit',
      component: Deposit,
    },
  ],
});

export default router;
