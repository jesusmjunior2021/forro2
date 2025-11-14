// Fix: Import ScaffoldingCalculationResults type.
import { CalculationResults, OptimizationResult, CeilingType, ScaffoldingCalculationResults, Product } from '../types';

// --- CEILING CALCULATION ---

const calculateLayout = (roomL: number, roomW: number, pL: number, pW: number) => {
    const panelsAlongL = Math.ceil(roomL / pL);
    const panelsAlongW = Math.ceil(roomW / pW);
    const totalPanels = panelsAlongL * panelsAlongW;

    const fullPanelsL = Math.floor(roomL / pL);
    const fullPanelsW = Math.floor(roomW / pW);
    const fullPanels = fullPanelsL * fullPanelsW;
    
    return {
        totalPanels,
        fullPanels,
        schematic: {
            cols: panelsAlongL,
            rows: panelsAlongW,
            lastColWidth: (roomL % pL) / pL * 100,
            lastRowHeight: (roomW % pW) / pW * 100,
        }
    };
};

export function calculateCeilingMaterials(
    length: number, 
    width: number, 
    ceilingType: CeilingType, 
    options: { panelLength?: number; panelWidth?: number; wastePercentage?: number; } = {},
    productCatalog: Product[]
): { results: CalculationResults; optimizationResult: OptimizationResult | null } {
    const l = Number(length);
    const w = Number(width);
    
    if (isNaN(l) || isNaN(w) || l <= 0 || w <= 0 || !ceilingType) {
        throw new Error('Dimensões ou tipo de forro inválidos.');
    }

    const area = l * w;
    const perimeter = (l + w) * 2;
    
    let results: CalculationResults;
    let optimizationResult: OptimizationResult | null = null;

    if (ceilingType === 'drywall') {
        const pL = Number(options.panelLength || 1.80);
        const pW = Number(options.panelWidth || 1.20);
        const waste = Number(options.wastePercentage || 10);

        if (isNaN(pL) || isNaN(pW) || pL <= 0 || pW <= 0 || isNaN(waste) || waste < 0) {
             throw new Error('Opções de Drywall inválidas.');
        }

        const layoutA = calculateLayout(l, w, pL, pW);
        const layoutB = calculateLayout(l, w, pW, pL);

        const bestLayout = layoutA.totalPanels <= layoutB.totalPanels ? 
            { ...layoutA, layout: 'A' as const, description: `Instalar placas de ${pL.toFixed(2)}m no sentido dos ${l.toFixed(2)}m` } : 
            { ...layoutB, layout: 'B' as const, description: `Instalar placas de ${pW.toFixed(2)}m no sentido dos ${l.toFixed(2)}m` };

        const totalWithWaste = Math.ceil(bestLayout.totalPanels * (1 + waste / 100));

        optimizationResult = {
            ...bestLayout,
            cutPanels: bestLayout.totalPanels - bestLayout.fullPanels,
            totalPanelsNoWaste: bestLayout.totalPanels,
            totalPanelsWithWaste: totalWithWaste,
            wastePercentage: waste,
        };
        
        const F530_SPACING = 0.60;
        const CANALETA_SPACING = 1.20;
        const HANGER_SPACING = 1.20;

        const shortDim = Math.min(l, w);
        const longDim = Math.max(l, w);

        const numCanaletas = Math.ceil(shortDim / CANALETA_SPACING);
        const totalCanaletaLength = numCanaletas * longDim;
        
        const numF530Rows = Math.ceil(longDim / F530_SPACING);
        const totalF530Length = numF530Rows * shortDim;

        const hangersPerCanaleta = Math.ceil(longDim / HANGER_SPACING);
        const totalHangers = numCanaletas * hangersPerCanaleta;

        const screws = Math.ceil((area / 0.15) + (numF530Rows * numCanaletas) + (totalHangers * 2));

        const panelProduct = productCatalog.find(p => p.Nome.toUpperCase().includes('DRYWALL'))?.Nome || `Placas de Gesso (${pL.toFixed(2)}x${pW.toFixed(2)}m)`;
        const mainStructProduct = productCatalog.find(p => p.Nome.toUpperCase().includes('CANALETA'))?.Nome || "Perfis Canaleta (barras 3m)";
        const secondStructProduct = productCatalog.find(p => p.Nome.toUpperCase().includes('F530'))?.Nome || "Perfis F530 (barras 3m)";
        const finishingProduct = productCatalog.find(p => p.Nome.toUpperCase().includes('CANTONEIRA L'))?.Nome || "Cantoneiras L (barras 3m)";
        
        results = {
            area: Number(area.toFixed(2)),
            panels: { count: totalWithWaste, description: panelProduct },
            mainStructure: { count: Math.ceil(totalCanaletaLength / 3), description: mainStructProduct },
            secondaryStructure: { count: Math.ceil(totalF530Length / 3), description: secondStructProduct },
            finishingProfiles: { count: Math.ceil(perimeter / 3), description: finishingProduct },
            hangers: Math.ceil(totalHangers),
            screws: Math.ceil(screws),
            corners: 4,
        };

    } else { // 'pvc-liso'
        const longDim = Math.max(l, w);
        const shortDim = Math.min(l, w);
        const METALON_SPACING = 0.60;

        const numMetalons = Math.ceil(longDim / METALON_SPACING) + 1;
        const totalMetalonLength = numMetalons * shortDim;

        const panelProduct = productCatalog.find(p => p.Nome.toUpperCase().includes('FORRO PVC'))?.Nome || "Painéis PVC (6m x 20cm)";
        const mainStructProduct = productCatalog.find(p => p.Nome.toUpperCase().includes('METALON'))?.Nome || "Estrutura Metalon 15x15 (barras 6m)";
        const finishingProduct = productCatalog.find(p => p.Nome.toUpperCase().includes('RODAFORRO'))?.Nome || "Rodaforro / Moldura U (barras 6m)";

        results = {
            area: Number(area.toFixed(2)),
            panels: { count: Math.ceil(area / (6 * 0.2)), description: panelProduct },
            mainStructure: { count: Math.ceil(totalMetalonLength / 6), description: mainStructProduct },
            finishingProfiles: { count: Math.ceil(perimeter / 6), description: finishingProduct },
            screws: Math.ceil((longDim / 0.20) * numMetalons),
            corners: 4,
        };
    }

    return { results, optimizationResult };
}
// --- SCAFFOLDING CALCULATION ---

