import React, { useState, useMemo } from 'react';
import { RssArticle } from '../types';
import ArticleDetailModal from './ArticleDetailModal';

interface RssFeedPanelProps {
  articles: RssArticle[];
  isLoading: boolean;
  error: string | null;
  isOpen: boolean;
  onClose: () => void;
  onRefresh: () => void;
  selectedVoiceName: string;
  speechRate: number;
}

const RssFeedPanel: React.FC<RssFeedPanelProps> = ({ articles, isLoading, error, isOpen, onClose, onRefresh, selectedVoiceName, speechRate }) => {
    const [selectedArticle, setSelectedArticle] = useState<RssArticle | null>(null);
    const [searchTerm, setSearchTerm] = useState('');

    const filteredArticles = useMemo(() => {
        if (!searchTerm) {
          return articles;
        }
        const lowercasedTerm = searchTerm.toLowerCase();
        return articles.filter(article =>
          article.title.toLowerCase().includes(lowercasedTerm) ||
          article.source.toLowerCase().includes(lowercasedTerm)
        );
      }, [articles, searchTerm]);


    const formatDate = (isoString: string) => {
        const date = new Date(isoString);
        return date.toLocaleDateString('pt-BR', { day: '2-digit', month: 'short', year: 'numeric' });
    };

    const ArticleItem: React.FC<{ article: RssArticle }> = ({ article }) => {
        const tag = article.source.replace('G1 - ', '');
        return (
            <button
                onClick={() => setSelectedArticle(article)}
                className="w-full text-left p-3 rounded-lg bg-gray-700 hover:bg-gray-600/80 transition-all duration-200 shadow-md hover:shadow-lg hover:-translate-y-0.5"
            >
                <h4 className="font-semibold text-sm text-blue-300 line-clamp-2" title={article.title}>{article.title}</h4>
                <div className="text-gray-400 text-xs mt-2 flex justify-between items-center">
                    <span className="px-2 py-0.5 text-[10px] bg-gray-600 text-gray-300 rounded-full">{tag}</span>
                    <span>{formatDate(article.pubDate)}</span>
                </div>
            </button>
        );
    };

    return (
        <>
            <div className={`slate-panel w-80 ${isOpen ? 'open' : ''} flex flex-col`}>
                <header className="p-4 flex justify-between items-center border-b border-gray-700/50 shrink-0">
                    <h3 className="text-lg font-semibold text-gray-200 flex items-center">
                        <i className="fas fa-newspaper mr-3"></i>
                        Feed de Notícias
                    </h3>
                    <div className="flex items-center space-x-2">
                        <button onClick={onClose} className="p-2 rounded-full hover:bg-gray-700 transition-colors">
                            <i className="fas fa-times"></i>
                        </button>
                    </div>
                </header>
                <div className="p-4 flex flex-col h-full overflow-hidden">
                    <div className="relative mb-4 shrink-0">
                        <input
                        type="text"
                        placeholder="Buscar notícias..."
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        className="w-full bg-gray-900/80 border border-gray-600 rounded-md text-sm pl-9 pr-3 py-2 focus:ring-blue-500 focus:border-blue-500"
                        />
                        <i className="fas fa-search absolute left-3 top-1/2 -translate-y-1/2 text-gray-500"></i>
                    </div>

                    {isLoading && articles.length === 0 ? (
                        <div className="flex-1 flex items-center justify-center">
                            <i className="fas fa-spinner fa-spin text-3xl text-gray-500"></i>
                        </div>
                    ) : error ? (
                        <div className="flex-1 flex flex-col items-center justify-center text-center text-red-400">
                            <i className="fas fa-exclamation-triangle text-3xl mb-3"></i>
                            <p className="text-sm">{error}</p>
                        </div>
                    ) : filteredArticles.length === 0 ? (
                        <div className="flex-1 flex flex-col items-center justify-center text-center text-gray-500">
                            <i className="fas fa-inbox text-3xl mb-3"></i>
                            <p className="text-sm">Nenhuma notícia encontrada.</p>
                        </div>
                    ) : (
                        <div className="flex flex-col gap-3 overflow-y-auto flex-1 pr-1 scrollbar-thin scrollbar-thumb-gray-600 scrollbar-track-gray-800">
                            {filteredArticles.map((article) => (
                                <ArticleItem key={article.id} article={article} />
                            ))}
                        </div>
                    )}
                </div>
            </div>

            {selectedArticle && (
                <ArticleDetailModal
                    article={selectedArticle}
                    onClose={() => setSelectedArticle(null)}
                    selectedVoiceName={selectedVoiceName}
                    speechRate={speechRate}
                />
            )}
        </>
    );
};

export default RssFeedPanel;