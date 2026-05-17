import { createRemoteJWKSet, jwtVerify } from "jose";

const APPLE_ISSUER = "https://appleid.apple.com";
const APPLE_JWKS = createRemoteJWKSet(new URL("https://appleid.apple.com/auth/keys"));

export type AppleIdTokenPayload = {
    sub: string;
    email?: string;
    email_verified?: boolean | string;
    is_private_email?: boolean | string;
    aud: string;
    iss: string;
};

export async function verifyAppleIdentityToken(
    identityToken: string,
    audience: string,
): Promise<AppleIdTokenPayload> {
    const { payload } = await jwtVerify(identityToken, APPLE_JWKS, {
        issuer: APPLE_ISSUER,
        audience,
    });
    if (!payload.sub) throw new Error("apple identity token missing sub");
    return payload as AppleIdTokenPayload;
}
