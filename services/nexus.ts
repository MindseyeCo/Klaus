
import { NexusPost, NexusSearchFilters, NexusCollection } from '../types';
import { getLocalKeepsakes } from './keepsakes';

const IA_BASE_URL = 'https://archive.org/advancedsearch.php';
const NASA_BASE_URL = 'https://images-api.nasa.gov/search';

// Optimized collection list including NEW SOURCES
const COLLECTIONS = [
  'computer_chronicles', 'prelinger', 'vintagetechnology', 'siggraph', 'scifi_pulp', 'folkscanomy_electronics',
  'tedtalks', 'smithsonian', 'noaa', 'europeana', 'gutenberg', 'open_verse', 'fedflix', 'nasa'
];

/**
 * Core Fetcher - Optimized for performance and pagination
 */
export const fetchNexusPosts = async (
    searchQuery?: string, 
    filters?: NexusSearchFilters, 
    limit = 30, 
    mode: 'feed' | 'klips' | 'library' | 'general' = 'general',
    page = 1
): Promise<NexusPost[]> => {

  const fetchIA = async () => {
      let q = '';

      // MODE SPECIFIC QUERY CONSTRUCTION
      if (mode === 'klips') {
          // Expanded Video Formats for compatibility
          q = `(mediatype:movies) AND (format:MPEG4 OR format:h.264 OR format:WebM OR format:Matroska OR format:QuickTime) AND NOT (format:ogv)`;
      } else if (mode === 'feed') {
          // Text/Image only, no books
          q = `(mediatype:texts OR mediatype:image) AND NOT (format:pdf OR format:epub OR format:djvu)`;
      } else if (mode === 'library') {
          // PDF/Docs only
          q = `(mediatype:texts) AND (format:pdf OR format:epub)`;
      } else {
          // General mix
          q = `(mediatype:movies OR mediatype:texts OR mediatype:image)`;
      }

      // Add Search/Filters
      if (searchQuery && searchQuery.trim().length > 0) {
          const safeQuery = searchQuery.trim().replace(/[^\w\s]/gi, ''); // Sanitize
          q += ` AND (title:(${safeQuery}) OR description:(${safeQuery}))`;
      } else if (mode === 'general') {
          q += ` AND (${COLLECTIONS.map(c => `collection:${c}`).join(' OR ')})`;
      }

      const params = new URLSearchParams({
        q: q,
        fl: ['identifier', 'title', 'description', 'year', 'downloads', 'format', 'collection', 'mediatype', 'creator'].join(','),
        sort: 'downloads desc',
        rows: limit.toString(),
        page: page.toString(),
        output: 'json'
      });
      
      try {
        const res = await fetch(`${IA_BASE_URL}?${params.toString()}`);
        const data = await res.json();
        return processIAResponse(data);
      } catch (e) {
        console.warn("IA Fetch Error", e);
        return [];
      }
  };

  const fetchNASA = async () => {
      // NASA API doesn't standard paginate easily with page numbers in this simple wrapper, 
      // but we can just skip it for pages > 1 to avoid dupes or implement complex cursor logic later.
      if (mode === 'library' || page > 1) return []; 
      
      try {
        let q = searchQuery || 'nebula';
        const mediaTypeParam = mode === 'klips' ? 'video' : 'image,video';
        
        const response = await fetch(`${NASA_BASE_URL}?q=${q}&media_type=${mediaTypeParam}`);
        const data = await response.json();
        
        if (data.collection?.items) {
            return data.collection.items.slice(0, 10).map((item: any) => {
                const datum = item.data[0];
                const isVideo = datum.media_type === 'video';
                
                const vUrl = item.links?.find((l:any) => l.href.endsWith('.mp4'))?.href || '';
                if (mode === 'klips' && !vUrl) return null;

                return {
                    id: datum.nasa_id,
                    title: datum.title,
                    description: datum.description || '',
                    fullText: datum.description || '',
                    videoUrl: vUrl,
                    thumbnailUrl: item.links?.find((l:any) => l.render === 'image')?.href || '',
                    source: 'NASA',
                    mediaType: isVideo ? 'video' : 'image',
                    year: datum.date_created?.substring(0,4) || '2025',
                    views: 0,
                    likes: 0,
                    author: 'NASA JPL'
                } as NexusPost;
            }).filter(Boolean);
        }
      } catch (e) { return []; }
      return [];
  };

  const [iaPosts, nasaPosts] = await Promise.all([fetchIA(), fetchNASA()]);
  const combined = [...iaPosts, ...nasaPosts];

  // Fisher-Yates Shuffle for discovery (only on first page to avoid weird shifts on infinite scroll)
  if (page === 1) {
      for (let i = combined.length - 1; i > 0; i--) {
          const j = Math.floor(Math.random() * (i + 1));
          [combined[i], combined[j]] = [combined[j], combined[i]];
      }
  }

  return combined;
};

