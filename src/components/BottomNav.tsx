"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Home, LineChart, Plus, User as UserIcon, Trophy } from "lucide-react";
import { cn } from "@/lib/utils";
import { motion, AnimatePresence } from "framer-motion";

export function BottomNav() {
  const pathname = usePathname();

  const navItems = [
    { name: "ホーム", href: "/", icon: Home },
    { name: "マーケット", href: "/market", icon: LineChart },
    { name: "投票", href: "/predict/new", icon: Plus, highlight: true },
    { name: "ランキング", href: "/ranking", icon: Trophy },
    { name: "資産", href: "/mypage", icon: UserIcon },
  ];

  return (
    <div className="fixed bottom-0 left-0 right-0 z-50 bg-white/90 backdrop-blur-xl border-t border-neutral-200 shadow-[0_-8px_30px_rgba(0,0,0,0.04)] pb-[env(safe-area-inset-bottom)] pt-1">
      <nav className="max-w-md mx-auto flex h-[68px] items-center justify-around px-2 relative">
        {navItems.map((item) => {
          const isActive = pathname === item.href || (item.href !== "/" && pathname.startsWith(item.href));
          const Icon = item.icon;

          if (item.highlight) {
            return (
              <Link
                key={item.href}
                href={item.href}
                className="relative -top-5 flex flex-col items-center justify-center w-[60px] h-[60px] rounded-full bg-slate-900 text-white shadow-xl shadow-slate-900/30 hover:scale-95 active:scale-90 transition-all duration-300 z-10"
              >
                <Icon className="w-8 h-8" strokeWidth={2.5} />
              </Link>
            );
          }

          return (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                "relative flex flex-col items-center justify-center w-full h-full space-y-1 transition-colors group",
                isActive ? "text-slate-900" : "text-neutral-400 hover:text-slate-600"
              )}
            >
              {isActive && (
                <motion.div
                  layoutId="bottomNavBubble"
                  className="absolute inset-x-0 w-12 h-12 mx-auto bg-slate-100 rounded-full -z-10"
                  initial={false}
                  transition={{ type: "spring", stiffness: 400, damping: 30 }}
                />
              )}
              <motion.div
                whileTap={{ scale: 0.85 }}
                className={cn(
                  "flex flex-col items-center justify-center transition-all duration-200",
                  isActive ? "translate-y-[-2px]" : ""
                )}
              >
                <Icon
                  className={cn(
                    "w-6 h-6 mb-[2px]",
                    isActive ? "fill-slate-900/10 stroke-slate-900" : "stroke-current"
                  )}
                  strokeWidth={isActive ? 2.5 : 2}
                />
                <span className={cn(
                  "text-[10px] font-medium tracking-wide",
                  isActive ? "font-bold" : ""
                )}>
                  {item.name}
                </span>
              </motion.div>
            </Link>
          );
        })}
      </nav>
    </div>
  );
}
