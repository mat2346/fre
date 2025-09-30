import React from 'react';
import type { EdgeProps } from 'reactflow';
import { getBezierPath } from 'reactflow';

/**
 * Componente para visualizar relaciones entre tablas como aristas en el diagrama
 */
const RelationshipEdge: React.FC<EdgeProps> = ({ 
  id, 
  sourceX,
  sourceY,
  targetX,
  targetY,
  sourcePosition,
  targetPosition,
  data
}) => {
  // Usar curvas Bézier para las conexiones
  const [edgePath, labelX, labelY] = getBezierPath({
    sourceX,
    sourceY,
    sourcePosition,
    targetX,
    targetY,
    targetPosition
  });
  
  // Valores por defecto para data
  const label = data?.label || '';
  const relationType = data?.type || '';
  
  // Determinar el estilo de la línea según el tipo de relación
  let edgeStyle: React.CSSProperties = { stroke: '#555' };
  
  if (relationType === 'MANY_TO_MANY') {
    edgeStyle.strokeDasharray = '5,5'; // Línea discontinua para muchos a muchos
    edgeStyle.strokeWidth = 2.5;
  } else if (relationType === 'ONE_TO_MANY' || relationType === 'MANY_TO_ONE') {
    edgeStyle.strokeWidth = 2;
  } else if (relationType === 'ONE_TO_ONE') {
    edgeStyle.strokeDasharray = '8,4,1,4'; // Patrón de línea para one-to-one
    edgeStyle.strokeWidth = 1.5;
  }
  return (
    <>
      <path
        id={id}
        className="react-flow__edge-path"
        d={edgePath}
        strokeWidth={2}
        stroke="#555"
        markerEnd="url(#arrow)"
      />
      
      {label && (
        <text
          className="react-flow__edge-text"
          x={labelX}
          y={labelY}
          textAnchor="middle"
          dominantBaseline="central"
          fontSize="10px"
          fill="#fff"
          dy={-10}
          style={{ 
            background: '#333',
            padding: '2px 5px',
            borderRadius: '3px',
            textShadow: '0 1px 2px rgba(0,0,0,0.8)'
          }}
        >
          {label}
        </text>
      )}
      
      {relationType && (
        <text
          className="react-flow__edge-text"
          x={labelX}
          y={labelY}
          textAnchor="middle"
          dominantBaseline="central"
          fontSize="8px"
          fill="#fff"
          dy={10}
          style={{
            background: '#444',
            padding: '1px 4px',
            borderRadius: '2px',
            textShadow: '0 1px 1px rgba(0,0,0,0.7)'
          }}
        >
          {relationType}
        </text>
      )}
    </>
  );
};

export default RelationshipEdge;
