"use client";

import { useState, useEffect } from "react";
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
                    <label className="text-xs font-bold text-slate-500 mb-1 block">本文（HTML）</label>
                    <textarea
                        value={content}
                        onChange={(e) => setContent(e.target.value)}
                        placeholder="HTMLを入力してください"
                        rows={6}
                        className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                    />
                    <p className="text-[10px] text-slate-400 mt-1">
                        HTMLを入力してください。{'<a href="...">リンク</a>'}、{'<span style="color:red">赤文字</span>'}等が使えます
                    </p>
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
