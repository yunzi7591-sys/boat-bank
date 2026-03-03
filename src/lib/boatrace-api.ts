import { prisma } from "@/lib/prisma";
import { VENUES } from "@/lib/constants/venues";
import * as cheerio from "cheerio";

const SCHEDULE_API_URL = "https://boatraceopenapi.github.io/programs/v2/today.json";
const RESULTS_API_URL = "https://boatraceopenapi.github.io/results/v2/today.json";

function extractGrade(gradeNumber: number): string {
    switch (gradeNumber) {
        case 1: return "SG";
        case 2: return "G1";
        case 3: return "G2";
        case 4: return "G3";
        case 5: return "一般";
        default: return "一般";
    }
}

function extractDay(subtitle: string): string {
    if (!subtitle) return "開催中";
    if (subtitle.includes("優勝戦") && !subtitle.includes("準")) return "最終日";
    if (subtitle.includes("準優勝戦")) return "5日目";
    if (subtitle.includes("ドリーム")) return "初日";
    return "開催中";
}

export async function syncTodaySchedule() {
    try {
        console.log(`[API] Fetching schedule from ${SCHEDULE_API_URL}...`);

        const res = await fetch(SCHEDULE_API_URL, { cache: 'no-store' });
        if (!res.ok) throw new Error("Schedule API Fetch failed");

        const data = await res.json();
        const programs = data.programs || [];

        if (programs.length === 0) {
            return { success: false, error: "No events today." };
        }

        let syncedCount = 0;

        for (const prog of programs) {
            // "race_stadium_number": 1 -> id: "01"
            const stadiumId = prog.race_stadium_number.toString().padStart(2, '0');
            const venue = VENUES.find(v => v.id === stadiumId);

            if (!venue) continue; // Unknown venue

            const placeName = venue.name;
            const raceNumber = prog.race_number;
            const raceDate = new Date(prog.race_date); // "2026-02-28" resulting in UTC 00:00

            // "race_closed_at": "2026-02-28 15:48:00" -> parsing correctly in Japan time is tricky without a proper library, 
            // but for simplicity, we treat the exact string as UTC or parse as local. Let's append JST +0900.
            const deadlineAt = new Date(`${prog.race_closed_at.replace(' ', 'T')}+09:00`);

            // Phase 22: Extract Grade and Day
            const grade = extractGrade(prog.race_grade_number);
            const day = extractDay(prog.race_subtitle);

            await prisma.raceSchedule.upsert({
                where: {
                    placeName_raceNumber_raceDate: {
                        placeName,
                        raceNumber,
                        raceDate,
                    }
                },
                update: { deadlineAt, grade, day },
                create: {
                    placeName,
                    raceNumber,
                    raceDate,
                    deadlineAt,
                    grade,
                    day
                }
            });
            syncedCount++;
        }

        return { success: true, count: syncedCount };
    } catch (e: any) {
        console.error("[API Error] Failed to sync schedule:", e);
        return { success: false, error: e.message };
    }
}

