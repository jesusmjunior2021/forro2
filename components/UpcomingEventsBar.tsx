import React, { useState, useMemo } from 'react';
import { CalendarEvent } from '../types';

interface EventCardProps {
  event: CalendarEvent;
}

const EventCard: React.FC<EventCardProps> = ({ event }) => {
  const [isExpanded, setIsExpanded] = useState(false);
  const eventDate = new Date(`${event.date}T${event.time}`);
  const isToday = new Date().toDateString() === eventDate.toDateString();

  return (
    <div className="bg-gray-800/60 border border-gray-700/70 rounded-lg shadow-lg overflow-hidden transition-all duration-300">
      <button
        onClick={() => setIsExpanded(!isExpanded)}
        className="w-full text-left p-3 flex items-center justify-between"
      >
        <div className="flex items-center min-w-0">
          <div className="flex flex-col items-center justify-center w-12 h-12 bg-blue-900/50 rounded-md mr-3 flex-shrink-0">
            <span className="text-xs text-blue-300 uppercase font-semibold">{eventDate.toLocaleString('pt-BR', { month: 'short' })}</span>
            <span className="text-lg font-bold text-white">{eventDate.getDate()}</span>
          </div>
          <div className="flex-grow min-w-0">
            <p className={`font-bold text-gray-100 truncate ${isToday ? 'text-yellow-400' : ''}`} title={event.title}>
              {isToday && <i className="fas fa-star text-xs mr-1"></i>}
              {event.title}
            </p>
            <p className="text-xs text-gray-400">
              <i className="far fa-clock mr-1.5"></i>{event.time} - {eventDate.toLocaleString('pt-BR', { weekday: 'long' })}
            </p>
          </div>
        </div>
        <i className={`fas fa-chevron-down text-gray-500 transition-transform duration-300 ${isExpanded ? 'rotate-180' : ''}`}></i>
      </button>

      {isExpanded && (
        <div className="px-4 pb-4 pt-2 border-t border-gray-700/50 animate-fade-in">
          <p className="text-sm text-gray-300 whitespace-pre-wrap">{event.description || 'Nenhuma descrição fornecida.'}</p>
        </div>
      )}
    </div>
  );
};

interface UpcomingEventsBarProps {
  events: CalendarEvent[];
}

const UpcomingEventsBar: React.FC<UpcomingEventsBarProps> = ({ events }) => {

  const upcomingEvents = useMemo(() => {
    const today = new Date();
    today.setHours(0, 0, 0, 0); // Start of today
    const sevenDaysFromNow = new Date(today);
    sevenDaysFromNow.setDate(today.getDate() + 7);

    return events
      .filter(event => {
        try {
            const eventDate = new Date(event.date + 'T00:00:00');
            return event.status === 'pending' && eventDate >= today && eventDate < sevenDaysFromNow;
        } catch(e) { return false; }
      })
      .sort((a, b) => new Date(a.date + 'T' + a.time).getTime() - new Date(b.date + 'T' + b.time).getTime());
  }, [events]);

  return (
    <div className="flex-1 overflow-y-auto p-4 md:p-6 animate-fade-in">
        <div className="max-w-4xl mx-auto">
            <h1 className="text-3xl font-bold text-white mb-2">Próximos Compromissos</h1>
            <p className="text-gray-400 mb-6">Seus eventos para os próximos 7 dias. Clique em um evento para ver os detalhes.</p>
            
            {upcomingEvents.length > 0 ? (
                <div className="space-y-3">
                    {upcomingEvents.map(event => <EventCard key={event.id} event={event} />)}
                </div>
            ) : (
                <div className="text-center text-gray-500 pt-16">
                    <i className="fas fa-calendar-check text-5xl mb-4"></i>
                    <h2 className="text-xl font-semibold">Tudo em dia!</h2>
                    <p className="mt-1">Você não tem compromissos para a próxima semana.</p>
                </div>
            )}
        </div>
    </div>
  );
};

export default UpcomingEventsBar;