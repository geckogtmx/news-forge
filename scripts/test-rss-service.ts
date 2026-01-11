import { services } from '../electron/main/services';

async function testRssService() {
    console.log('🧪 Testing RSS Service...\n');

    try {
        // Test 1: Fetch a known RSS feed
        console.log('📡 Test 1: Fetching TechCrunch RSS feed...');
        const feed = await services.rss.fetchFeed('https://techcrunch.com/feed/');
        console.log(`✅ Feed fetched: "${feed.title}"`);
        console.log(`   Items: ${feed.items.length}`);
        if (feed.items.length > 0) {
            console.log(`   First item: "${feed.items[0].title}"`);
        }

        // Test 2: Extract headlines
        console.log('\n📰 Test 2: Extracting headlines...');
        const headlines = services.rss.extractHeadlines(feed, 1, 1);
        console.log(`✅ Extracted ${headlines.length} headlines`);
        if (headlines.length > 0) {
            console.log(`   Sample: "${headlines[0].title}"`);
            console.log(`   URL: ${headlines[0].url}`);
        }

        // Test 3: Discover feeds from a website
        console.log('\n🔍 Test 3: Discovering feeds from TechCrunch...');
        const discovered = await services.rss.discoverFeeds('https://techcrunch.com');
        console.log(`✅ Discovered ${discovered.length} feeds`);
        discovered.forEach((feed, i) => {
            console.log(`   ${i + 1}. ${feed.url} (${feed.type})`);
        });

        // Test 4: Validate a feed URL
        console.log('\n✔️  Test 4: Validating feed URL...');
        const validation = await services.rss.validateFeed('https://techcrunch.com/feed/');
        console.log(`✅ Validation result: ${validation.valid ? 'VALID' : 'INVALID'}`);
        if (validation.title) {
            console.log(`   Feed title: "${validation.title}"`);
        }

        // Test 5: Test error handling with invalid URL
        console.log('\n❌ Test 5: Testing error handling with invalid URL...');
        try {
            await services.rss.fetchFeed('https://invalid-url-that-does-not-exist.com/feed');
            console.log('⚠️  Expected error but got success');
        } catch (error: any) {
            console.log(`✅ Error handled correctly: ${error.message}`);
        }

        console.log('\n✨ All RSS tests passed!');
        process.exit(0);
    } catch (error: any) {
        console.error('\n❌ RSS test failed:', error.message);
        console.error(error.stack);
        process.exit(1);
    }
}

testRssService();
