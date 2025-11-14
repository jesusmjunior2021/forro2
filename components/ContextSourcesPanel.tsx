import React from 'react';
import { LocalContextLink } from '../types';

interface ContextSourcesPanelProps {
  links: LocalContextLink[];
  onLoad: (link: LocalContextLink) => void;
}

const getContextIcon = (type: LocalContextLink['type']) => {
  switch (type) {
    case 'document':
      return 'fas fa-file-alt text-yellow-400';
    case 'chat':
      return 'fas fa-history text-purple-400';
    case 'knowledge':
      return 'fas fa-sitemap text-green-400';
    default:
      return 'fas fa-question-circle text-gray-400';
  }
};

const ContextSourcesPanel: React.FC<ContextSourcesPanelProps> = ({ links, onLoad }) => {
  if (!links || links.length === 0) {
    return null;
  }

  return (
    <div className="context-panel">
      <h3 className="context-panel-title">
        <i className="fas fa-brain mr-2"></i>
        Consultando sua Memória...
      </h3>
      <ul className="context-list">
        {links.map((link) => (
          <li key={`${link.type}-${link.id}`} className="context-item">
            <button
              onClick={() => onLoad(link)}
              className="context-link w-full text-left"
            >
              <div className="context-icon">
                <i className={`${getContextIcon(link.type)} text-xl`}></i>
              </div>
              <div className="context-info">
                <span className="context-title">{link.title}</span>
                <span className="context-snippet">{link.snippet}</span>
              </div>
            </button>
          </li>
        ))}
      </ul>
    </div>
  );
};

export default ContextSourcesPanel;