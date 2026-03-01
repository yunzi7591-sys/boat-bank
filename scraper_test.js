const cheerio = require('cheerio');
fetch('https://www.boatrace.jp/owpc/pc/race/index')
  .then(r => r.text())
  .then(html => {
    const $ = cheerio.load(html);
    const results = [];
    
    // It seems 'a[href*="/owpc/pc/race/raceindex?jcd="]' didn't match anything.
    // Let's print out all links to see what the href looks like.
    let count = 0;
    $('a').each((i, el) => {
        const href = $(el).attr('href');
        if(href && href.includes('jcd=') && count < 10) {
            console.log(href);
            count++;
        }
    });
  });
