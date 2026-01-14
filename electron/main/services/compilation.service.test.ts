// Simple import validation test
import { compilationService } from './compilation.service';

console.log('✅ Compilation service imported successfully');
console.log('✅ Service methods available:', Object.getOwnPropertyNames(Object.getPrototypeOf(compilationService)));

// Test basic grouping with mock data
const mockHeadlines = [
    {
        id: 1,
        runId: 1,
        sourceId: 1,
        title: 'AI Breakthrough in NLP',
        description: 'New model achieves SOTA',
        url: 'https://example.com/1',
        publishedAt: new Date(),
        source: 'rss' as const,
        isSelected: true,
        createdAt: new Date(),
    },
    {
        id: 2,
        runId: 1,
        sourceId: 1,
        title: 'OpenAI Releases GPT',
        description: 'Improved reasoning',
        url: 'https://example.com/2',
        publishedAt: new Date(),
        source: 'rss' as const,
        isSelected: true,
        createdAt: new Date(),
    },
];

compilationService.groupHeadlines(mockHeadlines)
    .then(groups => {
        console.log(`✅ Grouped ${mockHeadlines.length} headlines into ${groups.length} groups`);
        groups.forEach((g, i) => console.log(`   Group ${i + 1}: "${g.topic}" (${g.headlines.length} items)`));
        console.log('\n✅ All validation tests passed!');
    })
    .catch(err => {
        console.error('❌ Test failed:', err);
        process.exit(1);
    });