// Phase 23: Scrape official grade and day from boatrace.jp
export async function syncOfficialGradeAndDay() {
    try {
        console.log("[Scraper] Fetching official site for precise Grade and Day...");
        const res = await fetch("https://www.boatrace.jp/owpc/pc/race/index", {
            headers: {
                "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko)"
            }
        });

        if (!res.ok) throw new Error("Failed to fetch boatrace.jp");

        const html = await res.text();
        const $ = cheerio.load(html);

        // Find all venues that have an active image like "/static_extra/pc/images/text_place1_01.png" -> 桐生
        let scrapedData: any[] = [];

        $('tbody').each((i, el) => {
            const venueImg = $(el).find('img[src*="text_place1_"]');
            if (!venueImg.length) return;

            const src = venueImg.attr('src') || '';
            const match = src.match(/text_place1_(\d+)\.png/);
            if (!match) return;

            const stadiumId = match[1];
            const venue = VENUES.find(v => v.id === stadiumId);
            if (!venue) return;

            const placeName = venue.name;

            let extractedDay = "-日目";

            $(el).find('td').each((_, td) => {
                const text = $(td).text();
                // 全角数字を含めてマッチさせる
                const dayMatch = text.match(/(初日|[2-7２-７]日目|最終日)/);
                if (dayMatch) {
                    // 抽出した文字列に対してのみ全角数字を半角に変換（例: "２日目" -> "2日目"）
                    extractedDay = dayMatch[1].replace(/[２-７]/g, (s) => String.fromCharCode(s.charCodeAt(0) - 0xfee0));
                }
            });

            // 強制バリデーション（絶対防衛線）
            const validDays = ["初日", "2日目", "3日目", "4日目", "5日目", "6日目", "7日目", "最終日"];
            let day = validDays.includes(extractedDay) ? extractedDay : "-日目";

            let grade = "一般";
            let broke = false;
            $(el).find('td, th').each((_, cell) => {
                if (broke) return;
                const cls = $(cell).attr('class') || '';
                if (cls.includes('is-sg')) { grade = "SG"; broke = true; }
                else if (cls.includes('is-g1')) { grade = "G1"; broke = true; }
                else if (cls.includes('is-g2')) { grade = "G2"; broke = true; }
                else if (cls.includes('is-g3')) { grade = "G3"; broke = true; }
                else if (cls.includes('is-ippan')) { grade = "一般"; broke = true; }

                $(cell).find('img').each((_, img) => {
                    const imgSrc = $(img).attr('src') || '';
                    if (imgSrc.includes('text_sg')) grade = "SG";
                    else if (imgSrc.includes('text_g1')) grade = "G1";
                    else if (imgSrc.includes('text_g2')) grade = "G2";
                    else if (imgSrc.includes('text_g3')) grade = "G3";
                });
            });

            // Determine today's date in JST
            const nowJst = new Date(new Date().toLocaleString('en-US', { timeZone: 'Asia/Tokyo' }));
            const yyyy = nowJst.getFullYear();
            const mm = String(nowJst.getMonth() + 1).padStart(2, '0');
            const dd = String(nowJst.getDate()).padStart(2, '0');
            const searchDate = new Date(`${yyyy}-${mm}-${dd}T00:00:00.000Z`);

            scrapedData.push({
                placeName,
                grade,
                day,
                searchDate
            });
        });

        console.log("Scraped Results (PC Strict):", scrapedData);

        // Collect and execute updates
        const updates: Promise<any>[] = [];
        for (const data of scrapedData) {
            // Only update if we extracted something meaningful, or just always update to ensure sync
            if (data.grade !== "一般" || data.day !== "-日目") {
                updates.push(
                    prisma.raceSchedule.updateMany({
                        where: {
                            placeName: data.placeName,
                            raceDate: data.searchDate
                        },
                        data: {
                            grade: data.grade,
                            day: data.day
                        }
                    })
                );
            }
        }

        await Promise.all(updates);
        return { success: true, count: updates.length, results: scrapedData };

    } catch (e: any) {
        console.error("[Scraper Error] Failed to extract from official site:", e);
        return { success: false, error: e.message };
    }
}

