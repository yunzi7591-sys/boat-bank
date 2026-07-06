/**
 * HTML サニタイザー（admin限定のニュース本文で使用）。
 * 自前の正規表現実装から、実績あるライブラリ（isomorphic-dompurify）ベースに変更。
 * 許可タグ・属性のホワイトリスト方式で、script/iframe/on*属性/javascript:URL 等を除去する。
 */
import DOMPurify from "isomorphic-dompurify";

const ALLOWED_TAGS = [
    "p", "br", "strong", "em", "u", "b", "i", "a", "ul", "ol", "li",
    "h1", "h2", "h3", "h4", "blockquote", "code", "pre", "hr", "span", "div",
];

// <a> に安全な rel / target を強制付与するフック（プロセス内で一度だけ登録）
let hookRegistered = false;
function ensureHook() {
    if (hookRegistered) return;
    DOMPurify.addHook("afterSanitizeAttributes", (node) => {
        const el = node as Element;
        if (el.tagName === "A") {
            el.setAttribute("rel", "noopener noreferrer nofollow");
            if (el.hasAttribute("target")) el.setAttribute("target", "_blank");
        }
    });
    hookRegistered = true;
}

export function sanitizeHtml(html: string): string {
    if (!html) return "";
    ensureHook();
    return DOMPurify.sanitize(html, {
        ALLOWED_TAGS,
        ALLOWED_ATTR: ["href", "target", "rel"],
        // 許可スキーム: http(s) / mailto / tel / 相対(/ ,#)。javascript:/data: 等は除外。
        ALLOWED_URI_REGEXP: /^(?:https?:|mailto:|tel:|\/|#)/i,
    });
}
