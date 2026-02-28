"use client";

import { useState } from "react";
import { updateProfile } from "@/actions/profile";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
    DialogTrigger,
} from "@/components/ui/dialog";
import { Edit2, Loader2 } from "lucide-react";

export function ProfileEditModal({ initialName, initialBio }: { initialName: string; initialBio: string }) {
    const [open, setOpen] = useState(false);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState("");

    const handleSubmit = async (formData: FormData) => {
        setLoading(true);
        setError("");
        const name = formData.get("name") as string;
        const bio = formData.get("bio") as string;

        const res = await updateProfile({ name, bio });
        setLoading(false);

        if (res.success) {
            setOpen(false);
        } else {
            setError(res.error || "Failed to update profile");
        }
    };

    return (
        <Dialog open={open} onOpenChange={setOpen}>
            <DialogTrigger asChild>
                <Button variant="outline" size="sm" className="h-8 text-xs font-bold rounded-full bg-white/10 border-white/20 text-white hover:bg-white/20 hover:text-white">
                    <Edit2 className="w-3 h-3 mr-1.5" />
                    プロフィール編集
                </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-[425px]">
                <DialogHeader>
                    <DialogTitle className="text-xl font-black">プロフィール編集</DialogTitle>
                </DialogHeader>
                <form action={handleSubmit} className="space-y-4 mt-4">
                    <div>
                        <label className="text-xs font-bold text-slate-500 mb-1 block">名前</label>
                        <Input name="name" defaultValue={initialName} placeholder="予想家名" required />
                    </div>
                    <div>
                        <label className="text-xs font-bold text-slate-500 mb-1 block">自己紹介 (Bio)</label>
                        <Textarea name="bio" defaultValue={initialBio} placeholder="得意な場、予想スタイルなど" rows={4} />
                    </div>
                    {error && <p className="text-xs text-red-500 font-bold">{error}</p>}
                    <Button type="submit" disabled={loading} className="w-full font-bold bg-slate-900 hover:bg-slate-800 text-white h-12 rounded-xl">
                        {loading ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : "保存する"}
                    </Button>
                </form>
            </DialogContent>
        </Dialog>
    );
}
