import * as jwt from "jsonwebtoken"
import { isError } from "./utils"

const JWT_SECRET = process.env.JWT_SECRET ?? "test"

export function encryptJWT(
    payload: object
): string {
    return jwt.sign(payload, JWT_SECRET, {algorithm: "HS256"})
}

export function decryptJWT(
    encrypted: string
): object {
    try {
        const payload = jwt.verify(encrypted, JWT_SECRET, {algorithms: ["HS256"], ignoreExpiration: true})
        return payload as object
    } catch (err) {
        console.warn("Failed to verify session!")
        console.log("test", err)
        if (isError(err)) {
            console.warn(err.message)
        }
        throw err
    }
}