// ポップアップ同士の交通整理（同時に重ねて表示しないため）
// LoginBonusModal が開いている間は他のポップアップに待ってもらう

const CLOSED_EVENT = "boatbank:login-bonus-closed";

let loginBonusOpen = false;

export function setLoginBonusOpen(open: boolean) {
    loginBonusOpen = open;
    if (!open && typeof window !== "undefined") {
        window.dispatchEvent(new Event(CLOSED_EVENT));
    }
}

export function isLoginBonusOpen(): boolean {
    return loginBonusOpen;
}

/** ログインボーナスが閉じたら1回だけ呼ばれる。戻り値は解除関数 */
export function onLoginBonusClosed(cb: () => void): () => void {
    window.addEventListener(CLOSED_EVENT, cb, { once: true });
    return () => window.removeEventListener(CLOSED_EVENT, cb);
}
