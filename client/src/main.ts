import { createApp } from 'vue'
import './style.css'
import App from './App.vue'
import router from './router'
import { io } from 'socket.io-client'

const socket = io("http://localhost:3000", {
    transports: ["websocket"]
})

socket.on("connect", () => {
    console.log('Connected to Socket.io server via WebSocket');
})

socket.on('connect_error', (error) => {
    console.error('Connection error:', error);
  });

const app = createApp(App)
app.use(router)
app.provide("socket", socket)
app.mount('#app')
