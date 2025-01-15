<template>
    <div class="game-container">
        <h1 class="no-margin">Game Room: {{ game ? game.name : "Loading..." }}</h1>
        <p>Game Id: {{ id }}</p>
        <h2 v-if="player" class="no-margin">Username: <span class="player-name">{{ player.username }}</span></h2>
        <div v-if="game">
            <div class="column-center">
                <h3 v-if="game.players.length >= 2" class="no-margin">It's <span class="player-name">{{ game.players[game.currentPlayer].username }}</span>'s turn!</h3>
                <h3 v-else>Waiting for players...</h3>
                <div class="discard-pile column-center">
                    <p class="bolded">Top of Discard Pile:</p>
                    <div :class="['card', 'bolded', lastCard ? lastCard.color : 'Wild']">
                        {{ lastCard === null ? "-" :
                            lastCard.type === "Number" ? `Value: ${lastCard.value}, Type: Number` :
                            `Type: ${lastCard.type}`
                        }}
                    </div>
                </div>
            </div>
            <div class="player-list">
                <h3 class="no-margin">Players:</h3>
                <div class="leaderboard">
                    <p v-for="(plr, plrIndex) in game.players" :key="plrIndex"
                        :class="[plrIndex === game.currentPlayer ? 'underlined' : '', 'player-entry', 'no-margin']">
                        <span class="player-name">{{ plr.username }}</span> (score: {{ plr.score }})
                    </p>
                </div>
            </div>
            <div class="player-hand column-center">
                <h3 class="small-margin">Your Hand:</h3>
                <div class="row-center">
                    <div class="small-margin column-center" v-for="(card, cardIndex) in player?.hand" :key="card.id">
                        <div :class="['card', 'bolded', card.color]">
                            {{ 
                                card.value !== undefined
                                ? `Value: ${card.value}, Type: Number`
                                : `Type: ${card.type}`    
                            }}
                        </div>
                        <button class="play-button"
                            @click="playCard(card)"
                            :disabled="playersTurn ? undefined : true"
                        >Play</button>
                        <button v-if="card.type === 'Wild' || card.type === 'Wild Add Four'"
                            class="draw-card-button"
                            @click="changeCardColor(cardIndex)"
                        >Switch Color</button>
                    </div>
                </div>
                <button class="draw-card-button"
                    @click="drawCard()"
                    :disabled="playersTurn ? undefined : true"
                >Draw Card and Skip Turn</button>
            </div>
            
        </div>
    </div>
</template>

<script lang="ts">
import { inject, onMounted, ref } from 'vue';
import { playCard, type Game } from '../game_logic/Game';
import type { Socket } from 'socket.io-client';
import { parseSessionsCookie, type GameSession, type SessionsCookie } from '../utils/utils';
import { CardColor, CardType, type Card } from '../game_logic/Card';
import { type Player } from '../game_logic/Player';
import { useRouter } from 'vue-router';

const getGameSession = (cookie: string | null, gameId: string): GameSession | undefined => {
    let gameSessions: SessionsCookie = {}
    try {
        gameSessions = parseSessionsCookie(cookie)
    } catch (err) {
        return
    }

    return gameSessions[gameId]
}

