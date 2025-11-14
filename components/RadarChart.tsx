import React from 'react';

interface RadarChartProps {
    data: number[];
    labels: string[];
    size?: number;
    color?: string;
}

const RadarChart: React.FC<RadarChartProps> = ({ data, labels, size = 180, color = 'rgba(59, 130, 246, 0.4)' }) => {
    const center = size / 2;
    const numAxes = labels.length;

    const pointsToString = (points: {x: number, y: number}[]) => points.map(p => `${p.x},${p.y}`).join(' ');

    const getPathCoordinates = (data_points: number[]): {x: number, y: number}[] => {
        const coords: {x: number, y: number}[] = [];
        // Ensure data_points is an array before iterating
        (data_points || []).forEach((value, i) => {
            const angle = (Math.PI * 2 * i) / numAxes - Math.PI / 2;
            const x = center + (center * 0.8 * value) * Math.cos(angle);
            const y = center + (center * 0.8 * value) * Math.sin(angle);
            coords.push({x, y});
        });
        return coords;
    };

    const dataPath = pointsToString(getPathCoordinates(data));
    const strokeColor = color.replace('0.4', '1');
    
    return (
        <svg viewBox={`0 0 ${size} ${size}`} width={size} height={size}>
            {/* Grid Lines */}
            {[0.25, 0.5, 0.75, 1].map(radius => (
                <circle
                    key={radius}
                    cx={center}
                    cy={center}
                    r={center * 0.8 * radius}
                    fill="none"
                    stroke="#4b5563" // gray-600
                    strokeWidth="0.5"
                />
            ))}
            {/* Axes and Labels */}
            {labels.map((label, i) => {
                const angle = (Math.PI * 2 * i) / numAxes - Math.PI / 2;
                const x2 = center + (center * 0.8) * Math.cos(angle);
                const y2 = center + (center * 0.8) * Math.sin(angle);
                const labelX = center + (center * 0.98) * Math.cos(angle);
                const labelY = center + (center * 0.98) * Math.sin(angle);
                return (
                    <g key={label}>
                        <line x1={center} y1={center} x2={x2} y2={y2} stroke="#4b5563" strokeWidth="0.5" />
                        <text
                            x={labelX}
                            y={labelY}
                            textAnchor="middle"
                            dominantBaseline="middle"
                            fill="#9ca3af" // gray-400
                            fontSize="8"
                            className="font-semibold"
                        >
                            {label}
                        </text>
                    </g>
                );
            })}
            {/* Data Polygon */}
            <polygon points={dataPath} fill={color} stroke={strokeColor} strokeWidth="1.5" />
        </svg>
    );
};

export default RadarChart;
