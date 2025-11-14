import React, { useRef, useEffect } from 'react';
import { ConnectionState, Transcription } from '../types';
import MarkdownRenderer from './MarkdownRenderer';
import StatusIndicator from './StatusIndicator';

interface LiveAuraProps {
  connectionState: ConnectionState;
}

const LiveAura: React.FC<LiveAuraProps> = ({ connectionState }) => {
    return (
        <div className="relative w-64 h-64 flex items-center justify-center">
            {/* Rings for thinking animation */}
            <div className={`absolute w-full h-full rounded-full border-2 border-dashed border-blue-500/50 opacity-0 state-thinking:opacity-100 outer-ring`}></div>
            <div className={`absolute w-3/4 h-3/4 rounded-full border-2 border-dashed border-cyan-500/50 opacity-0 state-thinking:opacity-100 inner-ring`}></div>

            {/* Main Orb */}
            <div className={`relative w-48 h-48 bg-gray-900 rounded-full flex items-center justify-center transition-all duration-500 live-aura-orb`}>
                <div className="absolute inset-0 bg-gradient-to-br from-blue-500/20 to-transparent rounded-full"></div>
                <i className={`fas fa-brain text-5xl text-blue-300 transition-all duration-300`}></i>
            </div>
        </div>
    );
};


interface LiveConversationViewProps {
  connectionState: ConnectionState;
  liveTranscript: { user: string; assistant: string };
  transcriptionHistory: Transcription[];
}

const LiveConversationView: React.FC<LiveConversationViewProps> = ({ connectionState, liveTranscript, transcriptionHistory }) => {
    const scrollRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        if (scrollRef.current) {
            scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
        }
    }, [transcriptionHistory, liveTranscript]);

    const containerClass = `relative flex-1 flex items-start justify-center state-${connectionState.toLowerCase()}`;

    const renderTranscriptionBubble = (t: Transcription) => {
        return (
             <div key={t.id} className={`flex items-end gap-3 ${t.speaker === 'user' ? 'justify-end' : 'justify-start'} animate-slide-in-up`}>
                {t.speaker !== 'user' && <i className={`fas ${t.speaker === 'assistant' ? 'fa-brain' : 'fa-info-circle'} text-xl text-blue-400 mb-2`}></i>}
                <div className={`transcription-bubble ${t.speaker}`}>
                   <div className="flex justify-between items-center mb-1">
                     <span className="font-bold text-sm">
                         {t.speaker === 'user' ? 'Você' : 'Assistente'}
                     </span>
                     <span className="text-xs text-gray-400/80 ml-3">
                        {new Date(t.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                     </span>
                   </div>
                   <MarkdownRenderer content={t.text} searchTerm="" />
                </div>
                {t.speaker === 'user' && <i className="fas fa-user-circle text-xl text-gray-400 mb-2"></i>}
            </div>
        );
    };
    
    return (
        <div className="flex h-full w-full">
            <div className="w-1/3 flex flex-col items-center justify-center bg-gray-900/50 p-4">
                 <div className={containerClass}>
                    <LiveAura connectionState={connectionState} />
                </div>
                <StatusIndicator state={connectionState} />
            </div>
            <div className="w-2/3 border-l border-gray-700/50 flex flex-col bg-gray-800/30">
                <header className="p-3 border-b border-gray-700/50">
                    <h3 className="font-semibold text-gray-200 flex items-center">
                        <i className="fas fa-stream mr-3"></i>Transcrição da Conversa
                    </h3>
                </header>
                 <div ref={scrollRef} className="flex-1 overflow-y-auto p-4 md:p-6 space-y-6">
                    {transcriptionHistory.map(renderTranscriptionBubble)}
                    
                    {liveTranscript.user && (
                         <div className="flex items-end gap-3 justify-end animate-pulse">
                            <div className="transcription-bubble user">
                               <MarkdownRenderer content={liveTranscript.user} searchTerm="" />
                            </div>
                            <i className="fas fa-user-circle text-xl text-gray-400 mb-2"></i>
                        </div>
                    )}
                    {liveTranscript.assistant && (
                        <div className="flex items-end gap-3 justify-start animate-pulse">
                             <i className="fas fa-brain text-xl text-blue-400 mb-2"></i>
                            <div className="transcription-bubble assistant">
                               <MarkdownRenderer content={liveTranscript.assistant} searchTerm="" />
                            </div>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};

export default LiveConversationView;