export async function fetchAndSaveRaceResult(placeName: string, raceNumber: number) {
    try {
        console.log(`[API] Fetching result for ${placeName} R${raceNumber} from ${RESULTS_API_URL}...`);

        const res = await fetch(RESULTS_API_URL, { cache: 'no-store' });
        if (!res.ok) throw new Error("Result API Fetch failed");

        const data = await res.json();
        const results = data.results || [];

        // Find stadiumId
        const venue = VENUES.find(v => v.name === placeName);
        if (!venue) throw new Error("Invalid place name");

        const stadiumNumber = parseInt(venue.id, 10);
        const raceResult = results.find((r: any) => r.race_stadium_number === stadiumNumber && r.race_number === raceNumber);

        if (!raceResult) {
            throw new Error("Result not found for this race yet.");
        }

        const raceDate = new Date(raceResult.race_date);

        // Parse boats to find 1st, 2nd, 3rd places
        const boats = raceResult.boats || [];
        const first = boats.find((b: any) => b.racer_place_number === 1)?.racer_boat_number;
        const second = boats.find((b: any) => b.racer_place_number === 2)?.racer_boat_number;
        const third = boats.find((b: any) => b.racer_place_number === 3)?.racer_boat_number;

        if (!first || !second || !third) {
            throw new Error("Match not fully concluded (Missing place numbers).");
        }

        // Parse payouts (refunds in our old terminology, now payouts)
        const apiPayouts = raceResult.payouts || {};
        const payoutsData: any[] = [];
        const refundedBoats: number[] = []; // 返還艇の番号

        // Extract Returns/Refunds from API
        // refunds are usually in raceResult.returns or similar, we check "returns" array
        if (raceResult.returns && Array.isArray(raceResult.returns)) {
            raceResult.returns.forEach((r: any) => {
                if (r && typeof r.racer_boat_number === 'number') {
                    refundedBoats.push(r.racer_boat_number);
                }
            });
        }

        // Map payouts to our format
        // trifecta -> 3TR (3連単)
        if (apiPayouts.trifecta && apiPayouts.trifecta.length > 0) {
            apiPayouts.trifecta.forEach((p: any) => {
                payoutsData.push({ type: "3TR", numbers: p.combination.replace(/-/g, '-'), amount: p.payout });
            });
        }
        // trio -> 3PL (3連複)
        if (apiPayouts.trio && apiPayouts.trio.length > 0) {
            apiPayouts.trio.forEach((p: any) => {
                payoutsData.push({ type: "3PL", numbers: p.combination.replace(/=/g, '-'), amount: p.payout });
            });
        }
        // exacta -> 2TR (2連単)
        if (apiPayouts.exacta && apiPayouts.exacta.length > 0) {
            apiPayouts.exacta.forEach((p: any) => {
                payoutsData.push({ type: "2TR", numbers: p.combination.replace(/-/g, '-'), amount: p.payout });
            });
        }
        // quinella -> 2PL (2連複)
        if (apiPayouts.quinella && apiPayouts.quinella.length > 0) {
            apiPayouts.quinella.forEach((p: any) => {
                payoutsData.push({ type: "2PL", numbers: p.combination.replace(/=/g, '-'), amount: p.payout });
            });
        }
        // win -> WIN (単勝)
        const win = apiPayouts.win && apiPayouts.win[0];
        if (win) {
            payoutsData.push({ type: "WIN", numbers: win.combination, amount: win.payout });
        }

        const savedResult = await prisma.raceResult.upsert({
            where: {
                placeName_raceNumber_raceDate: {
                    placeName,
                    raceNumber,
                    raceDate
                }
            },
            update: {
                firstPlace: first,
                secondPlace: second,
                thirdPlace: third,
                payouts: payoutsData,
                refunds: refundedBoats
            },
            create: {
                placeName,
                raceNumber,
                raceDate,
                firstPlace: first,
                secondPlace: second,
                thirdPlace: third,
                payouts: payoutsData,
                refunds: refundedBoats
            }
        });

        return { success: true, result: savedResult };
    } catch (e: any) {
        console.error("[API Error] Failed to fetch and save result:", e);
        return { success: false, error: e.message };
    }
}

