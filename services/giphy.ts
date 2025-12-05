
// Using a standard public beta key for Tenor (Open Source friendly) or robust Giphy fallback
// For this demo we use a free open API pattern to ensure results load.
const API_KEY = 'LIVDSRZULELA'; // Tenor Public Key
const BASE_URL = 'https://g.tenor.com/v1';

export interface GifResult {
    id: string;
    url: string; // The specific media url
    title: string;
    preview: string;
}

export const getTrendingGifs = async (limit = 20): Promise<GifResult[]> => {
    try {
        const res = await fetch(`${BASE_URL}/trending?key=${API_KEY}&limit=${limit}&media_filter=minimal`);
        const data = await res.json();
        return mapGifs(data.results);
    } catch (e) {
        console.error("GIF Error", e);
        return [];
    }
};

export const searchGifs = async (term: string, limit = 20): Promise<GifResult[]> => {
    try {
        const res = await fetch(`${BASE_URL}/search?key=${API_KEY}&q=${encodeURIComponent(term)}&limit=${limit}&media_filter=minimal`);
        const data = await res.json();
        return mapGifs(data.results);
    } catch (e) {
        console.error("GIF Error", e);
        return [];
    }
};

const mapGifs = (data: any[]): GifResult[] => {
    if (!data) return [];
    return data.map(item => ({
        id: item.id,
        title: item.title || 'GIF',
        url: item.media[0].gif.url,
        preview: item.media[0].tinygif.url
    }));
};
