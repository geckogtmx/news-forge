
import { services } from '../electron/main/services';

async function verifyCoreDataLayer() {
    console.log('🧪 Starting Core Data Layer Verification...');

    try {
        // 1. User Service
        console.log('\n👤 Testing User Service...');
        const userEmail = `verify_${Date.now()}@example.com`;
        const userOpenId = `openid_${Date.now()}`;
        const user = await services.user.createUser({
            email: userEmail,
            name: 'Verification User',
            openId: userOpenId,
            loginMethod: 'test',
            role: 'user'
        });
        console.log('✅ User created:', user.id, user.email);

        // 2. Settings Service
        console.log('\n⚙️ Testing Settings Service...');
        const settings = await services.settings.getSettings(user.id);
        await services.settings.updateTone(user.id, 'witty');
        console.log('✅ Settings checked and updated:', settings.id);

        // 3. News Source Service
        console.log('\n📰 Testing News Source Service...');
        const source = await services.newsSource.createSource({
            userId: user.id,
            name: 'TechCrunch RSS',
            type: 'rss',
            config: { url: 'https://techcrunch.com/feed' },
            topics: ['tech', 'startups'],
            isActive: true
        });
        console.log('✅ Source created:', source.id, source.name);

        // 4. Run Service
        console.log('\n🏃 Testing Run Service...');
        const run = await services.run.createRun(user.id);
        console.log('✅ Run created:', run.id, run.status);

        await services.run.updateRunStatus(run.id, 'collecting');
        console.log('✅ Run status updated to collecting');

        // 5. Headline Service
        console.log('\n📑 Testing Headline Service...');
        const headlines = await services.headline.createHeadlines([
            {
                runId: run.id,
                sourceId: source.id,
                title: 'New AI Model Released',
                url: 'https://example.com/ai-model',
                publishedAt: new Date(),
                source: 'rss',
                isSelected: true,
                description: 'A new AI model has been released...'
            },
            {
                runId: run.id,
                sourceId: source.id,
                title: 'Tech Stocks Rally',
                url: 'https://example.com/tech-stocks',
                publishedAt: new Date(),
                source: 'rss',
                isSelected: false,
                description: 'Tech stocks are up today...'
            }
        ]);
        console.log(`✅ Created ${headlines.length} headlines`);

        const selectedHeadlines = await services.headline.getSelectedHeadlines(run.id);
        console.log(`✅ Found ${selectedHeadlines.length} selected headlines`);

        // 6. Compiled Item Service
        console.log('\n📦 Testing Compiled Item Service...');
        const compiledItem = await services.compiledItem.createCompiledItem({
            runId: run.id,
            topic: 'Artificial Intelligence',
            hook: 'AI is changing everything',
            summary: 'Summary of AI news...',
            sourceHeadlineIds: [headlines[0].id],
            isSelected: true
        });
        console.log('✅ Compiled Item created:', compiledItem.id);

        // 7. Content Package Service
        console.log('\n🎬 Testing Content Package Service...');
        const pkg = await services.contentPackage.createPackage({
            runId: run.id,
            compiledItemId: compiledItem.id,
            status: 'draft',
            youtubeTitle: 'AI News Update',
            youtubeDescription: 'Latest AI news...',
            scriptOutline: '- Intro\n- Main Story\n- Outro'
        });
        console.log('✅ Content Package created:', pkg.id);

        // 8. Archive Service
        console.log('\n🗄️ Testing Archive Service...');
        await services.run.completeRun(run.id, { totalHeadlines: 2 });
        const archive = await services.archive.createArchive({
            runId: run.id,
            userId: user.id,
            archivedData: { run, headlines, compiledItem, pkg },
            obsidianExportPath: '/path/to/vault/news.md'
        });
        console.log('✅ Run Archived:', archive.id);

        console.log('\n✨ Verification Complete! Core Data Layer is fully functional.');
        process.exit(0);
    } catch (error) {
        console.error('\n❌ Verification Failed:', error);
        process.exit(1);
    }
}

verifyCoreDataLayer();
