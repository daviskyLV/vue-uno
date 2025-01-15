<template>
    <div class="topbar">
        <h1>Available Uno Games</h1>
        <button @click="createGame()" class="create-game-btn">Create a New Game</button>
    </div>
    <div class="game-list">
        <div v-for="game in games" :key="game.id" class="game-card">
            <p>
                <span class="game-title">{{ game.name }}</span>
                (Players: {{ game.players.length }}/{{ game.maxPlayers }})
            </p>
            <button @click="joinGame(game.id)" class="join-btn">Join Game</button>
        </div>
    </div>
</template>

<script lang="ts">
import { type Game } from '../game_logic/Game';
import { inject, onMounted, ref } from 'vue';
import { Socket } from 'socket.io-client';
import { parseSessionsCookie, type SessionsCookie } from '../utils/utils';

export default {
    setup() {
        const socket = inject<Socket>("socket")
        if (!socket) {
            throw new Error("Socket not provided")
        }

        const games = ref<Game[]>([])

        const newGame = () => {
            socket.on("newGame", (game: Game) => {
                games.value.push(game)
            })
        }
        onMounted(newGame)

        const fetchGames = () => {
            socket.emit("fetchGames", (returnedGames: Game[]) => {
                games.value = returnedGames
            })
        }
        onMounted(fetchGames)

        return {socket, games}
    },
    methods: {
        createGame() {
            const gameName = prompt("Enter game name")
            if (gameName === null || gameName.trim().length < 3) {
                alert("Game name must be at least 3 characters long!")
                return
            }

            const playerName = prompt("Enter your name")
            if (playerName === null || playerName.trim().length < 3) {
                alert("Username must be at least 3 characters long!")
                return
            }

            this.socket.emit("createGame",
                gameName, 4, playerName,
                (gameId: string, token: string) => {
                    if (gameId.length === 0 || token.length === 0) {
                        alert("Failed to create game")
                        return
                    }

                    let gameSessions: SessionsCookie = {}
                    try {
                        gameSessions = parseSessionsCookie(localStorage.getItem("sessions"))
                    } catch (err) {
                        alert("Failed to create game!")
                        return
                    }

                    gameSessions[gameId] = {gameId, token, username: playerName}
                    localStorage.setItem("sessions", JSON.stringify(gameSessions))
                    this.joinGame(gameId)
                }
            )
        },

        joinGame(gameId: string) {
            let gameSessions: SessionsCookie = {}
            try {
                gameSessions = parseSessionsCookie(localStorage.getItem("sessions"))
            } catch (err) {
                alert("Failed to join game!")
                return
            }

            const ses = gameSessions[gameId]
            let plrName = "error"
            let token: string | undefined = undefined
            if (ses === undefined) {
                const input = prompt("Enter your name")
                if (input === null || input.trim().length < 3) {
                    alert("Username must be at least 3 characters long!")
                    return
                }
                plrName = input
            } else {
                plrName = ses.username
                token = ses.token
            }

            this.socket.emit("joinGame",
                gameId, plrName, token,
                (game: Game | null, tok: string) => {
                    if (game === null) {
                        alert("Failed to join game!")
                        return
                    }
                    let gameSessions: SessionsCookie = {}
                    try {
                        gameSessions = parseSessionsCookie(localStorage.getItem("sessions"))
                    } catch (err) {
                        alert("Failed to create game!")
                        return
                    }

                    gameSessions[gameId] = {gameId, token: tok, username: plrName}
                    localStorage.setItem("sessions", JSON.stringify(gameSessions))
                    this.$router.push(`/game/${gameId}`)
                }
            )
        }
    }
}
</script>

<style scoped>
.game-list {
    font-family: 'Arial', sans-serif;
    display: flex;
    flex-wrap: wrap;
    justify-content: center;
    align-items: flex-start;
}

.game-card {
    display: flex;
    flex-direction: column;
    align-items: center;
    margin: 10px;
    padding: 5px;
    max-width: 200px;
}

.game-title {
    color: blue;
    font-weight: bold;
}

.topbar {
    font-family: 'Arial', sans-serif;
    display: flex;
    flex-direction: column;
    align-items: center;
}

.create-game-btn, .join-btn {
    border: none;
    color: white;
    text-align: center;
    text-decoration: none;
    display: inline-block;
    border-radius: 8px;
}

.create-game-btn {
    background-color: #046daa;
    font-size: 16px;
    padding: 8px 20px;
    width: 200px;
}

.join-btn {
    background-color: #04aa3b;
    padding: 8px 20px;
    font-size: 14px;
    width: 100%;
}

.create-game-btn:hover {
  box-shadow: 0 12px 16px 0 rgba(0,0,0,0.24), 0 17px 50px 0 rgba(0,0,0,0.19);
}

.join-btn:hover {
  box-shadow: 0 12px 16px 0 rgba(0,0,0,0.24), 0 17px 50px 0 rgba(0,0,0,0.19);
}
</style>