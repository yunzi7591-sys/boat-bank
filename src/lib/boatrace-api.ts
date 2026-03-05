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
    // Special keywords first
    if (subtitle.includes("優勝戦") && !subtitle.includes("準")) return "最終日";
    if (subtitle.includes("準優勝戦")) return "5日目";
    if (subtitle.includes("ドリーム")) return "初日";
    // Parse numeric day: "2日目", "3日目" ... "7日目"
    const dayMatch = subtitle.match(/(\d+)日目/);
    if (dayMatch) return `${dayMatch[1]}日目`;
    // Parse "初日" explicitly
    if (subtitle.includes("初日")) return "初日";
    // Parse "Xday" / English-style day markers
    const edayMatch = subtitle.match(/(\d+)\s*day/i);
    if (edayMatch) return `${edayMatch[1]}日目`;
    return "開催中";
}

function extractRacerClass(classNumber: number): string {
    switch (classNumber) {
        case 1: return 'A1';
        case 2: return 'A2';
        case 3: return 'B1';
        case 4: return 'B2';
        default: return 'B1';
    }
}

export async function syncTodaySchedule() {
    try {
        console.log(`[API] Fetching schedule from ${SCHEDULE_API_URL}...`);

        // 1. 本日分のデータをすでに取得しているかチェック (高速スキップ機能)
        const todayStr = new Date().toLocaleString('en-US', { timeZone: 'Asia/Tokyo' });
        const currentDate = new Date(todayStr);
        const yyyy = currentDate.getFullYear();
        const mm = String(currentDate.getMonth() + 1).padStart(2, '0');
        const dd = String(currentDate.getDate()).padStart(2, '0');
        const searchDate = new Date(`${yyyy}-${mm}-${dd}T00:00:00.000Z`);

        const existingCount = await prisma.raceSchedule.count({
            where: { raceDate: searchDate }
        });

        const schedulesAlreadySynced = existingCount > 100;

        const res = await fetch(SCHEDULE_API_URL, { cache: 'no-store' });
        if (!res.ok) {
            console.error(`[API Error] Schedule API Fetch failed with status: ${res.status} ${res.statusText}`);
            throw new Error(`Schedule API Fetch failed: ${res.status} ${res.statusText}`);
        }

        const data = await res.json();
        const programs = data.programs || [];

        if (programs.length === 0) {
            return { success: false, error: "No events today." };
        }

        let syncedCount = 0;

        // 2. レース番組表パースと事前チェック
        const parsedPrograms: any[] = [];
        const uniqueRacers = new Map<number, { name: string; grade: string }>(); // racerNumber -> {name, grade}

        for (const prog of programs) {
            const stadiumId = prog.race_stadium_number.toString().padStart(2, '0');
            const venue = VENUES.find(v => v.id === stadiumId);

            if (!venue) continue; // Unknown venue

            const placeName = venue.name;
            const raceNumber = prog.race_number;
            const raceDate = new Date(prog.race_date); // "2026-02-28" resulting in UTC 00:00
            // "race_closed_at": "2026-02-28 15:48:00"
            const deadlineAt = new Date(`${prog.race_closed_at.replace(' ', 'T')}+09:00`);

            const grade = extractGrade(prog.race_grade_number);
            const day = extractDay(prog.race_subtitle);

            const entriesData: any[] = [];
            const boats = prog.boats || [];

            for (const b of boats) {
                const rName = typeof b.racer_name === 'string' ? b.racer_name.trim() : "";
                const rNum = typeof b.racer_number === 'number' ? b.racer_number : null;
                const rGrade = extractRacerClass(b.racer_class_number);

                if (rNum && rName && rName !== "undefined undefined") {
                    uniqueRacers.set(rNum, { name: rName, grade: rGrade });
                    entriesData.push({ boatNumber: b.racer_boat_number, racerNumber: rNum });
                }
            }

            parsedPrograms.push({
                placeName, raceNumber, raceDate, deadlineAt, grade, day, entriesData
            });
        }

        // 3. 選手(Racer)データをバルクUpsert（新規は作成、既存はname/gradeを更新）
        const racerDataArray = Array.from(uniqueRacers.entries()).map(([rNum, info]) => ({
            racerNumber: rNum,
            name: info.name,
            grade: info.grade
        }));

        if (racerDataArray.length > 0) {
            // Chunked upsert to avoid connection pool exhaustion
            const RACER_CHUNK = 50;
            for (let i = 0; i < racerDataArray.length; i += RACER_CHUNK) {
                const chunk = racerDataArray.slice(i, i + RACER_CHUNK);
                const upsertOps = chunk.map(r =>
                    prisma.racer.upsert({
                        where: { racerNumber: r.racerNumber },
                        update: { name: r.name, grade: r.grade },
                        create: { racerNumber: r.racerNumber, name: r.name, grade: r.grade }
                    })
                );
                await prisma.$transaction(upsertOps);
            }
        }

        // 紐付けのために、先ほどUpsertした(または既に存在していた)Racersの完全なリストをDBから再取得
        const racerIds = Array.from(uniqueRacers.keys());
        const allRacersInDb = await prisma.racer.findMany({
            where: { racerNumber: { in: racerIds } },
            select: { id: true, racerNumber: true }
        });
        const racerIdMap = new Map(allRacersInDb.map(r => [r.racerNumber, r.id]));

        // 4, 5: Skip schedule/entry inserts if already synced (but racers above were still updated)
        if (schedulesAlreadySynced) {
            console.log(`[API] Schedules already synced (${existingCount} races). Racer grades updated. Skipping schedule/entry inserts.`);
            return { success: true, count: existingCount, skipped: true };
        }

        // 4. RaceSchedule のバルクINSERTデータ作成
        const scheduleDataArray = parsedPrograms.map(pr => ({
            placeName: pr.placeName,
            raceNumber: pr.raceNumber,
            raceDate: pr.raceDate,
            deadlineAt: pr.deadlineAt,
            grade: pr.grade,
            day: pr.day
        }));

        if (scheduleDataArray.length > 0) {
            await prisma.raceSchedule.createMany({
                data: scheduleDataArray,
                skipDuplicates: true
            });
            syncedCount = scheduleDataArray.length;
        }

        // 5. RaceEntry のバルクINSERTデータとチャンク分割 (タイムアウト・メモリ圧迫対策)
        const entriesDataArray: any[] = [];
        for (const pr of parsedPrograms) {
            for (const entry of pr.entriesData) {
                const racerId = racerIdMap.get(entry.racerNumber);
                if (racerId) {
                    entriesDataArray.push({
                        placeName: pr.placeName,
                        raceNumber: pr.raceNumber,
                        raceDate: pr.raceDate,
                        boatNumber: entry.boatNumber,
                        racerId: racerId
                    });
                }
            }
        }

        const CHUNK_SIZE = 500;
        for (let i = 0; i < entriesDataArray.length; i += CHUNK_SIZE) {
            const chunk = entriesDataArray.slice(i, i + CHUNK_SIZE);
            if (chunk.length > 0) {
                await prisma.raceEntry.createMany({
                    data: chunk,
                    skipDuplicates: true
                });
            }
        }

        console.log(`[API] Successfully synced ${syncedCount} race schedules and ${entriesDataArray.length} entries using chunked createMany.`);
        return { success: true, count: syncedCount, entries: entriesDataArray.length };
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

// Phase 51: Scraping-based Result Sync from boatrace.jp official site
export async function syncTodayResults() {
    try {
        console.log(`[SCRAPE] Starting scraping-based result sync...`);

        // --- STEP 1: Discover target races from DB ---
        const now = new Date();
        const tenMinutesAgo = new Date(now.getTime() - 10 * 60 * 1000);

        // Get today's date in JST for DB query
        const jstNow = new Date(now.getTime() + 9 * 60 * 60 * 1000);
        const todayStr = jstNow.toISOString().split('T')[0];
        const todayStart = new Date(todayStr + 'T00:00:00.000Z');
        const todayEnd = new Date(todayStr + 'T23:59:59.999Z');

        const targetRaces = await prisma.raceSchedule.findMany({
            where: {
                raceDate: { gte: todayStart, lte: todayEnd },
                deadlineAt: { lt: tenMinutesAgo }, // Deadline passed 10+ minutes ago
                resultSynced: false, // Not yet synced
            },
            orderBy: [{ placeName: 'asc' }, { raceNumber: 'asc' }],
        });

        if (targetRaces.length === 0) {
            console.log(`[SCRAPE] No unsycned completed races found.`);
            return { success: true, count: 0, processedRaces: [] };
        }

        console.log(`[SCRAPE] Found ${targetRaces.length} overdue races. Limiting to 5 races per batch to prevent execution timeout.`);

        // Vercel Hobby plan limit mitigation: only process up to 5 races per invocation
        const batchedRaces = targetRaces.slice(0, 5);

        let syncedCount = 0;
        const processedRaces: { placeName: string; raceNumber: number; raceDate: Date }[] = [];
        const dbOperations: any[] = [];
        const syncedScheduleIds: string[] = [];
        const uniqueRacers = new Map<number, string>();

        // --- STEP 2: Scrape each race from boatrace.jp ---
        for (const schedule of targetRaces) {
            const venue = VENUES.find(v => v.name === schedule.placeName);
            if (!venue) {
                console.warn(`[SCRAPE] Unknown venue: ${schedule.placeName}, skipping.`);
                continue;
            }

            const jstRaceDate = new Date(schedule.raceDate.getTime() + 9 * 60 * 60 * 1000);
            const hdParam = jstRaceDate.toISOString().split('T')[0].replace(/-/g, '');
            const url = `https://www.boatrace.jp/owpc/pc/race/raceresult?rno=${schedule.raceNumber}&jcd=${venue.id}&hd=${hdParam}`;

            try {
                console.log(`[SCRAPE] Fetching ${schedule.placeName} R${schedule.raceNumber}: ${url}`);
                const res = await fetch(url, { cache: 'no-store' });
                if (!res.ok) {
                    console.warn(`[SCRAPE] HTTP ${res.status} for ${schedule.placeName} R${schedule.raceNumber}, skipping.`);
                    continue;
                }

                const html = await res.text();
                const $ = cheerio.load(html);

                // --- STEP 3: Parse Arrivals ---
                const arrivalsData: { place: number; boatNumber: number; racerName: string; racerNumber: number | null }[] = [];
                const resultTableBody = $('table.is-w495 tbody, table.is-w748 tbody').first();

                // Each row in the result table has boat number in td.is-boatColorN
                let placeIndex = 0;
                $('tbody tr').each((_, row) => {
                    const boatCell = $(row).find('td[class*="is-boatColor"]');
                    if (boatCell.length === 0) return;

                    placeIndex++;
                    const boatNumber = parseInt(boatCell.text().trim(), 10);
                    if (isNaN(boatNumber)) return;

                    const nameSpan = $(row).find('span.is-fs18.is-fBold').first();
                    const racerName = nameSpan.text().trim().replace(/\s+/g, '　') || '選手情報なし';
                    const numberSpan = $(row).find('span.is-fs12').first();
                    const racerNumber = numberSpan.length > 0 ? parseInt(numberSpan.text().trim(), 10) : null;

                    arrivalsData.push({
                        place: placeIndex,
                        boatNumber,
                        racerName,
                        racerNumber: isNaN(racerNumber as number) ? null : racerNumber,
                    });

                    if (racerNumber && !isNaN(racerNumber) && racerName && racerName !== '選手情報なし') {
                        uniqueRacers.set(racerNumber, racerName.replace(/　/g, ' ').trim());
                    }
                });

                if (arrivalsData.length < 3) {
                    console.warn(`[SCRAPE] ${schedule.placeName} R${schedule.raceNumber}: Less than 3 arrivals found (${arrivalsData.length}), race may not be concluded. Skipping.`);
                    continue;
                }

                const first = arrivalsData[0]?.boatNumber;
                const second = arrivalsData[1]?.boatNumber;
                const third = arrivalsData[2]?.boatNumber;
                if (!first || !second || !third) continue;

                // --- STEP 4: Parse Payouts ---
                const payoutsData: { type: string; numbers: string; amount: number }[] = [];

                const betTypeMap: Record<string, string> = {
                    '3連単': '3TR',
                    '3連複': '3PL',
                    '2連単': '2TR',
                    '2連複': '2PL',
                    '拡連複': 'WIDE',
                    '単勝': 'WIN',
                    '複勝': 'PLACE',
                };

                // Each tbody in the payout table has a td[rowspan] labeling the bet type
                $('div.grid_unit tbody').each((_, tbody) => {
                    const labelCell = $(tbody).find('td[rowspan]').first();
                    if (labelCell.length === 0) return;

                    const jaLabel = labelCell.text().trim();
                    const betType = betTypeMap[jaLabel];
                    if (!betType) return;

                    $(tbody).find('tr.is-p3-0').each((_, row) => {
                        const numberSpans = $(row).find('span.numberSet1_number');
                        if (numberSpans.length === 0) return; // Empty row (nbsp)

                        const combination = numberSpans.map((_, s) => $(s).text().trim()).get().join('-');
                        if (!combination || combination === '') return;

                        const payoutSpan = $(row).find('span.is-payout1').first();
                        const payoutText = payoutSpan.text().trim();
                        if (!payoutText || payoutText === '\u00a0' || payoutText === '') return;

                        const amount = parseInt(payoutText.replace(/[¥,\s]/g, ''), 10);
                        if (isNaN(amount) || amount === 0) return;

                        payoutsData.push({ type: betType, numbers: combination, amount });
                    });
                });

                if (payoutsData.length === 0) {
                    console.warn(`[SCRAPE] ${schedule.placeName} R${schedule.raceNumber}: No payouts found, race may not be settled. Skipping.`);
                    continue;
                }

                // --- STEP 5: Build DB Operations ---
                const raceDate = schedule.raceDate;

                // Upsert RaceResult
                dbOperations.push(
                    prisma.raceResult.upsert({
                        where: {
                            placeName_raceNumber_raceDate: {
                                placeName: schedule.placeName,
                                raceNumber: schedule.raceNumber,
                                raceDate
                            }
                        },
                        update: {
                            firstPlace: first,
                            secondPlace: second,
                            thirdPlace: third,
                            payouts: payoutsData,
                            arrivals: arrivalsData,
                            refunds: []
                        },
                        create: {
                            placeName: schedule.placeName,
                            raceNumber: schedule.raceNumber,
                            raceDate,
                            firstPlace: first,
                            secondPlace: second,
                            thirdPlace: third,
                            payouts: payoutsData,
                            arrivals: arrivalsData,
                            refunds: []
                        }
                    })
                );

                processedRaces.push({
                    placeName: schedule.placeName,
                    raceNumber: schedule.raceNumber,
                    raceDate
                });
                syncedScheduleIds.push(schedule.id);
                syncedCount++;

                console.log(`[SCRAPE] ✅ SUCCESS ${schedule.placeName} R${schedule.raceNumber}: DB upsert queued (Arrivals: ${arrivalsData.length}, Payouts: ${payoutsData.length}).`);

            } catch (scrapeErr: any) {
                console.error(`[SCRAPE] ❌ Error scraping ${schedule.placeName} R${schedule.raceNumber}:`, scrapeErr.message);
                continue; // Skip this race and continue with others
            }

            // Rate limiting: 500ms delay between requests
            await new Promise(resolve => setTimeout(resolve, 500));
        }

        console.log(`[SCRAPE] Parsing completed. Proceeding to DB transactions for ${dbOperations.length} races...`);

        // --- STEP 6: Bulk save Racers ---
        const racerDataArray = Array.from(uniqueRacers.entries()).map(([rNum, rName]) => ({
            racerNumber: rNum,
            name: rName
        }));

        if (racerDataArray.length > 0) {
            await prisma.racer.createMany({
                data: racerDataArray,
                skipDuplicates: true
            });
        }

        // --- STEP 7: Execute DB operations in chunks ---
        const CHUNK_SIZE = 100;
        for (let i = 0; i < dbOperations.length; i += CHUNK_SIZE) {
            const chunk = dbOperations.slice(i, i + CHUNK_SIZE);
            if (chunk.length > 0) {
                await prisma.$transaction(chunk);
            }
        }

        // --- STEP 8: Mark synced schedules ---
        if (syncedScheduleIds.length > 0) {
            await prisma.raceSchedule.updateMany({
                where: { id: { in: syncedScheduleIds } },
                data: { resultSynced: true }
            });
        }

        console.log(`[SCRAPE] Successfully synced ${syncedCount} race results via scraping.`);
        return { success: true, count: syncedCount, processedRaces };
    } catch (e: any) {
        console.error("[SCRAPE Error] Failed to sync results:", e);
        return { success: false, error: e.message };
    }
}

