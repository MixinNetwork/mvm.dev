import { createRouter, createWebHistory } from "vue-router";

const router = createRouter({
  history: createWebHistory(),
  routes: [
    {
      path: "/",
      component: () => import("@/components/Tutorial/TutorialLayout.vue"),
      children: [
        {
          path: "",
          name: "introduce",
          component: () => import("@/components/Tutorial/Introduce.vue"),
        },
        {
          path: "register",
          name: "register_user",
          component: () => import("@/components/Tutorial/Register.vue"),
        },
        {
          path: "call",
          name: "call",
          component: () => import("@/components/Tutorial/Call.vue"),
        },
      ],
    },
    {
      path: "/demo",
      component: () => import("@/components/Demo/DemoLayout.vue"),
      children: [
        {
          path: "",
          name: "register",
          component: () => import("@/components/Demo/Register.vue"),
        },
        {
          path: "deposit",
          name: "deposit",
          component: () => import("@/components/Demo/Deposit.vue"),
        },
        {
          path: "transfer",
          children: [
            {
              path: "",
              name: "balances",
              component: () => import("@/components/Demo/Balances.vue"),
            },
            {
              path: ":id",
              name: "transfer",
              component: () => import("@/components/Demo/Transfer.vue"),
            },
          ],
        },
      ],
    },
  ],
});

router.afterEach(() => {
  window.scrollTo({
    top: 0,
    left: 0,
  });
});

export default router;
