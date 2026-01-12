import Parser from 'rss-parser';

async function testRss() {
    const url = 'https://techcrunch.com/feed/';
    const parser = new Parser({
        timeout: 30000,
        headers: {
            'User-Agent': 'NewsForge/1.0',
        },
    });

    console.log(`Fetching ${url} with parser...`);
    try {
        const feed = await parser.parseURL(url);
        console.log('Success!', feed.title);
    } catch (error: any) {
        console.error('Parser failed:', error.message);
    }

    console.log('\nFetching with native fetch...');
    try {
        const response = await fetch(url, {
            headers: { 'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36' }
        });
        console.log('Fetch Status:', response.status);
        if (!response.ok) {
            console.log('Fetch Text:', await response.text());
        } else {
            console.log('Fetch OK');
        }
    } catch (e) {
        console.error('Fetch failed:', e);
    }
}

testRss();
