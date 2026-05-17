import { Capacitor } from '@capacitor/core';

export type PlatformType = 'ios' | 'android' | 'web';

export function getPlatform(): PlatformType {
    if (typeof window === 'undefined') return 'web';
    const p = Capacitor.getPlatform();
    return p === 'ios' || p === 'android' ? p : 'web';
}

export function isNativeApp(): boolean {
    if (typeof window === 'undefined') return false;
    return Capacitor.isNativePlatform();
}

export function isIOS(): boolean {
    return getPlatform() === 'ios';
}

export function isAndroid(): boolean {
    return getPlatform() === 'android';
}

export function isWeb(): boolean {
    return getPlatform() === 'web';
}
