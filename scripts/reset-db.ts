
import { db } from '../electron/main/db/index';
import { newsSources, runs, rawHeadlines, compiledItems, contentPackages, runArchives } from '../electron/main/db/schema';

async function resetDb() {
    console.log('Resetting Database...');

    try {
        console.log('Deleting Content Packages...');
        await db.delete(contentPackages);

        console.log('Deleting Compiled Items...');
        await db.delete(compiledItems);

        console.log('Deleting Raw Headlines...');
        await db.delete(rawHeadlines);

        console.log('Deleting Runs...');
        await db.delete(runs);

        console.log('Deleting News Sources...');
        await db.delete(newsSources);

        console.log('Deleting Run Archives...');
        await db.delete(runArchives);

        console.log('Database Reset Complete!');
    } catch (error) {
        console.error('Error resetting database:', error);
    }
}

resetDb();
