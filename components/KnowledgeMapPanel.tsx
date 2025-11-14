import React, { useMemo, useState, useRef, MouseEvent, useEffect } from 'react';
import { KnowledgeTree, KnowledgeTopic, KnowledgeResource, ResourceCategory } from '../types';

interface KnowledgeMapPanelProps {
  isOpen: boolean;
  onClose: () => void;
  knowledgeTree: KnowledgeTree;
}

interface Position { x: number; y: number; }
interface Velocity { vx: number; vy: number; }

interface Node {
  id: string;
  type: 'center' | 'topic' | 'resource';
  label: string;
  data: KnowledgeTopic | KnowledgeResource | null;
  pos: Position;
  velocity: Velocity;
  fixed?: boolean;
}

interface Edge {
  id: string;
  source: string;
  target: string;
}

interface TooltipState {
  node: Node;
  pos: { x: number; y: number };
}

// Custom hook for force-directed layout simulation
const useForceLayout = (nodes: Node[], edges: Edge[], width: number, height: number) => {
  const nodeRef = useRef(nodes);
  const isSimulating = useRef(false);

  useEffect(() => {
    nodeRef.current = nodes.map(n => ({
      ...n,
      pos: nodeRef.current.find(p => p.id === n.id)?.pos || n.pos,
    }));
  }, [nodes]);
  
  const [nodePositions, setNodePositions] = useState<Record<string, Position>>({});

  useEffect(() => {
    // Initialize positions on first render of nodes
    setNodePositions(Object.fromEntries(nodeRef.current.map(n => [n.id, n.pos])));

    const simulation = () => {
      if (!isSimulating.current) return;
      
      const currentNodes = nodeRef.current;
      const REPULSION_STRENGTH = 60000;
      const ATTRACTION_STRENGTH = 0.02;
      const DAMPING = 0.95;

      // Calculate forces
      for (const nodeA of currentNodes) {
        if (nodeA.fixed) {
            nodeA.velocity = { vx: 0, vy: 0 };
            continue;
        };

        // Repulsion from other nodes
        for (const nodeB of currentNodes) {
          if (nodeA.id === nodeB.id) continue;
          const dx = nodeA.pos.x - nodeB.pos.x;
          const dy = nodeA.pos.y - nodeB.pos.y;
          const distance = Math.sqrt(dx * dx + dy * dy) || 1;
          const force = REPULSION_STRENGTH / (distance * distance);
          nodeA.velocity.vx += (dx / distance) * force;
          nodeA.velocity.vy += (dy / distance) * force;
        }
      }

       // Attraction from edges
       for (const edge of edges) {
        const source = currentNodes.find(n => n.id === edge.source);
        const target = currentNodes.find(n => n.id === edge.target);
        if (!source || !target) continue;

        const dx = target.pos.x - source.pos.x;
        const dy = target.pos.y - source.pos.y;
        
        source.velocity.vx += dx * ATTRACTION_STRENGTH;
        source.velocity.vy += dy * ATTRACTION_STRENGTH;
        target.velocity.vx -= dx * ATTRACTION_STRENGTH;
        target.velocity.vy -= dy * ATTRACTION_STRENGTH;
      }


      // Update positions
      const newPositions: Record<string, Position> = {};
      for (const node of currentNodes) {
        node.velocity.vx *= DAMPING;
        node.velocity.vy *= DAMPING;
        node.pos.x += node.velocity.vx;
        node.pos.y += node.velocity.vy;
        newPositions[node.id] = { x: node.pos.x, y: node.pos.y };
      }
      
      setNodePositions(newPositions);
      requestAnimationFrame(simulation);
    };

    isSimulating.current = true;
    requestAnimationFrame(simulation);

    return () => { isSimulating.current = false; };
  }, [nodes, edges, width, height]);

  return nodePositions;
};

const getResourceIcon = (category: ResourceCategory) => {
    switch (category) {
      case 'video': return 'fab fa-youtube';
      case 'podcast': return 'fas fa-podcast';
      case 'audio': return 'fas fa-headphones';
      case 'book': return 'fas fa-book';
      default: return 'fas fa-link';
    }
};

const KnowledgeMapTooltip: React.FC<{ tooltip: TooltipState }> = ({ tooltip }) => {
    const { node, pos } = tooltip;
    const resourceData = node.data as KnowledgeResource;
    return (
        <div className="knowledge-map-tooltip" style={{ transform: `translate(${pos.x + 15}px, ${pos.y + 15}px)` }}>
            <h4>{node.label}</h4>
            {node.type === 'resource' && <p>{resourceData.source}</p>}
        </div>
    );
};

