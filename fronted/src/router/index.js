import { createRouter, createWebHashHistory } from 'vue-router'
import HomeView from '../views/HomeView.vue'

const routes = [
  {
    path: '/',
    name: 'home',
    component: HomeView
  },
  {
    path: '/usuario',
    name: 'usuario',
    component: function () {
      return import(/* webpackChunkName: "usuario" */ '../views/UserView.vue')
    }
  },
  {
    path: '/admin',
    name: 'admin',
    component: function () {
      return import(/* webpackChunkName: "admin" */ '../views/AdminView.vue')
    }
  }
]

const router = createRouter({
  history: createWebHashHistory(),
  routes
})

export default router
