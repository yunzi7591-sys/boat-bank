/**
 * 軽量な HTML サニタイザー（admin限定で使用）
 * 許可タグ・属性のホワイトリスト方式。XSS の主要ベクター（script/iframe/on*属性/javascript:URL）を除去。
 */

const ALLOWED_TAGS = new Set([
    "p", "br", "strong", "em", "u", "b", "i", "a", "ul", "ol", "li",
    "h1", "h2", "h3", "h4", "blockquote", "code", "pre", "hr", "span", "div",
]);

const ALLOWED_ATTRS: Record<string, Set<string>> = {
    a: new Set(["href", "target", "rel"]),
};

function safeUrl(url: string): string | null {
    const trimmed = url.trim();
    // javascript: / data: 系をブロック
    if (/^\s*(javascript|data|vbscript|file):/i.test(trimmed)) return null;
    // 許可するスキーム or 相対 URL のみ
    if (/^(https?:|mailto:|tel:|\/|#)/i.test(trimmed)) return trimmed;
    return null;
}

function escapeAttrValue(value: string): string {
    return value.replace(/&/g, "&amp;").replace(/"/g, "&quot;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
}

export function sanitizeHtml(html: string): string {
    if (!html) return "";

    let out = html;

    // コメント除去
    out = out.replace(/<!--[\s\S]*?-->/g, "");

    // 危険タグを中身ごと完全除去
    out = out.replace(
        /<(script|style|iframe|object|embed|link|meta|form|input|textarea|button|svg|math|video|audio|source)\b[^>]*>[\s\S]*?<\/\1\s*>/gi,
        "",
    );
    // 自己閉じ系の危険タグも除去
    out = out.replace(
        /<(script|style|iframe|object|embed|link|meta|form|input|textarea|button|svg|math|video|audio|source)\b[^>]*\/?>/gi,
        "",
    );

    // 開きタグの属性フィルタリング
    out = out.replace(/<([a-zA-Z][a-zA-Z0-9]*)((?:\s[^>]*)?)>/g, (_match, tag, attrs: string) => {
        const lowerTag = tag.toLowerCase();
        if (!ALLOWED_TAGS.has(lowerTag)) return "";

        const allowedAttrs = ALLOWED_ATTRS[lowerTag] ?? new Set<string>();
        let cleanAttrs = "";
        const attrRe = /\s([a-zA-Z_:][-a-zA-Z0-9_:.]*)\s*=\s*(?:"([^"]*)"|'([^']*)'|([^\s>]+))/g;
        let m: RegExpExecArray | null;
        while ((m = attrRe.exec(attrs)) !== null) {
            const name = m[1].toLowerCase();
            const value = m[2] ?? m[3] ?? m[4] ?? "";
            // on* イベント系は全拒否
            if (name.startsWith("on")) continue;
            // style 属性は禁止（CSS expression XSS 防止）
            if (name === "style") continue;
            if (!allowedAttrs.has(name)) continue;
            if (name === "href") {
                const safe = safeUrl(value);
                if (!safe) continue;
                cleanAttrs += ` href="${escapeAttrValue(safe)}"`;
            } else if (name === "target") {
                cleanAttrs += ` target="_blank"`;
            } else if (name === "rel") {
                // rel は強制で安全な値
                continue;
            }
        }

        // <a> タグには rel="noopener noreferrer nofollow" を強制付与
        if (lowerTag === "a") {
            cleanAttrs += ` rel="noopener noreferrer nofollow"`;
        }
        return `<${lowerTag}${cleanAttrs}>`;
    });

    // 閉じタグのフィルタリング
    out = out.replace(/<\/([a-zA-Z][a-zA-Z0-9]*)\s*>/g, (_match, tag) => {
        const lowerTag = tag.toLowerCase();
        return ALLOWED_TAGS.has(lowerTag) ? `</${lowerTag}>` : "";
    });

    return out;
}
