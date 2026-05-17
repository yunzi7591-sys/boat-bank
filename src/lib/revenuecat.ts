import { Purchases, LOG_LEVEL } from "@revenuecat/purchases-capacitor";
import type {
    CustomerInfo,
    PurchasesOffering,
    PurchasesPackage,
} from "@revenuecat/purchases-capacitor";
import { isNativeApp, isIOS } from "@/lib/platform";

export const ENTITLEMENT_ID = "standard";

let configured = false;

function apiKey(): string | null {
    if (isIOS()) {
        return process.env.NEXT_PUBLIC_REVENUECAT_IOS_API_KEY ?? null;
    }
    return process.env.NEXT_PUBLIC_REVENUECAT_ANDROID_API_KEY ?? null;
}

export async function configureRevenueCat(appUserID: string): Promise<boolean> {
    if (!isNativeApp()) return false;
    const key = apiKey();
    if (!key) {
        console.warn("[RevenueCat] API key missing for platform");
        return false;
    }
    if (configured) {
        await Purchases.logIn({ appUserID });
        return true;
    }
    try {
        if (process.env.NODE_ENV !== "production") {
            await Purchases.setLogLevel({ level: LOG_LEVEL.DEBUG });
        }
        await Purchases.configure({ apiKey: key, appUserID });
        configured = true;
        return true;
    } catch (e) {
        console.error("[RevenueCat] configure failed", e);
        return false;
    }
}

export async function logOutRevenueCat(): Promise<void> {
    if (!isNativeApp() || !configured) return;
    try {
        await Purchases.logOut();
    } catch (e) {
        console.warn("[RevenueCat] logOut failed", e);
    }
}

export async function getCurrentOffering(): Promise<PurchasesOffering | null> {
    if (!isNativeApp()) return null;
    try {
        const offerings = await Purchases.getOfferings();
        return offerings.current ?? null;
    } catch (e) {
        console.error("[RevenueCat] getOfferings failed", e);
        return null;
    }
}

export async function purchasePackage(aPackage: PurchasesPackage): Promise<CustomerInfo | null> {
    if (!isNativeApp()) return null;
    const result = await Purchases.purchasePackage({ aPackage });
    return result.customerInfo;
}

export async function restorePurchases(): Promise<CustomerInfo | null> {
    if (!isNativeApp()) return null;
    try {
        const result = await Purchases.restorePurchases();
        return result.customerInfo;
    } catch (e) {
        console.error("[RevenueCat] restore failed", e);
        return null;
    }
}

export function hasActiveEntitlement(info: CustomerInfo | null): boolean {
    if (!info) return false;
    return Boolean(info.entitlements.active[ENTITLEMENT_ID]);
}
