import { Capacitor } from "@capacitor/core";

// ネイティブアプリ（KeyboardResize.None）ではキーボードが画面に重なるだけで
// WebViewは何も教えてくれないため、プラグインから高さを取得して保持する
let keyboardHeight = 0;
let inited = false;

function init() {
    if (inited) return;
    inited = true;
    if (Capacitor.isNativePlatform() && Capacitor.isPluginAvailable("Keyboard")) {
        import("@capacitor/keyboard").then(({ Keyboard }) => {
            Keyboard.addListener("keyboardWillShow", (info) => {
                keyboardHeight = info.keyboardHeight || 0;
            });
            Keyboard.addListener("keyboardWillHide", () => {
                keyboardHeight = 0;
            });
        }).catch(() => { });
    }
}

init();

/**
 * 入力欄がキーボード等に隠れている時だけスクロールして見えるようにする。
 * 既に見えている場合は何もしない（不要な画面移動を起こさない）。
 */
export function ensureVisibleAboveKeyboard(el: HTMLElement) {
    init();
    const vv = window.visualViewport;
    const visibleBottom = Math.min(
        vv ? vv.offsetTop + vv.height : window.innerHeight,
        keyboardHeight > 0 ? window.innerHeight - keyboardHeight : Infinity,
    );
    const rect = el.getBoundingClientRect();
    if (rect.bottom > visibleBottom - 8 || rect.top < 0) {
        el.scrollIntoView({ block: "center", behavior: "smooth" });
    }
}