// Phase 31: Bulk Sync Today's Results from API
export async function syncTodayResults() {
    try {
        console.log(`[API] Fetching all results from ${RESULTS_API_URL}...`);

        const res = await fetch(RESULTS_API_URL, { cache: 'no-store' });
        if (!res.ok) throw new Error("Result API Fetch failed");

        const data = await res.json();
        const results = data.results || [];

        if (results.length === 0) {
            return { success: false, error: "No results today." };
        }

        let syncedCount = 0;
        const processedRaces: { placeName: string; raceNumber: number; raceDate: Date }[] = [];

        for (const raceResult of results) {
            // "race_status" 判定があるとは思いますが、基本的にbots(1-6)とpayoutsがあればレース成立
            const boats = raceResult.boats || [];
            if (boats.length === 0) continue; // Not finished yet

            const first = boats.find((b: any) => b.racer_place_number === 1)?.racer_boat_number;
            const second = boats.find((b: any) => b.racer_place_number === 2)?.racer_boat_number;
            const third = boats.find((b: any) => b.racer_place_number === 3)?.racer_boat_number;

            if (!first || !second || !third) {
                continue; // Match not fully concluded
            }

            const stadiumId = raceResult.race_stadium_number.toString().padStart(2, '0');
            const venue = VENUES.find(v => v.id === stadiumId);
            if (!venue) continue; // Unknown venue

            const placeName = venue.name;
            const raceNumber = raceResult.race_number;
            const raceDate = new Date(raceResult.race_date);

            // Phase 31: Save full arrivals (1-6)
            const arrivals = boats.map((b: any) => ({
                place: b.racer_place_number,
                boatNumber: b.racer_boat_number,
                racerName: `${b.racer_last_name} ${b.racer_first_name}`.trim()
            })).sort((a: any, b: any) => {
                // Return valid places first, then missing/unplaced at the end
                if (!a.place) return 1;
                if (!b.place) return -1;
                return a.place - b.place;
            });

            // Parse payouts
            const apiPayouts = raceResult.payouts || {};
            const payoutsData: any[] = [];
            const refundedBoats: number[] = [];

            if (raceResult.returns && Array.isArray(raceResult.returns)) {
                raceResult.returns.forEach((r: any) => {
                    if (r && typeof r.racer_boat_number === 'number') {
                        refundedBoats.push(r.racer_boat_number);
                    }
                });
            }

            // Map payouts
            if (apiPayouts.trifecta && apiPayouts.trifecta.length > 0) {
                apiPayouts.trifecta.forEach((p: any) => payoutsData.push({ type: "3TR", numbers: p.combination.replace(/-/g, '-'), amount: p.payout }));
            }
            if (apiPayouts.trio && apiPayouts.trio.length > 0) {
                apiPayouts.trio.forEach((p: any) => payoutsData.push({ type: "3PL", numbers: p.combination.replace(/=/g, '-'), amount: p.payout }));
            }
            if (apiPayouts.exacta && apiPayouts.exacta.length > 0) {
                apiPayouts.exacta.forEach((p: any) => payoutsData.push({ type: "2TR", numbers: p.combination.replace(/-/g, '-'), amount: p.payout }));
            }
            if (apiPayouts.quinella && apiPayouts.quinella.length > 0) {
                apiPayouts.quinella.forEach((p: any) => payoutsData.push({ type: "2PL", numbers: p.combination.replace(/=/g, '-'), amount: p.payout }));
            }
            const win = apiPayouts.win && apiPayouts.win[0];
            if (win) {
                payoutsData.push({ type: "WIN", numbers: win.combination, amount: win.payout });
            }

            await prisma.raceResult.upsert({
                where: {
                    placeName_raceNumber_raceDate: {
                        placeName,
                        raceNumber,
                        raceDate
                    }
                },
                update: {
                    firstPlace: first,
                    secondPlace: second,
                    thirdPlace: third,
                    payouts: payoutsData,
                    refunds: refundedBoats,
                    arrivals: arrivals // Phase 31 array
                },
                create: {
                    placeName,
                    raceNumber,
                    raceDate,
                    firstPlace: first,
                    secondPlace: second,
                    thirdPlace: third,
                    payouts: payoutsData,
                    refunds: refundedBoats,
                    arrivals: arrivals // Phase 31 array
                }
            });

            processedRaces.push({ placeName, raceNumber, raceDate });
            syncedCount++;
        }

        return { success: true, count: syncedCount, processedRaces };
    } catch (e: any) {
        console.error("[API Error] Failed to sync bulk results:", e);
        return { success: false, error: e.message };
    }
}
