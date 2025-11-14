import { useState, useCallback, useEffect } from 'react';
import { RssArticle } from '../types';
import { fetchAndParseRss } from '../utils/rssUtils';

const FEEDS: Record<string, string> = {
    'G1 - Brasil': 'https://g1.globo.com/dynamo/brasil/rss2.xml',
    'G1 - Mundo': 'https://g1.globo.com/dynamo/mundo/rss2.xml',
    'G1 - Economia': 'https://g1.globo.com/dynamo/economia/rss2.xml',
    'G1 - Tecnologia': 'https://g1.globo.com/dynamo/tecnologia/rss2.xml',
    'G1 - Ciência e Saúde': 'https://g1.globo.com/dynamo/ciencia-e-saude/rss2.xml',
    'G1 - Pop & Arte': 'https://g1.globo.com/dynamo/pop-arte/rss2.xml',
    'G1 - Política': 'https://g1.globo.com/dynamo/politica/mensalao/rss2.xml',
};

export const useRssReader = () => {
    const [articles, setArticles] = useState<RssArticle[]>([]);
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);

    const fetchFeeds = useCallback(async () => {
        setIsLoading(true);
        setError(null);
        setArticles([]); // Limpa artigos antigos antes de buscar
        try {
            const allArticlesPromises = Object.entries(FEEDS).map(([sourceName, url]) => 
                fetchAndParseRss(url, sourceName).catch(e => {
                    // Loga erros de feeds individuais mas não falha o lote inteiro
                    console.error(`Erro ao buscar o feed ${sourceName}:`, e);
                    return []; // Retorna um array vazio para feeds que falharam
                })
            );
            
            const results = await Promise.all(allArticlesPromises);
            const allArticles = results.flat();
            
            if (allArticles.length === 0) {
                 setError('Não foi possível carregar nenhuma notícia. Verifique sua conexão ou tente mais tarde.');
            } else {
                // Ordena todos os artigos por data descendente
                allArticles.sort((a, b) => new Date(b.pubDate).getTime() - new Date(a.pubDate).getTime());
                setArticles(allArticles);
            }

        } catch (err) { // Este catch externo pode ser redundante agora, mas é bom por segurança
            setError('Ocorreu um erro inesperado ao buscar notícias.');
            console.error(err);
        } finally {
            setIsLoading(false);
        }
    }, []);

    useEffect(() => {
        fetchFeeds();
    }, [fetchFeeds]);

    return { articles, isLoading, error, refreshFeeds: fetchFeeds };
};