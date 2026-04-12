export default function Loading() {
    return (
        <div className="min-h-screen bg-white flex items-center justify-center">
            <div className="flex flex-col items-center gap-3">
                <div className="w-8 h-8 rounded-full border-4 border-[#e5edf5] border-t-[#533afd] animate-spin" />
                <p className="text-sm font-bold text-[#64748d]">詳細成績を読み込み中...</p>
            </div>
        </div>
    );
}
