import fs from 'fs';

async function scrapeTvShows() {
    console.log('Starting the TV shows scraping process...');
    const browser = await puppeteer.launch({ args: [ '--no-sandbox', '--disable-setuid-sandbox' ] });
    const page = await browser.newPage();
    
    try {
        await page.goto('https://www.rottentomatoes.com/browse/tv_series_browse/audience:upright~critics:fresh~genres:action,adventure,animation,anime,comedy,fantasy,history,nature,sci_fi,war,western~sort:popular', {
            waitUntil: 'networkidle2',
            timeout: 60000
        });
    } catch ( error ) {
        console.error('Error navigating to page:', error);
        await browser.close();
        return;
    }
    
    const shows = await page.evaluate(() => {
        const tiles = document.querySelectorAll('.discovery-tiles__wrap .js-tile-link');
        const results = [];
        tiles.forEach(tile => {
            const imgElement = tile.querySelector('rt-img');
            const title = imgElement ? imgElement.getAttribute('alt') : null;
            const imageUrl = imgElement ? imgElement.getAttribute('src') : null;
            
            const criticsScoreElement = tile.querySelector('rt-text[slot="criticsScore"]');
            const criticsScore = criticsScoreElement ? criticsScoreElement.innerText.trim() : null;
            
            const audienceScoreElement = tile.querySelector('rt-text[slot="audienceScore"]');
            const audienceScore = audienceScoreElement ? audienceScoreElement.innerText.trim() : null;
            
            const latestEpisodeDateElement = tile.querySelector('span[data-qa="discovery-media-list-item-start-date"]');
            const latestEpisodeDate = latestEpisodeDateElement ?
                latestEpisodeDateElement.innerText.split(': ')[1] :
                null;
            
            if ( title && imageUrl && criticsScore && audienceScore && latestEpisodeDate ) {
                const [ month ] = latestEpisodeDate.split(' ');
                const currentMonth = new Date().toLocaleString('default', { month: 'short' });
                if ( month === currentMonth ) {
                    results.push({
                        title,
                        imageUrl,
                        criticsScore,
                        audienceScore
                    });
                }
            }
        });
        return results;
    });
    
    await browser.close();
    
    const uniqueShows = Array.from(new Set(shows.map(show => show.title)))
        .map(title => shows.find(show => show.title === title));
    
    fs.writeFileSync(TV_DATA_FILE, JSON.stringify(uniqueShows, null, 2));
    console.log(`TV shows data saved to ${ TV_DATA_FILE }`);
}

module.exports = scrapeTvShows;