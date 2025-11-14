import React, { useState, useMemo, FormEvent } from 'react';
import { PostItNote, TTSState } from '../types';

// Helper to get a consistent color class from a color name
const postItColors: Record<string, { bg: string, border: string }> = {
    yellow: { bg: 'bg-yellow-300/20', border: 'border-yellow-400' },
    blue: { bg: 'bg-blue-300/20', border: 'border-blue-400' },
    green: { bg: 'bg-green-300/20', border: 'border-green-400' },
    pink: { bg: 'bg-pink-300/20', border: 'border-pink-400' },
    purple: { bg: 'bg-purple-300/20', border: 'border-purple-400' },
};
const colorNames = Object.keys(postItColors);

// --- MODALS --- //
interface FormModalProps {
  noteToEdit?: PostItNote | null;
  onSave: (noteData: Omit<PostItNote, 'id' | 'tags' | 'createdAt'>) => void;
  onUpdate: (id: string, updates: Partial<PostItNote>) => void;
  onClose: () => void;
  onProcessText: (text: string, mode: 'correct' | 'transform') => Promise<string>;
}

const FormModal: React.FC<FormModalProps> = ({ noteToEdit, onSave, onUpdate, onClose, onProcessText }) => {
    const [content, setContent] = useState(noteToEdit?.content || '');
    const [color, setColor] = useState(noteToEdit?.color || 'yellow');
    const [isProcessing, setIsProcessing] = useState(false);

    const handleProcess = async (mode: 'correct' | 'transform') => {
        if (!content.trim()) return;
        setIsProcessing(true);
        try {
            const newContent = await onProcessText(content, mode);
            setContent(newContent);
        } finally {
            setIsProcessing(false);
        }
    };

    const handleSubmit = (e: FormEvent) => {
        e.preventDefault();
        if (!content.trim()) return;
        const noteData = { content, color };
        if (noteToEdit) {
            onUpdate(noteToEdit.id, noteData);
        } else {
            onSave(noteData);
        }
        onClose();
    };
    
    return (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 animate-fade-in" onClick={onClose}>
            <div className="bg-gray-800 rounded-2xl shadow-2xl w-full max-w-2xl m-4 border border-gray-700 flex flex-col" onClick={e => e.stopPropagation()}>
                <header className="p-5 border-b border-gray-700">
                    <h2 className="text-xl font-bold text-blue-300">{noteToEdit ? 'Editar Nota' : 'Nova Nota Rápida'}</h2>
                </header>
                <form onSubmit={handleSubmit} className="p-6 space-y-4">
                    <textarea 
                        value={content} 
                        onChange={e => setContent(e.target.value)} 
                        placeholder="Escreva ou cole algo aqui..."
                        rows={10} 
                        className="w-full bg-gray-700 border border-gray-600 rounded-md text-sm p-3 focus:ring-blue-500 focus:border-blue-500" 
                    />
                    <div className="flex justify-between items-center">
                        <div className="flex items-center space-x-2">
                            <span className="text-sm text-gray-400">Cor:</span>
                            {colorNames.map(cName => (
                                <button key={cName} type="button" onClick={() => setColor(cName)} className={`w-6 h-6 rounded-full ${postItColors[cName].bg} ${color === cName ? `ring-2 ring-white` : ''}`}></button>
                            ))}
                        </div>
                        <div className="flex items-center space-x-2">
                            <button type="button" onClick={() => handleProcess('correct')} disabled={isProcessing} className="px-3 py-1 text-xs bg-gray-600 hover:bg-gray-500 rounded-md disabled:opacity-50">
                                <i className="fas fa-check-double mr-1"></i> Corrigir
                            </button>
                             <button type="button" onClick={() => handleProcess('transform')} disabled={isProcessing} className="px-3 py-1 text-xs bg-blue-600 hover:bg-blue-500 rounded-md disabled:opacity-50">
                                <i className="fas fa-magic mr-1"></i> Transformar p/ IA
                            </button>
                        </div>
                    </div>
                </form>
                 <footer className="p-4 bg-gray-900/50 border-t border-gray-700 flex justify-end space-x-2">
                    <button type="button" onClick={onClose} className="px-4 py-2 text-sm rounded-md bg-gray-600 hover:bg-gray-500">Cancelar</button>
                    <button type="submit" onClick={handleSubmit} className="px-4 py-2 text-sm rounded-md bg-blue-600 hover:bg-blue-700 font-semibold">Salvar</button>
                </footer>
            </div>
        </div>
    );
};

