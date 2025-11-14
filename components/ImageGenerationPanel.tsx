import React, { useState, useRef } from 'react';
import { ImageGenerationState, ImageGeneration } from '../types';

interface ImageGenerationPanelProps {
  isOpen: boolean;
  onClose: () => void;
  state: ImageGenerationState;
  onGenerateImage: (prompt: string, aspectRatio: string) => void;
  onEditImage: (prompt: string) => void;
  onSetMode: (mode: 'generate' | 'edit') => void;
  onSelectImageToEdit: (image: ImageGeneration | null) => void;
}

const ImageGenerationPanel: React.FC<ImageGenerationPanelProps> = ({ 
  isOpen, 
  onClose, 
  state, 
  onGenerateImage,
  onEditImage,
  onSetMode,
  onSelectImageToEdit,
}) => {
  const [prompt, setPrompt] = useState('');
  const [aspectRatio, setAspectRatio] = useState('1:1');
  const fileInputRef = useRef<HTMLInputElement>(null);
  const { isLoading, error, generations, mode, imageToEdit } = state;

  const latestGeneration = generations[0];

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (prompt.trim() && !isLoading) {
      if (mode === 'generate') {
        onGenerateImage(prompt, aspectRatio);
      } else {
        onEditImage(prompt);
      }
      setPrompt('');
    }
  };

  const handleUsePrompt = (p: string, ar: string) => {
    onSetMode('generate');
    onSelectImageToEdit(null);
    setPrompt(p);
    setAspectRatio(ar);
  };
  
  const handleDownload = (imageUrl: string) => {
    const link = document.createElement('a');
    link.href = imageUrl;
    link.download = `generated_image_${Date.now()}.webp`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const handleSelectToEdit = (image: ImageGeneration) => {
    onSelectImageToEdit(image);
    setPrompt('');
  }

  const handleCancelEdit = () => {
    onSelectImageToEdit(null);
  }

  const handleUploadForEdit = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        const img = new Image();
        img.onload = () => {
            const tempImage: ImageGeneration = {
                id: `local-${Date.now()}`,
                imageUrl: reader.result as string,
                prompt: file.name,
                aspectRatio: `${img.width}:${img.height}`,
                createdAt: new Date().toISOString(),
            };
            onSelectImageToEdit(tempImage);
        }
        img.src = reader.result as string;
      };
      reader.readAsDataURL(file);
    }
  };

  const ResultDisplay = () => {
    const imageToShow = mode === 'edit' && imageToEdit ? imageToEdit.imageUrl : latestGeneration?.imageUrl;
    const promptToShow = mode === 'edit' && imageToEdit ? imageToEdit.prompt : latestGeneration?.prompt;

    if (isLoading) {
        return <div className={`w-full bg-gray-900/50 rounded-lg animate-pulse ${aspectRatio === '16:9' ? 'aspect-video' : aspectRatio === '9:16' ? 'aspect-[9/16]' : 'aspect-square'}`}></div>;
    }
    if (error && !imageToEdit) { // Only show general errors if not in an edit session
        return <div className="p-4 text-center text-red-400 bg-red-900/30 rounded-lg">{error}</div>;
    }
    if (imageToShow) {
        return (
            <div className="relative group">
                <img src={imageToShow} alt={promptToShow} className="w-full rounded-lg border border-gray-700" />
                <div className="absolute top-2 right-2 flex space-x-2 opacity-0 group-hover:opacity-100 transition-opacity">
                    <button onClick={() => handleDownload(imageToShow)} className="w-8 h-8 rounded-full bg-black/50 hover:bg-black/80 text-white" title="Baixar Imagem">
                        <i className="fas fa-download"></i>
                    </button>
                </div>
            </div>
        );
    }
    return (
        <div className={`w-full bg-gray-900/50 rounded-lg flex items-center justify-center text-gray-500 border-2 border-dashed border-gray-700 ${aspectRatio === '16:9' ? 'aspect-video' : aspectRatio === '9:16' ? 'aspect-[9/16]' : 'aspect-square'}`}>
            <i className="fas fa-image text-4xl"></i>
        </div>
    );
  };

  const Tabs = () => (
    <div className="flex border-b border-gray-700 mb-4">
        <button onClick={() => onSetMode('generate')} className={`px-4 py-2 text-sm font-semibold ${mode === 'generate' ? 'text-blue-400 border-b-2 border-blue-400' : 'text-gray-500 hover:text-gray-300'}`}>
            Gerar
        </button>
        <button onClick={() => onSetMode('edit')} className={`px-4 py-2 text-sm font-semibold ${mode === 'edit' ? 'text-blue-400 border-b-2 border-blue-400' : 'text-gray-500 hover:text-gray-300'}`}>
            Editar
        </button>
    </div>
  );

  return (
    <div className={`slate-panel w-full max-w-4xl ${isOpen ? 'open' : ''} flex flex-col`}>
      <header className="p-4 flex justify-between items-center border-b border-gray-700/50 shrink-0">
        <h3 className="text-lg font-semibold text-gray-200 flex items-center">
          <i className="fas fa-image mr-3 text-blue-400"></i>
          Estúdio Criativo de Imagem
        </h3>
        <button onClick={onClose} className="p-2 rounded-full hover:bg-gray-700 transition-colors">
          <i className="fas fa-times"></i>
        </button>
      </header>
      
      <div className="flex-1 flex flex-col md:flex-row overflow-hidden">
        {/* Main generation area */}
        <div className="w-full md:w-1/2 p-4 flex flex-col border-b md:border-r md:border-b-0 border-gray-700/50">
          <Tabs />
          {mode === 'generate' ? (
            <form onSubmit={handleSubmit} className="space-y-3">
              <textarea placeholder="Descreva a imagem que você quer criar..." rows={4} value={prompt} onChange={e => setPrompt(e.target.value)} className="w-full bg-gray-900 border border-gray-600 rounded-md text-sm p-3 focus:ring-blue-500"/>
              <div className="flex items-center space-x-2">
                  <label className="text-sm font-medium text-gray-400">Proporção:</label>
                  <select value={aspectRatio} onChange={e => setAspectRatio(e.target.value)} className="bg-gray-700 border border-gray-600 rounded-md text-sm px-2 py-1">
                      <option value="1:1">Quadrado</option> <option value="16:9">Paisagem</option> <option value="9:16">Retrato</option>
                  </select>
              </div>
              <button type="submit" disabled={isLoading || !prompt.trim()} className="w-full bg-blue-600 hover:bg-blue-700 font-bold py-2.5 rounded-lg disabled:bg-gray-500">
                {isLoading ? <><i className="fas fa-spinner fa-spin mr-2"></i>Gerando...</> : 'Gerar Imagem'}
              </button>
            </form>
          ) : (
            <>
                {!imageToEdit ? (
                    <div>
                        <p className="text-sm text-center text-gray-400 mb-2">Selecione uma imagem do histórico ou envie uma nova para editar.</p>
                         <input type="file" ref={fileInputRef} onChange={handleUploadForEdit} accept="image/*" className="hidden" />
                        <button onClick={() => fileInputRef.current?.click()} className="w-full py-2.5 border-2 border-dashed border-gray-600 rounded-lg text-gray-400 hover:bg-gray-700/50 hover:border-gray-500">
                            <i className="fas fa-upload mr-2"></i> Enviar Imagem
                        </button>
                    </div>
                ) : (
                    <form onSubmit={handleSubmit} className="space-y-3">
                        <div className="flex justify-between items-center">
                            <p className="text-sm font-semibold text-gray-300">Editando imagem:</p>
                            <button type="button" onClick={handleCancelEdit} className="text-xs text-red-400 hover:underline">Cancelar Edição</button>
                        </div>
                        <textarea placeholder="Instruções para edição (ex: adicione óculos de sol)..." rows={4} value={prompt} onChange={e => setPrompt(e.target.value)} className="w-full bg-gray-900 border border-gray-600 rounded-md text-sm p-3 focus:ring-blue-500"/>
                        <button type="submit" disabled={isLoading || !prompt.trim()} className="w-full bg-purple-600 hover:bg-purple-700 font-bold py-2.5 rounded-lg disabled:bg-gray-500">
                           {isLoading ? <><i className="fas fa-spinner fa-spin mr-2"></i>Editando...</> : 'Editar Imagem'}
                        </button>
                    </form>
                )}
            </>
          )}

          <div className="mt-4 flex-1 flex flex-col items-center justify-center">
              <ResultDisplay />
              {error && imageToEdit && <div className="mt-2 p-2 text-center text-sm text-red-400 bg-red-900/30 rounded-lg">{error}</div>}
          </div>
        </div>

        {/* History area */}
        <div className="w-full md:w-1/2 p-4 flex flex-col">
           <h4 className="font-bold text-gray-300 mb-3 shrink-0">Histórico</h4>
            {generations.length === 0 ? (
                <div className="flex-1 flex flex-col items-center justify-center text-gray-500">
                    <i className="fas fa-history text-3xl mb-3"></i><p>Suas imagens geradas aparecerão aqui.</p>
                </div>
            ) : (
                <div className="flex-1 overflow-y-auto pr-2 scrollbar-thin scrollbar-thumb-gray-600 scrollbar-track-gray-800">
                    <div className="grid grid-cols-2 lg:grid-cols-3 gap-3">
                        {generations.map(gen => (
                            <div key={gen.id} className="relative group aspect-square bg-gray-900 rounded-md overflow-hidden">
                                <img src={gen.imageUrl} alt={gen.prompt} className="w-full h-full object-cover"/>
                                <div className="absolute inset-0 bg-black/70 opacity-0 group-hover:opacity-100 transition-opacity p-2 flex flex-col justify-end text-white">
                                    <p className="text-[10px] line-clamp-3">{gen.prompt}</p>
                                    <div className="flex space-x-1 mt-1">
                                        <button onClick={() => handleUsePrompt(gen.prompt, gen.aspectRatio)} className="w-6 h-6 rounded-full bg-white/20 hover:bg-white/40" title="Reutilizar Prompt"><i className="fas fa-redo-alt text-xs"></i></button>
                                        <button onClick={() => handleSelectToEdit(gen)} className="w-6 h-6 rounded-full bg-white/20 hover:bg-white/40" title="Editar"><i className="fas fa-pencil-alt text-xs"></i></button>
                                        <button onClick={() => handleDownload(gen.imageUrl)} className="w-6 h-6 rounded-full bg-white/20 hover:bg-white/40" title="Baixar"><i className="fas fa-download text-xs"></i></button>
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            )}
        </div>
      </div>
    </div>
  );
};

export default ImageGenerationPanel;