import React, { useState } from 'react';
import { CalendarEvent } from '../types';
import EventCard from './EventCard';
import EventForm from './EventForm';

interface CalendarPanelProps {
  events: CalendarEvent[];
  isOpen: boolean;
  onClose: () => void;
  onScheduleEvent: (eventData: Omit<CalendarEvent, 'id' | 'status'>) => void;
  onEditEvent: (eventId: string, updates: Partial<Omit<CalendarEvent, 'id'>>) => void;
  onDeleteEvent: (eventId: string) => void;
  onUpdateEventStatus: (eventId: string, status: 'pending' | 'completed') => void;
}

const CalendarPanel: React.FC<CalendarPanelProps> = ({ events, isOpen, onClose, onScheduleEvent, onEditEvent, onDeleteEvent, onUpdateEventStatus }) => {
  const [currentDate, setCurrentDate] = useState(new Date());
  const [selectedEvent, setSelectedEvent] = useState<CalendarEvent | null>(null);
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [eventToEdit, setEventToEdit] = useState<CalendarEvent | null>(null);
  const [formInitialDate, setFormInitialDate] = useState('');


  const daysOfWeek = ['Dom', 'Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sáb'];

  const changeMonth = (amount: number) => {
    setCurrentDate(prev => {
      const newDate = new Date(prev);
      newDate.setDate(1); // Avoid issues with different month lengths
      newDate.setMonth(newDate.getMonth() + amount);
      return newDate;
    });
  };

  const handleAddEventClick = (date: string) => {
      setEventToEdit(null);
      setFormInitialDate(date);
      setIsFormOpen(true);
  };

  const handleEditEventClick = (event: CalendarEvent) => {
    setSelectedEvent(null);
    setEventToEdit(event);
    setIsFormOpen(true);
  };
  
  const handleSaveEvent = (eventData: Omit<CalendarEvent, 'id' | 'status'>, eventId?: string) => {
      if (eventId) {
        onEditEvent(eventId, eventData);
      } else {
        onScheduleEvent(eventData);
      }
      setIsFormOpen(false);
      setEventToEdit(null);
  };

  const handleToggleStatus = (eventId: string, currentStatus: 'pending' | 'completed') => {
    const newStatus = currentStatus === 'pending' ? 'completed' : 'pending';
    onUpdateEventStatus(eventId, newStatus);
    // Also update the selected event if it's being viewed
    if(selectedEvent?.id === eventId) {
        setSelectedEvent(prev => prev ? {...prev, status: newStatus} : prev);
    }
  };

  const renderHeader = () => (
    <div className="flex justify-between items-center mb-4">
      <button onClick={() => changeMonth(-1)} className="p-2 rounded-full hover:bg-gray-700 transition-colors w-10 h-10 flex items-center justify-center"><i className="fas fa-chevron-left"></i></button>
      <h2 className="text-xl font-bold capitalize">{currentDate.toLocaleString('pt-BR', { month: 'long', year: 'numeric' })}</h2>
      <button onClick={() => changeMonth(1)} className="p-2 rounded-full hover:bg-gray-700 transition-colors w-10 h-10 flex items-center justify-center"><i className="fas fa-chevron-right"></i></button>
    </div>
  );
  
  const renderDays = () => (
    <div className="grid grid-cols-7 gap-1 text-center text-xs font-semibold text-gray-400">
      {daysOfWeek.map(day => <div key={day} className="py-2">{day}</div>)}
    </div>
  );

  const renderCells = () => {
    const monthStart = new Date(currentDate.getFullYear(), currentDate.getMonth(), 1);
    const monthEnd = new Date(currentDate.getFullYear(), currentDate.getMonth() + 1, 0);
    const startDate = new Date(monthStart);
    startDate.setDate(startDate.getDate() - monthStart.getDay());
    
    const cells = [];
    let day = startDate;

    for (let i = 0; i < 42; i++) {
      const formattedDate = day.toISOString().split('T')[0];
      const eventsForDay = events.filter(e => e.date === formattedDate);
      const isToday = new Date().toISOString().split('T')[0] === formattedDate;
      const isCurrentMonth = day.getMonth() === currentDate.getMonth();

      cells.push(
        <div 
          key={day.toString()} 
          onClick={() => isCurrentMonth && handleAddEventClick(formattedDate)}
          className={`p-1.5 border border-gray-700/50 rounded-md min-h-[100px] flex flex-col transition-colors duration-200 ${isCurrentMonth ? 'bg-gray-900/50 hover:bg-gray-800 cursor-pointer' : 'bg-gray-900/20 text-gray-600'}`}
        >
          <div className={`text-xs font-bold self-start mb-1 ${isToday ? 'bg-blue-600 text-white rounded-full w-6 h-6 flex items-center justify-center' : ''}`}>{day.getDate()}</div>
          <div className="flex-1 overflow-y-auto space-y-1 scrollbar-thin scrollbar-thumb-gray-600 scrollbar-track-gray-800">
            {eventsForDay.map(event => (
              <button 
                key={event.id} 
                onClick={(e) => { e.stopPropagation(); setSelectedEvent(event); }}
                className={`w-full text-left text-[10px] p-1 rounded truncate transition-colors ${
                  event.status === 'completed' 
                  ? 'bg-green-900/70 text-gray-400 line-through hover:bg-green-800/70' 
                  : 'bg-blue-800/80 hover:bg-blue-700 text-white'
                }`}
                title={event.title}
              >
                <span className="font-semibold">{event.time}</span> {event.title}
              </button>
            ))}
          </div>
        </div>
      );
      day.setDate(day.getDate() + 1);
    }
    return <div className="grid grid-cols-7 grid-rows-6 gap-1 flex-1">{cells}</div>;
  };

  return (
    <>
      <div className={`slate-panel w-full max-w-4xl ${isOpen ? 'open' : ''} flex flex-col`}>
         <header className="p-4 flex justify-between items-center border-b border-gray-700/50 shrink-0">
            <h3 className="text-lg font-semibold text-gray-200 flex items-center">
                <i className="fas fa-calendar-alt mr-3"></i>
                Calendário de Compromissos
            </h3>
            <button onClick={onClose} className="p-2 rounded-full hover:bg-gray-700 transition-colors">
                <i className="fas fa-times"></i>
            </button>
        </header>
        <div className="flex-1 flex flex-col overflow-auto rounded-lg bg-gray-800 p-4 shadow-2xl">
            {renderHeader()}
            {renderDays()}
            {renderCells()}
        </div>
      </div>
      {selectedEvent && <EventCard event={selectedEvent} onClose={() => setSelectedEvent(null)} onEdit={handleEditEventClick} onDelete={onDeleteEvent} onToggleStatus={handleToggleStatus} />}
      {isFormOpen && <EventForm onSave={handleSaveEvent} onClose={() => { setIsFormOpen(false); setEventToEdit(null); }} initialDate={formInitialDate} eventToEdit={eventToEdit} />}
    </>
  );
};

export default CalendarPanel;