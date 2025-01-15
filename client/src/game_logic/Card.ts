import { shuffleArray } from "../utils/utils"

export enum CardColor {
    Red = "Red",
    Yellow = "Yellow",
    Green = "Green",
    Blue = "Blue",
    Wild = "Wild"
}

export enum CardType {
    Number = "Number",
    Skip = "Skip",
    Reverse = "Reverse",
    Wild = "Wild",
    AddTwo = "Add Two",
    WildAddFour = "Wild Add Four"
}

/**
 * An Uno card, for unused "Wild" type cards color is set to Wild, otherwise color specifies which color it uses.
 * Value is only set for Number type cards to the number on the card.
 */
export type Card = {
    id: number
    color: CardColor
    type: CardType
    value?: number
}

/**
 * Create a full card deck
 * @returns Full Uno card deck
 */
export const createDeck = (): Card[] => {
    const cards: Card[] = []
    const colors = [CardColor.Red, CardColor.Yellow, CardColor.Green, CardColor.Blue]
    colors.forEach(col => {
        // Numbers from 1 to 9 (double)
        for (let i = 1; i < 10; i++) {
            cards.push({id: cards.length, color: col, type: CardType.Number, value: i})
            cards.push({id: cards.length, color: col, type: CardType.Number, value: i})
        }
        // Number 0
        cards.push({id: cards.length, color: col, type: CardType.Number, value: 0})

        // Special cards
        for (let i = 0; i < 2; i++) {
            cards.push({id: cards.length, color: col, type: CardType.Skip})
            cards.push({id: cards.length, color: col, type: CardType.Reverse})
            cards.push({id: cards.length, color: col, type: CardType.AddTwo})
        }
    });

    // Wildcards
    for (let i = 0; i < 4; i++) {
        cards.push({id: cards.length, color: CardColor.Wild, type: CardType.Wild})
        cards.push({id: cards.length, color: CardColor.Wild, type: CardType.WildAddFour})
    }

    return cards
}

/**
 * Performs a deep copy of the object
 * @param card The card to copy
 */
export const copyCard = (card: Card): Card => {
    return {
        id: card.id,
        color: card.color,
        type: card.type,
        value: card.value
    }
}

/**
 * Utility function to shuffle cards and ensure that wildcards have wild colors
 * @param cards Cards to reshuffle
 */
export const reshuffleCards = (cards: Card[]): Card[] => {
    // resetting wildcard colors
    for (let i = 0; i < cards.length; i++) {
        const c = cards[i];
        if (c.type === CardType.Wild || c.type === CardType.WildAddFour)
            cards[i].color = CardColor.Wild
    }

    return shuffleArray(cards)
}