const processIAResponse = (data: any) => {
    if (!data.response || !data.response.docs) return [];
    return data.response.docs.map((doc: any) => {
        const identifier = doc.identifier;
        const isVideo = doc.mediatype === 'movies';
        
        let mediaType: NexusPost['mediaType'] = 'text';
        if (isVideo) mediaType = 'video';
        else if (doc.mediatype === 'image') mediaType = 'image';
        else if (doc.format?.includes('PDF') || doc.format?.includes('ePub')) mediaType = 'book';

        let sourceDisplay = 'Internet Archive';
        if (doc.collection?.includes('tedtalks')) sourceDisplay = 'TED Open Data';
        else if (doc.collection?.includes('smithsonian')) sourceDisplay = 'Smithsonian';
        else if (doc.collection?.includes('noaa')) sourceDisplay = 'NOAA';
        else if (doc.collection?.includes('europeana')) sourceDisplay = 'Europeana';
        else if (doc.collection?.includes('gutenberg')) sourceDisplay = 'Project Gutenberg';

        return {
            id: identifier,
            title: doc.title || 'Untitled',
            description: typeof doc.description === 'string' ? doc.description.substring(0, 300) : (doc.title || ''),
            fullText: typeof doc.description === 'string' ? doc.description : '',
            videoUrl: isVideo ? `https://archive.org/download/${identifier}/${identifier}.mp4` : '',
            thumbnailUrl: `https://archive.org/services/img/${identifier}`,
            source: sourceDisplay,
            mediaType: mediaType,
            year: doc.year || 'Unknown',
            views: doc.downloads || 0,
            likes: Math.floor((doc.downloads || 0) / 50),
            author: Array.isArray(doc.creator) ? doc.creator[0] : (doc.creator || 'Archive'),
            externalLink: `https://archive.org/details/${identifier}`
        } as NexusPost;
    });
};

export const getRandomNexusContent = async (): Promise<NexusPost | null> => {
    try {
        const localItems = await getLocalKeepsakes();
        if (localItems.length > 0 && Math.random() > 0.5) {
            return localItems[Math.floor(Math.random() * localItems.length)];
        }

        const queries = ['tedtalks', 'cyberpunk', 'smithsonian', 'robotics', 'europeana'];
        const randomQ = queries[Math.floor(Math.random() * queries.length)];
        const items = await fetchNexusPosts(randomQ, {}, 10, 'general');
        
        if (items.length > 0) {
            return items[Math.floor(Math.random() * items.length)];
        }
        return null;
    } catch (e) {
        return null;
    }
};

export const fetchNexusCollections = async (): Promise<NexusCollection[]> => {
    return [
        { title: "TED Ideas", description: "Innovation & Technology.", posts: await fetchNexusPosts('collection:tedtalks', {}, 6, 'general') },
        { title: "Smithsonian", description: "Cultural Heritage.", posts: await fetchNexusPosts('collection:smithsonian', {}, 6, 'general') },
        { title: "Gutenberg", description: "Literary Classics.", posts: await fetchNexusPosts('collection:gutenberg', {}, 6, 'library') }
    ];
};
