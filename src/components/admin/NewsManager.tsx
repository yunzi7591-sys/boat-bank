"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import { createNews, getNewsList, deleteNews } from "@/actions/admin-news";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Eye, EyeOff, Trash2 } from "lucide-react";

type NewsItem = {
    id: string;
    title: string;
    content: string;
    isPublished: boolean;
    createdAt: string;
};

export function NewsManager() {
    const [newsList, setNewsList] = useState<NewsItem[]>([]);
    const [loading, setLoading] = useState(false);
    const [title, setTitle] = useState("");
    const [content, setContent] = useState("");
    const [message, setMessage] = useState("");
    const [showPreview, setShowPreview] = useState(false);
    const editorRef = useRef<HTMLDivElement>(null);

    const execCmd = useCallback((command: string, value?: string) => {
        document.execCommand(command, false, value);
        if (editorRef.current) {
            setContent(editorRef.current.innerHTML);
        }
    }, []);

    const fetchNews = async () => {
        const data = await getNewsList();
        setNewsList(data as any);
    };

    useEffect(() => {
        fetchNews();
    }, []);

    const handleCreate = async () => {
        if (!title || !content) {
            setMessage("タイトルと本文を入力してください");
            return;
        }
        setLoading(true);
        setMessage("");
        const result = await createNews({ title, content });
        if (result.error) {
            setMessage(result.error);
        } else {
            setMessage("ニュースを投稿しました");
            setTitle("");
            setContent("");
            if (editorRef.current) editorRef.current.innerHTML = "";
            setShowPreview(false);
            await fetchNews();
        }
        setLoading(false);
    };

    const handleDelete = async (id: string) => {
        if (!confirm("このニュースを削除しますか？")) return;
        setLoading(true);
        const result = await deleteNews(id);
        if (result.error) {
            setMessage(result.error);
        } else {
            setMessage("ニュースを削除しました");
            await fetchNews();
        }
        setLoading(false);
    };

    return (
        <div className="space-y-6">
            {/* 投稿フォーム */}
            <div className="space-y-3">
                <h3 className="text-sm font-bold text-slate-700">ニュース投稿</h3>
                <div>
                    <label className="text-xs font-bold text-slate-500 mb-1 block">タイトル</label>
                    <Input
                        value={title}
                        onChange={(e) => setTitle(e.target.value)}
                        placeholder="例: メンテナンスのお知らせ"
                    />
                </div>
                <div>
                    <label className="text-xs font-bold text-slate-500 mb-1 block">本文</label>
                    <div className="rounded-lg border border-input bg-background overflow-hidden">
                        <div className="flex gap-1 border-b border-[#e5edf5] px-2 py-1.5">
                            <button type="button" onClick={() => execCmd("bold")} className="px-2 py-1 text-xs font-bold text-slate-600 hover:bg-slate-100 rounded transition-colors" title="太字">B</button>
                            <button type="button" onClick={() => execCmd("italic")} className="px-2 py-1 text-xs italic text-slate-600 hover:bg-slate-100 rounded transition-colors" title="斜体">I</button>
                            <button type="button" onClick={() => { const url = prompt("URLを入力"); if (url) execCmd("createLink", url); }} className="px-2 py-1 text-xs text-slate-600 hover:bg-slate-100 rounded transition-colors" title="リンク">🔗</button>
                            <button type="button" onClick={() => { const color = prompt("色コード(例: red, #ff0000)"); if (color) execCmd("foreColor", color); }} className="px-2 py-1 text-xs font-bold text-slate-600 hover:bg-slate-100 rounded transition-colors" title="文字色">A</button>
                            <button type="button" onClick={() => execCmd("insertUnorderedList")} className="px-2 py-1 text-xs text-slate-600 hover:bg-slate-100 rounded transition-colors" title="リスト">•</button>
                            <button type="button" onClick={() => execCmd("formatBlock", "h3")} className="px-2 py-1 text-xs font-bold text-slate-600 hover:bg-slate-100 rounded transition-colors" title="見出し">H</button>
                        </div>
                        <div
                            ref={editorRef}
                            contentEditable
                            className="min-h-[120px] px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-ring prose prose-sm max-w-none"
                            onInput={() => {
                                if (editorRef.current) {
                                    setContent(editorRef.current.innerHTML);
                                }
                            }}
                        />
                    </div>
                </div>

                {/* プレビュー */}
                <button
                    type="button"
                    onClick={() => setShowPreview(!showPreview)}
                    className="flex items-center gap-1 text-xs font-bold text-blue-600 hover:text-blue-800 transition-colors"
                >
                    {showPreview ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
                    {showPreview ? "プレビューを閉じる" : "プレビュー表示"}
                </button>

                {showPreview && content && (
                    <div className="border border-blue-200 bg-blue-50 rounded-lg p-3">
                        <p className="text-[10px] font-bold text-blue-500 mb-2">プレビュー</p>
                        <p className="font-bold text-sm text-[#061b31] mb-2">{title || "（タイトル未入力）"}</p>
                        <div
                            className="text-sm text-[#061b31] leading-relaxed prose prose-sm max-w-none"
                            dangerouslySetInnerHTML={{ __html: content }}
                        />
                    </div>
                )}

                <Button onClick={handleCreate} disabled={loading} className="bg-green-600 hover:bg-green-700 text-white font-bold">
                    {loading ? "投稿中..." : "ニュース投稿"}
                </Button>
                {message && (
                    <p className={`text-xs font-bold ${message.includes("失敗") || message.includes("入力") ? "text-red-500" : "text-emerald-600"}`}>
                        {message}
                    </p>
                )}
            </div>

            {/* ニュース一覧 */}
            <div className="space-y-3">
                <h3 className="text-sm font-bold text-slate-700">投稿済みニュース</h3>
                {newsList.length === 0 ? (
                    <p className="text-xs text-slate-400">ニュースはありません</p>
                ) : (
                    <div className="space-y-2">
                        {newsList.map((news) => (
                            <div key={news.id} className="flex items-center justify-between p-3 rounded-lg border bg-white border-slate-200">
                                <div className="min-w-0 flex-1">
                                    <div className="flex items-center gap-2">
                                        <span className="text-sm font-bold text-slate-800 truncate">{news.title}</span>
                                        {!news.isPublished && (
                                            <span className="text-[10px] font-bold bg-slate-100 text-slate-500 px-1.5 py-0.5 rounded shrink-0">非公開</span>
                                        )}
                                    </div>
                                    <p className="text-[11px] text-slate-500 mt-0.5">
                                        {new Date(news.createdAt).toLocaleDateString("ja-JP")}
                                    </p>
                                </div>
                                <Button
                                    variant="outline"
                                    size="sm"
                                    onClick={() => handleDelete(news.id)}
                                    disabled={loading}
                                    className="text-red-600 border-red-200 hover:bg-red-50 text-xs shrink-0 ml-2"
                                >
                                    <Trash2 className="w-3.5 h-3.5" />
                                </Button>
                            </div>
                        ))}
                    </div>
                )}
            </div>
        </div>
    );
}
