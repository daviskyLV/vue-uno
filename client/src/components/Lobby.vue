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
        <div class="game-card">
            <p><span class="game-title">Hello WOOORLD!!</span> (Players: 123/1234)</p>
            <button class="join-btn">Join Game</button>
        </div>
        <div class="game-card">
            <p><span class="game-title">Hello WOOORLD!!</span> (Players: 123/1234)</p>
            <button class="join-btn">Join Game</button>
        </div>
        <div class="game-card">
            <p><span class="game-title">Hello WOOORLD!!</span> (Players: 123/1234)</p>
            <button class="join-btn">Join Game</button>
        </div>
        <div class="game-card">
            <p><span class="game-title">Hello WOOORLD!!</span> (Players: 123/1234)</p>
            <button class="join-btn">Join Game</button>
        </div>
    </div>
</template>

<script lang="ts">
import { z } from 'zod';
import { type Game } from '../game_logic/Game';

const sessionSchema = z.array(z.object({
    gameId: z.string(),
    username: z.string().trim().min(3),
    token: z.string().trim().min(1)
}))

export default {
    data() {
        let g: Game[] = []
        return {
            games: g
        }
    },
    methods: {
        createGame() {
            const playerName = prompt("Enter your name")
            if (playerName === null || playerName.trim().length < 3) {
                alert("Username must be at least 3 characters long!")
                return
            }

            // TODO: create game and join game 
        },

        joinGame(gameId: string) {
            const sessionCookie = localStorage.getItem("session")
            let gameSessions: {gameId: string, username: string, token: string}[] = []

            // getting existing game sessions
            if (sessionCookie !== null) {
                try {
                    const parsedJSON = JSON.parse(sessionCookie)
                    gameSessions = sessionSchema.parse(parsedJSON)
                } catch (err) {
                    alert("Something went wrong while joining the game!")
                    return
                }
            }

            let playerInGame = -1 // -1 for false, index in gameSessions for true
            for (let i = 0; i < gameSessions.length; i++) {
                if (gameSessions[i].gameId === gameId) {
                    playerInGame = i
                    break
                }
            }

            // TODO: join game
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