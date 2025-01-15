import { Game } from "./game_logic/Game"
import express from 'express'
import http from "http"
import { Socket } from "socket.io"
import { Card, CardColor } from "./game_logic/Card"
import { createGame, fetchGameInfo, fetchGames, joinGame } from "./game-data"
import { drawCard, playCard } from "./game-actions"

const PORT = process.env.PORT ?? 3000

// Server setup
const app = express()
const server = http.createServer(app)
const io = require('socket.io')(server);

io.on("connection", (socket: Socket) => {
    socket.on("createGame", async (
        gameName: string,
        maxPlrs: number,
        plrName: string,
        callback: (gameId: string, token: string) => void
    ) => {
        createGame(io, gameName, maxPlrs, plrName, callback)
    })

    socket.on("joinGame", async (
        gameId: string,
        plrName: string,
        plrToken: string | undefined,
        callback: (game: Game | null, token: string) => void
    ) => {
        joinGame(io, gameId, plrName, plrToken, callback)
    })

    socket.on("fetchGames", async (
        callback: (games: Game[]) => void
    ) => {
       fetchGames(callback) 
    })

    socket.on("fetchGameInfo", async (
        gameId: string,
        plrToken: string | undefined,
        callback: (game: Game | null) => void
    ) => {
        fetchGameInfo(gameId, plrToken, callback)
    })

    socket.on("drawCard", async (
        gameId: string,
        plrToken: string,
        callback: (success: boolean) => void
    ) => {
        drawCard(io, gameId, plrToken, callback)
    })

    socket.on("playCard", async (
        gameId: string,
        plrToken: string,
        card: Card,
        wildcardOverride: CardColor,
        callback: (success: boolean) => void
    ) => {
        playCard(io, gameId, plrToken, card, wildcardOverride, callback)
    })
})

server.listen(PORT, () => console.log(`Server running on port ${PORT}`))