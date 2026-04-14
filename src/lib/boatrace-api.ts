import { prisma } from "@/lib/prisma";
import { VENUES } from "@/lib/constants/venues";
import * as cheerio from "cheerio";

// v3 API endpoints
const SCHEDULE_API_URL = "https://boatraceopenapi.github.io/programs/v3/today.json";
const RESULTS_API_URL = "https://boatraceopenapi.github.io/results/v3/today.json";

function extractRacerClass(classNumber: number): string {
    switch (classNumber) {
        case 1: return 'A1';
        case 2: return 'A2';
        case 3: return 'B1';
        case 4: return 'B2';
        default: return 'B1';
    }
}

// v3 grade_label → 内部グレード文字列のマッピング
function normalizeGradeLabel(label: string | undefined): string {
    if (!label) return "一般";
    if (label.includes("SG")) return "SG";
    if (label.includes("G1") || label.includes("GⅠ")) return "G1";
    if (label.includes("G2") || label.includes("GⅡ")) return "G2";
    if (label.includes("G3") || label.includes("GⅢ")) return "G3";
    return "一般";
}

// v3 day_label → 内部日目文字列のマッピング
function normalizeDayLabel(label: string | undefined): string {
    if (!label) return "開催中";
    // 全角数字を半角に変換（APIが"２日目"等の全角で返す場合がある）
    const normalized = label.replace(/[０-９]/g, (s) => String.fromCharCode(s.charCodeAt(0) - 0xfee0));
    const validDays = ["初日", "2日目", "3日目", "4日目", "5日目", "6日目", "7日目", "最終日"];
    if (validDays.includes(normalized)) return normalized;
    return "開催中";
}

/**
 * チャンク対応: offset〜offset+limit のプログラムだけ処理する
 * GitHub Actions から複数回呼ばれる想定
 */
