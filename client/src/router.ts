import { createRouter, createWebHistory } from "vue-router";
import GameRoom from "./components/GameRoom.vue";
import Lobby from "./components/Lobby.vue";

const routes = [
    {
        path: "/",
        name: "Lobby",
        component: Lobby
    },
    {
        path: "/game/:id",
        name: "Game",
        component: GameRoom,
        meta: { requiresAuth: true},
        props: true
    }
]

const router = createRouter({
    history: createWebHistory(),
    routes
})

router.beforeEach((to, from, next) => {
    const isAuthenticated = !!localStorage.getItem("session")
    if (to.meta.requiresAuth && !isAuthenticated) {
        next("/")
    } else {
        next()
    }
})



export default router