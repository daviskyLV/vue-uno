import { addPlayer, createGame, Game, limitGameInfo } from "./game_logic/Game"
import express from 'express'
import http from "http"
import { Socket } from "socket.io"
import { decryptJWT, encryptJWT } from "./utils/security"

const PORT = process.env.PORT ?? 3000

// Where game rooms are saved
const games: {[id: string]: Game} = {}

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
        let game: Game
        try {
            game = createGame(gameName, maxPlrs, [plrName])
        } catch (err) {
            console.warn(`Failed to create game ${gameName}, with ${maxPlrs} max players and starter player ${plrName}`)
            callback("", "")
            return
        }

        games[game.id] = game
        const token = encryptJWT({plrName, gameId: game.id})
        callback(game.id, token)
        io.emit("newGame", limitGameInfo(game, [], true))
    })

    socket.on("joinGame", async (
        gameId: string,
        plrName: string,
        plrToken: string | undefined,
        callback: (game: Game | null, token: string) => void
    ) => {
        let game = games[gameId]
        if (game === undefined) {
            callback(null, "")
            return
        }

        const plrInGame = game.players.find(p => p.username === plrName)
        if (plrToken === undefined) {
            if (plrInGame !== undefined) {
                // player already in game
                callback(null, "")
                return
            }

            // adding player to game
            try {
                game = addPlayer(game, plrName)
                games[game.id] = game
                const token = encryptJWT({plrName, gameId: game.id})
                callback(limitGameInfo(game, [plrName], true), token)
                // notifying others that game state has changed
                io.emit("gameUpdate", game.id)
                return
            } catch (err) {
                callback(null, "")
                return
            }
        }

        // Player provided a token, using that to join
        try {
            const decoded = decryptJWT(plrToken)
            if (!(
                "plrName" in decoded && "gameId" in decoded &&
                typeof decoded.plrName === "string" && typeof decoded.gameId === "string"
            )) {
                callback(null, "")
                return
            }

            // verifying
            if (!(plrName === decoded.plrName && gameId === decoded.gameId &&
                plrInGame !== undefined
            )) {
                callback(null, "")
                return
            }

            // player already a part of game, sending back game info
            callback(limitGameInfo(game, [plrName], true), plrToken)
        } catch (err) {
            console.warn(`Error decoding JWT ${plrToken}`)
            callback(null, "")
            return
        }
    })
})

server.listen(PORT, () => console.log(`Server running on port ${PORT}`))