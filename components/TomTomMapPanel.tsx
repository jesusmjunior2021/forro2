
import React, { useEffect, useRef, useState } from 'react';

interface TomTomMapPanelProps {
  isOpen: boolean;
  onClose: () => void;
  apiKey: string | null;
}

const CORS_PROXY_URL = 'https://corsproxy.io/?';

// Mapeia iconCategory para ícones e cores do FontAwesome
const iconCategoryMap: Record<number, { icon: string; color: string; }> = {
    0: { icon: 'fa-question-circle', color: '#888' }, // Unknown
    1: { icon: 'fa-car-crash', color: '#ff4d4d' }, // Accident
    2: { icon: 'fa-smog', color: '#aaa' }, // Fog
    3: { icon: 'fa-exclamation-triangle', color: '#ffcc00' }, // DangerousConditions
    4: { icon: 'fa-cloud-showers-heavy', color: '#66ccff' }, // Rain
    5: { icon: 'fa-snowflake', color: '#99d6ff' }, // Ice
    6: { icon: 'fa-traffic-light', color: '#ff9933' }, // Jam
    7: { icon: 'fa-road-barrier', color: '#ff6666' }, // LaneClosed
    8: { icon: 'fa-road-barrier', color: '#e60000' }, // RoadClosed
    9: { icon: 'fa-person-digging', color: '#ff9900' }, // RoadWorks
    10: { icon: 'fa-wind', color: '#99ccff' }, // Wind
    11: { icon: 'fa-water', color: '#6699ff' }, // Flooding
    14: { icon: 'fa-car-burst', color: '#ffad33' }, // BrokenDownVehicle
};

