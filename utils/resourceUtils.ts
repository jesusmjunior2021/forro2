import { ResourceCategory } from '../types';

/**
 * Extracts a video ID from various YouTube URL formats.
 * @param url The YouTube URL.
 * @returns The video ID or null.
 */
const getYouTubeId = (url: string): string | null => {
    const regExp = /^.*(youtu.be\/|v\/|u\/\w\/|embed\/|watch\?v=|\&v=)([^#\&\?]*).*/;
    const match = url.match(regExp);
    return (match && match[2].length === 11) ? match[2] : null;
};

/**
 * Generates an embeddable URL for a YouTube video.
 * @param url The YouTube URL.
 * @returns A URL string for the embed player, or null.
 */
export const getYouTubeEmbedUrl = (url: string): string | null => {
    const videoId = getYouTubeId(url);
    // Add rel=0 to prevent related videos from other channels
    return videoId ? `https://www.youtube.com/embed/${videoId}?rel=0` : null;
};

/**
 * Generates a thumbnail URL for a given video URL (YouTube supported).
 * @param url The URL of the video.
 * @returns A URL string for the thumbnail, or null if not a supported video URL.
 */
export const getThumbnailUrl = (url: string): string | null => {
    const lowerUrl = url.toLowerCase();
    
    if (lowerUrl.includes('youtube.com') || lowerUrl.includes('youtu.be')) {
        const videoId = getYouTubeId(url);
        if (videoId) {
            // mqdefault.jpg is a good balance of quality and size (320x180)
            return `https://img.youtube.com/vi/${videoId}/mqdefault.jpg`;
        }
    }
    
    // Placeholder for Vimeo or other services if needed in the future
    // if (lowerUrl.includes('vimeo.com')) { ... }

    return null;
};

/**
 * Heuristically categorizes a URL based on its domain and path.
 * @param url The URL string to categorize.
 * @param title The title of the web page, used as a secondary hint.
 * @returns A ResourceCategory string.
 */
export const categorizeUrl = (url: string, title: string): ResourceCategory => {
    try {
        const lowerUrl = url.toLowerCase();
        const lowerTitle = title.toLowerCase();
        const urlObj = new URL(url);
        const hostname = urlObj.hostname.replace('www.', '');

        if (hostname.includes('youtube.com') || hostname.includes('youtu.be') || hostname.includes('vimeo.com')) {
            return 'video';
        }
        if (hostname.includes('spotify.com') || hostname.includes('soundcloud.com') || hostname.includes('music.apple.com')) {
            if (lowerUrl.includes('podcast') || lowerTitle.includes('podcast')) {
                return 'podcast';
            }
            return 'audio';
        }
        if (hostname.includes('audible.com') || lowerTitle.includes('audiobook')) {
            return 'audiobook';
        }
        if (hostname.includes('goodreads.com') || hostname.includes('amazon.com/books')) {
            return 'book';
        }
        if (hostname.includes('imdb.com') || hostname.includes('rottentomatoes.com')) {
            if (lowerTitle.includes('series') || lowerTitle.includes('season')) return 'series';
            return 'movie';
        }
        if (lowerUrl.endsWith('.pdf')) {
            if (lowerTitle.includes('report')) return 'report';
            return 'article';
        }
        
        // News & Articles
        const articleSites = ['medium.com', 'forbes.com', 'techcrunch.com', 'nytimes.com', 'theguardian.com', 'g1.globo.com', 'bbc.com'];
        if (articleSites.some(site => hostname.includes(site)) || lowerUrl.includes('/article/')) {
            return 'article';
        }

        return 'web-search'; // Default category
    } catch (error) {
        console.warn(`Could not parse URL for categorization: ${url}`, error);
        return 'generic'; // Fallback for invalid URLs
    }
};

/**
 * Cleans text for Text-to-Speech (TTS) by removing markdown and normalizing punctuation.
 * This results in a more natural-sounding narration.
 * @param text The raw text content to clean.
 * @returns A string cleaned for TTS.
 */
export const cleanTextForTTS = (text: string): string => {
    if (!text) return '';
    let cleanedText = text;

    // Remove markdown links, keeping the link text.
    cleanedText = cleanedText.replace(/\[([^\]]+)\]\([^)]+\)/g, '$1');

    // Remove image tags
    cleanedText = cleanedText.replace(/!\[.*?\]\(.*?\)/g, '');

    // Remove code blocks
    cleanedText = cleanedText.replace(/```[\s\S]*?```/g, '');
    cleanedText = cleanedText.replace(/`([^`]+)`/g, '$1');

    // Remove formatting symbols but keep content
    cleanedText = cleanedText.replace(/(\*\*|__)(.*?)\1/g, '$2'); // Bold
    cleanedText = cleanedText.replace(/(\*|_)(.*?)\1/g, '$2');   // Italic
    cleanedText = cleanedText.replace(/~~(.*?)~~/g, '$1');   // Strikethrough

    // Replace headings and list markers to avoid them being read as symbols
    cleanedText = cleanedText.replace(/^#+\s*/gm, '');     // Headers
    cleanedText = cleanedText.replace(/^\s*[-*+]\s+/gm, ''); // List items
    cleanedText = cleanedText.replace(/^>\s+/gm, ''); // Blockquotes

    // Replace horizontal rules with a sentence break for a pause
    cleanedText = cleanedText.replace(/^-{3,}\s*$/gm, '. ');

    // Collapse multiple spaces into one, but preserve newlines
    cleanedText = cleanedText.replace(/ +/g, ' ');
    
    return cleanedText.trim();
};