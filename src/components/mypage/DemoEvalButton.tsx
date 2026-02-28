"use client";

import { useState } from "react";
import { triggerDemoEvaluation } from "@/actions/admin";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Loader2, Settings } from "lucide-react";

export function DemoEvalButton() {
    const [loading, setLoading] = useState(false);
    const [resultMsg, setResultMsg] = useState("");

    return (
        <div className="bg-neutral-900 border border-neutral-800 p-4 rounded-lg text-neutral-400 font-mono text-xs">
            <div className="flex items-center gap-2 mb-3">
                <Settings className="w-4 h-4" />
                <span className="font-bold">ADMIN ACTIONS / DEMO EVALUATOR</span>
            </div>

            <form
                action={async (formData) => {
                    setLoading(true);
                    setResultMsg("");
                    try {
                        const placeName = formData.get('placeName') as string || '桐生';
                        const raceNumber = parseInt(formData.get('raceNumber') as string) || 12;
                        const res = await triggerDemoEvaluation(placeName, raceNumber, formData);
                        if (res.success) {
                            setResultMsg(`Evaluated ${res.evaluatedCount} predictions.`);
                        }
                    } catch (e: any) {
                        setResultMsg(e.message || "Error occurred");
                    } finally {
                        setLoading(false);
                    }
                }}
                className="flex gap-2 items-center flex-wrap"
            >
                <Input name="placeName" defaultValue="桐生" className="w-20 bg-neutral-800 border-neutral-700 h-8" />
                <Input name="raceNumber" defaultValue="12" type="number" className="w-16 bg-neutral-800 border-neutral-700 h-8" />

                <span className="mx-2">Results (3TR):</span>
                <Input name="first" defaultValue="1" type="number" className="w-12 bg-neutral-800 border-neutral-700 h-8" /> -
                <Input name="second" defaultValue="2" type="number" className="w-12 bg-neutral-800 border-neutral-700 h-8" /> -
                <Input name="third" defaultValue="3" type="number" className="w-12 bg-neutral-800 border-neutral-700 h-8" />

                <span className="mx-2">Payout:</span>
                <Input name="payout" defaultValue="1540" type="number" className="w-20 bg-neutral-800 border-neutral-700 h-8" />

                <Button type="submit" disabled={loading} size="sm" className="bg-neutral-700 hover:bg-neutral-600 h-8">
                    {loading ? <Loader2 className="w-3 h-3 animate-spin mr-1" /> : "Run Batch"}
                </Button>
                {resultMsg && <span className="ml-2 text-green-400">{resultMsg}</span>}
            </form>
        </div>
    );
}
