import { useState } from 'react';
import { RssSourceForm } from '@/components/sources/RssSourceForm';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';

export default function TestRssForm() {
    const [showSuccess, setShowSuccess] = useState(false);

    // Mock user ID for testing
    const userId = 1;

    const handleSuccess = () => {
        setShowSuccess(true);
        setTimeout(() => setShowSuccess(false), 3000);
    };

    return (
        <div className="min-h-screen bg-background p-8">
            <div className="max-w-3xl mx-auto space-y-6">
                <div>
                    <h1 className="text-3xl font-bold">RSS Source Form Test</h1>
                    <p className="text-muted-foreground mt-2">
                        Test the RSS source form component with live feed fetching
                    </p>
                </div>

                {showSuccess && (
                    <div className="p-4 bg-green-50 dark:bg-green-950 border border-green-200 dark:border-green-800 rounded-md">
                        <p className="text-green-800 dark:text-green-200 font-medium">
                            ✅ RSS source saved successfully!
                        </p>
                    </div>
                )}

                <Card>
                    <CardHeader>
                        <CardTitle>Add RSS Source</CardTitle>
                        <CardDescription>
                            Enter a feed URL or website to discover and add an RSS source
                        </CardDescription>
                    </CardHeader>
                    <CardContent>
                        <RssSourceForm
                            userId={userId}
                            onSuccess={handleSuccess}
                        />
                    </CardContent>
                </Card>

                <Card>
                    <CardHeader>
                        <CardTitle>Test URLs</CardTitle>
                        <CardDescription>Try these URLs to test the form</CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-2">
                        <div className="text-sm space-y-1">
                            <p className="font-medium">Direct Feed URLs:</p>
                            <ul className="list-disc list-inside space-y-1 text-muted-foreground">
                                <li>https://techcrunch.com/feed/</li>
                                <li>https://www.theverge.com/rss/index.xml</li>
                                <li>https://hnrss.org/frontpage</li>
                            </ul>
                        </div>
                        <div className="text-sm space-y-1 mt-4">
                            <p className="font-medium">Website URLs (for discovery):</p>
                            <ul className="list-disc list-inside space-y-1 text-muted-foreground">
                                <li>https://techcrunch.com</li>
                                <li>https://www.theverge.com</li>
                            </ul>
                        </div>
                    </CardContent>
                </Card>
            </div>
        </div>
    );
}
