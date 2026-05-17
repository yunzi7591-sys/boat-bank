import jwt from "jsonwebtoken";

type Cached = { token: string; expiresAt: number };
let cached: Cached | null = null;

export function getAppleClientSecret(): string {
    if (cached && cached.expiresAt > Date.now() + 60 * 60 * 1000) {
        return cached.token;
    }

    const teamId = process.env.AUTH_APPLE_TEAM_ID;
    const keyId = process.env.AUTH_APPLE_KEY_ID;
    const clientId = process.env.AUTH_APPLE_ID;
    const rawKey = process.env.AUTH_APPLE_PRIVATE_KEY;

    if (!teamId || !keyId || !clientId || !rawKey) {
        throw new Error("Apple auth env vars missing");
    }

    const privateKey = rawKey.replace(/\\n/g, "\n");
    const now = Math.floor(Date.now() / 1000);
    const expiresIn = 180 * 24 * 60 * 60;

    const token = jwt.sign(
        {
            iss: teamId,
            iat: now,
            exp: now + expiresIn,
            aud: "https://appleid.apple.com",
            sub: clientId,
        },
        privateKey,
        {
            algorithm: "ES256",
            keyid: keyId,
        },
    );

    cached = { token, expiresAt: (now + expiresIn) * 1000 };
    return token;
}