export default {
    props: ["id"],
    setup(props, { emit }) {
        const router = useRouter()
        const socket = inject<Socket>("socket")
        if (!socket) {
            throw new Error("Socket not provided")
        }

        const game = ref<Game | null>(null)
        const lastCard = ref<Card | null>(null)
        const player = ref<Player | null>(null)
        const playersTurn = ref<boolean>(false)

        const joinGame = () => {
            const ses: GameSession | undefined = getGameSession(localStorage.getItem("sessions"), props.id)
            if (ses === undefined) { router.push(`/`); return }

            socket.emit("joinGame", 
                ses.gameId, ses.username, ses.token,
                (returnedGame: Game | null, tok: string) => {
                    console.log("returned game from join game", returnedGame)
                    if (returnedGame === null) {
                        router.push(`/`)
                        return
                    }

                    game.value = returnedGame
                    if (returnedGame.discardPile.length > 0) 
                        lastCard.value = returnedGame.discardPile[returnedGame.discardPile.length-1]
                    player.value = returnedGame.players.find(p => p.username === ses.username) ?? null
                    playersTurn.value = 
                        returnedGame.players[returnedGame.currentPlayer].username === ses.username
                        && returnedGame.players.length >= 2
                }
            )
        }
        onMounted(joinGame)

        const gameUpdate = () => {
            const ses: GameSession | undefined = getGameSession(localStorage.getItem("sessions"), props.id)
            if (ses === undefined) { return }

            socket.on("gameUpdate", (gameId: string) => {
                if (gameId !== props.id)
                    return

                socket.emit("fetchGameInfo",
                    gameId, ses.token,
                    (returnedGame: Game | null) => {
                        console.log("fetch game returned: ", returnedGame)
                        game.value = returnedGame
                        if (returnedGame === null) {
                            lastCard.value = null
                            player.value = null
                            playersTurn.value = false
                            return
                        }

                        if (returnedGame.discardPile.length > 0) 
                            lastCard.value = returnedGame.discardPile[returnedGame.discardPile.length-1]
                        player.value = returnedGame.players.find(p => p.username === ses.username) ?? null
                        game.value = returnedGame
                        playersTurn.value =
                            returnedGame.players[returnedGame.currentPlayer].username === ses.username
                            && returnedGame.players.length >= 2
                    }
                )
            })
        }
        onMounted(gameUpdate)

        return {socket, game, lastCard, player, playersTurn}
    },
    methods: {
        changeCardColor(cardIndex: number) {
            if (this.player === null || this.player.hand === undefined)
                return

            const hand = this.player.hand
            const colors = [CardColor.Red, CardColor.Blue, CardColor.Green, CardColor.Yellow, CardColor.Wild]
            if (hand[cardIndex].type !== CardType.Wild && hand[cardIndex].type !== CardType.WildAddFour)
                return

            const curCol = colors.findIndex(c => hand[cardIndex].color === c)
            if (curCol === -1)
                return
            if (curCol === colors.length-1) {
                hand[cardIndex].color = colors[0]
            } else {
                hand[cardIndex].color = colors[curCol+1]
            }
        },
        playCard(card: Card) {
            if (this.game === null || !this.playersTurn)
                return
            
            const ses: GameSession | undefined = getGameSession(localStorage.getItem("sessions"), this.id)
            if (ses === undefined) {
                this.$router.push(`/`)
                return
            }

            if (card.color === CardColor.Wild) {
                alert("Wildcard color can't be Wild!")
                return
            }

            if (card.type === CardType.Wild || card.type === CardType.WildAddFour) {
                this.socket.emit("playCard",
                    this.id, ses.token, {...card, color: CardColor.Wild}, card.color,
                    (_successful: boolean) => {}
                )
            } else {
                this.socket.emit("playCard",
                    this.id, ses.token, card, card.color,
                    (_successful: boolean) => {}
                )
            }

            
        },
        drawCard() {
            console.log("Pressed draw card!")
            if (this.game === null || !this.playersTurn)
                return

            const ses: GameSession | undefined = getGameSession(localStorage.getItem("sessions"), this.id)
            if (ses === undefined) {
                this.$router.push(`/`)
                return
            }

            this.socket.emit("drawCard",
                this.id, ses.token, 
                (_successful: boolean) => {}
            )
        }
    }
}
</script>

<style scoped>
.underlined { text-decoration: underline; }
.no-margin { margin: 0; }
.small-margin { margin: 5px; }
.bolded { font-weight: bold; }

.game-container {
    font-family: 'Arial', sans-serif;
    display: flex;
    flex-direction: column;
    align-items: center;
    max-width: 1200px;
    min-width: 800px;
    margin: 0 auto
}

.player-name {
    font-weight: bold;
    color: green;
}

.player-list {
    position: absolute;
    top: 15px;
}

.card {
    display: inline-block;
    width: 80px;
    height: 120px;
    padding: 10px;
    border-radius: 8px;
    text-align: center;
    font-size: 1.2em;
    color: black;  /* No white text */
}

.discard-pile {
    margin: 5px 0;
}

.Red {
    background-color: #e74c3c;
}

.Green {
    background-color: #27ae60;
}

.Blue {
    background-color: #3498db;
}

.Yellow {
    background-color: #f1c40f;
}

.Wild {
    background-color: #e90ff1;
}

.player-hand {
    margin: 20px 0;
}

.row-center {
    display: flex;
    justify-content: center;
    flex-wrap: wrap;
    flex-direction: row;
}

.column-center {
    display: flex;
    align-items: center;
    flex-direction: column;
}

.play-button {
    font-weight: bold;
    margin: 7px;
    background-color: #2ecc71;
    color: black;  /* No white text */
    border: none;
    padding: 8px 12px;
    border-radius: 4px;
    cursor: pointer;
    transition: background-color 0.3s ease;
}

.play-button:hover {
    background-color: #27ae60;
}

.draw-card-button {
    font-weight: bold;
    margin: 7px;
    background-color: #e67e22;
    color: black;  /* No white text */
    border: none;
    padding: 10px 16px;
    border-radius: 4px;
    cursor: pointer;
    transition: background-color 0.3s ease;
}

.draw-card-button:hover {
    background-color: #d35400;
}
</style>