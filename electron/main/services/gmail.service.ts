import { google, gmail_v1 } from 'googleapis';
import { OAuth2Client, Credentials } from 'google-auth-library';
import { shell } from 'electron';
import http from 'node:http';
import url from 'node:url';
import { settingsService } from './settings.service';

/**
 * GmailService - Handles Gmail OAuth2 authentication and newsletter fetching
 */

// OAuth2 configuration
const REDIRECT_URI = 'http://localhost:8089/oauth2callback';

// Scopes required for reading emails
const SCOPES = [
    'https://www.googleapis.com/auth/gmail.readonly',
    'https://www.googleapis.com/auth/gmail.labels',
];

export interface GmailTokens {
    access_token: string;
    refresh_token: string;
    expiry_date: number;
    token_type: string;
    scope: string;
}

export interface GmailFilters {
    labels?: string[];
    senders?: string[];
    subjects?: string[];
    after?: Date;
    before?: Date;
    maxResults?: number;
}

export interface ParsedEmail {
    id: string;
    threadId: string;
    subject: string;
    from: string;
    date: Date;
    snippet: string;
    body: string;
    links: string[];
}

export interface GmailHeadline {
    title: string;
    description: string;
    url: string;
    publishedAt: Date;
    source: 'gmail';
    metadata: {
        emailId: string;
        from: string;
        subject: string;
    };
}

class GmailService {
    private oauth2Client: OAuth2Client | null = null;
    private currentServer: any = null;

    constructor() {
        // Defer initialization to ensure env vars are loaded
    }

    /**
     * Initialize OAuth2 client if needed
     */
    private ensureClient(): void {
        if (this.oauth2Client) return;

        const clientId = process.env.GMAIL_CLIENT_ID;
        const clientSecret = process.env.GMAIL_CLIENT_SECRET;

        if (clientId && clientSecret) {
            this.oauth2Client = new google.auth.OAuth2(
                clientId,
                clientSecret,
                REDIRECT_URI
            );
        }
    }

    /**
     * Check if OAuth2 is properly configured
     */
    isConfigured(): boolean {
        // explicit check for env vars here to ensure they are loaded
        return !!(process.env.GMAIL_CLIENT_ID && process.env.GMAIL_CLIENT_SECRET);
    }

    /**
     * Check if user is authenticated
     */
    async isAuthenticated(userId: number): Promise<boolean> {
        try {
            const tokens = await this.getStoredTokens(userId);
            if (!tokens) return false;

            // Check if token is expired
            if (tokens.expiry_date && tokens.expiry_date < Date.now()) {
                // Try to refresh
                const refreshed = await this.refreshTokens(userId);
                return refreshed;
            }

            return true;
        } catch {
            return false;
        }
    }

    /**
     * Generate OAuth2 authorization URL
     */
    getAuthUrl(): string {
        this.ensureClient();
        if (!this.oauth2Client) {
            throw new Error('Gmail OAuth2 not configured. Set GMAIL_CLIENT_ID and GMAIL_CLIENT_SECRET.');
        }

        return this.oauth2Client.generateAuthUrl({
            access_type: 'offline',
            scope: SCOPES,
            prompt: 'consent', // Force consent to get refresh token
        });
    }

