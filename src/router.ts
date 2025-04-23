import { createRouter, createWebHistory } from 'vue-router';
import Register from './components/Demo/Register.vue';
import Balances from './components/Demo/Balances.vue';
import Deposit from './components/Demo/Deposit.vue';
import Transfer from './components/Demo/Transfer.vue';
import DemoLayout from './components/Demo/DemoLayout.vue';
import TutorialLayout from './components/Tutorial/TutorialLayout.vue';
import Introduce from './components/Tutorial/Introduce.vue';
import RegisterTutorial from './components/Tutorial/Register.vue';
import Call from './components/Tutorial/Call.vue';

const router = createRouter({
  history: createWebHistory(),
  routes: [
    {
      path: '/',
      component: TutorialLayout,
      children: [
        {
          path: '',
          name: 'introduce',
          component: Introduce,
        },
        {
          path: 'register',
          name: 'register_user',
          component: RegisterTutorial,
        },
        {
          path: 'call',
          name: 'call',
          component: Call,
        },
      ],
    },
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
