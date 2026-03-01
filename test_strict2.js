const cheerio = require('cheerio');

async function test() {
  const res = await fetch('https://www.boatrace.jp/owpc/pc/race/index');
  const html = await res.text();
  const $ = cheerio.load(html);
  
  const scrapedData = [];
  
  $('tbody').each((i, el) => {
    const venueImg = $(el).find('img[src*="text_place1_"]');
    if (!venueImg.length) return;
    
    const src = venueImg.attr('src') || '';
    const match = src.match(/text_place1_(\d+)\.png/);
    if (!match) return;
    const stadiumId = match[1];
    
    let day = "-日目";
    // First let's check exact match like /(初日|[１-９1-9]{1,2}日目|最終日)/
    $(el).find('td').each((_, td) => {
        let text = $(td).text().trim();
        // Convert full-width characters to half-width before regex matching
        text = text.replace(/[０-９]/g, (s) => String.fromCharCode(s.charCodeAt(0) - 0xfee0));
        
        const dayMatch = text.match(/(初日|[1-9]{1,2}日目|最終日)/);
        if (dayMatch) {
            // It should be a short text string or contain a date range like 2/24 to ensure it's the right block
            if (text.length < 25 || text.includes('/')) {
                day = dayMatch[1];
            }
        }
    });

    let grade = "一般";
    let broke = false;
    $(el).find('td, th').each((_, cell) => {
        if(broke) return;
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

    if (grade !== "一般" || day !== "-日目") {
        scrapedData.push({ stadiumId, grade, day, text: $(el).text().replace(/\s+/g,' ').trim() });
    }
  });

  console.log("Scraped Results (PC Strict):", JSON.stringify(scrapedData.slice(0, 5), null, 2));
}

test();