interface DetailModalProps {
    note: PostItNote;
    onClose: () => void;
    onPlay: () => void;
    onStop: () => void;
    isPlaying: boolean;
}

const DetailModal: React.FC<DetailModalProps> = ({ note, onClose, onPlay, onStop, isPlaying }) => {
    const colorClass = postItColors[note.color] || postItColors.yellow;
    return (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 animate-fade-in" onClick={onClose}>
            <div className={`bg-gray-800 rounded-2xl shadow-2xl w-full max-w-3xl m-4 border ${colorClass.border} flex flex-col max-h-[80vh]`} onClick={e => e.stopPropagation()}>
                <header className={`p-4 ${colorClass.bg} rounded-t-2xl flex justify-between items-center`}>
                    <div className="flex flex-wrap gap-2">
                        {note.tags.map(tag => <span key={tag} className="px-2 py-0.5 text-xs bg-black/20 text-gray-200 rounded-full">{tag}</span>)}
                    </div>
                    <button onClick={onClose} className="text-gray-300 hover:text-white"><i className="fas fa-times"></i></button>
                </header>
                <div className="p-6 overflow-y-auto prose prose-invert max-w-none text-gray-200">
                    <p className="whitespace-pre-wrap">{note.content}</p>
                </div>
                <footer className="p-3 bg-gray-900/50 border-t border-gray-700 flex justify-end">
                    <button onClick={isPlaying ? onStop : onPlay} className="px-4 py-2 text-sm rounded-md bg-blue-600 hover:bg-blue-700 font-semibold">
                        <i className={`fas ${isPlaying ? 'fa-stop' : 'fa-play'} mr-2`}></i> {isPlaying ? 'Parar Leitura' : 'Ler em Voz Alta'}
                    </button>
                </footer>
            </div>
        </div>
    );
};

// --- MAIN PANEL --- //
interface PostItPanelProps {
  isOpen: boolean;
  onClose: () => void;
  notes: PostItNote[];
  onAddNote: (noteData: Omit<PostItNote, 'id' | 'tags' | 'createdAt'>) => void;
  onUpdateNote: (id: string, updates: Partial<PostItNote>) => void;
  onDeleteNote: (id: string) => void;
  onProcessText: (text: string, mode: 'correct' | 'transform') => Promise<string>;
  onPlayTTS: (id: string, text: string) => void;
  onStopTTS: () => void;
  ttsState: TTSState;
}

