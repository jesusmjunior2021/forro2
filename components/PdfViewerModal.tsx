import React, { useState, useEffect, useRef, useCallback } from 'react';

declare const pdfjsLib: any;

interface PdfViewerModalProps {
  pdfUrl: string | null;
  onClose: () => void;
}

const PdfViewerModal: React.FC<PdfViewerModalProps> = ({ pdfUrl, onClose }) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [pdfDoc, setPdfDoc] = useState<any | null>(null);
  const [pageNum, setPageNum] = useState(1);
  const [numPages, setNumPages] = useState(0);
  const [scale, setScale] = useState(1.5);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const renderPage = useCallback(async (num: number) => {
    if (!pdfDoc) return;
    try {
      const page = await pdfDoc.getPage(num);
      const viewport = page.getViewport({ scale });
      const canvas = canvasRef.current;
      if (canvas) {
        canvas.height = viewport.height;
        canvas.width = viewport.width;
        const renderContext = {
          canvasContext: canvas.getContext('2d'),
          viewport,
        };
        await page.render(renderContext).promise;
      }
    } catch (e) {
        console.error("Erro ao renderizar página:", e);
        setError("Não foi possível renderizar a página do PDF.");
    }
  }, [pdfDoc, scale]);

  useEffect(() => {
    const loadPdf = async () => {
      if (!pdfUrl) return;
      setIsLoading(true);
      setError(null);
      setPageNum(1);
      try {
        const loadingTask = pdfjsLib.getDocument(pdfUrl);
        const pdf = await loadingTask.promise;
        setPdfDoc(pdf);
        setNumPages(pdf.numPages);
      } catch (e) {
        console.error('Erro ao carregar PDF:', e);
        setError('Não foi possível carregar o documento PDF. O link pode estar quebrado ou o CORS bloqueado.');
      } finally {
        setIsLoading(false);
      }
    };
    loadPdf();
  }, [pdfUrl]);

  useEffect(() => {
    if (pdfDoc) {
      renderPage(pageNum);
    }
  }, [pdfDoc, pageNum, renderPage]);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
      if (e.key === 'ArrowLeft' && pageNum > 1) setPageNum(p => p - 1);
      if (e.key === 'ArrowRight' && pageNum < numPages) setPageNum(p => p + 1);
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [onClose, pageNum, numPages]);

  if (!pdfUrl) return null;

  return (
    <div className="media-modal-backdrop animate-fade-in" onClick={onClose}>
      <div className="media-modal-content" onClick={(e) => e.stopPropagation()}>
        <div className="pdf-viewer-toolbar">
          <button onClick={onClose} className="toolbar-btn" title="Fechar"><i className="fas fa-times"></i></button>
          <div className="toolbar-separator"></div>
          <button onClick={() => setPageNum(p => Math.max(1, p - 1))} disabled={pageNum <= 1} className="toolbar-btn" title="Página Anterior"><i className="fas fa-arrow-left"></i></button>
          <span className="text-sm text-gray-300 font-semibold">{`Página ${pageNum} de ${numPages || '...'}`}</span>
          <button onClick={() => setPageNum(p => Math.min(numPages, p + 1))} disabled={pageNum >= numPages} className="toolbar-btn" title="Próxima Página"><i className="fas fa-arrow-right"></i></button>
          <div className="toolbar-separator"></div>
          <button onClick={() => setScale(s => s - 0.2)} className="toolbar-btn" title="Diminuir Zoom"><i className="fas fa-search-minus"></i></button>
          <button onClick={() => setScale(s => s + 0.2)} className="toolbar-btn" title="Aumentar Zoom"><i className="fas fa-search-plus"></i></button>
        </div>
        <div className="flex-1 overflow-auto bg-gray-700 flex items-start justify-center p-4">
          {isLoading && <i className="fas fa-spinner fa-spin text-4xl text-white"></i>}
          {error && <div className="text-center text-white bg-red-800 p-4 rounded-lg"><p>{error}</p></div>}
          <canvas ref={canvasRef} className={`${isLoading || error ? 'hidden' : ''}`}></canvas>
        </div>
      </div>
    </div>
  );
};

export default PdfViewerModal;