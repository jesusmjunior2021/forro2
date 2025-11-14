import React, { useState, useEffect } from 'react';
import { CalendarEvent } from '../types';

interface EventFormProps {
  onSave: (eventData: Omit<CalendarEvent, 'id' | 'status'>, eventId?: string) => void;
  onClose: () => void;
  initialDate: string; // YYYY-MM-DD
  eventToEdit?: CalendarEvent | null;
}

const EventForm: React.FC<EventFormProps> = ({ onSave, onClose, initialDate, eventToEdit }) => {
  const [title, setTitle] = useState('');
  const [date, setDate] = useState(initialDate);
  const [time, setTime] = useState('10:00');
  const [description, setDescription] = useState('');
  const [prerequisites, setPrerequisites] = useState('');
  const [executionSteps, setExecutionSteps] = useState('');
  const [error, setError] = useState('');

  useEffect(() => {
    if (eventToEdit) {
      setTitle(eventToEdit.title);
      setDate(eventToEdit.date);
      setTime(eventToEdit.time);
      setDescription(eventToEdit.description);
      setPrerequisites(eventToEdit.prerequisites.join('\n'));
      setExecutionSteps(eventToEdit.executionSteps.join('\n'));
    } else {
      setDate(initialDate);
    }
  }, [eventToEdit, initialDate]);

  const handleSave = () => {
    if (!title || !date || !time) {
      setError('Título, data e hora são obrigatórios.');
      return;
    }
    setError('');

    const eventData: Omit<CalendarEvent, 'id' | 'status'> = {
      title,
      date,
      time,
      description,
      prerequisites: prerequisites.split('\n').filter(p => p.trim() !== ''),
      executionSteps: executionSteps.split('\n').filter(s => s.trim() !== ''),
    };
    onSave(eventData, eventToEdit?.id);
  };

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 animate-fade-in" onClick={onClose}>
      <div className="bg-gray-800 rounded-2xl shadow-2xl w-full max-w-lg m-4 border border-gray-700" onClick={e => e.stopPropagation()}>
        <div className="p-6">
          <div className="flex justify-between items-start mb-4">
            <h2 className="text-2xl font-bold text-blue-300">{eventToEdit ? 'Editar Evento' : 'Agendar Novo Evento'}</h2>
            <button onClick={onClose} className="text-gray-500 hover:text-white transition-colors">
              <i className="fas fa-times text-2xl"></i>
            </button>
          </div>

          {error && <p className="bg-red-900/50 text-red-300 text-sm p-2 rounded-md mb-4">{error}</p>}

          <div className="space-y-4 max-h-[70vh] overflow-y-auto pr-2">
            <div>
              <label htmlFor="title" className="block text-sm font-medium text-gray-400 mb-1">Título</label>
              <input type="text" id="title" value={title} onChange={e => setTitle(e.target.value)} className="w-full bg-gray-700 border border-gray-600 rounded-md text-sm px-3 py-2 focus:ring-blue-500 focus:border-blue-500" />
            </div>

            <div className="grid grid-cols-2 gap-4">
                <div>
                    <label htmlFor="date" className="block text-sm font-medium text-gray-400 mb-1">Data</label>
                    <input type="date" id="date" value={date} onChange={e => setDate(e.target.value)} className="w-full bg-gray-700 border border-gray-600 rounded-md text-sm px-3 py-2 focus:ring-blue-500 focus:border-blue-500" />
                </div>
                <div>
                    <label htmlFor="time" className="block text-sm font-medium text-gray-400 mb-1">Hora</label>
                    <input type="time" id="time" value={time} onChange={e => setTime(e.target.value)} className="w-full bg-gray-700 border border-gray-600 rounded-md text-sm px-3 py-2 focus:ring-blue-500 focus:border-blue-500" />
                </div>
            </div>

            <div>
              <label htmlFor="description" className="block text-sm font-medium text-gray-400 mb-1">Descrição</label>
              <textarea id="description" value={description} onChange={e => setDescription(e.target.value)} rows={3} className="w-full bg-gray-700 border border-gray-600 rounded-md text-sm px-3 py-2 focus:ring-blue-500 focus:border-blue-500" />
            </div>
            
            <div>
              <label htmlFor="prerequisites" className="block text-sm font-medium text-gray-400 mb-1">Pré-requisitos (um por linha)</label>
              <textarea id="prerequisites" value={prerequisites} onChange={e => setPrerequisites(e.target.value)} rows={3} className="w-full bg-gray-700 border border-gray-600 rounded-md text-sm px-3 py-2 focus:ring-blue-500 focus:border-blue-500" />
            </div>

            <div>
              <label htmlFor="executionSteps" className="block text-sm font-medium text-gray-400 mb-1">Passos para Execução (um por linha)</label>
              <textarea id="executionSteps" value={executionSteps} onChange={e => setExecutionSteps(e.target.value)} rows={3} className="w-full bg-gray-700 border border-gray-600 rounded-md text-sm px-3 py-2 focus:ring-blue-500 focus:border-blue-500" />
            </div>
          </div>

          <div className="mt-6 flex justify-end space-x-3">
            <button onClick={onClose} className="px-4 py-2 rounded-md bg-gray-600 hover:bg-gray-500 text-white font-semibold transition-colors">Cancelar</button>
            <button onClick={handleSave} className="px-4 py-2 rounded-md bg-blue-600 hover:bg-blue-700 text-white font-semibold transition-colors">Salvar Evento</button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default EventForm;