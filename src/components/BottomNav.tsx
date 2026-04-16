"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Home, LineChart, Bell, User as UserIcon, Trophy } from "lucide-react";
import { cn } from "@/lib/utils";
import { motion } from "framer-motion";

export function BottomNav() {
  const pathname = usePathname();

  const navItems = [
    { name: "ホーム", href: "/", icon: Home },
    { name: "マーケット", href: "/market", icon: LineChart },
    { name: "通知", href: "/notifications", icon: Bell },
    { name: "ランキング", href: "/ranking", icon: Trophy },
    { name: "マイページ", href: "/mypage", icon: UserIcon },
  ];

  return (
    <div
      className="fixed bottom-0 left-0 right-0 z-50 bg-white border-t border-[#e5edf5]"
      style={{ paddingBottom: 'env(safe-area-inset-bottom)' }}
    >
      <nav className="max-w-md mx-auto flex h-[64px] items-center justify-around px-2 relative">
        {navItems.map((item) => {
          const isActive = item.href === "/" ? pathname === "/" : pathname.startsWith(item.href);
          const Icon = item.icon;

          return (
            <Link
              key={item.href}
              href={item.href}
              prefetch={true}
              aria-label={item.name}
              className={cn(
                "relative flex flex-col items-center justify-center w-16 h-full transition-colors",
                isActive ? "text-[#533afd]" : "text-[#64748d]"
              )}
            >
              {isActive && (
                <motion.div
                  layoutId="bottomNavIndicator"
                  className="absolute top-0 w-8 h-0.5 bg-[#533afd] rounded-full"
                  initial={false}
                  transition={{ type: "spring", stiffness: 500, damping: 35 }}
                />
              )}
              <motion.div
                whileTap={{ scale: 0.85 }}
                className="flex flex-col items-center justify-center w-full h-full"
              >
                <Icon
                  className={cn(
                    "w-[21px] h-[21px] mb-1",
                    isActive ? "stroke-[#533afd]" : "stroke-current"
                  )}
                  strokeWidth={isActive ? 2.5 : 1.8}
                />
                <span className={cn(
                  "text-[10px]",
                  isActive ? "font-bold text-[#533afd]" : "font-medium"
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
