import { createRouter, createWebHistory } from 'vue-router';
import Register from './components/Register.vue';
import Balances from './components/Balances.vue';
import Deposit from './components/Deposit.vue';
import Transfer from './components/Transfer.vue';

const router = createRouter({
  history: createWebHistory(),
  routes: [
    {
      path: '/',
      component: Register,
    },
    {
      path: '/transfer',
      children: [
        {
          path: '',
          component: Balances,
        },
        {
          path: ':id',
          component: Transfer,
        }
      ]
    },
    {
      path: '/deposit',
      component: Deposit,
    },
  ],
});

export default router;
