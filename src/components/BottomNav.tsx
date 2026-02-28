"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Home, LineChart, PenSquare, User as UserIcon, Trophy } from "lucide-react";
import { cn } from "@/lib/utils";

export function BottomNav() {
  const pathname = usePathname();

  const navItems = [
    { name: "ホーム", href: "/", icon: Home },
    { name: "マーケット", href: "/market", icon: LineChart },
    { name: "ランキング", href: "/ranking", icon: Trophy },
    { name: "投稿", href: "/predict", icon: PenSquare, highlight: true },
    { name: "マイページ", href: "/mypage", icon: UserIcon },
  ];

  return (
    <div className="fixed bottom-0 left-0 right-0 z-50 bg-white border-t border-neutral-200 shadow-[0_-4px_12px_rgba(0,0,0,0.05)] pb-safe pt-safe">
      <nav className="max-w-md mx-auto flex h-16 items-center justify-around px-2">
        {navItems.map((item) => {
          const isActive = pathname === item.href;
          const Icon = item.icon;

          return (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                "flex flex-col items-center justify-center w-full h-full space-y-1 transition-colors",
                isActive ? "text-slate-900 font-bold" : "text-neutral-400 hover:text-slate-600 font-medium"
              )}
            >
              {item.highlight ? (
                <div className={cn(
                  "p-3 rounded-xl mb-6 shadow-lg shadow-green-500/20 transition-transform hover:scale-105",
                  isActive ? "bg-slate-900 text-white" : "bg-green-600 text-white"
                )}>
                  <Icon className="w-6 h-6" />
                </div>
              ) : (
                <>
                  <Icon className={cn("w-6 h-6", isActive ? "fill-slate-900" : "")} />
                  <span className="text-[10px]">{item.name}</span>
                </>
              )}
            </Link>
          );
        })}
      </nav>
    </div>
  );
}