const PostItPanel: React.FC<PostItPanelProps> = ({ isOpen, onClose, notes, onAddNote, onUpdateNote, onDeleteNote, onProcessText, onPlayTTS, onStopTTS, ttsState }) => {
    const [searchTerm, setSearchTerm] = useState('');
    const [isFormOpen, setIsFormOpen] = useState(false);
    const [noteToEdit, setNoteToEdit] = useState<PostItNote | null>(null);
    const [noteToView, setNoteToView] = useState<PostItNote | null>(null);

    const handleOpenForm = (note?: PostItNote) => {
        setNoteToEdit(note || null);
        setIsFormOpen(true);
    };

    const sortedNotes = useMemo(() => {
        return [...notes].sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
    }, [notes]);

    const filteredNotes = useMemo(() => {
        if (!searchTerm.trim()) return sortedNotes;
        const lowerTerm = searchTerm.toLowerCase();
        return sortedNotes.filter(note =>
            note.content.toLowerCase().includes(lowerTerm) ||
            note.tags.some(tag => tag.toLowerCase().includes(lowerTerm))
        );
    }, [sortedNotes, searchTerm]);

    return (
        <>
        <div className={`slate-panel w-full max-w-4xl ${isOpen ? 'open' : ''} flex flex-col`}>
            <header className="p-4 flex justify-between items-center border-b border-gray-700/50">
                <h3 className="text-lg font-semibold text-gray-200 flex items-center"><i className="fas fa-sticky-note mr-3"></i> Notas Rápidas</h3>
                <button onClick={onClose} className="p-2 rounded-full hover:bg-gray-700"><i className="fas fa-times"></i></button>
            </header>

            <div className="p-4 border-b border-gray-700/50 flex space-x-2">
                <div className="relative flex-grow">
                    <i className="fas fa-search absolute left-3 top-1/2 -translate-y-1/2 text-gray-500"></i>
                    <input type="text" placeholder="Buscar notas..." value={searchTerm} onChange={e => setSearchTerm(e.target.value)} className="w-full bg-gray-900/80 border border-gray-600 rounded-md text-sm pl-9 pr-3 py-2"/>
                </div>
                <button onClick={() => handleOpenForm()} className="px-4 py-2 text-sm bg-blue-600 hover:bg-blue-700 font-semibold rounded-md flex items-center shrink-0">
                    <i className="fas fa-plus mr-2"></i> Nova Nota
                </button>
            </div>

            <div className="flex-1 overflow-y-auto p-4">
                {filteredNotes.length > 0 ? (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                        {filteredNotes.map(note => {
                            const colorClass = postItColors[note.color] || postItColors.yellow;
                            return (
                                <div key={note.id} onDoubleClick={() => setNoteToView(note)} className={`relative group p-4 rounded-lg border ${colorClass.border} ${colorClass.bg} flex flex-col h-56 cursor-pointer`}>
                                    <div className="flex-grow overflow-hidden mb-2">
                                        <p className="text-sm text-gray-200 whitespace-pre-wrap line-clamp-6">{note.content}</p>
                                    </div>
                                    <div className="flex flex-wrap gap-1 mt-auto">
                                        {note.tags.map(tag => <span key={tag} className="px-2 py-0.5 text-[10px] bg-black/20 text-gray-300 rounded-full">{tag}</span>)}
                                    </div>
                                    <div className="absolute top-2 right-2 flex space-x-1 opacity-0 group-hover:opacity-100 transition-opacity">
                                        <button onClick={(e) => { e.stopPropagation(); handleOpenForm(note) }} className="w-7 h-7 rounded-full bg-black/30 hover:bg-black/50" title="Editar"><i className="fas fa-pencil-alt text-xs"></i></button>
                                        <button onClick={(e) => { e.stopPropagation(); onPlayTTS(note.id, note.content) }} className="w-7 h-7 rounded-full bg-black/30 hover:bg-black/50" title="Ouvir"><i className="fas fa-play text-xs"></i></button>
                                        <button onClick={(e) => { e.stopPropagation(); navigator.clipboard.writeText(note.content) }} className="w-7 h-7 rounded-full bg-black/30 hover:bg-black/50" title="Copiar"><i className="fas fa-copy text-xs"></i></button>
                                        <button onClick={(e) => { e.stopPropagation(); onDeleteNote(note.id) }} className="w-7 h-7 rounded-full bg-black/30 hover:bg-black/50" title="Excluir"><i className="fas fa-trash-alt text-xs"></i></button>
                                    </div>
                                </div>
                            );
                        })}
                    </div>
                ) : (
                     <div className="text-center py-16 px-6">
                        <i className="fas fa-folder-open text-4xl text-gray-500 mb-4"></i>
                        <h3 className="text-lg font-semibold text-gray-400">Nenhuma nota encontrada</h3>
                        <p className="text-gray-500 mt-1 text-sm">Crie sua primeira nota para começar.</p>
                    </div>
                )}
            </div>
        </div>
        {isFormOpen && <FormModal noteToEdit={noteToEdit} onSave={onAddNote} onUpdate={onUpdateNote} onClose={() => setIsFormOpen(false)} onProcessText={onProcessText} />}
        {noteToView && <DetailModal 
            note={noteToView} 
            onClose={() => setNoteToView(null)}
            onPlay={() => onPlayTTS(noteToView.id, noteToView.content)}
            onStop={onStopTTS}
            isPlaying={ttsState.playingId === noteToView.id && !ttsState.isPaused}
        />}
        </>
    );
};

export default PostItPanel;