const KnowledgeMapPanel: React.FC<KnowledgeMapPanelProps> = ({ isOpen, onClose, knowledgeTree }) => {
  const [viewBox, setViewBox] = useState({ x: 0, y: 0, w: 2000, h: 1400 });
  const [isPanning, setIsPanning] = useState(false);
  const lastMousePos = useRef({ x: 0, y: 0 });
  const svgRef = useRef<SVGSVGElement>(null);
  
  const [expandedTopics, setExpandedTopics] = useState(new Set<string>());
  const [searchTerm, setSearchTerm] = useState('');
  const [hoveredNode, setHoveredNode] = useState<TooltipState | null>(null);

  const { visibleNodes, visibleEdges } = useMemo(() => {
      const baseNodes: Node[] = [];
      const baseEdges: Edge[] = [];
      const topics: KnowledgeTopic[] = Object.values(knowledgeTree);
      
      const width = 2000;
      const height = 1400;

      const centerNode: Node = {
        id: 'center', type: 'center', label: 'Conhecimento', data: null,
        pos: { x: width / 2, y: height / 2 }, velocity: { vx: 0, vy: 0 }, fixed: true
      };
      baseNodes.push(centerNode);

      topics.forEach((topic, i) => {
        const angle = (i / topics.length) * 2 * Math.PI;
        baseNodes.push({
          id: topic.id, type: 'topic', label: topic.title, data: topic,
          pos: { x: width/2 + 300 * Math.cos(angle), y: height/2 + 300 * Math.sin(angle) }, velocity: { vx: 0, vy: 0 }
        });
        baseEdges.push({ id: `center-${topic.id}`, source: 'center', target: topic.id });

        topic.resources.forEach((resource, j) => {
            const resAngle = (j / topic.resources.length) * 2 * Math.PI;
            baseNodes.push({
                id: resource.id, type: 'resource', label: resource.title, data: resource,
                pos: { x: baseNodes.find(n=>n.id===topic.id)!.pos.x + 100 * Math.cos(resAngle), y: baseNodes.find(n=>n.id===topic.id)!.pos.y + 100 * Math.sin(resAngle) }, velocity: { vx: 0, vy: 0 }
            });
            baseEdges.push({ id: `${topic.id}-${resource.id}`, source: topic.id, target: resource.id });
        });
      });
      
      const forceExpandTopics = new Set<string>();
      if(searchTerm.trim()){
          baseNodes.forEach(node => {
              if(node.type === 'resource' && node.label.toLowerCase().includes(searchTerm.toLowerCase())){
                  const parentEdge = baseEdges.find(e => e.target === node.id);
                  if(parentEdge) forceExpandTopics.add(parentEdge.source);
              }
          })
      }
      
      const finalExpanded = new Set([...expandedTopics, ...forceExpandTopics]);

      const visibleNodes = baseNodes.filter(node => {
        if(node.type === 'resource'){
            const parentEdge = baseEdges.find(e => e.target === node.id);
            return parentEdge && finalExpanded.has(parentEdge.source);
        }
        return true;
      });
      const visibleNodeIds = new Set(visibleNodes.map(n => n.id));
      const visibleEdges = baseEdges.filter(e => visibleNodeIds.has(e.source) && visibleNodeIds.has(e.target));

      return { visibleNodes, visibleEdges };
  }, [knowledgeTree, expandedTopics, searchTerm]);

  const nodePositions = useForceLayout(visibleNodes, visibleEdges, viewBox.w, viewBox.h);
  
  const toggleTopic = (topicId: string) => {
    setExpandedTopics(prev => {
        const newSet = new Set(prev);
        if (newSet.has(topicId)) newSet.delete(topicId);
        else newSet.add(topicId);
        return newSet;
    });
  };

  const getSVGCoordinates = (e: MouseEvent): { x: number, y: number } => {
    if (!svgRef.current) return { x: 0, y: 0 };
    const pt = svgRef.current.createSVGPoint();
    pt.x = e.clientX;
    pt.y = e.clientY;
    return pt.matrixTransform(svgRef.current.getScreenCTM()?.inverse());
  };

  const handleWheel = (e: React.WheelEvent) => {
    e.preventDefault();
    const zoomFactor = 1.1;
    const { w, h } = viewBox;
    const newW = e.deltaY > 0 ? w * zoomFactor : w / zoomFactor;
    const newH = e.deltaY > 0 ? h * zoomFactor : h / zoomFactor;
    const coords = getSVGCoordinates(e as unknown as MouseEvent);
    setViewBox({
        x: viewBox.x + (coords.x - viewBox.x) * (1 - newW / w),
        y: viewBox.y + (coords.y - viewBox.y) * (1 - newH / h),
        w: newW,
        h: newH,
    });
  };

  const handleMouseDown = (e: MouseEvent<SVGSVGElement>) => {
    if (e.target !== svgRef.current) return;
    setIsPanning(true);
    lastMousePos.current = { x: e.clientX, y: e.clientY };
  };

  const handleMouseMove = (e: MouseEvent<SVGSVGElement>) => {
    if (isPanning) {
      const dx = e.clientX - lastMousePos.current.x;
      const dy = e.clientY - lastMousePos.current.y;
      lastMousePos.current = { x: e.clientX, y: e.clientY };
      setViewBox(prev => ({ ...prev, x: prev.x - dx * (viewBox.w / (svgRef.current?.clientWidth || 1)), y: prev.y - dy * (viewBox.h / (svgRef.current?.clientHeight || 1)) }));
    }
  };
  const handleMouseUp = () => setIsPanning(false);

  if (!isOpen) return null;

  return (
    <>
    <div className="fixed inset-0 bg-gray-900/80 backdrop-blur-sm flex flex-col z-40 animate-fade-in">
        <header className="p-3 bg-gray-800/80 backdrop-blur-sm border-b border-gray-700/50 flex justify-between items-center shrink-0">
            <h2 className="text-lg font-bold text-gray-200 flex items-center"><i className="fas fa-sitemap mr-3 text-blue-400"></i>Mapa do Conhecimento</h2>
            <button onClick={onClose} className="w-10 h-10 rounded-full hover:bg-gray-700 transition-colors flex items-center justify-center" title="Fechar Mapa"><i className="fas fa-times text-xl"></i></button>
        </header>
        <main className="flex-1 overflow-hidden relative" style={{ backgroundColor: '#111827' }}>
            <div className="knowledge-map-search">
                <i className="fas fa-search search-icon"></i>
                <input type="text" placeholder="Buscar no mapa..." value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} />
            </div>
            <svg ref={svgRef} width="100%" height="100%" viewBox={`${viewBox.x} ${viewBox.y} ${viewBox.w} ${viewBox.h}`} className="knowledge-map-svg" onWheel={handleWheel} onMouseDown={handleMouseDown} onMouseMove={handleMouseMove} onMouseUp={handleMouseUp} onMouseLeave={handleMouseUp}>
                <g>
                    {visibleEdges.map(edge => {
                        const sourcePos = nodePositions[edge.source];
                        const targetPos = nodePositions[edge.target];
                        if (!sourcePos || !targetPos) return null;
                        return <line key={edge.id} x1={sourcePos.x} y1={sourcePos.y} x2={targetPos.x} y2={targetPos.y} className="map-edge" />
                    })}
                </g>
                <g>
                    {visibleNodes.map(node => {
                      const pos = nodePositions[node.id];
                      if(!pos) return null;
                      
                      const resourceData = node.data as KnowledgeResource;
                      const openLink = (e: React.MouseEvent) => { e.stopPropagation(); if (resourceData?.url) window.open(resourceData.url, '_blank'); };
                      
                      const isExpanded = node.type === 'topic' && expandedTopics.has(node.id);
                      
                      let nodeShape, nodeLabel, nodeIcon, expandButton;
                      switch(node.type) {
                        case 'center':
                          nodeShape = <circle r="60" className="map-node-shape map-node-center" />;
                          nodeLabel = <text dy="0.3em" className="map-text font-bold text-lg">Conhecimento</text>;
                          break;
                        case 'topic':
                          nodeShape = <circle r="45" className="map-node-shape map-node-topic" />;
                          nodeLabel = <text y="58" className="map-text map-text-topic">{node.label.substring(0, 20)}</text>;
                          expandButton = (
                            <g onClick={(e) => {e.stopPropagation(); toggleTopic(node.id);}} transform="translate(0, 45)">
                                <circle r="12" className="map-expand-button"/>
                                <foreignObject x="-6" y="-6" width="12" height="12">
                                  <i className={`fas ${isExpanded ? 'fa-minus' : 'fa-plus'} map-expand-icon`}></i>
                                </foreignObject>
                            </g>
                          );
                          break;
                        case 'resource':
                           nodeShape = <circle r="25" className="map-node-shape map-node-resource" onClick={openLink} />;
                           nodeIcon = <foreignObject x="-12" y="-12" width="24" height="24"><i className={`${getResourceIcon(resourceData?.type)} map-node-icon`}></i></foreignObject>;
                           nodeLabel = <text y="38" className="map-text">{resourceData.source}</text>;
                          break;
                      }
                      return (
                        <g key={node.id} className="map-node-group" style={{transform: `translate(${pos.x}px, ${pos.y}px)`}} onMouseEnter={(e) => setHoveredNode({ node, pos: { x: e.clientX, y: e.clientY } })} onMouseLeave={() => setHoveredNode(null)}>
                            {nodeShape}
                            {nodeLabel}
                            {nodeIcon}
                            {expandButton}
                        </g>
                      );
                    })}
                </g>
            </svg>
        </main>
    </div>
    {hoveredNode && <KnowledgeMapTooltip tooltip={hoveredNode} />}
    </>
  );
};

export default KnowledgeMapPanel;
