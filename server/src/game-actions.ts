import { games } from "./game-data"
import { Card, CardColor } from "./game_logic/Card"
import { skipTurn, drawCard as gameDrawCard, newRound, playCard as gamePlayCard } from "./game_logic/Game"
import { verifyPlayerInGame } from "./utils/utils"

export const drawCard = (
    socketio: any,
    gameId: string,
    plrToken: string,
    callback: (success: boolean) => void
) => {
    const game = games[gameId]
    if (game === undefined) {
        callback(false)
        return
    }

    const plrIndex = verifyPlayerInGame(plrToken, game)
    if (plrIndex === undefined) {
        callback(false)
        return
    }

    try {
        gameDrawCard(game, plrIndex)
        skipTurn(game)
        callback(true)
        socketio.emit("gameUpdate", game.id)
    } catch (err) {
        callback(false)
    }
}

export const playCard = (
    socketio: any,
    gameId: string,
    plrToken: string,
    card: Card,
    wildcardOverride: CardColor,
    callback: (success: boolean) => void
) => {
    const game = games[gameId]
    if (game === undefined) {
        callback(false)
        return
    }

    const plrIndex = verifyPlayerInGame(plrToken, game)
    if (plrIndex === undefined || game.currentPlayer !== plrIndex) {
        callback(false)
        return
    }

    try {
        gamePlayCard(game, card, false, wildcardOverride)
        callback(true)
        const plr = game.players[plrIndex]
        if (plr.hand !== undefined) {
            if (plr.hand.length === 0) {
                socketio.emit("roundWon", game.id, plr.username)
                newRound(game)
            }
        }
        socketio.emit("gameUpdate", game.id)
    } catch (err) {
        callback(false)
    }
}