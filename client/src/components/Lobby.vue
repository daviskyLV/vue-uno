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
import { z } from 'zod';
import { type Game } from '../game_logic/Game';
import { inject } from 'vue';
import { Socket } from 'socket.io-client';

type GameSession = {
    gameId: string
    username: string
    token: string
}

const sessionSchema = z.array(z.object({
    gameId: z.string(),
    username: z.string().trim().min(3),
    token: z.string().trim().min(1)
}))

const getGamesCookie = (): GameSession[] => {
    const sessionCookie = localStorage.getItem("sessions")
    let gameSessions: GameSession[] = []

    // getting existing game sessions
    if (sessionCookie !== null) {
        const parsedJSON = JSON.parse(sessionCookie)
        gameSessions = sessionSchema.parse(parsedJSON)
    }

    return gameSessions
}

export default {
    setup() {
        const socket = inject<Socket>("socket")
        if (!socket) {
            throw new Error("Socket not provided")
        }
        return {socket}
    },
    data() {
        let g: Game[] = []
        return { games: g }
    },
    created() {
        this.socket.on("newGame", (game: Game) => {
            this.games.push(game)
        })
        this.socket.emit("fetchGames", (games: Game[]) => {
            this.games = games
        })
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

                    let gameSessions: GameSession[] = []
                    try {
                        gameSessions = getGamesCookie()
                    } catch (err) {
                        alert("Failed to create game!")
                        return
                    }

                    gameSessions.push({gameId, token, username: playerName})
                    localStorage.setItem("sessions", JSON.stringify(gameSessions))
                    this.joinGame(gameId)
                }
            )
        },

        joinGame(gameId: string) {
            let gameSessions: GameSession[] = []
            try {
                gameSessions = getGamesCookie()
            } catch (err) {
                alert("Failed to join game!")
                return
            }

            let playerInGame = -1 // -1 for false, index in gameSessions for true
            for (let i = 0; i < gameSessions.length; i++) {
                if (gameSessions[i].gameId === gameId) {
                    playerInGame = i
                    break
                }
            }

            let plrName = "error"
            let token: string | undefined = undefined
            if (playerInGame === -1) {
                const input = prompt("Enter your name")
                if (input === null || input.trim().length < 3) {
                    alert("Username must be at least 3 characters long!")
                    return
                }
                plrName = input
            } else {
                const ses = gameSessions[playerInGame]
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
                    let gameSessions: GameSession[] = []
                    try {
                        gameSessions = getGamesCookie()
                    } catch (err) {
                        alert("Failed to create game!")
                        return
                    }

                    gameSessions.push({gameId, token: tok, username: plrName})
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
}

.topbar {
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