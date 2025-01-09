import * as jwt from "jsonwebtoken"

const JWT_SECRET = process.env.JWT_SECRET ?? "test"

export function encryptJWT(
    payload: object,
    expiresIn: number | string | undefined = undefined
): string {
    return jwt.sign(payload, JWT_SECRET, {algorithm: "HS256", expiresIn})
}

export function decryptJWT(
    encrypted: string,
    verifyTime: boolean = false
): object {
    try {
        const payload = jwt.verify(encrypted, JWT_SECRET, {algorithms: ["HS256"], ignoreExpiration: !verifyTime})
        return payload as object
    } catch (err) {
        console.warn("Failed to verify session!")
        throw err
    }
}