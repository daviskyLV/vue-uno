import { addPlayer, createGame as createNewGame, Game, limitGameInfo } from "./game_logic/Game";
import { decryptJWT, encryptJWT } from "./utils/security";
import { verifyPlayerInGame } from "./utils/utils";

// Where game rooms are saved
export const games: {[id: string]: Game} = {}

export const fetchGames = (
    callback: (games: Game[]) => void
) => {
    let gs: Game[] = []
    for (const id in games) {
        if (games.hasOwnProperty(id)) {
            gs.push(limitGameInfo(games[id], [], true))
        }
    }
    gs.sort((a: Game, b: Game) => a.id.localeCompare(b.id))
    callback(gs)
}


export const fetchGameInfo = (
    gameId: string,
    plrToken: string | undefined,
    callback: (game: Game | null) => void
) => {
    const game = games[gameId]
    if (game === undefined) {
        callback(null)
        return
    }

    if (plrToken === undefined) {
        callback(limitGameInfo(game, [], true))
        return
    }

    const plrIndex = verifyPlayerInGame(plrToken, game)
    if (plrIndex === undefined) {
        callback(null)
        return
    }

    callback(limitGameInfo(game, [game.players[plrIndex].username], true))
}

export const createGame = (
    socketio: any,
    gameName: string,
    maxPlrs: number,
    plrName: string,
    callback: (gameId: string, token: string) => void
) => {
    let game: Game
    try {
        game = createNewGame(gameName, maxPlrs, [plrName])
    } catch (err) {
        console.warn(`Failed to create game ${gameName}, with ${maxPlrs} max players and starter player ${plrName}`)
        callback("", "")
        return
    }

    games[game.id] = game
    const token = encryptJWT({plrName, gameId: game.id})
    callback(game.id, token)
    socketio.emit("newGame", limitGameInfo(game, [], true))
}

export const joinGame = (
    socketio: any,
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
    if (plrToken === undefined || plrToken === null) {
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
            socketio.emit("gameUpdate", game.id)
            return
        } catch (err) {
            console.warn("failed to add player to game", err)
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
}