export async function syncTodayScheduleChunk(offset: number = 0, limit: number = 20) {
    try {
        const res = await fetch(SCHEDULE_API_URL, { cache: 'no-store' });
        if (!res.ok) throw new Error(`API Fetch failed: ${res.status}`);

        const data = await res.json();
        const allPrograms = data.programs || [];

        if (allPrograms.length === 0) {
            return { success: true, total: 0, processed: 0, done: true };
        }

        const chunk = allPrograms.slice(offset, offset + limit);
        if (chunk.length === 0) {
            return { success: true, total: allPrograms.length, processed: 0, done: true };
        }

        const uniqueRacers = new Map<number, { name: string; grade: string }>();
        const parsedPrograms: any[] = [];

        for (const prog of chunk) {
            const stadiumId = prog.stadium_number.toString().padStart(2, '0');
            const venue = VENUES.find(v => v.id === stadiumId);
            if (!venue) continue;

            const placeName = venue.name;
            const raceNumber = prog.number;
            const raceDate = new Date(prog.date);
            const deadlineAt = new Date(`${prog.closed_at.replace(' ', 'T')}+09:00`);
            const grade = normalizeGradeLabel(prog.grade_label);
            const day = normalizeDayLabel(prog.day_label);

            const entriesData: any[] = [];
            for (const b of (prog.boats || [])) {
                const rName = typeof b.racer_name === 'string' ? b.racer_name.trim() : "";
                const rNum = typeof b.racer_number === 'number' ? b.racer_number : null;
                const rGrade = extractRacerClass(b.racer_class_number);
                if (rNum && rName && rName !== "undefined undefined") {
                    uniqueRacers.set(rNum, { name: rName, grade: rGrade });
                    entriesData.push({ boatNumber: b.racer_boat_number, racerNumber: rNum, localWinRate: b.racer_national_top_1_percent || null, motorRate: b.racer_assigned_motor_top_2_percent || null });
                }
            }
            parsedPrograms.push({ placeName, raceNumber, raceDate, deadlineAt, grade, day, entriesData });
        }

        // Racer upsert (小チャンク)
        const racerArray = Array.from(uniqueRacers.entries()).map(([rNum, info]) => ({
            racerNumber: rNum, name: info.name, grade: info.grade
        }));
        for (let i = 0; i < racerArray.length; i += 20) {
            const rc = racerArray.slice(i, i + 20);
            await prisma.$transaction(rc.map(r =>
                prisma.racer.upsert({
                    where: { racerNumber: r.racerNumber },
                    update: { name: r.name, grade: r.grade },
                    create: { racerNumber: r.racerNumber, name: r.name, grade: r.grade }
                })
            ));
        }

        // Racer ID map
        const racerIds = Array.from(uniqueRacers.keys());
        const racersInDb = await prisma.racer.findMany({
            where: { racerNumber: { in: racerIds } },
            select: { id: true, racerNumber: true }
        });
        const racerIdMap = new Map(racersInDb.map(r => [r.racerNumber, r.id]));

        // Schedule insert
        await prisma.raceSchedule.createMany({
            data: parsedPrograms.map(pr => ({
                placeName: pr.placeName, raceNumber: pr.raceNumber,
                raceDate: pr.raceDate, deadlineAt: pr.deadlineAt,
                grade: pr.grade, day: pr.day
            })),
            skipDuplicates: true
        });

        // Entry insert
        const entriesData: any[] = [];
        for (const pr of parsedPrograms) {
            for (const entry of pr.entriesData) {
                const racerId = racerIdMap.get(entry.racerNumber);
                if (racerId) {
                    entriesData.push({
                        placeName: pr.placeName, raceNumber: pr.raceNumber,
                        raceDate: pr.raceDate, boatNumber: entry.boatNumber, racerId,
                        localWinRate: entry.localWinRate, motorRate: entry.motorRate,
                    });
                }
            }
        }
        if (entriesData.length > 0) {
            await prisma.raceEntry.createMany({ data: entriesData, skipDuplicates: true });
        }

        const done = offset + limit >= allPrograms.length;
        console.log(`[CHUNK] offset=${offset} limit=${limit}: ${parsedPrograms.length} schedules, ${entriesData.length} entries. done=${done}`);
        return {
            success: true,
            total: allPrograms.length,
            processed: parsedPrograms.length,
            nextOffset: offset + limit,
            done
        };
    } catch (e: any) {
        console.error("[CHUNK Error]", e);
        return { success: false, error: e.message };
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
            // v3 field names: stadium_number, number, date, closed_at, grade_label, day_label
            const stadiumId = prog.stadium_number.toString().padStart(2, '0');
            const venue = VENUES.find(v => v.id === stadiumId);

            if (!venue) continue; // Unknown venue

            const placeName = venue.name;
            const raceNumber = prog.number;
            const raceDate = new Date(prog.date); // "2026-02-28" resulting in UTC 00:00
            // "closed_at": "2026-02-28 15:48:00"
            const deadlineAt = new Date(`${prog.closed_at.replace(' ', 'T')}+09:00`);

            // v3: grade_label/day_label から直接取得（スクレイピング不要）
            const grade = normalizeGradeLabel(prog.grade_label);
            const day = normalizeDayLabel(prog.day_label);

            const entriesData: any[] = [];
            const boats = prog.boats || [];

            for (const b of boats) {
                const rName = typeof b.racer_name === 'string' ? b.racer_name.trim() : "";
                const rNum = typeof b.racer_number === 'number' ? b.racer_number : null;
                const rGrade = extractRacerClass(b.racer_class_number);

                if (rNum && rName && rName !== "undefined undefined") {
                    uniqueRacers.set(rNum, { name: rName, grade: rGrade });
                    entriesData.push({ boatNumber: b.racer_boat_number, racerNumber: rNum, localWinRate: b.racer_national_top_1_percent || null, motorRate: b.racer_assigned_motor_top_2_percent || null });
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

        // 4, 5: If already synced, update deadlineAt only (締切時刻変更対応)
        if (schedulesAlreadySynced) {
            let updatedCount = 0;
            for (const pr of parsedPrograms) {
                const result = await prisma.raceSchedule.updateMany({
                    where: { placeName: pr.placeName, raceNumber: pr.raceNumber, raceDate: pr.raceDate },
                    data: { deadlineAt: pr.deadlineAt, grade: pr.grade, day: pr.day },
                });
                if (result.count > 0) updatedCount++;
            }
            // エントリの当地勝率・モーター2連率も更新
            for (const pr of parsedPrograms) {
                for (const entry of pr.entriesData) {
                    if (entry.localWinRate != null || entry.motorRate != null) {
                        await prisma.raceEntry.updateMany({
                            where: { placeName: pr.placeName, raceNumber: pr.raceNumber, raceDate: pr.raceDate, boatNumber: entry.boatNumber },
                            data: { localWinRate: entry.localWinRate, motorRate: entry.motorRate },
                        });
                    }
                }
            }

            console.log(`[API] Schedules already synced (${existingCount} races). Updated deadlineAt + entry stats for ${updatedCount} races.`);
            return { success: true, count: existingCount, updated: updatedCount, skipped: true };
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
                        racerId: racerId,
                        localWinRate: entry.localWinRate,
                        motorRate: entry.motorRate,
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
                const $cell = $(cell);

                // Use .hasClass() for robust multiple-class support
                // Also check for case-insensitive variations seen in logs (is-G1b, etc.)
                const classAttr = $cell.attr('class') || '';

                if (classAttr.toLowerCase().includes('is-sg')) { grade = "SG"; broke = true; }
                else if (classAttr.toLowerCase().includes('is-g1')) { grade = "G1"; broke = true; }
                else if (classAttr.toLowerCase().includes('is-g2')) { grade = "G2"; broke = true; }
                else if (classAttr.toLowerCase().includes('is-g3')) { grade = "G3"; broke = true; }
                else if (classAttr.toLowerCase().includes('is-ippan')) { grade = "一般"; broke = true; }

                if (!broke) {
                    $cell.find('img').each((_, img) => {
                        const imgSrc = $(img).attr('src') || '';
                        if (imgSrc.includes('text_sg')) { grade = "SG"; broke = true; }
                        else if (imgSrc.includes('text_g1')) { grade = "G1"; broke = true; }
                        else if (imgSrc.includes('text_g2')) { grade = "G2"; broke = true; }
                        else if (imgSrc.includes('text_g3')) { grade = "G3"; broke = true; }
                    });
                }
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

/**
 * results/v3 API から結果を取得して保存する（フォールバック用）
 */
/**
 * 事前取得済みのAPI結果配列から1レース分をパースする
 */
function parseResultFromAPIData(raceResult: any) {
    const boats = raceResult.boats || [];
    const arrivalsData = boats
        .filter((b: any) => b.racer_place_number > 0)
        .map((b: any) => ({
            place: b.racer_place_number,
            boatNumber: b.racer_boat_number,
            racerName: b.racer_name || '選手情報なし',
            racerNumber: b.racer_number || null,
        }))
        .sort((a: any, b: any) => a.place - b.place);

    const first = arrivalsData.find((a: any) => a.place === 1)?.boatNumber;
    const second = arrivalsData.find((a: any) => a.place === 2)?.boatNumber;
    const third = arrivalsData.find((a: any) => a.place === 3)?.boatNumber;

    if (!first || !second || !third) {
        throw new Error("Match not fully concluded (Missing place numbers).");
    }

    const refundedBoats: number[] = boats
        .filter((b: any) => !b.racer_place_number || b.racer_place_number === 0)
        .map((b: any) => b.racer_boat_number);

    const apiPayouts = raceResult.payouts || {};
    const payoutsData: { type: string; numbers: string; amount: number }[] = [];

    const payoutMapping: [string, string, string][] = [
        ['trifecta', '3TR', '-'],
        ['trio', '3PL', '-'],
        ['exacta', '2TR', '-'],
        ['quinella', '2PL', '-'],
        ['quinella_place', 'WIDE', '-'],
        ['win', 'WIN', ''],
        ['place', 'PLACE', ''],
    ];

    for (const [apiKey, betType, _sep] of payoutMapping) {
        const entries = apiPayouts[apiKey];
        if (entries && Array.isArray(entries)) {
            for (const p of entries) {
                const numbers = p.combination.replace(/[=]/g, '-');
                payoutsData.push({ type: betType, numbers, amount: p.amount });
            }
        }
    }

    return { first, second, third, payoutsData, arrivalsData, refundedBoats, raceDate: new Date(raceResult.date) };
}

export async function fetchResultFromAPI(placeName: string, raceNumber: number, raceDate: Date) {
    console.log(`[API Fallback] Fetching result for ${placeName} R${raceNumber} from results/v3...`);

    const res = await fetch(RESULTS_API_URL, { cache: 'no-store' });
    if (!res.ok) throw new Error(`Result API Fetch failed: ${res.status}`);

    const data = await res.json();
    const results = data.results || [];

    const venue = VENUES.find(v => v.name === placeName);
    if (!venue) throw new Error("Invalid place name");

    const stadiumNumber = parseInt(venue.id, 10);
    const raceResult = results.find((r: any) => r.stadium_number === stadiumNumber && r.number === raceNumber);

    if (!raceResult) {
        throw new Error("Result not found in API yet.");
    }

    return parseResultFromAPIData(raceResult);
}

/**
 * 1レースの結果をスクレイピングで取得する（メイン処理）
 */
export async function scrapeSingleRaceResult(placeName: string, raceNumber: number, raceDate: Date) {
    const venue = VENUES.find(v => v.name === placeName);
    if (!venue) throw new Error(`会場名不明: ${placeName}`);

    const jstRaceDate = new Date(raceDate.getTime() + 9 * 60 * 60 * 1000);
    const hdParam = jstRaceDate.toISOString().split('T')[0].replace(/-/g, '');
    const url = `https://www.boatrace.jp/owpc/pc/race/raceresult?rno=${raceNumber}&jcd=${venue.id}&hd=${hdParam}`;

    const res = await fetch(url, {
        cache: 'no-store',
        headers: { 'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/122.0.0.0 Safari/537.36' }
    });

    if (!res.ok) throw new Error(`HTTP ${res.status}`);

    const html = await res.text();
    const $ = cheerio.load(html);

    // --- Parse Arrivals ---
    const arrivalsData: { place: number; boatNumber: number; racerName: string; racerNumber: number | null }[] = [];
    const resultTable = $('table.is-w495, table.is-w748').first();

    resultTable.find('tbody tr').each((_, row) => {
        const boatCell = $(row).find('td[class*="is-boatColor"]');
        if (boatCell.length === 0) return;

        const boatNumber = parseInt(boatCell.text().trim(), 10);
        if (isNaN(boatNumber)) return;

        const rankText = $(row).find('td').first().text().trim();
        const rankNum = parseInt(rankText.replace(/[１-９]/g, (s) => String.fromCharCode(s.charCodeAt(0) - 0xfee0)), 10);
        const place = !isNaN(rankNum) ? rankNum : 99;

        const nameSpan = $(row).find('span.is-fs18.is-fBold').first();
        const racerName = nameSpan.text().trim().replace(/\s+/g, '　') || '選手情報なし';
        const numberSpan = $(row).find('span.is-fs12').first();
        const racerNumberStr = numberSpan.text().trim();
        const racerNumber = racerNumberStr ? parseInt(racerNumberStr, 10) : null;

        arrivalsData.push({
            place,
            boatNumber,
            racerName,
            racerNumber: (racerNumber && !isNaN(racerNumber)) ? racerNumber : null,
        });
    });

    if (arrivalsData.length < 3) {
        throw new Error(`着順データ不足 (${arrivalsData.length}艇のみ)`);
    }

    const first = arrivalsData.find(a => a.place === 1)?.boatNumber || arrivalsData[0].boatNumber;
    const second = arrivalsData.find(a => a.place === 2)?.boatNumber || arrivalsData[1].boatNumber;
    const third = arrivalsData.find(a => a.place === 3)?.boatNumber || arrivalsData[2].boatNumber;

    // --- Parse Refunds ---
    // 返還セクション: <th>返還</th> を含むテーブル内の numberSet1_number を取得
    const refunds: number[] = [];
    $('table').each((_, table) => {
        const headerText = $(table).find('th').text();
        if (headerText.includes('返還')) {
            $(table).find('span.numberSet1_number').each((_, span) => {
                const num = parseInt($(span).text().trim(), 10);
                if (!isNaN(num) && num >= 1 && num <= 6 && !refunds.includes(num)) {
                    refunds.push(num);
                }
            });
        }
    });

    // --- Parse Payouts ---
    const payoutsData: { type: string; numbers: string; amount: number }[] = [];
    const betTypeMap: Record<string, string> = {
        '3連単': '3TR', '3連複': '3PL', '2連単': '2TR', '2連複': '2PL',
        '拡連複': 'WIDE', '単勝': 'WIN', '複勝': 'PLACE',
    };

    $('div.grid_unit tbody').each((_, tbody) => {
        const labelCell = $(tbody).find('td[rowspan]').first();
        const jaLabel = labelCell.text().trim();
        const matchedKey = Object.keys(betTypeMap).find(k => jaLabel.includes(k));
        if (!matchedKey) return;
        const betType = betTypeMap[matchedKey];

        $(tbody).find('tr').each((_, row) => {
            const numberSpans = $(row).find('span.numberSet1_number');
            if (numberSpans.length === 0) return;

            const combination = numberSpans.map((_, s) => $(s).text().trim()).get().join('-');
            if (!combination) return;

            const payoutSpan = $(row).find('span.is-payout1').first();
            const payoutText = payoutSpan.text().trim();
            if (!payoutText || payoutText.includes('返還')) return;

            const amount = parseInt(payoutText.replace(/[¥,\s]/g, ''), 10);
            if (!isNaN(amount) && amount > 0) {
                payoutsData.push({ type: betType, numbers: combination, amount });
            }
        });
    });

    if (payoutsData.length === 0 && refunds.length === 0) {
        throw new Error('払戻・返還データなし');
    }

    return { first, second, third, payoutsData, arrivalsData, refundedBoats: refunds };
}

/**
 * レース結果をDBに保存する共通処理
 */
async function saveRaceResult(
    placeName: string, raceNumber: number, raceDate: Date,
    resultData: {
        first: number; second: number; third: number;
        payoutsData: { type: string; numbers: string; amount: number }[];
        arrivalsData?: any[];
        refundedBoats: number[];
    }
) {
    // 返還艇が新たに追加された場合、精算済みベットをリセットして再精算させる
    if (resultData.refundedBoats.length > 0) {
        const existing = await prisma.raceResult.findUnique({
            where: { placeName_raceNumber_raceDate: { placeName, raceNumber, raceDate } },
            select: { refunds: true },
        });
        const oldRefunds: number[] = (existing?.refunds as number[]) || [];
        const newRefunds = resultData.refundedBoats.filter(b => !oldRefunds.includes(b));

        if (newRefunds.length > 0) {
            console.log(`[SYNC] ⚠️ ${placeName} R${raceNumber}: 新たな返還艇検出 [${newRefunds}] → 精算済みベットをリセット`);
            // 精算済みのベットをリセット（再精算させる）
            await prisma.prediction.updateMany({
                where: { placeName, raceNumber, raceDate, isSettled: true },
                data: { isSettled: false, isHit: false, hitAmount: 0, refundAmount: 0, resultChecked: false },
            });
            await prisma.userBet.updateMany({
                where: { placeName, raceNumber, raceDate, isSettled: true },
                data: { isSettled: false, isHit: false, hitAmount: 0, refundAmount: 0 },
            });
            await prisma.eventBet.updateMany({
                where: { placeName, raceNumber, raceDate, isSettled: true },
                data: { isSettled: false, isHit: false, hitAmount: 0, refundAmount: 0 },
            });
        }
    }

    await prisma.$transaction(async (tx) => {
        await tx.raceResult.upsert({
            where: {
                placeName_raceNumber_raceDate: { placeName, raceNumber, raceDate }
            },
            update: {
                firstPlace: resultData.first,
                secondPlace: resultData.second,
                thirdPlace: resultData.third,
                payouts: resultData.payoutsData,
                arrivals: resultData.arrivalsData || [],
                refunds: resultData.refundedBoats,
            },
            create: {
                placeName, raceNumber, raceDate,
                firstPlace: resultData.first,
                secondPlace: resultData.second,
                thirdPlace: resultData.third,
                payouts: resultData.payoutsData,
                arrivals: resultData.arrivalsData || [],
                refunds: resultData.refundedBoats,
            }
        });

        await tx.raceSchedule.updateMany({
            where: { placeName, raceNumber, raceDate },
            data: { resultSynced: true }
        });

        if (resultData.arrivalsData) {
            for (const a of resultData.arrivalsData) {
                if (a.racerNumber && a.racerName && a.racerName !== '選手情報なし') {
                    await tx.racer.upsert({
                        where: { racerNumber: a.racerNumber },
                        update: { name: a.racerName.replace(/　/g, ' ').trim() },
                        create: {
                            racerNumber: a.racerNumber,
                            name: a.racerName.replace(/　/g, ' ').trim(),
                            grade: 'B1'
                        }
                    });
                }
            }
        }
    });

    const trifectaPayout = resultData.payoutsData.find(p => p.type === '3TR')?.amount || 0;
    const refundMsg = resultData.refundedBoats.length > 0 ? ` (返還: ${resultData.refundedBoats.join(',')})` : '';
    console.log(`[SYNC] ✅ ${placeName} R${raceNumber}: 保存成功 (3連単: ${trifectaPayout.toLocaleString()}円)${refundMsg}`);
}

/**
 * 1レースの結果を取得して保存する（スクレイピング優先 + API フォールバック）
 * QStash のワーカーから呼ばれる想定
 */
export async function syncAndSaveSingleResult(placeName: string, raceNumber: number, raceDate: Date) {
    let resultData: {
        first: number; second: number; third: number;
        payoutsData: { type: string; numbers: string; amount: number }[];
        arrivalsData?: any[];
        refundedBoats: number[];
    };

    // 1. スクレイピングを試行
    try {
        resultData = await scrapeSingleRaceResult(placeName, raceNumber, raceDate);
        console.log(`[SYNC] ${placeName} R${raceNumber}: スクレイピング成功`);
    } catch (scrapeErr: any) {
        console.warn(`[SYNC] ${placeName} R${raceNumber}: スクレイピング失敗 (${scrapeErr.message}), APIフォールバック実行...`);
        // 2. フォールバック: results/v3 API
        try {
            resultData = await fetchResultFromAPI(placeName, raceNumber, raceDate);
            console.log(`[SYNC] ${placeName} R${raceNumber}: APIフォールバック成功`);
        } catch (apiErr: any) {
            throw new Error(`スクレイピング・API両方失敗: scrape=${scrapeErr.message}, api=${apiErr.message}`);
        }
    }

    // 3. DB保存（共通処理）
    await saveRaceResult(placeName, raceNumber, raceDate, resultData);

    return { success: true, placeName, raceNumber, raceDate };
}

/**
 * 未同期の完了レース一覧を取得する（ディスパッチャー用）
 */
export async function getUnsyncedRaces(limit?: number) {
    const now = new Date();
    const fiveMinutesAgo = new Date(now.getTime() - 5 * 60 * 1000);

    // JST基準で当日の範囲を取得
    const jstNow = new Date(now.getTime() + 9 * 60 * 60 * 1000);
    const todayStr = jstNow.toISOString().split('T')[0];
    const todayStart = new Date(todayStr + 'T00:00:00.000Z');
    const todayEnd = new Date(todayStr + 'T23:59:59.999Z');

    return prisma.raceSchedule.findMany({
        where: {
            raceDate: { gte: todayStart, lte: todayEnd },
            deadlineAt: { lt: fiveMinutesAgo },
            resultSynced: false,
        },
        orderBy: [{ deadlineAt: 'asc' }, { placeName: 'asc' }, { raceNumber: 'asc' }],
        take: limit,
    });
}

/**
 * バッチで結果を同期する（API一括取得優先 + 残りを並列スクレイピング）
 * 手動実行 / cron 用
 */
export async function syncTodayResults(options: { limit?: number } = {}) {
    try {
        const modeStr = options.limit ? `Batch limit: ${options.limit}` : "UNLIMITED (Manual)";
        console.log(`[SYNC] Starting syncTodayResults (${modeStr})...`);

        const targetRaces = await getUnsyncedRaces(options.limit);

        if (targetRaces.length === 0) {
            console.log(`[SYNC] No unsynced completed races found.`);
            return { success: true, count: 0, processedRaces: [] };
        }

        console.log(`[SYNC] Found ${targetRaces.length} races to process.`);

        // Phase 1: API一括取得（1リクエストで全レース分）
        let apiResultsMap = new Map<string, any>(); // "placeName-raceNumber" → raceResult
        try {
            const res = await fetch(RESULTS_API_URL, { cache: 'no-store' });
            if (res.ok) {
                const data = await res.json();
                const results = data.results || [];
                for (const r of results) {
                    const stadiumId = r.stadium_number.toString().padStart(2, '0');
                    const venue = VENUES.find(v => v.id === stadiumId);
                    if (venue) {
                        apiResultsMap.set(`${venue.name}-${r.number}`, r);
                    }
                }
                console.log(`[SYNC] API一括取得成功: ${apiResultsMap.size}件の結果を取得`);
            } else {
                console.warn(`[SYNC] API一括取得失敗 (${res.status}), 全件スクレイピングにフォールバック`);
            }
        } catch (apiErr: any) {
            console.warn(`[SYNC] API一括取得エラー: ${apiErr.message}, 全件スクレイピングにフォールバック`);
        }

        let syncedCount = 0;
        const processedRaces: { placeName: string; raceNumber: number; raceDate: Date }[] = [];
        const scrapeTargets: typeof targetRaces = [];

        // Phase 2: APIデータがあるレースを一括処理
        for (const schedule of targetRaces) {
            const key = `${schedule.placeName}-${schedule.raceNumber}`;
            const apiResult = apiResultsMap.get(key);

            if (apiResult) {
                try {
                    const resultData = parseResultFromAPIData(apiResult);
                    await saveRaceResult(schedule.placeName, schedule.raceNumber, schedule.raceDate, resultData);
                    processedRaces.push({
                        placeName: schedule.placeName,
                        raceNumber: schedule.raceNumber,
                        raceDate: schedule.raceDate
                    });
                    syncedCount++;
                } catch (err: any) {
                    console.warn(`[SYNC] ${schedule.placeName} R${schedule.raceNumber}: APIパース失敗 (${err.message}), スクレイピング対象に追加`);
                    scrapeTargets.push(schedule);
                }
            } else {
                scrapeTargets.push(schedule);
            }
        }

        console.log(`[SYNC] API処理: ${syncedCount}件完了, スクレイピング残: ${scrapeTargets.length}件`);

        // Phase 3: 残りを並列スクレイピング（同時最大5件）
        const CONCURRENCY = 5;
        for (let i = 0; i < scrapeTargets.length; i += CONCURRENCY) {
            const batch = scrapeTargets.slice(i, i + CONCURRENCY);
            const results = await Promise.allSettled(
                batch.map(async (schedule) => {
                    let resultData;
                    try {
                        resultData = await scrapeSingleRaceResult(schedule.placeName, schedule.raceNumber, schedule.raceDate);
                    } catch (scrapeErr: any) {
                        console.warn(`[SYNC] ${schedule.placeName} R${schedule.raceNumber}: スクレイピング失敗 (${scrapeErr.message}), APIフォールバック...`);
                        resultData = await fetchResultFromAPI(schedule.placeName, schedule.raceNumber, schedule.raceDate);
                    }
                    await saveRaceResult(schedule.placeName, schedule.raceNumber, schedule.raceDate, resultData);
                    return { placeName: schedule.placeName, raceNumber: schedule.raceNumber, raceDate: schedule.raceDate };
                })
            );

            for (const r of results) {
                if (r.status === 'fulfilled') {
                    processedRaces.push(r.value);
                    syncedCount++;
                } else {
                    console.error(`[SYNC] スクレイピング失敗: ${r.reason?.message || r.reason}`);
                }
            }

            // バッチ間の待機（boatrace.jp負荷軽減）
            if (i + CONCURRENCY < scrapeTargets.length) {
                await new Promise(resolve => setTimeout(resolve, 500));
            }
        }

        console.log(`[SYNC] 処理完了。同期数: ${syncedCount}/${targetRaces.length}`);
        return { success: true, count: syncedCount, processedRaces };
    } catch (e: any) {
        console.error("[SYNC Error] syncTodayResults failed:", e);
        return { success: false, error: e.message };
    }
}

// =============================================================
// 欠場情報の取得
// =============================================================

/**
 * boatrace.jpの出走表から欠場艇を取得して更新する
 */
export async function syncAbsentBoats() {
    const now = new Date();
    const jstNow = new Date(now.getTime() + 9 * 60 * 60 * 1000);
    const todayStr = jstNow.toISOString().split('T')[0];
    const todayStart = new Date(todayStr + 'T00:00:00.000Z');
    const todayEnd = new Date(todayStr + 'T23:59:59.999Z');
    const hdParam = todayStr.replace(/-/g, '');

    // 本日開催中の場を取得
    const schedules = await prisma.raceSchedule.findMany({
        where: { raceDate: { gte: todayStart, lte: todayEnd } },
        select: { placeName: true },
        distinct: ['placeName'],
    });

    let updated = 0;

    for (const { placeName } of schedules) {
        const venue = VENUES.find(v => v.name === placeName);
        if (!venue) continue;

        // 各レースの出走表をチェック
        // 結果未確定のレース全て（締切前後問わず）
        const venueSchedules = await prisma.raceSchedule.findMany({
            where: { placeName, raceDate: { gte: todayStart, lte: todayEnd }, resultSynced: false },
            select: { raceNumber: true, raceDate: true },
        });

        for (const sched of venueSchedules) {
            try {
                const url = `https://www.boatrace.jp/owpc/pc/race/racelist?rno=${sched.raceNumber}&jcd=${venue.id}&hd=${hdParam}`;
                const res = await fetch(url, {
                    cache: 'no-store',
                    headers: { 'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36' },
                });
                if (!res.ok) continue;

                const html = await res.text();
                const $ = cheerio.load(html);

                // is-miss クラスを持つ tbody から欠場艇の番号を取得
                const absentBoats: number[] = [];
                $('tbody.is-miss').each((_, tbody) => {
                    const boatCell = $(tbody).find('td[class*="is-boatColor"]').first();
                    const boatNum = parseInt(boatCell.text().trim().replace(/[０-９]/g, (s) => String.fromCharCode(s.charCodeAt(0) - 0xfee0)));
                    if (!isNaN(boatNum) && boatNum >= 1 && boatNum <= 6) {
                        absentBoats.push(boatNum);
                    }
                });

                if (absentBoats.length > 0) {
                    // 欠場艇をマーク
                    for (const boatNum of absentBoats) {
                        const result = await prisma.raceEntry.updateMany({
                            where: { placeName, raceNumber: sched.raceNumber, raceDate: sched.raceDate, boatNumber: boatNum, isAbsent: false },
                            data: { isAbsent: true },
                        });
                        if (result.count > 0) {
                            console.log(`[ABSENT] ${placeName} R${sched.raceNumber} ${boatNum}号艇 欠場`);
                            updated++;
                        }
                    }
                }
            } catch (e: any) {
                console.warn(`[ABSENT] ${placeName} R${sched.raceNumber} チェック失敗: ${e.message}`);
            }
        }

        // 負荷軽減
        await new Promise(r => setTimeout(r, 300));
    }

    console.log(`[ABSENT] 完了: ${updated}件更新`);
    return { success: true, updated };
}

// =============================================================
// オッズ取得 (参考オッズ)
// =============================================================

const ODDS_UA = 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/122.0.0.0 Safari/537.36';

/**
 * boatrace.jpから3連単オッズをスクレイピング
 *
 * odds3t ページの構造:
 * - テーブル(table.is-w495)にtbodyが1つ
 * - ヘッダーは6列 (1着=1号艇〜6号艇)
 * - 各列は3セル: [rowspan付き2着番号], [3着番号], [oddsPoint]
 * - rowspan=4 なので4行で1つの2着候補グループ
 * - 5つの2着候補 × 4行の3着候補 = 20行
 */
async function scrapeOdds3TR(venueId: string, raceNumber: number, hdParam: string): Promise<Record<string, number>> {
    const url = `https://www.boatrace.jp/owpc/pc/race/odds3t?rno=${raceNumber}&jcd=${venueId}&hd=${hdParam}`;
    const res = await fetch(url, {
        cache: 'no-store',
        headers: { 'User-Agent': ODDS_UA }
    });
    if (!res.ok) throw new Error(`HTTP ${res.status}`);

    const html = await res.text();
    const $ = cheerio.load(html);
    const odds: Record<string, number> = {};

    // テーブル内のtbody (is-p3-0 クラス)
    const tbody = $('tbody.is-p3-0');
    if (!tbody.length) return odds;

    const rows = tbody.find('tr');

    // 各1着の現在の2着を追跡
    // ヘッダーから1着の順番を取得（常に1,2,3,4,5,6）
    const firstBoats = [1, 2, 3, 4, 5, 6];

    // 各列の現在の2着番号を追跡
    const currentSecond: number[] = [0, 0, 0, 0, 0, 0]; // index=列(0-5)
    let rowInGroup = 0; // 0-3のカウント

    rows.each((rowIdx, row) => {
        const cells = $(row).find('td');
        if (cells.length === 0) return;

        // 各列を処理
        // rowspan=4のセルがある行は新しい2着グループの開始
        let cellIdx = 0;

        for (let col = 0; col < 6; col++) {
            if (cellIdx >= cells.length) break;

            const cell = cells[cellIdx];
            const $cell = $(cell);
            const rowspan = parseInt($cell.attr('rowspan') || '0');

            if (rowspan === 4) {
                // 2着番号（rowspan付きのセル）
                const secondNum = parseInt($cell.text().trim());
                if (!isNaN(secondNum)) {
                    currentSecond[col] = secondNum;
                }
                cellIdx++;

                // 次のセルが3着番号
                if (cellIdx < cells.length) {
                    const thirdNum = parseInt($(cells[cellIdx]).text().trim());
                    cellIdx++;

                    // その次がオッズ
                    if (cellIdx < cells.length) {
                        const oddsText = $(cells[cellIdx]).text().trim();
                        const oddsVal = parseFloat(oddsText);
                        if (!isNaN(oddsVal) && oddsVal > 0 && !isNaN(thirdNum)) {
                            odds[`${firstBoats[col]}-${secondNum}-${thirdNum}`] = oddsVal;
                        }
                        cellIdx++;
                    }
                }
            } else {
                // rowspan無しのセル: 3着番号 + オッズ
                const thirdNum = parseInt($cell.text().trim());
                cellIdx++;

                if (cellIdx < cells.length) {
                    const oddsText = $(cells[cellIdx]).text().trim();
                    const oddsVal = parseFloat(oddsText);
                    if (!isNaN(oddsVal) && oddsVal > 0 && !isNaN(thirdNum) && currentSecond[col]) {
                        odds[`${firstBoats[col]}-${currentSecond[col]}-${thirdNum}`] = oddsVal;
                    }
                    cellIdx++;
                }
            }
        }
    });

    return odds;
}

/**
 * boatrace.jpから2連単オッズをスクレイピング
 * odds2tf ページ: 上部テーブルが2連単、下部が2連複
 */
async function scrapeOdds2TR(venueId: string, raceNumber: number, hdParam: string): Promise<Record<string, number>> {
    const url = `https://www.boatrace.jp/owpc/pc/race/odds2tf?rno=${raceNumber}&jcd=${venueId}&hd=${hdParam}`;
    const res = await fetch(url, {
        cache: 'no-store',
        headers: { 'User-Agent': ODDS_UA }
    });
    if (!res.ok) throw new Error(`HTTP ${res.status}`);

    const html = await res.text();
    const $ = cheerio.load(html);
    const odds: Record<string, number> = {};

    // 2連単テーブル: 最初のgrid_unit内のtable
    const firstTable = $('div.grid_unit').first().find('table.is-w495');
    if (!firstTable.length) return odds;

    firstTable.find('tbody tr').each((_, row) => {
        const cells = $(row).find('td');
        if (cells.length < 2) return;

        let cellIdx = 0;
        while (cellIdx + 1 < cells.length) {
            const $numCell = $(cells[cellIdx]);
            const $oddsCell = $(cells[cellIdx + 1]);

            // 番号セル (is-boatColor* クラス)
            const classAttr = $numCell.attr('class') || '';
            if (classAttr.includes('is-boatColor') || classAttr.includes('oddsPoint')) {
                const boatNum = parseInt($numCell.text().trim());
                if ($oddsCell.hasClass('oddsPoint')) {
                    const oddsVal = parseFloat($oddsCell.text().trim());
                    const rowspan = $numCell.attr('rowspan');
                    // rowspanがある場合、1着番号
                    // ない場合、2着番号
                    if (!isNaN(oddsVal) && oddsVal > 0 && !isNaN(boatNum)) {
                        // 組合せキーの構築はテーブル構造に依存するため、
                        // ここではセル位置からの推定は困難。
                        // 代替: セルのdata属性やrowspan構造から推定
                    }
                }
            }
            cellIdx += 2;
        }
    });

    return odds;
}

/**
 * boatrace.jpから単勝オッズをスクレイピング
 * oddstf ページ: 上部が単勝、下部が複勝
 */
async function scrapeOddsWin(venueId: string, raceNumber: number, hdParam: string): Promise<Record<string, number>> {
    const url = `https://www.boatrace.jp/owpc/pc/race/oddstf?rno=${raceNumber}&jcd=${venueId}&hd=${hdParam}`;
    const res = await fetch(url, {
        cache: 'no-store',
        headers: { 'User-Agent': ODDS_UA }
    });
    if (!res.ok) throw new Error(`HTTP ${res.status}`);

    const html = await res.text();
    const $ = cheerio.load(html);
    const win: Record<string, number> = {};

    // 単勝テーブル: 最初のgrid_unit内のtable
    $('div.grid_unit').first().find('table.is-w495 tbody tr').each((_, row) => {
        const boatCell = $(row).find('td[class*="is-boatColor"]').first();
        const oddsCell = $(row).find('td.oddsPoint').first();

        if (boatCell.length && oddsCell.length) {
            const boatNum = boatCell.text().trim();
            const oddsVal = parseFloat(oddsCell.text().trim());
            if (boatNum && !isNaN(oddsVal) && oddsVal > 0) {
                win[boatNum] = oddsVal;
            }
        }
    });

    return win;
}

/**
 * 指定レースの全オッズを取得してDBに保存する
 */
export async function fetchAndSaveOdds(placeName: string, raceNumber: number, raceDate: Date) {
    const venue = VENUES.find(v => v.name === placeName);
    if (!venue) throw new Error(`会場名不明: ${placeName}`);

    const jstRaceDate = new Date(raceDate.getTime() + 9 * 60 * 60 * 1000);
    const hdParam = jstRaceDate.toISOString().split('T')[0].replace(/-/g, '');

    console.log(`[ODDS] Fetching odds for ${placeName} R${raceNumber} (${hdParam})...`);

    const oddsTypes: { type: string; fn: () => Promise<Record<string, number>> }[] = [
        { type: '3TR', fn: () => scrapeOdds3TR(venue.id, raceNumber, hdParam) },
        { type: 'WIN', fn: () => scrapeOddsWin(venue.id, raceNumber, hdParam) },
    ];

    for (const { type, fn } of oddsTypes) {
        try {
            const data = await fn();
            if (Object.keys(data).length > 0) {
                await prisma.raceOdds.upsert({
                    where: { placeName_raceNumber_raceDate_oddsType: { placeName, raceNumber, raceDate, oddsType: type } },
                    update: { oddsData: data, fetchedAt: new Date() },
                    create: { placeName, raceNumber, raceDate, oddsType: type, oddsData: data },
                });
                console.log(`[ODDS] ${type}: ${Object.keys(data).length}件`);
            }
        } catch (e: any) {
            console.warn(`[ODDS] ${type}取得失敗: ${e.message}`);
        }
    }

    console.log(`[ODDS] ✅ ${placeName} R${raceNumber} オッズ保存完了`);
}

/**
 * オッズ取得対象のレースを判定して取得する
 * - 前のレースの締め切り時刻にそのレースのオッズを取得
 * - 締め切り15分前にもオッズを取得
 * - 締切後のレースのオッズは削除
 */
export async function syncOdds() {
    const now = new Date();

    // JST基準で当日の範囲
    const jstNow = new Date(now.getTime() + 9 * 60 * 60 * 1000);
    const todayStr = jstNow.toISOString().split('T')[0];
    const todayStart = new Date(todayStr + 'T00:00:00.000Z');
    const todayEnd = new Date(todayStr + 'T23:59:59.999Z');

    // 当日の全スケジュールを取得
    const schedules = await prisma.raceSchedule.findMany({
        where: { raceDate: { gte: todayStart, lte: todayEnd } },
        orderBy: [{ placeName: 'asc' }, { raceNumber: 'asc' }],
    });

    if (schedules.length === 0) {
        console.log('[ODDS] No schedules for today');
        return { success: true, fetched: 0, cleaned: 0 };
    }

    // 場ごとにグループ化
    const byVenue = new Map<string, typeof schedules>();
    for (const s of schedules) {
        const arr = byVenue.get(s.placeName) || [];
        arr.push(s);
        byVenue.set(s.placeName, arr);
    }

    let fetched = 0;
    let cleaned = 0;

    for (const [placeName, venueSchedules] of byVenue) {
        // raceNumberで昇順ソート
        venueSchedules.sort((a, b) => a.raceNumber - b.raceNumber);

        for (let i = 0; i < venueSchedules.length; i++) {
            const race = venueSchedules[i];
            const deadline = new Date(race.deadlineAt);

            // 締切済みのレースのオッズを削除
            if (now > deadline) {
                const deleted = await prisma.raceOdds.deleteMany({
                    where: { placeName, raceNumber: race.raceNumber, raceDate: race.raceDate },
                });
                if (deleted.count > 0) {
                    cleaned += deleted.count;
                    console.log(`[ODDS] 🗑 ${placeName} R${race.raceNumber} オッズ削除 (締切済み)`);
                }
                continue;
            }

            // まだ締め切ってないレース: オッズ取得タイミング判定
            const msUntilDeadline = deadline.getTime() - now.getTime();
            const fifteenMin = 15 * 60 * 1000;

            // 条件1: 締切15分前以内
            const isWithin15Min = msUntilDeadline <= fifteenMin && msUntilDeadline > 0;

            // 条件2: 前のレースが締切済み（前のレースの締切〜このレースの締切15分前の間）
            const prevRace = i > 0 ? venueSchedules[i - 1] : null;
            const prevDeadlinePassed = prevRace ? now >= new Date(prevRace.deadlineAt) : false;

            if (isWithin15Min || prevDeadlinePassed) {
                // 直近3分以内に既に取得済みなら再取得しない
                const existing = await prisma.raceOdds.findFirst({
                    where: { placeName, raceNumber: race.raceNumber, raceDate: race.raceDate },
                    select: { fetchedAt: true },
                    orderBy: { fetchedAt: 'desc' },
                });

                const threeMinAgo = new Date(now.getTime() - 3 * 60 * 1000);
                if (existing && existing.fetchedAt > threeMinAgo) {
                    continue; // 最近取得済み、スキップ
                }

                try {
                    await fetchAndSaveOdds(placeName, race.raceNumber, race.raceDate);
                    fetched++;
                } catch (e: any) {
                    console.error(`[ODDS] ${placeName} R${race.raceNumber} 取得エラー: ${e.message}`);
                }
            }
        }
    }

    console.log(`[ODDS] 完了: 取得=${fetched}, 削除=${cleaned}`);
    return { success: true, fetched, cleaned };
}
