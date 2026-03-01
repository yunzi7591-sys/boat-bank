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
    <div
      className="fixed bottom-0 left-0 right-0 z-50 bg-white/95 backdrop-blur-2xl border-t border-slate-200/60 shadow-[0_-8px_30px_rgba(0,0,0,0.04)] pt-1"
      style={{ paddingBottom: 'env(safe-area-inset-bottom)' }}
    >
      <nav className="max-w-md mx-auto flex h-[68px] items-center justify-around px-2 relative">
        {navItems.map((item) => {
          // Exact match for Home, prefix match for others
          const isActive = item.href === "/" ? pathname === "/" : pathname.startsWith(item.href);
          const Icon = item.icon;

          if (item.highlight) {
            return (
              <Link
                key={item.href}
                href={item.href}
                className="relative -top-5 flex flex-col items-center justify-center w-[60px] h-[60px] rounded-full bg-indigo-600 text-white shadow-[0_8px_20px_rgba(79,70,229,0.4)] md:hover:scale-105 active:scale-90 transition-all duration-300 z-10"
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
                "relative flex flex-col items-center justify-center w-16 h-full transition-colors group",
                isActive ? "text-indigo-600" : "text-slate-400 hover:text-slate-600"
              )}
            >
              {isActive && (
                <motion.div
                  layoutId="bottomNavBubble"
                  className="absolute inset-0 m-auto w-12 h-12 bg-indigo-50/80 rounded-2xl -z-10"
                  initial={false}
                  transition={{ type: "spring", stiffness: 400, damping: 30 }}
                />
              )}
              <motion.div
                whileTap={{ scale: 0.85 }}
                className={cn(
                  "flex flex-col items-center justify-center transition-all duration-200 w-full h-full",
                  isActive ? "-translate-y-0.5" : ""
                )}
              >
                <Icon
                  className={cn(
                    "w-[22px] h-[22px] mb-[3px]",
                    isActive ? "fill-indigo-100 stroke-indigo-600" : "stroke-current"
                  )}
                  strokeWidth={isActive ? 2.5 : 2}
                />
                <span className={cn(
                  "text-[10px] tracking-wide",
                  isActive ? "font-bold text-indigo-700" : "font-medium"
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
