const cheerio = require('cheerio');
const fs = require('fs');

async function test() {
  const res = await fetch('https://www.boatrace.jp/owsp/sp/race/index', {
    headers: {
        "User-Agent": "Mozilla/5.0 (iPhone; CPU iPhone OS 16_0 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/16.0 Mobile/15E148 Safari/604.1"
    }
  });
  const html = await res.text();
  const $ = cheerio.load(html);
  
  const results = [];
  
  // Try to find the venue rows
  $('.heading2_titleDetail').each((i, block) => {
    // The SP site might have venues in `.accordion` or lists. Let's look for venue names.
    // Actually, let's just dump the top elements to see what we're working with.
  });
  
  // Let's just find image sources and texts for elements that might represent venues
  // Often on SP site, it might be `.is-arrow1`, or `.place`
  $('a[href*="/owsp/sp/race/raceindex?jcd="]').each((i, el) => {
      const href = $(el).attr('href');
      const text = $(el).parent().text().replace(/\s+/g, ' ').trim();
      const imgs = [];
      $(el).find('img').each((i, img) => imgs.push($(img).attr('src')));
      results.push({ href, text, imgs });
  });

  console.log(JSON.stringify(results.slice(0, 3), null, 2));

  // Let's also save the HTML for deeper inspection
  fs.writeFileSync('sp_index.html', html);
}

test();
