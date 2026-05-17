import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { ContactForm } from "./form";
import Link from "next/link";

export const metadata = {
    title: "お問い合わせ | BOAT BANK",
};

export default async function ContactPage() {
    const session = await auth();
    let defaultName = "";
    let defaultEmail = "";

    if (session?.user?.id) {
        const user = await prisma.user.findUnique({
            where: { id: session.user.id },
            select: { name: true, email: true },
        });
        defaultName = user?.name || "";
        defaultEmail = user?.email || "";
    }

    return (
        <div className="min-h-full bg-white px-4 py-8 max-w-2xl mx-auto">
            <Link
                href="/"
                className="text-xs text-[#533afd] hover:underline inline-block mb-6"
            >
                ← トップに戻る
            </Link>

            <h1 className="text-xl font-bold text-[#061b31] mb-4">お問い合わせ</h1>
            <p className="text-sm text-slate-600 mb-6">
                ご不明点・ご要望・不具合報告などお気軽にお問い合わせください。通常2〜3営業日以内にご返信いたします。
            </p>

            <ContactForm defaultName={defaultName} defaultEmail={defaultEmail} />
        </div>
    );
}
