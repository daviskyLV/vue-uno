import { z } from "zod";

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

const gameSessionSchema = z.object({
  gameId: z.string(),
  username: z.string().trim().min(3),
  token: z.string().trim().min(1)
})
const sessionsCookieSchema = z.record(z.string(), gameSessionSchema);
export type GameSession = z.infer<typeof gameSessionSchema>;
export type SessionsCookie = z.infer<typeof sessionsCookieSchema>;

export const parseSessionsCookie = (
  sessionsCookie: string | null
): SessionsCookie => {
  let parsed: SessionsCookie = {}

  // getting existing game sessions
  if (sessionsCookie !== null) {
      const parsedJSON = JSON.parse(sessionsCookie)
      parsed = sessionsCookieSchema.parse(parsedJSON)
  }

  return parsed
}