// Fix: Implement and export calculateScaffoldingMaterials to resolve missing member error.
export function calculateScaffoldingMaterials(
    height: number,
    length: number,
    width: number
): ScaffoldingCalculationResults {
    const FRAME_HEIGHT = 1.0; // Standard frame height in meters
    const FRAME_LENGTH = 1.5; // Standard frame length (bay size)
    const PLATFORM_WIDTH = 0.5; // Average width of a platform board

    if (height <= 0 || length <= 0 || width <= 0) {
        throw new Error("As dimensões devem ser maiores que zero.");
    }

    const levels = Math.ceil(height / FRAME_HEIGHT);
    const bays = Math.ceil(length / FRAME_LENGTH);
    const platformsPerRow = Math.ceil(width / PLATFORM_WIDTH);

    const totalArea = height * length;
    
    // For a facade scaffold, there are (bays + 1) vertical lines of frames.
    const frames = (bays + 1) * levels;

    // Typically one X-brace per bay per level for stability.
    const braces = bays * levels;

    // Platforms are needed for the working levels. Assume one working level at the top.
    const platforms = bays * platformsPerRow;

    // Base jacks are needed for each vertical line of frames.
    const baseJacks = bays + 1;

    // Guard rails for the top working level's front side.
    // Each bay needs a guard rail section.
    const guardRails = bays;
    
    return {
        totalArea,
        frames,
        braces,
        platforms,
        baseJacks,
        guardRails,
    };
}