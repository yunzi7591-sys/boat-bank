#!/usr/bin/env node
/**
 * GitHub Actions用: レーススケジュール同期スクリプト
 * Vercel Functionを経由せず、直接DBに書き込む
 *
 * 必要な環境変数: DATABASE_URL
 */
import { PrismaClient } from '@prisma/client';

const SCHEDULE_API_URL = "https://boatraceopenapi.github.io/programs/v3/today.json";

const VENUES = [
  { id: "01", name: "桐生" }, { id: "02", name: "戸田" }, { id: "03", name: "江戸川" },
  { id: "04", name: "平和島" }, { id: "05", name: "多摩川" }, { id: "06", name: "浜名湖" },
  { id: "07", name: "蒲郡" }, { id: "08", name: "常滑" }, { id: "09", name: "津" },
  { id: "10", name: "三国" }, { id: "11", name: "びわこ" }, { id: "12", name: "住之江" },
  { id: "13", name: "尼崎" }, { id: "14", name: "鳴門" }, { id: "15", name: "丸亀" },
  { id: "16", name: "児島" }, { id: "17", name: "宮島" }, { id: "18", name: "徳山" },
  { id: "19", name: "下関" }, { id: "20", name: "若松" }, { id: "21", name: "芦屋" },
  { id: "22", name: "福岡" }, { id: "23", name: "唐津" }, { id: "24", name: "大村" },
];

function extractRacerClass(n) {
  switch (n) { case 1: return 'A1'; case 2: return 'A2'; case 3: return 'B1'; case 4: return 'B2'; default: return 'B1'; }
}
function normalizeGradeLabel(label) {
  if (!label) return "一般";
  if (label.includes("SG")) return "SG";
  if (label.includes("G1") || label.includes("GⅠ")) return "G1";
  if (label.includes("G2") || label.includes("GⅡ")) return "G2";
  if (label.includes("G3") || label.includes("GⅢ")) return "G3";
  return "一般";
}
function normalizeDayLabel(label) {
  if (!label) return "開催中";
  const valid = ["初日", "2日目", "3日目", "4日目", "5日目", "6日目", "7日目", "最終日"];
  return valid.includes(label) ? label : "開催中";
}

async function main() {
  const prisma = new PrismaClient();

  try {
    console.log("[SYNC] Fetching schedule API...");
    const res = await fetch(SCHEDULE_API_URL);
    if (!res.ok) throw new Error(`API fetch failed: ${res.status}`);

    const data = await res.json();
    const programs = data.programs || [];
    console.log(`[SYNC] ${programs.length} programs found`);

    if (programs.length === 0) {
      console.log("[SYNC] No events today");
      return;
    }

    // Parse
    const uniqueRacers = new Map();
    const parsedPrograms = [];

    for (const prog of programs) {
      const stadiumId = prog.stadium_number.toString().padStart(2, '0');
      const venue = VENUES.find(v => v.id === stadiumId);
      if (!venue) continue;

      const entriesData = [];
      for (const b of (prog.boats || [])) {
        const rName = typeof b.racer_name === 'string' ? b.racer_name.trim() : "";
        const rNum = typeof b.racer_number === 'number' ? b.racer_number : null;
        if (rNum && rName && rName !== "undefined undefined") {
          uniqueRacers.set(rNum, { name: rName, grade: extractRacerClass(b.racer_class_number) });
          entriesData.push({ boatNumber: b.racer_boat_number, racerNumber: rNum });
        }
      }

      parsedPrograms.push({
        placeName: venue.name,
        raceNumber: prog.number,
        raceDate: new Date(prog.date),
        deadlineAt: new Date(`${prog.closed_at.replace(' ', 'T')}+09:00`),
        grade: normalizeGradeLabel(prog.grade_label),
        day: normalizeDayLabel(prog.day_label),
        entriesData,
      });
    }

    // Racer upsert (chunks of 20)
    const racerArray = Array.from(uniqueRacers.entries()).map(([rNum, info]) => ({
      racerNumber: rNum, name: info.name, grade: info.grade
    }));
    console.log(`[SYNC] Upserting ${racerArray.length} racers...`);
    for (let i = 0; i < racerArray.length; i += 20) {
      const chunk = racerArray.slice(i, i + 20);
      await prisma.$transaction(chunk.map(r =>
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

    // Schedule insert (new) + update deadlineAt (existing)
    console.log(`[SYNC] Inserting/updating ${parsedPrograms.length} schedules...`);
    await prisma.raceSchedule.createMany({
      data: parsedPrograms.map(pr => ({
        placeName: pr.placeName, raceNumber: pr.raceNumber,
        raceDate: pr.raceDate, deadlineAt: pr.deadlineAt,
        grade: pr.grade, day: pr.day
      })),
      skipDuplicates: true
    });

    // Update deadlineAt for existing schedules (締切時刻変更対応)
    for (const pr of parsedPrograms) {
      await prisma.raceSchedule.updateMany({
        where: { placeName: pr.placeName, raceNumber: pr.raceNumber, raceDate: pr.raceDate },
        data: { deadlineAt: pr.deadlineAt, grade: pr.grade, day: pr.day },
      });
    }

    // Entry insert (chunks of 500)
    const entriesData = [];
    for (const pr of parsedPrograms) {
      for (const entry of pr.entriesData) {
        const racerId = racerIdMap.get(entry.racerNumber);
        if (racerId) {
          entriesData.push({
            placeName: pr.placeName, raceNumber: pr.raceNumber,
            raceDate: pr.raceDate, boatNumber: entry.boatNumber, racerId
          });
        }
      }
    }
    console.log(`[SYNC] Inserting ${entriesData.length} entries...`);
    for (let i = 0; i < entriesData.length; i += 500) {
      await prisma.raceEntry.createMany({
        data: entriesData.slice(i, i + 500),
        skipDuplicates: true
      });
    }

    console.log(`[SYNC] Done! ${parsedPrograms.length} schedules, ${entriesData.length} entries`);
  } finally {
    await prisma.$disconnect();
  }
}

main().catch(e => { console.error(e); process.exit(1); });
