"use client";

import { useState } from "react";
import { Database, Trophy, Megaphone, Users, Trash2 } from "lucide-react";
import { ApiActionForms } from "./ApiActionForms";
import { EventManager } from "./EventManager";
import { NewsManager } from "./NewsManager";
import { UserManager } from "./UserManager";
import { AdminPredictionList } from "./AdminPredictionList";

const TABS = [
    { id: "data", label: "データ", icon: Database },
    { id: "events", label: "イベント", icon: Trophy },
    { id: "news", label: "ニュース", icon: Megaphone },
    { id: "users", label: "ユーザー", icon: Users },
    { id: "predictions", label: "予想", icon: Trash2 },
] as const;

type TabId = typeof TABS[number]["id"];

export function AdminTabs() {
    const [activeTab, setActiveTab] = useState<TabId>("data");

    return (
        <div>
            {/* タブバー */}
            <div className="flex overflow-x-auto gap-1 bg-white rounded-lg p-1 border border-[#e5edf5] shadow-sm mb-4 [-ms-overflow-style:none] [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
                {TABS.map(tab => {
                    const Icon = tab.icon;
                    return (
                        <button
                            key={tab.id}
                            onClick={() => setActiveTab(tab.id)}
                            className={`flex items-center gap-1.5 px-3 py-2 rounded-md text-xs font-bold whitespace-nowrap transition-all ${
                                activeTab === tab.id
                                    ? "bg-[#533afd] text-white shadow-sm"
                                    : "text-[#64748d] hover:bg-[#f6f8fa]"
                            }`}
                        >
                            <Icon className="w-3.5 h-3.5" />
                            {tab.label}
                        </button>
                    );
                })}
            </div>

            {/* コンテンツ */}
            {activeTab === "data" && <ApiActionForms />}
            {activeTab === "events" && <EventManager />}
            {activeTab === "news" && <NewsManager />}
            {activeTab === "users" && <UserManager />}
            {activeTab === "predictions" && <AdminPredictionList />}
        </div>
    );
}
