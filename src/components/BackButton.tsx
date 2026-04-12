"use client";

import { useRouter } from "next/navigation";
import { ArrowLeft } from "lucide-react";

export function BackButton({ label = "戻る" }: { label?: string }) {
    const router = useRouter();
    return (
        <button
            onClick={() => router.back()}
            className="inline-flex items-center gap-1.5 text-sm font-bold text-[#64748d] hover:text-[#061b31] transition-colors mb-6"
        >
            <ArrowLeft className="w-4 h-4" />
            {label}
        </button>
    );
}
