import { Skeleton } from "@/components/ui/skeleton";

export default function Loading() {
    return (
        <div className="min-h-[100dvh] bg-slate-50 flex flex-col p-4 animate-pulse pt-20">
            {/* Header Skeleton */}
            <div className="flex items-center justify-between mb-6">
                <Skeleton className="h-8 w-48 rounded-xl bg-slate-200" />
                <Skeleton className="h-10 w-10 rounded-full bg-slate-200" />
            </div>

            {/* Main Hero Card Skeleton */}
            <Skeleton className="h-40 w-full rounded-3xl bg-slate-200 mb-6" />

            {/* Content List Skeleton */}
            <div className="space-y-4">
                {[1, 2, 3, 4].map((i) => (
                    <div key={i} className="flex gap-4 p-4 bg-white rounded-2xl shadow-sm border border-slate-100">
                        <Skeleton className="h-12 w-12 rounded-full bg-slate-200 shrink-0" />
                        <div className="flex-1 space-y-2">
                            <Skeleton className="h-4 w-3/4 rounded-md bg-slate-200" />
                            <Skeleton className="h-3 w-1/2 rounded-md bg-slate-200" />
                            <Skeleton className="h-8 w-full rounded-xl bg-slate-200 mt-2" />
                        </div>
                    </div>
                ))}
            </div>
        </div>
    );
}