    /**
     * Start local server to handle OAuth callback
     */
    private async startAuthServer(userId: number, onListening?: () => void): Promise<string> {
        // Close any existing server first
        if (this.currentServer) {
            console.log('Closing existing auth server...');
            this.currentServer.close();
            this.currentServer = null;
        }

        return new Promise((resolve, reject) => {
            const server = http.createServer(async (req: any, res: any) => {
                try {
                    const queryObject = url.parse(req.url!, true).query;
                    const { code } = queryObject;

                    if (code) {
                        res.writeHead(200, { 'Content-Type': 'text/html' });
                        res.end('<h1>Authentication successful!</h1><p>You can close this window and return to NewsForge.</p><script>setTimeout(function() { window.close(); }, 3000);</script>');

                        // Process code
                        await this.handleAuthCallback(code as string, userId);

                        // Close server immediately after success
                        server.close();
                        this.currentServer = null;
                        resolve(code as string);
                    } else {
                        // Ignore requests without code (like favicon)
                        if (req.url?.includes('favicon')) {
                            res.writeHead(404);
                            res.end();
                            return;
                        }
                        throw new Error('No code found in callback');
                    }
                } catch (error) {
                    console.error('Auth callback error:', error);
                    res.writeHead(500, { 'Content-Type': 'text/html' });
                    res.end('<h1>Authentication failed</h1><p>Please try again.</p>');
                    server.close();
                    this.currentServer = null;
                    reject(error);
                }
            });

            server.on('error', (err: any) => {
                console.error('Auth server error:', err);
                this.currentServer = null;
                reject(err);
            });

            server.listen(8089, () => {
                console.log('Auth server listening on port 8089');
                if (onListening) onListening();
            });

            this.currentServer = server;

            // Timeout after 5 minutes
            setTimeout(() => {
                if (server.listening) {
                    console.log('Auth server timed out, closing.');
                    server.close();
                    if (this.currentServer === server) {
                        this.currentServer = null;
                    }
                    reject(new Error('Authentication timed out'));
                }
            }, 5 * 60 * 1000);
        });
    }

    /**
     * Open authorization URL in default browser and wait for callback
     */
    async openAuthUrl(userId: number): Promise<boolean> {
        try {
            const authUrl = this.getAuthUrl();

            // Create a promise that resolves when the server is listening
            let serverReadyResolve: () => void = () => { };
            const serverReadyPromise = new Promise<void>((resolve) => {
                serverReadyResolve = resolve;
            });

            // Start listening for callback BEFORE opening URL, but pass the readiness callback
            const authPromise = this.startAuthServer(userId, () => {
                console.log('Server is ready, resolving ready promise');
                serverReadyResolve();
            });

            // Wait for server to be LISTENING
            await serverReadyPromise;
            console.log('Server ready, opening browser:', authUrl);

            await shell.openExternal(authUrl);

            // Wait for the server to receive the code
            await authPromise;
            return true;
        } catch (error) {
            console.error('Auth flow failed:', error);
            return false;
        }
    }

    /**
     * Exchange authorization code for tokens
     */
    async handleAuthCallback(code: string, userId: number): Promise<GmailTokens> {
        this.ensureClient();
        if (!this.oauth2Client) {
            throw new Error('Gmail OAuth2 not configured');
        }

        const { tokens } = await this.oauth2Client.getToken(code);

        const gmailTokens: GmailTokens = {
            access_token: tokens.access_token || '',
            refresh_token: tokens.refresh_token || '',
            expiry_date: tokens.expiry_date || 0,
            token_type: tokens.token_type || 'Bearer',
            scope: tokens.scope || SCOPES.join(' '),
        };

        // Store tokens in user settings
        await this.storeTokens(userId, gmailTokens);

        return gmailTokens;
    }

    /**
     * Refresh expired tokens
     */
    async refreshTokens(userId: number): Promise<boolean> {
        this.ensureClient();
        if (!this.oauth2Client) return false;

        try {
            const tokens = await this.getStoredTokens(userId);
            if (!tokens?.refresh_token) return false;

            this.oauth2Client.setCredentials({
                refresh_token: tokens.refresh_token,
            });

            const { credentials } = await this.oauth2Client.refreshAccessToken();

            const updatedTokens: GmailTokens = {
                ...tokens,
                access_token: credentials.access_token || tokens.access_token,
                expiry_date: credentials.expiry_date || tokens.expiry_date,
            };

            await this.storeTokens(userId, updatedTokens);
            return true;
        } catch (error) {
            console.error('Failed to refresh Gmail tokens:', error);
            return false;
        }
    }

