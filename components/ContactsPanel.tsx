import React, { useState, useMemo } from 'react';
import { Contact } from '../types';

interface ContactsPanelProps {
  contacts: Contact[];
  isOpen: boolean;
  onClose: () => void;
  onClearContacts: () => void;
}

const ContactsPanel: React.FC<ContactsPanelProps> = ({ contacts, isOpen, onClose, onClearContacts }) => {
  const [searchTerm, setSearchTerm] = useState('');

  const filteredContacts = useMemo(() => {
    if (!searchTerm) {
      return contacts;
    }
    const lowercasedTerm = searchTerm.toLowerCase();
    return contacts.filter(contact =>
      contact.name.toLowerCase().includes(lowercasedTerm) ||
      contact.phone.toLowerCase().includes(lowercasedTerm)
    );
  }, [contacts, searchTerm]);

  const handleClearContacts = () => {
    if (window.confirm('Tem certeza de que deseja apagar TODOS os contatos? Esta ação não pode ser desfeita.')) {
        onClearContacts();
    }
  };

  const ContactItem: React.FC<{ contact: Contact }> = ({ contact }) => (
    <div
      className="w-full text-left p-3 rounded-lg bg-gray-700 flex justify-between items-center"
    >
      <div>
        <h4 className="font-semibold text-sm text-gray-200 truncate" title={contact.name}>{contact.name}</h4>
        <p className="text-xs text-gray-400 mt-1">{contact.phone}</p>
      </div>
      <a
        href={contact.whatsappLink}
        target="_blank"
        rel="noopener noreferrer"
        title={`WhatsApp para ${contact.name}`}
        className="px-3 py-2 rounded-lg bg-green-600 hover:bg-green-700 text-white font-semibold transition-colors flex items-center text-xs shrink-0"
      >
        <i className="fab fa-whatsapp mr-2"></i>
        <span>Chat</span>
      </a>
    </div>
  );

  return (
    <>
      <div className={`slate-panel w-80 ${isOpen ? 'open' : ''} flex flex-col`}>
        <header className="p-4 flex justify-between items-center border-b border-gray-700/50 shrink-0">
          <h3 className="text-lg font-semibold text-gray-200 flex items-center">
            <i className="fas fa-users mr-3"></i>
            Contatos
          </h3>
          <button onClick={onClose} className="p-2 rounded-full hover:bg-gray-700 transition-colors">
            <i className="fas fa-times"></i>
          </button>
        </header>
        <div className="p-4 flex flex-col h-full overflow-hidden">
          <div className="relative mb-4 shrink-0">
            <input
              type="text"
              placeholder="Buscar contato..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full bg-gray-900/80 border border-gray-600 rounded-md text-sm pl-9 pr-3 py-2 focus:ring-blue-500 focus:border-blue-500"
            />
            <i className="fas fa-search absolute left-3 top-1/2 -translate-y-1/2 text-gray-500"></i>
          </div>

          {contacts.length === 0 ? (
            <div className="flex-1 flex flex-col items-center justify-center text-center text-gray-500">
              <i className="fas fa-address-book text-3xl mb-3"></i>
              <p className="text-sm">Nenhum contato carregado.</p>
              <p className="text-xs mt-1">Use o botão 'Carregar Contatos' para importar um arquivo .csv.</p>
            </div>
          ) : filteredContacts.length === 0 ? (
            <div className="flex-1 flex flex-col items-center justify-center text-center text-gray-500">
                <i className="fas fa-search-minus text-3xl mb-3"></i>
                <p className="text-sm">Nenhum contato encontrado para "{searchTerm}".</p>
            </div>
          ) : (
            <div className="flex flex-col gap-3 overflow-y-auto flex-1 pr-1 scrollbar-thin scrollbar-thumb-gray-600 scrollbar-track-gray-800">
              {filteredContacts.map((contact, index) => (
                <ContactItem key={`${contact.phone}-${index}`} contact={contact} />
              ))}
            </div>
          )}

          <div className="mt-4 pt-4 border-t border-gray-700 flex-shrink-0">
            <div className="text-center text-xs text-gray-500 mb-3">
                {contacts.length} {contacts.length === 1 ? 'contato' : 'contatos'} na agenda.
            </div>
            <button
                onClick={handleClearContacts}
                className="w-full text-sm bg-red-800/80 hover:bg-red-700 text-red-100 py-2 px-3 rounded-md transition-colors flex items-center justify-center disabled:bg-gray-700/50 disabled:text-gray-500 disabled:cursor-not-allowed"
                disabled={contacts.length === 0}
            >
                <i className="fas fa-trash-alt mr-2"></i>
                Limpar Contatos
            </button>
        </div>
        </div>
      </div>
    </>
  );
};

export default ContactsPanel;