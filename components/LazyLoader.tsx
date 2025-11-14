import React from 'react';

interface LazyLoaderProps {
  message?: string;
}

const LazyLoader: React.FC<LazyLoaderProps> = ({ message = 'Carregando Módulo...' }) => (
  <div className="fixed inset-0 bg-gray-900/50 flex items-center justify-center z-50">
    <div className="bg-gray-800 p-4 rounded-lg flex items-center shadow-lg border border-gray-700">
        <i className="fas fa-spinner fa-spin mr-3 text-blue-400"></i>
        <span className="text-gray-300 font-semibold">{message}</span>
    </div>
  </div>
);

export default LazyLoader;