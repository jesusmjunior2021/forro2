import React from 'react';
import { ConnectionState } from '../types';

interface StatusIndicatorProps {
  state: ConnectionState;
}

const StatusIndicator: React.FC<StatusIndicatorProps> = ({ state }) => {
  const statusConfig = {
    [ConnectionState.LOADING_FILE]: { color: 'yellow', text: 'Carregando Arquivo...' },
    [ConnectionState.IDLE]: { color: 'gray', text: 'Ocioso' },
    [ConnectionState.CONNECTING]: { color: 'yellow', text: 'Conectando...' },
    [ConnectionState.THINKING]: { color: 'purple', text: 'Analisando...' },
    [ConnectionState.SPEAKING]: { color: 'blue', text: 'Falando...' },
    [ConnectionState.CONNECTED]: { color: 'green', text: 'Conectado' },
    [ConnectionState.PAUSED]: { color: 'yellow', text: 'Pausado' },
    [ConnectionState.SAVING]: { color: 'yellow', text: 'Salvando...' },
    [ConnectionState.DISCONNECTED]: { color: 'gray', text: 'Desconectado' },
    [ConnectionState.ERROR]: { color: 'red', text: 'Erro' },
    [ConnectionState.SILENT]: { color: 'purple', text: 'Modo Chat' },
  };
  
  const config = statusConfig[state] || { color: 'gray', text: state };
  const { color, text } = config;

  const colorClasses = {
      gray: 'bg-gray-500',
      yellow: 'bg-yellow-500',
      green: 'bg-green-500',
      red: 'bg-red-500',
      purple: 'bg-purple-500',
      blue: 'bg-blue-500',
  };
  
  const shouldAnimate = [
    ConnectionState.CONNECTING, 
    ConnectionState.CONNECTED,
    ConnectionState.LOADING_FILE,
    ConnectionState.SAVING,
    ConnectionState.THINKING,
    ConnectionState.SPEAKING,
  ].includes(state);

  return (
    <div className="flex items-center space-x-2">
      <span className={`w-3 h-3 rounded-full ${colorClasses[color]} ${shouldAnimate ? 'animate-pulse' : ''}`}></span>
      <span className="text-sm font-medium text-gray-300">{text}</span>
    </div>
  );
};

export default StatusIndicator;