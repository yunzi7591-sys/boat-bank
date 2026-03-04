const fs = require('fs');

function extractKeys(obj, prefix = '') {
    let keys = new Set();
    if (Array.isArray(obj)) {
        if (obj.length > 0) {
            const childKeys = extractKeys(obj[0], prefix + '[]');
            childKeys.forEach(k => keys.add(k));
        }
    } else if (obj && typeof obj === 'object') {
        for (const [key, val] of Object.entries(obj)) {
            const currentPrefix = prefix ? `${prefix}.${key}` : key;
            keys.add(currentPrefix);
            const childKeys = extractKeys(val, currentPrefix);
            childKeys.forEach(k => keys.add(k));
        }
    }
    return Array.from(keys);
}

try {
    const progData = JSON.parse(fs.readFileSync('programs.json', 'utf8'));
    console.log("=== Programs API (Schedule & Entries) ===");
    console.log(extractKeys(progData).join('\n'));
} catch (e) { console.error("Could not parse programs", e); }

try {
    const resData = JSON.parse(fs.readFileSync('results.json', 'utf8'));
    console.log("\n=== Results API ===");
    console.log(extractKeys(resData).join('\n'));
} catch (e) { console.error("Could not parse results", e); }
