import { RssArticle } from '../types';

// Usando um proxy CORS diferente, pois o anterior pode estar instável ou bloqueado.
// corsproxy.io simplesmente precisa da URL de destino anexada.
const CORS_PROXY_URL = 'https://corsproxy.io/?';

const defaultFeeds: Record<string, string> = {
    'G1 - Brasil': 'https://g1.globo.com/dynamo/brasil/rss2.xml',
    'G1 - Mundo': 'https://g1.globo.com/dynamo/mundo/rss2.xml',
    'G1 - Economia': 'https://g1.globo.com/dynamo/economia/rss2.xml',
    'G1 - Tecnologia': 'https://g1.globo.com/dynamo/tecnologia/rss2.xml',
    'G1 - Ciência e Saúde': 'https://g1.globo.com/dynamo/ciencia-e-saude/rss2.xml',
    'G1 - Pop & Arte': 'https://g1.globo.com/dynamo/pop-arte/rss2.xml',
    'G1 - Política': 'https://g1.globo.com/dynamo/politica/mensalao/rss2.xml',
};

export const fetchAndParseRss = async (feedUrl: string, sourceName: string): Promise<RssArticle[]> => {
    try {
        // Chamada de fetch atualizada para o novo proxy, que não precisa de codificação de URL em um parâmetro.
        const response = await fetch(`${CORS_PROXY_URL}${feedUrl}`);
        if (!response.ok) {
            throw new Error(`Erro de HTTP! status: ${response.status} para ${feedUrl}`);
        }
        const text = await response.text();
        const parser = new DOMParser();
        const xml = parser.parseFromString(text, 'application/xml');

        const parseError = xml.querySelector('parsererror');
        if (parseError) {
            console.error('Erro de parse de XML:', parseError.textContent);
            throw new Error(`Falha ao fazer o parse do feed RSS de ${feedUrl}.`);
        }
        
        const items = Array.from(xml.querySelectorAll('item'));
        
        return items.map(item => {
            const title = item.querySelector('title')?.textContent || '';
            const link = item.querySelector('link')?.textContent || '';
            const pubDate = item.querySelector('pubDate')?.textContent || new Date().toISOString();
            const contentEncoded = item.querySelector('content\\:encoded')?.textContent;
            const description = item.querySelector('description')?.textContent || '';
            const content = contentEncoded || description;

            return {
                id: link || `${title}-${pubDate}`,
                title,
                link,
                pubDate,
                content,
                source: sourceName,
            };
        });
    } catch (error) {
        // Loga o erro e o relança para que o chamador possa lidar com ele.
        console.error(`Falha ao buscar ou fazer parse do feed RSS ${feedUrl}:`, error);
        throw error;
    }
};

export const fetchNewsFromFeeds = async (category?: string, keywords?: string[]): Promise<RssArticle[]> => {
    let feedUrlToFetch = defaultFeeds['G1 - Brasil'];
    let sourceNameToUse = 'G1 - Brasil';

    if (category) {
        const categoryKey = Object.keys(defaultFeeds).find(key => 
            key.toLowerCase().includes(category.toLowerCase())
        );
        if (categoryKey) {
            feedUrlToFetch = defaultFeeds[categoryKey];
            sourceNameToUse = categoryKey;
        }
    }

    try {
        let articles = await fetchAndParseRss(feedUrlToFetch, sourceNameToUse);

        if (keywords && keywords.length > 0) {
            articles = articles.filter(article => 
                keywords.some(keyword => 
                    article.title.toLowerCase().includes(keyword.toLowerCase()) || 
                    article.content.toLowerCase().includes(keyword.toLowerCase())
                )
            );
        }
        
        return articles.sort((a, b) => new Date(b.pubDate).getTime() - new Date(a.pubDate).getTime());
    } catch (error) {
        console.error(`A chamada de função 'fetchNews' falhou:`, error);
        return [];
    }
};