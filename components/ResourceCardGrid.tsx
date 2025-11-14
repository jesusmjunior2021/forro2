import React from 'react';
import ResourceCard from './ResourceCard';

interface Resource {
  id: string;
  icon: string;
  title: string;
  description: string;
}

interface ResourceCardGridProps {
  resources: Resource[];
  onResourceClick: (id: string) => void;
}

const ResourceCardGrid: React.FC<ResourceCardGridProps> = ({ resources, onResourceClick }) => {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 p-4">
      {resources.map(resource => (
        <ResourceCard
          key={resource.id}
          icon={resource.icon}
          title={resource.title}
          description={resource.description}
          onClick={() => onResourceClick(resource.id)}
        />
      ))}
    </div>
  );
};

export default ResourceCardGrid;
