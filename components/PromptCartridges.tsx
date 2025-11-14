import React, { useState } from 'react';
import { PromptCartridge } from '../types';
import PromptCartridgeForm from './PromptCartridgeForm';

interface PromptCartridgesProps {
  cartridges: PromptCartridge[];
  activeCartridgeId: string | null;
  onSelect: (id: string | null) => void;
  onAdd: (cartridge: { title: string; prompt: string }) => void;
  onDelete: (id: string) => void;
}

const PromptCartridgeItem: React.FC<{
    cartridge: PromptCartridge;
    isActive: boolean;
    onSelect: () => void;
    onDelete: (e: React.MouseEvent) => void;
}> = ({ cartridge, isActive, onSelect, onDelete }) => {
    return (
        <div className="relative group flex-shrink-0" title={cartridge.title}>
            <button 
                onClick={onSelect} 
                className={`w-20 h-24 bg-gray-700 border-b-4 border-gray-900 rounded-t-lg p-1 flex flex-col transition-all duration-200 transform hover:-translate-y-1 focus:outline-none ${isActive ? 'ring-2 ring-yellow-400 ring-offset-2 ring-offset-gray-800' : 'ring-0'}`}
            >
                <div className="w-full h-full bg-gray-800 rounded-t-md flex items-center justify-center p-1 text-center text-gray-200 text-xs font-bold uppercase border-t border-x border-gray-600" style={{ fontFamily: '"Press Start 2P", cursive, monospace' }}>
                    {cartridge.title}
                </div>
            </button>
            {cartridge.isRemovable && (
                <button 
                    onClick={onDelete} 
                    className="absolute -top-2 -right-2 w-5 h-5 bg-red-600 rounded-full text-white text-xs flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity hover:bg-red-700"
                    title="Remover Cartucho"
                >
                    <i className="fas fa-times"></i>
                </button>
            )}
        </div>
    );
};


const PromptCartridges: React.FC<PromptCartridgesProps> = ({ cartridges, activeCartridgeId, onSelect, onAdd, onDelete }) => {
    const [isFormOpen, setIsFormOpen] = useState(false);

    const handleSave = (cartridge: { title: string; prompt: string }) => {
        onAdd(cartridge);
        setIsFormOpen(false);
    };
    
    const handleDelete = (id: string, e: React.MouseEvent) => {
        e.stopPropagation();
        if (window.confirm("Tem certeza que deseja remover este cartucho?")) {
            onDelete(id);
        }
    };

    return (
        <>
            <div className="flex items-end space-x-3 p-2 h-32">
                {cartridges.map(cartridge => (
                    <PromptCartridgeItem
                        key={cartridge.id}
                        cartridge={cartridge}
                        isActive={activeCartridgeId === cartridge.id}
                        onSelect={() => onSelect(activeCartridgeId === cartridge.id ? null : cartridge.id)}
                        onDelete={(e) => handleDelete(cartridge.id, e)}
                    />
                ))}
                <button 
                    onClick={() => setIsFormOpen(true)} 
                    className="w-16 h-16 bg-gray-800 border-2 border-dashed border-gray-600 rounded-lg flex items-center justify-center text-gray-500 hover:text-white hover:border-gray-500 transition-colors"
                    title="Adicionar Novo Cartucho"
                >
                    <i className="fas fa-plus fa-lg"></i>
                </button>
            </div>
            {isFormOpen && (
                <PromptCartridgeForm onSave={handleSave} onClose={() => setIsFormOpen(false)} />
            )}
        </>
    );
};

export default PromptCartridges;