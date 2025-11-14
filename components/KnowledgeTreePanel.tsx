import React, { useState } from 'react';
import { KnowledgeTree, KnowledgeTopic, KnowledgeResource, ResourceCategory } from '../types';

interface KnowledgeTreePanelProps {
  isOpen: boolean;
  onClose: () => void;
  knowledgeTree: KnowledgeTree;
}

const getResourceIcon = (category: ResourceCategory) => {
    switch (category) {
        case 'video': return 'fab fa-youtube text-red-400';
        case 'podcast': return 'fas fa-podcast text-purple-400';
        case 'audio': return 'fas fa-headphones text-blue-400';
        case 'book': return 'fas fa-book text-yellow-600';
        case 'article': return 'fas fa-newspaper text-green-400';
        default: return 'fas fa-link text-gray-400';
    }
};

const ResourceItem: React.FC<{ resource: KnowledgeResource }> = ({ resource }) => (
    <a href={resource.url} target="_blank" rel="noopener noreferrer" className="knowledge-tree-resource-item group">
        <i className={`w-5 text-center ${getResourceIcon(resource.type)} mr-3`}></i>
        <div className="flex-1 overflow-hidden">
            <p className="font-semibold text-sm text-gray-200 truncate group-hover:text-blue-300 transition-colors" title={resource.title}>
                {resource.title}
            </p>
            <p className="text-xs text-gray-500 truncate">{resource.source}</p>
        </div>
        <i className="fas fa-external-link-alt text-gray-500 group-hover:text-white transition-colors"></i>
    </a>
);

const TopicItem: React.FC<{ topic: KnowledgeTopic }> = ({ topic }) => {
    const [isExpanded, setIsExpanded] = useState(false);

    return (
        <div className="knowledge-tree-topic-item">
            <button onClick={() => setIsExpanded(!isExpanded)} className="w-full flex justify-between items-center p-3 bg-gray-700/50 hover:bg-gray-700 rounded-lg">
                <h4 className="font-bold text-gray-100">{topic.title}</h4>
                <i className={`fas fa-chevron-down transition-transform ${isExpanded ? 'rotate-180' : ''}`}></i>
            </button>
            {isExpanded && (
                <div className="pl-4 pt-2 mt-1 border-l-2 border-gray-600/50 space-y-2">
                    {topic.resources.length > 0 ? (
                        topic.resources.map(res => <ResourceItem key={res.id} resource={res} />)
                    ) : (
                        <p className="text-xs text-gray-500 px-3 py-2">Nenhum recurso encontrado para este tópico.</p>
                    )}
                </div>
            )}
        </div>
    );
};


const KnowledgeTreePanel: React.FC<KnowledgeTreePanelProps> = ({ isOpen, onClose, knowledgeTree }) => {
    const topics: KnowledgeTopic[] = Object.values(knowledgeTree);

    return (
        <div className={`slate-panel w-96 ${isOpen ? 'open' : ''} flex flex-col`}>
            <header className="p-4 flex justify-between items-center border-b border-gray-700/50 shrink-0">
                <h3 className="text-lg font-semibold text-gray-200 flex items-center">
                    <i className="fas fa-network-wired mr-3"></i>
                    Árvore de Conhecimento
                </h3>
                <button onClick={onClose} className="p-2 rounded-full hover:bg-gray-700 transition-colors">
                    <i className="fas fa-times"></i>
                </button>
            </header>
            <div className="flex-1 p-4 space-y-3 overflow-y-auto scrollbar-thin scrollbar-thumb-gray-600 scrollbar-track-gray-800">
                {topics.length === 0 ? (
                    <div className="text-center text-gray-500 pt-16">
                        <i className="fas fa-seedling text-4xl mb-4"></i>
                        <p>A árvore de conhecimento está vazia.</p>
                        <p className="text-xs">Ela será preenchida à medida que você interage.</p>
                    </div>
                ) : (
                    topics.map(topic => <TopicItem key={topic.id} topic={topic} />)
                )}
            </div>
        </div>
    );
};

export default KnowledgeTreePanel;
