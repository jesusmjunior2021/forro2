import React, { useState, useMemo } from 'react';
import { Product } from '../types';

interface ProductCatalogPanelProps {
  isOpen: boolean;
  onClose: () => void;
  products: Product[];
}

type SortKey = keyof Product;
type SortOrder = 'asc' | 'desc';

const ProductCatalogPanel: React.FC<ProductCatalogPanelProps> = ({ isOpen, onClose, products }) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [sortConfig, setSortConfig] = useState<{ key: SortKey; order: SortOrder } | null>({ key: 'Nome', order: 'asc' });

  const sortedAndFilteredProducts = useMemo(() => {
    let filtered = products.filter(p =>
      p.Nome.toLowerCase().includes(searchTerm.toLowerCase()) ||
      p.Categoria?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      p.Marca?.toLowerCase().includes(searchTerm.toLowerCase())
    );

    if (sortConfig !== null) {
      filtered.sort((a, b) => {
        const aValue = a[sortConfig.key];
        const bValue = b[sortConfig.key];

        if (aValue === undefined || aValue === null) return 1;
        if (bValue === undefined || bValue === null) return -1;

        if (aValue < bValue) {
          return sortConfig.order === 'asc' ? -1 : 1;
        }
        if (aValue > bValue) {
          return sortConfig.order === 'asc' ? 1 : -1;
        }
        return 0;
      });
    }

    return filtered;
  }, [products, searchTerm, sortConfig]);

  const requestSort = (key: SortKey) => {
    let order: SortOrder = 'asc';
    if (sortConfig && sortConfig.key === key && sortConfig.order === 'asc') {
      order = 'desc';
    }
    setSortConfig({ key, order });
  };

  const SortableHeader: React.FC<{ sortKey: SortKey, label: string }> = ({ sortKey, label }) => {
    const isSorted = sortConfig?.key === sortKey;
    const icon = isSorted ? (sortConfig?.order === 'asc' ? 'fa-sort-up' : 'fa-sort-down') : 'fa-sort';
    return (
      <th scope="col" className="px-4 py-3" onClick={() => requestSort(sortKey)}>
        <div className="flex items-center cursor-pointer">
          {label}
          <i className={`fas ${icon} ml-2 text-gray-500`}></i>
        </div>
      </th>
    );
  };

  return (
    <div className={`slate-panel w-full max-w-4xl ${isOpen ? 'open' : ''} flex flex-col`}>
      <header className="p-4 flex justify-between items-center border-b border-gray-700/50 shrink-0">
        <h3 className="text-lg font-semibold text-gray-200 flex items-center">
          <i className="fas fa-book mr-3"></i>
          Catálogo de Produtos
        </h3>
        <button onClick={onClose} className="p-2 rounded-full hover:bg-gray-700 transition-colors">
          <i className="fas fa-times"></i>
        </button>
      </header>
      
      <div className="p-4 border-b border-gray-700/50">
        <div className="relative">
          <i className="fas fa-search absolute left-3 top-1/2 -translate-y-1/2 text-gray-500"></i>
          <input
            type="text"
            placeholder="Buscar por nome, categoria ou marca..."
            value={searchTerm}
            onChange={e => setSearchTerm(e.target.value)}
            className="w-full bg-gray-900/80 border border-gray-600 rounded-md text-sm pl-9 pr-3 py-2 focus:ring-blue-500"
          />
        </div>
      </div>

      <main className="flex-1 overflow-y-auto">
        <table className="w-full text-sm text-left text-gray-300">
          <thead className="text-xs text-gray-400 uppercase bg-gray-700/50 sticky top-0">
            <tr>
              <SortableHeader sortKey="Codigo" label="Código" />
              <SortableHeader sortKey="Nome" label="Nome" />
              <SortableHeader sortKey="Categoria" label="Categoria" />
              <SortableHeader sortKey="Marca" label="Marca" />
              <SortableHeader sortKey="ValorPrecoFixado" label="Preço" />
              <SortableHeader sortKey="EstoqueUnidade" label="Unidade" />
            </tr>
          </thead>
          <tbody>
            {sortedAndFilteredProducts.map((product, index) => (
              <tr key={product.Codigo} className={`border-b border-gray-700/50 ${index % 2 === 0 ? 'bg-gray-800/40' : 'bg-gray-800/80'} hover:bg-gray-700/50`}>
                <td className="px-4 py-3 font-medium text-gray-400">{product.Codigo}</td>
                <th scope="row" className="px-4 py-3 font-medium text-white whitespace-nowrap">{product.Nome}</th>
                <td className="px-4 py-3">{product.Categoria || 'N/A'}</td>
                <td className="px-4 py-3">{product.Marca || 'N/A'}</td>
                <td className="px-4 py-3">R$ {product.ValorPrecoFixado?.toFixed(2) || '0.00'}</td>
                <td className="px-4 py-3">{product.EstoqueUnidade || 'N/A'}</td>
              </tr>
            ))}
          </tbody>
        </table>
        {sortedAndFilteredProducts.length === 0 && (
          <div className="text-center p-8 text-gray-500">
            <i className="fas fa-box-open text-3xl mb-3"></i>
            <p>Nenhum produto encontrado.</p>
          </div>
        )}
      </main>
    </div>
  );
};

export default ProductCatalogPanel;