    /**
     * Revoke authentication
     */
    async revokeAuth(userId: number): Promise<boolean> {
        try {
            this.ensureClient();
            const tokens = await this.getStoredTokens(userId);
            if (tokens?.access_token && this.oauth2Client) {
                await this.oauth2Client.revokeToken(tokens.access_token);
            }

            // Clear stored tokens
            await this.storeTokens(userId, null);
            return true;
        } catch (error) {
            console.error('Failed to revoke Gmail auth:', error);
            // Still clear local tokens even if revoke fails
            await this.storeTokens(userId, null);
            return false;
        }
    }

    /**
     * Store tokens in user settings
     */
    private async storeTokens(userId: number, tokens: GmailTokens | null): Promise<void> {
        const settings = await settingsService.getSettings(userId);
        const currentApiKeys = settings?.format as Record<string, unknown> || {};

        await settingsService.updateSettings(userId, {
            format: {
                ...currentApiKeys,
                gmailTokens: tokens,
            },
        });
    }

    /**
     * Get stored tokens from user settings
     */
    private async getStoredTokens(userId: number): Promise<GmailTokens | null> {
        const settings = await settingsService.getSettings(userId);
        const format = settings?.format as Record<string, unknown> || {};
        return (format.gmailTokens as GmailTokens) || null;
    }

    /**
     * Get authenticated Gmail client
     */
    private async getGmailClient(userId: number): Promise<gmail_v1.Gmail> {
        this.ensureClient();
        if (!this.oauth2Client) {
            throw new Error('Gmail OAuth2 not configured');
        }

        const tokens = await this.getStoredTokens(userId);
        if (!tokens) {
            throw new Error('Gmail not authenticated');
        }

        this.oauth2Client.setCredentials(tokens as Credentials);
        return google.gmail({ version: 'v1', auth: this.oauth2Client });
    }

    /**
     * Fetch emails matching filters
     */
    async fetchNewsletters(userId: number, filters: GmailFilters = {}): Promise<ParsedEmail[]> {
        const gmail = await this.getGmailClient(userId);

        // Build search query
        const queryParts: string[] = [];

        if (filters.labels?.length) {
            queryParts.push(filters.labels.map(l => `label:${l}`).join(' OR '));
        }
        if (filters.senders?.length) {
            queryParts.push(filters.senders.map(s => `from:${s}`).join(' OR '));
        }
        if (filters.subjects?.length) {
            queryParts.push(filters.subjects.map(s => `subject:${s}`).join(' OR '));
        }
        if (filters.after) {
            queryParts.push(`after:${Math.floor(filters.after.getTime() / 1000)}`);
        }
        if (filters.before) {
            queryParts.push(`before:${Math.floor(filters.before.getTime() / 1000)}`);
        }

        const query = queryParts.join(' ');
        const maxResults = filters.maxResults || 20;

        // List messages
        const response = await gmail.users.messages.list({
            userId: 'me',
            q: query,
            maxResults,
        });

        const messages = response.data.messages || [];
        const emails: ParsedEmail[] = [];

        // Fetch full message data for each
        for (const msg of messages) {
            if (!msg.id) continue;

            const fullMsg = await gmail.users.messages.get({
                userId: 'me',
                id: msg.id,
                format: 'full',
            });

            const parsed = this.parseMessage(fullMsg.data);
            if (parsed) {
                emails.push(parsed);
            }
        }

        return emails;
    }

