import { shuffleArray } from "../utils/utils"
import { CardColor, CardType, copyCard, createDeck, reshuffleCards, type Card } from "./Card"
import { calculateNextPlayer, calculatePoints, isCardPlayable } from "./GameUtils"
import { copyPlayer, createPlayer, removeCard, type Player } from "./Player"

export type Game = {
    name: string
    maxPlayers: number
    players: Player[]
    drawPile?: Card[]
    discardPile: Card[]
    direction: number
    currentPlayer: number
}

export const createGame = (
    name: string,
    maxPlayers: number = 4,
    initialPlayers: string[] = []
): Game => {
    if (maxPlayers < initialPlayers.length)
        throw new Error("Too many initial players!")

    const drawPile = shuffleArray(createDeck())
    const initialCard = drawPile.pop()
    if (initialCard === undefined)
        throw new Error("No cards in deck!")
    const discardPile: Card[] = [initialCard]

    const players: Player[] = []
    initialPlayers.forEach(playerName => {
        players.push(createPlayer(playerName, 0, []))
    })

    // Double loop to ensure that every player has at least 1 card
    for (let i = 0; i < 7; i++) {
        for (let j = 0; j < players.length; j++) {
            const plrHand = players[j].hand
            if (plrHand === undefined)
                continue;

            const drawnCard = drawPile.pop()
            if (drawnCard === undefined)
                break;

            plrHand.push(drawnCard)
        }
    }

    return {
        name,
        maxPlayers,
        players,
        drawPile,
        discardPile,
        direction: 1,
        currentPlayer: 0
    }
}

/**
 * Performs a deep copy of the object
 * @param game The game to deep copy
 */
export const copyGame = (game: Game): Game => {
    const newPlayers: Player[] = []
    game.players.forEach(p => {
        newPlayers.push(copyPlayer(p))
    });

    const newDiscard: Card[] = []
    game.discardPile.forEach(c => {
        newDiscard.push(copyCard(c))
    });

    let newDraw: Card[] | undefined = (game.drawPile ? [] : undefined)
    if (game.drawPile !== undefined && newDraw !== undefined) {
        game.drawPile.forEach(c => {
            newDraw.push(copyCard(c))
        });
    }

    return {
        name: game.name,
        maxPlayers: game.maxPlayers,
        players: newPlayers,
        drawPile: newDraw,
        discardPile: newDiscard,
        direction: game.direction,
        currentPlayer: game.currentPlayer
    }
}

/**
 * Add a new player to the game, throws an error if too many players or the player name already exists
 * @param game The game state to use
 * @param playerName Player name who wants to join
 * @param pureFunction Whether the function should act as pure and return a completely new game object, default false
 */
export const addPlayer = (
    game: Game,
    playerName: string,
    pureFunction: boolean = false
): Game => {
    if (pureFunction)
        game = copyGame(game)

    if (game.maxPlayers <= game.players.length)
        throw new Error("Game is full!")
    if (game.players.find(p => p.username === playerName))
        throw new Error("Player is already in the game!")
    if (game.drawPile === undefined)
        throw new Error("Game object has no draw pile defined!")


    const newPlayer: Player = {
        username: playerName,
        score: 0,
        calledUno: false,
        visibleCardAmount: 0,
        hand: []
    }
    game.players.push(newPlayer)

    // Drawing cards for the player
    for (let i = 0; i < 7; i++) {
        game = drawCard(game, game.players.length-1, false)
    }
    
    return game
}

/**
 * Make the player pick up a card from the draw pile, if no cards in draw pile, reshuffles the discard pile
 * @param game The game state to use
 * @param playerIndex player index who picks up a card
 * @param pureFunction Whether the function should act as pure and return a completely new game object, default false
 */
export const drawCard = (
    game: Game,
    playerIndex: number,
    pureFunction: boolean = false
): Game => {
    if (pureFunction)
        game = copyGame(game)

    if (game.drawPile === undefined)
        throw new Error("Game object has no draw pile defined!")
    if (game.players[playerIndex].hand === undefined)
        throw new Error("Player's hand is undefined!")

    let drawnCard = game.drawPile.pop()
    if (drawnCard === undefined) {
        // No cards in draw pile, reshuffling discard pile
        const topCard = game.discardPile.pop()
        if (topCard !== undefined) {
            game.discardPile = [topCard]
            game.drawPile = reshuffleCards(game.discardPile)
        }
        drawnCard = game.drawPile.pop()
        if (drawnCard !== undefined)
            game.players[playerIndex].hand.push(drawnCard)
    } else {
        game.players[playerIndex].hand.push(drawnCard)
    }

    return game
}

