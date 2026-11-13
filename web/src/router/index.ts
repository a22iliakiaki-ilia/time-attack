import { createRouter, createWebHistory } from 'vue-router'
import GameBoard from '../views/GameBoard.vue'

const router = createRouter({
  history: createWebHistory(import.meta.env.BASE_URL),
  routes: [
    {
      path: '/',
      name: 'gameboard',
      component: GameBoard,
    },
  ],
})

export default router
