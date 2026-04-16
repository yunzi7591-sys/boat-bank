import { WifiOff } from "lucide-react";

export default function OfflinePage() {
    return (
        <div className="min-h-screen bg-white flex flex-col items-center justify-center p-6 text-center">
            <WifiOff className="w-16 h-16 text-slate-200 mb-4" />
            <h1 className="text-xl font-bold text-[#061b31] mb-2">オフラインです</h1>
            <p className="text-sm text-[#64748d] leading-relaxed">
                インターネット接続を確認してから
                <br />もう一度お試しください。
            </p>
        </div>
    );
}
