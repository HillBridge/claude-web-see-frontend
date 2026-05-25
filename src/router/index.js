import Vue from 'vue';
import VueRouter from 'vue-router';

Vue.use(VueRouter);

const routes = [
  {
    path: '/login',
    name: 'login',
    component: () => import(/* webpackChunkName: "login" */ '../views/LoginView.vue'),
    meta: { public: true }
  },
  {
    path: '/register',
    name: 'register',
    component: () => import(/* webpackChunkName: "register" */ '../views/RegisterView.vue'),
    meta: { public: true }
  },
  {
    path: '/',
    name: 'home',
    component: () => import(/* webpackChunkName: "home" */ '../views/HomeView.vue')
  },
  {
    path: '/errors',
    name: 'errors',
    component: () => import(/* webpackChunkName: "errors" */ '../views/ErrorsView.vue')
  },
  {
    path: '/performance',
    name: 'performance',
    component: () => import(/* webpackChunkName: "performance" */ '../views/PerformanceView.vue')
  },
  {
    path: '/test',
    name: 'test',
    component: () => import(/* webpackChunkName: "test" */ '../views/TestView.vue')
  },
  {
    path: '/about',
    name: 'about',
    component: () => import(/* webpackChunkName: "about" */ '../views/AboutView.vue')
  },
  {
    path: '/projects',
    name: 'projects',
    component: () => import(/* webpackChunkName: "projects" */ '../views/ProjectsView.vue')
  }
];

const router = new VueRouter({
  routes
});

router.beforeEach((to, _from, next) => {
  const isLoggedIn = !!localStorage.getItem('auth-token');
  if (!to.meta.public && !isLoggedIn) {
    next({ name: 'login' });
  } else if (to.name === 'login' && isLoggedIn) {
    next({ name: 'home' });
  } else {
    next();
  }
});

export default router;
