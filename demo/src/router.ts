import { createRouter, createWebHistory } from 'vue-router';
import Register from './components/Register.vue';
import Balances from './components/Balances.vue';
import Deposit from './components/Deposit.vue';
import Transfer from './components/Transfer.vue';
import DemoLayout from './components/DemoLayout.vue';

const router = createRouter({
  history: createWebHistory(),
  routes: [
    {
      path: '/demo',
      component: DemoLayout,
      children: [
        {
          path: '',
          name: 'register',
          component: Register,
        },
        {
          path: 'deposit',
          name: 'deposit',
          component: Deposit,
        },
        {
          path: 'transfer',
          children: [
            {
              path: '',
              name: 'balances',
              component: Balances,
            },
            {
              path: ':id',
              name: 'transfer',
              component: Transfer,
            }
          ]
        },
      ],
    },
  ],
});

export default router;
