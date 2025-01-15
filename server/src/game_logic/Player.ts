import { copyCard, type Card } from "./Card"

export type Player = {
    username: string
    score: number
    hand?: Card[]
    calledUno: boolean
    visibleCardAmount: number
}

/**
 * Utility function to quickly create a new player object
 * @param username player name
 * @param score player's current score, default 0
 * @param hand player's current cards, default undefined
 * @param calledUno has player called uno, default false
 * @param visibleCardAmount how many cards the player shows to other players, default 0
 * @returns 
 */
export const createPlayer = (
    username: string,
    score: number = 0,
    hand: Card[] | undefined = undefined,
    calledUno: boolean = false,
    visibleCardAmount: number = 0
): Player => {
    return {
        username,
        score,
        calledUno,
        visibleCardAmount,
        hand
    }
}

/**
 * Performs a deep copy of the object
 * @param plr The player to deep copy
 */
export const copyPlayer = (plr: Player): Player => {
    let newHand: Card[] | undefined = undefined

    if (plr.hand !== undefined) {
        newHand = []
        plr.hand.forEach(c => {
            newHand?.push(copyCard(c))
        });
    }

    return {
        username: plr.username,
        score: plr.score,
        calledUno: plr.calledUno,
        visibleCardAmount: plr.visibleCardAmount,
        hand: newHand
    }
}

/**
 * Search and remove a card from player, removes only first found matching card
 * @param player The player from who to remove the card
 * @param card The card to remove
 * @param pureFunction Whether the function should act as pure and return a completely new player object, default false
 */
export const removeCard = (
    player: Player,
    card: Card,
    pureFunction: boolean = false
): Player => {
    if (pureFunction)
        player = copyPlayer(player)

    if (player.hand === undefined)
        throw new Error("Player hand is undefined!")

    // TODO:
    // FIX BUG WHERE IT REMOVES INDEX 0 CARD IF THERE ARE 2 EXACTLY SAME CARDS
    let matchingIndex = player.hand.findIndex(c => c.id === card.id)
    if (matchingIndex === -1)
        throw new Error("Card not found in player's hand!")

    player.hand.splice(matchingIndex, 1)
    return player
}

/**
 * Remove player hand from player object
 * @param player The player state to use
 * @param pureFunction Whether the function should act as pure and return a completely new player object, default false
 */
export const limitPlayerInfo = (
    player: Player,
    pureFunction: boolean = false
): Player => {
    if (pureFunction)
        player = copyPlayer(player)

    player.hand = undefined
    return player
}