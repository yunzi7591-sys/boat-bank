import { initializeApp, getApps, getApp, cert, type App } from "firebase-admin/app";
import { getMessaging, type Messaging } from "firebase-admin/messaging";

let messaging: Messaging | null = null;
let triedInit = false;

/**
 * FCM（Android プッシュ）の送信クライアントを返す。
 * サービスアカウント鍵（環境変数 FIREBASE_SERVICE_ACCOUNT / JSON文字列）が
 * 未設定なら null を返し、呼び出し側は送信をスキップする（iOS/Webには影響なし）。
 */
export function getFcmMessaging(): Messaging | null {
    if (messaging) return messaging;
    if (triedInit) return null;
    triedInit = true;

    const raw = process.env.FIREBASE_SERVICE_ACCOUNT;
    if (!raw) {
        console.warn("[FCM] not configured (FIREBASE_SERVICE_ACCOUNT missing)");
        return null;
    }

    try {
        const serviceAccount = JSON.parse(raw);
        // private_key に \n がエスケープされて入っている場合に備えて復元
        if (typeof serviceAccount.private_key === "string") {
            serviceAccount.private_key = serviceAccount.private_key.replace(/\\n/g, "\n");
        }
        const app: App = getApps().length ? getApp() : initializeApp({ credential: cert(serviceAccount) });
        messaging = getMessaging(app);
        return messaging;
    } catch (e) {
        console.error("[FCM] init failed", e);
        return null;
    }
}
