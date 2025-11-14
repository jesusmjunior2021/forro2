import React, { useEffect, useRef } from 'react';
import { MapState } from '../types';

declare const L: any; // Usa o L global do script CDN

interface MapModalProps {
  mapState: MapState;
  onClose: () => void;
  onClearMap: () => void;
  onAddMarkerManually: (position: [number, number], popupText: string) => void;
}

const MapModal: React.FC<MapModalProps> = ({ mapState, onClose, onClearMap, onAddMarkerManually }) => {
  const mapContainerRef = useRef<HTMLDivElement>(null);
  const mapInstance = useRef<any>(null); // Para manter a instância de L.map
  const markersLayer = useRef<any>(null); // Para manter o L.layerGroup para marcadores
  const routesLayer = useRef<any>(null);  // Para manter o L.layerGroup para rotas

  // Inicializa o mapa
  useEffect(() => {
    if (mapContainerRef.current && !mapInstance.current && mapState.isOpen) {
      const map = L.map(mapContainerRef.current).setView(mapState.center, mapState.zoom);
      L.tileLayer('https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png', {
        attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors &copy; <a href="https://carto.com/attributions">CARTO</a>'
      }).addTo(map);

      map.on('click', (e: any) => {
          const popupText = prompt("Digite o texto para este marcador:");
          if (popupText) {
              const { lat, lng } = e.latlng;
              onAddMarkerManually([lat, lng], popupText);
          }
      });

      mapInstance.current = map;
      markersLayer.current = L.layerGroup().addTo(map);
      routesLayer.current = L.layerGroup().addTo(map);
    }
  }, [mapState.isOpen, onAddMarkerManually]); // Executa apenas ao abrir

  // Atualiza a visualização quando o centro/zoom muda
  useEffect(() => {
    if (mapInstance.current && mapState.isOpen) {
      mapInstance.current.setView(mapState.center, mapState.zoom);
    }
  }, [mapState.center, mapState.zoom]);

  // Atualiza marcadores
  useEffect(() => {
    if (markersLayer.current && mapState.isOpen) {
      markersLayer.current.clearLayers();
      mapState.markers.forEach(markerInfo => {
        L.marker(markerInfo.position).bindPopup(markerInfo.popupText).addTo(markersLayer.current);
      });
    }
  }, [mapState.markers]);

  // Atualiza rotas e ajusta a visualização para caber
  useEffect(() => {
    if (routesLayer.current && mapInstance.current && mapState.isOpen) {
      routesLayer.current.clearLayers();
      const allBounds: any[] = [];
      
      mapState.routes.forEach(routeInfo => {
        const polyline = L.polyline(routeInfo.points, { color: routeInfo.color || 'blue' }).addTo(routesLayer.current);
        if (routeInfo.label) {
            polyline.bindPopup(routeInfo.label);
        }
        allBounds.push(polyline.getBounds());
      });
      
      if (allBounds.length > 0) {
        // Cria um grupo de limites a partir de todos os limites de rota
        const bounds = allBounds.reduce((acc, b) => acc.extend(b));
        if (bounds.isValid()) {
            // Ajusta o mapa para mostrar todos os limites com um pouco de preenchimento
            mapInstance.current.fitBounds(bounds, { padding: [50, 50] });
        }
      }
    }
  }, [mapState.routes]);

  if (!mapState.isOpen) return null;

  return (
    <div className="fixed inset-0 bg-gray-900/80 backdrop-blur-sm flex flex-col z-40 animate-fade-in">
      <header className="p-3 bg-gray-800/80 backdrop-blur-sm border-b border-gray-700/50 flex justify-between items-center shrink-0">
        <h2 className="text-lg font-bold text-gray-200 flex items-center">
          <i className="fas fa-map-marked-alt mr-3 text-blue-400"></i>
          Mapa Interativo
        </h2>
        <div className="flex items-center space-x-2">
            <button
                onClick={onClearMap}
                className="px-3 py-2 text-sm bg-red-800/80 hover:bg-red-700 text-red-100 rounded-md transition-colors flex items-center justify-center"
                title="Limpar marcadores e rotas do mapa"
            >
                <i className="fas fa-trash-alt mr-2"></i>
                Limpar Mapa
            </button>
            <button 
                onClick={onClose} 
                className="w-10 h-10 rounded-full hover:bg-gray-700 transition-colors flex items-center justify-center" 
                title="Fechar Mapa"
            >
              <i className="fas fa-times text-xl"></i>
            </button>
        </div>
      </header>
      <main className="flex-1 overflow-hidden relative bg-gray-900" style={{ cursor: 'crosshair' }}>
        <div ref={mapContainerRef} style={{ height: '100%', width: '100%' }}></div>
      </main>
    </div>
  );
};

export default MapModal;