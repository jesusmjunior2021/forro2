import React from 'react';
import { CalendarEvent } from '../types';

interface EventCardProps {
  event: CalendarEvent;
  onClose: () => void;
  onEdit: (event: CalendarEvent) => void;
  onDelete: (eventId: string) => void;
  onToggleStatus: (eventId: string, currentStatus: 'pending' | 'completed') => void;
}

const EventCard: React.FC<EventCardProps> = ({ event, onClose, onEdit, onDelete, onToggleStatus }) => {
  if (!event) return null;

  const isCompleted = event.status === 'completed';
  const eventDate = new Date(event.date + 'T' + event.time);
  const isValidDate = !isNaN(eventDate.getTime());

  const handleDelete = () => {
    if (window.confirm(`Tem certeza que deseja excluir o evento "${event.title}"?`)) {
      onDelete(event.id);
      onClose();
    }
  };

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 animate-fade-in" onClick={onClose}>
      <div className="bg-gray-800 rounded-2xl shadow-2xl w-full max-w-md m-4 border border-gray-700 flex flex-col" onClick={e => e.stopPropagation()}>
        <div className="p-6">
          <div className="flex justify-between items-start">
            <div>
              <h2 className={`text-2xl font-bold ${isCompleted ? 'text-gray-500 line-through' : 'text-blue-300'}`}>
                {isCompleted && <i className="fas fa-check-circle text-green-500 mr-2"></i>}
                {event.title}
              </h2>
              <p className="text-sm text-gray-400 mt-1">
                <i className="fas fa-calendar-alt mr-2"></i>
                {isValidDate 
                  ? eventDate.toLocaleDateString('pt-BR', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })
                  : 'Data inválida'
                }
                <span className="mx-2">|</span>
                <i className="fas fa-clock mr-2"></i>{event.time}
              </p>
            </div>
            <button onClick={onClose} className="text-gray-500 hover:text-white transition-colors">
              <i className="fas fa-times text-2xl"></i>
            </button>
          </div>
          <p className="text-gray-300 mt-4 text-sm leading-relaxed">{event.description}</p>
          
          {event.prerequisites && event.prerequisites.length > 0 && (
            <div className="mt-6">
              <h3 className="text-md font-semibold text-gray-300 mb-2 flex items-center"><i className="fas fa-list-check mr-2 text-yellow-400"></i>Pré-requisitos</h3>
              <ul className="list-disc list-inside space-y-1 text-sm text-gray-400">
                {event.prerequisites.map((item, index) => <li key={index}>{item}</li>)}
              </ul>
            </div>
          )}
          
          {event.executionSteps && event.executionSteps.length > 0 && (
            <div className="mt-6">
              <h3 className="text-md font-semibold text-gray-300 mb-2 flex items-center"><i className="fas fa-tasks mr-2 text-green-400"></i>Passos para Execução</h3>
              <ul className="list-decimal list-inside space-y-1 text-sm text-gray-400">
                {event.executionSteps.map((item, index) => <li key={index}>{item}</li>)}
              </ul>
            </div>
          )}
        </div>
        <div className="bg-gray-900/50 p-4 mt-auto border-t border-gray-700 flex justify-between items-center rounded-b-2xl">
            <button onClick={() => onToggleStatus(event.id, event.status)} className={`px-4 py-2 rounded-md font-semibold transition-colors text-sm flex items-center ${isCompleted ? 'bg-yellow-600 hover:bg-yellow-700 text-white' : 'bg-green-600 hover:bg-green-700 text-white'}`}>
                <i className={`fas ${isCompleted ? 'fa-undo' : 'fa-check'} mr-2`}></i>
                {isCompleted ? 'Reabrir Tarefa' : 'Marcar como Concluído'}
            </button>
            <div className="space-x-2">
                 <button onClick={() => onEdit(event)} className="px-4 py-2 rounded-md bg-blue-600 hover:bg-blue-700 text-white font-semibold transition-colors text-sm">
                    <i className="fas fa-pencil-alt mr-2"></i>Editar
                </button>
                <button onClick={handleDelete} className="px-4 py-2 rounded-md bg-red-700 hover:bg-red-800 text-white font-semibold transition-colors text-sm">
                    <i className="fas fa-trash-alt mr-2"></i>Excluir
                </button>
            </div>
        </div>
      </div>
    </div>
  );
};

export default EventCard;