    /**
     * Parse a Gmail message into structured format
     */
    private parseMessage(message: gmail_v1.Schema$Message): ParsedEmail | null {
        if (!message.id || !message.payload) return null;

        const headers = message.payload.headers || [];
        const getHeader = (name: string) =>
            headers.find(h => h.name?.toLowerCase() === name.toLowerCase())?.value || '';

        const subject = getHeader('subject');
        const from = getHeader('from');
        const dateStr = getHeader('date');
        const date = dateStr ? new Date(dateStr) : new Date();

        // Extract body
        let body = '';
        if (message.payload.body?.data) {
            body = Buffer.from(message.payload.body.data, 'base64').toString('utf8');
        } else if (message.payload.parts) {
            body = this.extractBodyFromParts(message.payload.parts);
        }

        // Extract links from body
        const links = this.extractLinks(body);

        return {
            id: message.id,
            threadId: message.threadId || '',
            subject,
            from,
            date,
            snippet: message.snippet || '',
            body: this.htmlToPlainText(body),
            links,
        };
    }

    /**
     * Extract body from multipart message
     */
    private extractBodyFromParts(parts: gmail_v1.Schema$MessagePart[]): string {
        for (const part of parts) {
            if (part.mimeType === 'text/plain' && part.body?.data) {
                return Buffer.from(part.body.data, 'base64').toString('utf8');
            }
            if (part.mimeType === 'text/html' && part.body?.data) {
                return Buffer.from(part.body.data, 'base64').toString('utf8');
            }
            if (part.parts) {
                const nested = this.extractBodyFromParts(part.parts);
                if (nested) return nested;
            }
        }
        return '';
    }

    /**
     * Extract URLs from email body
     */
    private extractLinks(body: string): string[] {
        const urlRegex = /https?:\/\/[^\s<>"']+/gi;
        const matches = body.match(urlRegex) || [];

        // Filter out common tracking/unsubscribe links
        const filtered = matches.filter(url => {
            const lower = url.toLowerCase();
            return !lower.includes('unsubscribe') &&
                !lower.includes('mailto:') &&
                !lower.includes('tracking') &&
                !lower.includes('click.');
        });

        // Return unique URLs
        return [...new Set(filtered)];
    }

    /**
     * Convert HTML to plain text
     */
    private htmlToPlainText(html: string): string {
        return html
            .replace(/<script[^>]*>[\s\S]*?<\/script>/gi, '')
            .replace(/<style[^>]*>[\s\S]*?<\/style>/gi, '')
            .replace(/<[^>]+>/g, ' ')
            .replace(/&nbsp;/g, ' ')
            .replace(/&amp;/g, '&')
            .replace(/&lt;/g, '<')
            .replace(/&gt;/g, '>')
            .replace(/&quot;/g, '"')
            .replace(/\s+/g, ' ')
            .trim();
    }

    /**
     * Convert parsed emails to headlines
     */
    extractHeadlines(emails: ParsedEmail[]): GmailHeadline[] {
        return emails.map(email => ({
            title: email.subject,
            description: email.snippet,
            url: email.links[0] || `mailto:${email.from}`,
            publishedAt: email.date,
            source: 'gmail' as const,
            metadata: {
                emailId: email.id,
                from: email.from,
                subject: email.subject,
            },
        }));
    }

    /**
     * Get user's Gmail labels
     */
    async getLabels(userId: number): Promise<{ id: string; name: string }[]> {
        const gmail = await this.getGmailClient(userId);
        const response = await gmail.users.labels.list({ userId: 'me' });

        return (response.data.labels || [])
            .filter(l => l.id && l.name)
            .map(l => ({ id: l.id!, name: l.name! }));
    }

    /**
     * Test connection with current filters
     */
    async testConnection(userId: number, filters: GmailFilters = {}): Promise<{
        success: boolean;
        emailCount: number;
        error?: string;
    }> {
        try {
            const emails = await this.fetchNewsletters(userId, { ...filters, maxResults: 5 });
            return {
                success: true,
                emailCount: emails.length,
            };
        } catch (error) {
            return {
                success: false,
                emailCount: 0,
                error: error instanceof Error ? error.message : 'Unknown error',
            };
        }
    }
}

// Export singleton instance
export const gmailService = new GmailService();
