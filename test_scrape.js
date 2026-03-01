const cheerio = require('cheerio');
const fs = require('fs');

async function test() {
  const res = await fetch('https://www.boatrace.jp/owpc/pc/race/index');
  const html = await res.text();
  const $ = cheerio.load(html);

  const results = [];

  // Try to find the venue rows
  $('tbody').each((i, tbody) => {
    // See if there's an image with place alt or src
    const img = $(tbody).find('img[src*="text_place1_"]');
    if (img.length > 0) {
      const src = img.attr('src');
      const match = src.match(/text_place1_(\d+)\.png/);
      const stadiumId = match ? match[1] : null;

      const text = $(tbody).text().replace(/\s+/g, ' ').trim();

      const imgs = [];
      $(tbody).find('img').each((idx, el) => {
        imgs.push($(el).attr('src'));
      });

      const classes = [];
      $(tbody).find('*').each((idx, el) => {
        const cls = $(el).attr('class');
        if (cls) classes.push(cls);
      });

      results.push({
        stadiumId,
        text,
        imgs,
        classes: [...new Set(classes)]
      });
    }
  });

  console.log(JSON.stringify(results.slice(0, 3), null, 2));
}

test();
