import React from 'react';

interface ResourceCardProps {
  icon: string;
  title: string;
  description: string;
  onClick: () => void;
}

const ResourceCard: React.FC<ResourceCardProps> = ({ icon, title, description, onClick }) => {
  return (
    <button
      onClick={onClick}
      className="w-full text-left p-4 bg-gray-700/50 hover:bg-gray-700 rounded-lg transition-all duration-200 border border-gray-600/50"
    >
      <div className="flex items-center mb-2">
        <i className={`fas ${icon} text-xl text-blue-400 mr-3`}></i>
        <h3 className="font-bold text-gray-100">{title}</h3>
      </div>
      <p className="text-sm text-gray-400">{description}</p>
    </button>
  );
};

export default ResourceCard;
