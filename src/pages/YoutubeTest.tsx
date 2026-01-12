import React, { useState } from 'react';
import { AddYoutubeVideoDialog } from '@/components/youtube/AddYoutubeVideoDialog';
import { Button } from '@/components/ui/button';
import { Video } from 'lucide-react';

export function YoutubeTestPage() {
    const [isDialogOpen, setIsDialogOpen] = useState(false);
    const [addedVideos, setAddedVideos] = useState<any[]>([]);

    const handleVideoAdded = (headline: any) => {
        console.log('Video added:', headline);
        setAddedVideos(prev => [...prev, headline]);
    };

    return (
        <div className="container mx-auto p-8 space-y-6">
            <div>
                <h1 className="text-3xl font-bold mb-2">YouTube Integration Test</h1>
                <p className="text-muted-foreground">
                    Test the YouTube video dialog component
                </p>
            </div>

            <div>
                <Button onClick={() => setIsDialogOpen(true)}>
                    <Video className="mr-2 h-4 w-4" />
                    Add YouTube Video
                </Button>
            </div>

            {addedVideos.length > 0 && (
                <div className="space-y-4">
                    <h2 className="text-xl font-semibold">Added Videos ({addedVideos.length})</h2>
                    <div className="space-y-3">
                        {addedVideos.map((video, index) => (
                            <div key={index} className="border rounded-lg p-4 space-y-2">
                                <h3 className="font-medium">{video.title}</h3>
                                <p className="text-sm text-muted-foreground">{video.description}</p>
                                <div className="flex gap-2 flex-wrap">
                                    {video.metadata.topics.map((topic: string, i: number) => (
                                        <span
                                            key={i}
                                            className="px-2 py-1 bg-primary/10 text-primary rounded-md text-xs"
                                        >
                                            {topic}
                                        </span>
                                    ))}
                                </div>
                                <a
                                    href={video.url}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className="text-sm text-blue-500 hover:underline"
                                >
                                    {video.url}
                                </a>
                            </div>
                        ))}
                    </div>
                </div>
            )}

            <AddYoutubeVideoDialog
                open={isDialogOpen}
                onOpenChange={setIsDialogOpen}
                onVideoAdded={handleVideoAdded}
                userId={1}
            />
        </div>
    );
}

export default YoutubeTestPage;