const TomTomMapPanel: React.FC<TomTomMapPanelProps> = ({ isOpen, onClose, apiKey }) => {
    const mapContainerRef = useRef<HTMLDivElement>(null);
    const mapRef = useRef<any>(null);
    const markersRef = useRef<any[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    // Função Debounce
    const debounce = (func: (...args: any[]) => void, delay: number) => {
        let timeoutId: number;
        return (...args: any[]) => {
            clearTimeout(timeoutId);
            timeoutId = window.setTimeout(() => {
                func(...args);
            }, delay);
        };
    };

    const fetchAndDisplayIncidents = async () => {
        if (!mapRef.current || !apiKey) return;
        
        const map = mapRef.current;
        const bounds = map.getBounds();
        const bbox = `${bounds.getWest()},${bounds.getSouth()},${bounds.getEast()},${bounds.getNorth()}`;

        const fields = "{incidents{type,geometry{type,coordinates},properties{id,iconCategory,events{description,code},startTime,endTime,from,to}}}";
        const url = `https://api.tomtom.com/traffic/services/5/incidentDetails?key=${apiKey}&bbox=${bbox}&fields=${fields}&language=pt-BR`;
        
        try {
            const response = await fetch(url);
            if (!response.ok) {
                throw new Error(`Erro na API de tráfego: ${response.statusText}`);
            }
            const data = await response.json();
            
            // Limpa marcadores existentes
            markersRef.current.forEach(marker => marker.remove());
            markersRef.current = [];

            if (data.incidents) {
                data.incidents.forEach((incident: any) => {
                    const { geometry, properties } = incident;
                    if (!geometry || !geometry.coordinates) return;

                    const coordinates = geometry.type === 'Point' 
                        ? geometry.coordinates 
                        : geometry.coordinates[0];

                    const categoryInfo = iconCategoryMap[properties.iconCategory] || iconCategoryMap[0];
                    
                    const el = document.createElement('div');
                    el.className = 'w-8 h-8 rounded-full flex items-center justify-center shadow-lg';
                    el.style.backgroundColor = categoryInfo.color;
                    el.innerHTML = `<i class="fas ${categoryInfo.icon} text-white"></i>`;

                    const description = properties.events[0]?.description || 'Sem descrição';
                    const popupContent = `
                        <div class="p-2">
                            <h4 class="font-bold text-base mb-1">${description}</h4>
                            <p class="text-xs"><strong>De:</strong> ${properties.from || 'N/A'}</p>
                            <p class="text-xs"><strong>Para:</strong> ${properties.to || 'N/A'}</p>
                            ${properties.startTime ? `<p class="text-xs mt-1"><strong>Início:</strong> ${new Date(properties.startTime).toLocaleString('pt-BR')}</p>` : ''}
                        </div>
                    `;

// Fix: Add window. prefix to maplibregl, as it's a global from a CDN.
                    const popup = new window.maplibregl.Popup({ offset: 25, className: 'custom-map-popup' })
                        .setHTML(popupContent);

// Fix: Add window. prefix to maplibregl, as it's a global from a CDN.
                    const marker = new window.maplibregl.Marker({ element: el })
                        .setLngLat(coordinates)
                        .setPopup(popup)
                        .addTo(map);

                    markersRef.current.push(marker);
                });
            }

        } catch (err) {
            console.error(err);
            setError(err instanceof Error ? err.message : "Erro desconhecido ao buscar incidentes.");
        }
    };
    
    const debouncedFetch = debounce(fetchAndDisplayIncidents, 750);

    useEffect(() => {
        if (isOpen && mapContainerRef.current && !mapRef.current) {
            if (!apiKey) {
                setError("Chave de API do TomTom não configurada.");
                setIsLoading(false);
                return;
            }

            setError(null);
            setIsLoading(true);
            
// Fix: Add window. prefix to maplibregl, as it's a global from a CDN.
            const map = new window.maplibregl.Map({
                container: mapContainerRef.current,
                style: `https://api.tomtom.com/map/1/style/main?key=${apiKey}`,
                center: [-44.3068, -2.5307], // São Luís, MA
                zoom: 12
            });

            map.on('load', () => {
                map.addSource('traffic-flow', {
                    type: 'raster',
                    tiles: [`https://api.tomtom.com/traffic/map/4/tile/flow/absolute/{z}/{x}/{y}.png?key=${apiKey}`],
                    tileSize: 256
                });
                map.addLayer({
                    id: 'traffic-flow-layer',
                    type: 'raster',
                    source: 'traffic-flow',
                    paint: { 'raster-opacity': 0.7 }
                });
                
                setIsLoading(false);
                fetchAndDisplayIncidents();
            });
            
            map.on('moveend', debouncedFetch);
            map.on('zoomend', debouncedFetch);
            
            mapRef.current = map;

            return () => {
                if (mapRef.current) {
                    mapRef.current.remove();
                    mapRef.current = null;
                }
            };
        }
    }, [isOpen, apiKey, debouncedFetch]);
    
    return (
      <div className={`slate-panel w-full ${isOpen ? 'open' : ''} flex flex-col`}>
        <header className="p-3 bg-gray-900/80 backdrop-blur-sm border-b border-gray-700/50 flex justify-between items-center shrink-0 z-10">
            <h2 className="text-lg font-bold text-gray-200 flex items-center"><i className="fas fa-car-crash mr-3 text-blue-400"></i>Mapa de Incidentes TomTom</h2>
            <button onClick={onClose} className="w-10 h-10 rounded-full hover:bg-gray-700 transition-colors flex items-center justify-center" title="Fechar Mapa"><i className="fas fa-times text-xl"></i></button>
        </header>

        <main className="flex-1 overflow-hidden relative bg-gray-900">
            <div ref={mapContainerRef} className="w-full h-full" />
            {(isLoading || error) && (
                <div className="absolute inset-0 bg-gray-900/70 flex items-center justify-center z-20">
                    {isLoading && <i className="fas fa-spinner fa-spin text-4xl text-white"></i>}
                    {error && <div className="p-4 bg-red-800/80 text-white rounded-lg text-center max-w-sm">{error}</div>}
                </div>
            )}
        </main>
      </div>
    );
};

export default TomTomMapPanel;
