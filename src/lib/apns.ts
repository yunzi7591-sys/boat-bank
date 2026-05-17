import apn from "@parse/node-apn";

let provider: apn.Provider | null = null;

export function getApnsProvider(): apn.Provider | null {
    if (provider) return provider;

    const keyId = process.env.APNS_KEY_ID;
    const teamId = process.env.APNS_TEAM_ID;
    const rawKey = process.env.APNS_KEY_P8;
    const bundleId = process.env.APNS_BUNDLE_ID || "jp.boatbank.app";
    const production = process.env.APNS_PRODUCTION !== "false";

    if (!keyId || !teamId || !rawKey) {
        console.warn("[APNs] not configured (APNS_KEY_ID / APNS_TEAM_ID / APNS_KEY_P8 missing)");
        return null;
    }

    const key = rawKey.replace(/\\n/g, "\n");

    provider = new apn.Provider({
        token: { key, keyId, teamId },
        production,
    });

    void bundleId;
    return provider;
}

export function getApnsBundleId(): string {
    return process.env.APNS_BUNDLE_ID || "jp.boatbank.app";
}