/**
 * Accuse the player of having 1 card and not calling uno
 * @param game The game state to use
 * @param playerIndex The player index who's accused of having 1 card
 * @param pureFunction Whether the function should act as pure and return a completely new game object, default false
 */
export const accuseUno = (
    game: Game,
    playerIndex: number,
    pureFunction: boolean = false
): Game => {
    if (pureFunction)
        game = copyGame(game)

    if (game.players[playerIndex].hand === undefined)
        throw new Error("Player's hand is undefined!")

    if (game.players[playerIndex].hand.length === 1 && !game.players[playerIndex].calledUno) {
        for (let i = 0; i < 4; i++) {
            game = drawCard(game, playerIndex, false)
        }
    }

    return game
}

/**
 * Skip the current player's turn
 * @param game The game state to use
 * @param pureFunction Whether the function should act as pure and return a completely new game object, default false
 */
export const skipTurn = (
    game: Game,
    pureFunction: boolean = false
): Game => {
    if (pureFunction)
        game = copyGame(game)

    game.currentPlayer = calculateNextPlayer(
        game.currentPlayer, game.players.length, game.direction
    )
    return game
}

/**
 * Make the current player attempt to play a card
 * @param game The game state to use
 * @param card Card to play
 * @param pureFunction Whether the function should act as pure and return a completely new game object, default false
 * @param wildcardColorOverride If placed card is Wild color, which color to use after it's been placed
 */
export const playCard = (
    game: Game,
    card: Card,
    pureFunction: boolean = false,
    wildcardColorOverride: CardColor = CardColor.Wild
): Game => {
    if (pureFunction)
        game = copyGame(game)

    if (card.color === CardColor.Wild && wildcardColorOverride === CardColor.Wild)
        throw new Error("Wildcard color override must be specified when a wild card is played")

    if (game.discardPile.length > 0) {
        if (!isCardPlayable(card, game.discardPile[game.discardPile.length-1]))
            throw new Error("Card isn't playable on last discard pile card!")
    }
    
    // Place card
    if (card.type === CardType.WildAddFour) {
        const nextPlrI = calculateNextPlayer(
            game.currentPlayer, game.players.length, game.direction
        )
        for (let i = 0; i < 4; i++) {
            game = drawCard(game, nextPlrI, false)
        }
        game.discardPile.push({...card, color: wildcardColorOverride})
    } else if (card.type === CardType.Wild) {
        game.discardPile.push({...card, color: wildcardColorOverride})
    } else if (card.type === CardType.AddTwo) {
        const nextPlrI = calculateNextPlayer(
            game.currentPlayer, game.players.length, game.direction
        )
        for (let i = 0; i < 4; i++) {
            game = drawCard(game, nextPlrI, false)
        }
    }
    if (card.type !== CardType.Wild && card.type !== CardType.WildAddFour) {
        game.discardPile.push({...card})
    }

    // Removing card from player
    game.players[game.currentPlayer] = removeCard(game.players[game.currentPlayer], card, false)
    // Other stuff
    game.currentPlayer = calculateNextPlayer(game.currentPlayer, game.players.length, game.direction, card.type)
    if (card.type === CardType.Reverse) {
        game.direction *= -1
    } 

    return game
}

/**
 * Finish previous round, award points to players who have 0 cards and start a new round
 * @param game The game state to use
 * @param pureFunction Whether the function should act as pure and return a completely new game object, default false
 */
export const newRound = (
    game: Game,
    pureFunction: boolean = false
): Game => {
    if (pureFunction)
        game = copyGame(game)

    // Awarding points to winners and clearing hands
    const winnersIndex: number[] = []
    let prizePool = 0
    for (let i = 0; i < game.players.length; i++) {
        const plrHand = game.players[i].hand
        if (plrHand === undefined)
            throw new Error(`Player ${i} has undefined hand!`)

        if (plrHand.length === 0)
            winnersIndex.push(i)
        else
            prizePool += calculatePoints(plrHand)

        game.players[i] = {...game.players[i], hand: []}
    }

    winnersIndex.forEach(i => {
        game.players[i].score += prizePool
    });

    // Setting up new game
    const drawPile = shuffleArray(createDeck())
    const initialCard = drawPile.pop()
    if (initialCard === undefined)
        throw new Error("No cards in deck!")
    const discardPile: Card[] = [initialCard]

    // Double loop to ensure that every player has at least 1 card
    for (let i = 0; i < 7; i++) {
        for (let j = 0; j < game.players.length; j++) {
            const plrHand = game.players[j].hand
            if (plrHand === undefined)
                continue;

            const drawnCard = drawPile.pop()
            if (drawnCard === undefined)
                break;

            plrHand.push(drawnCard)
        }
    }

    return {
        ...game,
        drawPile,
        discardPile,
        direction: 1,
        currentPlayer: 0
    }
}