import { Game } from "../game_logic/Game";
import { decryptJWT } from "./security";

export function shuffleArray<T>(array: T[]): T[] {
    let currentIndex = array.length,  randomIndex;

    while (currentIndex != 0) {
        // Pick a remaining element.
        randomIndex = Math.floor(Math.random() * currentIndex);
        currentIndex--;

        // And swap it with the current element.
        [array[currentIndex], array[randomIndex]] = [
        array[randomIndex], array[currentIndex]];
    }

    return array;
};

export function isError(obj: unknown): obj is Error {
    return typeof obj === 'object' && obj !== null && 'message' in obj && 'name' in obj;
}

/**
 * Verify that the player is in game, returns undefined if not
 * @param token Player's game token
 * @param game The game player is a part of
 * @returns Player index in game, undefined or -1 if not in game
 */
export const verifyPlayerInGame = (
    token: string,
    game: Game
): number | undefined => {
    try {
        const decoded = decryptJWT(token)
        if (!(
            "plrName" in decoded && "gameId" in decoded &&
            typeof decoded.plrName === "string" && typeof decoded.gameId === "string"
        )) {
            return
        }

        // verifying
        const plrIndex = game.players.findIndex(p => p.username === decoded.plrName)
        if (plrIndex === -1 || decoded.gameId !== game.id) {
            return
        }

        return plrIndex
    } catch (err) {
        return
    }
}