import { syncOfficialGradeAndDay } from './src/lib/boatrace-api';

async function run() {
    try {
        const res = await syncOfficialGradeAndDay();
        console.log("Response:", res);
    } catch (e) {
        console.error("Error:", e);
    }
}
run();
