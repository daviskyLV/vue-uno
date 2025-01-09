import { CardColor, CardType, type Card } from "./Card";

/**
 * Calculates which player will be next
 * @param currentPlayer Current player index
 * @param playerAmount Total amount of players
 * @param turnDirection Current turn direction (1 = forward, -1 = backward)
 * @param cardType Card type placed (if omitted, acts as regular number card)
 */
export function calculateNextPlayer(
    currentPlayer: number,
    playerAmount: number,
    turnDirection: number,
    cardType?: CardType
): number {
    if (cardType === undefined) cardType = CardType.Number
    if (cardType === CardType.Reverse) turnDirection *= -1;
    let movement = turnDirection;
    if (cardType === CardType.Skip) movement *= 2;
    return (currentPlayer + movement + playerAmount) % playerAmount;
}

/**
 * Check if the card is playable
 * @param card the card to play
 * @param topCard last card on discard pile
 * @returns Can the card be played
 */
export function isCardPlayable(card: Card, topCard: Card): boolean {
    return (
        card.color === topCard.color ||
        card.color === CardColor.Wild || topCard.color === CardColor.Wild ||
        (
            card.type === CardType.Number && topCard.type === CardType.Number &&
            card.value !== undefined && topCard.value !== undefined &&
            card.value === topCard.value
        )
    );
}

/**
 * Calculates the amount of points gained from the given cards
 * @param cards Cards to use
 */
export function calculatePoints(cards: Card[]): number {
    let total = 0;
    cards.forEach(c => {
        if (c.type === CardType.Number) {
            // Use default value 0 if c.value is undefined
            total += c.value ?? 0; 
        }
        if (c.type === CardType.AddTwo) { total += 20 }
        if (c.type === CardType.Reverse) { total += 20 }
        if (c.type === CardType.Skip) { total += 20 }
        if (c.type === CardType.Wild) { total += 50 }
        if (c.type === CardType.WildAddFour) { total += 50 }
    });
    return total;
}