import React from 'react';

import { Handle, Position } from 'reactflow';

// Nodo personalizado que renderiza etiqueta y atributos, y dispara evento para abrir menú contextual
const CustomNode = ({ data, id }: { data: any, id: string }) => {
  const isMobile = window.innerWidth < 768;
  const [isHovered, setIsHovered] = React.useState(false);

  const handleContextMenu = (event: React.MouseEvent) => {
    event.preventDefault();
    event.stopPropagation();
    console.log("Clic derecho en nodo:", id, "con datos:", data);
    // Disparar un CustomEvent para que useDiagram lo capture y abra el menú contextual
    window.dispatchEvent(new CustomEvent('custom-context-menu', { detail: { nodeId: id, data, x: event.clientX, y: event.clientY } }));
  };

  return (
    <div 
      onContextMenu={handleContextMenu} 
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
      onClick={() => console.log("Clic en nodo:", id, "con datos:", data)}
      style={{ 
        position: 'relative', 
        background: 'white', 
        border: `2px solid ${isHovered ? '#4CAF50' : '#1a192b'}`, 
        borderRadius: '3px', 
        padding: isMobile ? '4px' : '6px', 
        minWidth: isMobile ? '80px' : '100px', 
        maxWidth: isMobile ? '120px' : '140px', 
        fontSize: isMobile ? '0.85rem' : '0.95rem', 
        cursor: 'context-menu', 
        color: '#222',
        transition: 'border-color 0.2s, box-shadow 0.2s',
        boxShadow: isHovered ? '0 0 8px rgba(76, 175, 80, 0.5)' : 'none'
      }}
    >
      {/* Puntos de conexión para las aristas - tanto source como target para todos los handles */}
      <Handle
        type="source"
        position={Position.Right}
        id="right"
        style={{ background: '#555', width: 8, height: 8 }}
        isConnectable={true}
      />
      <Handle
        type="target"
        position={Position.Right}
        id="right"
        style={{ background: '#555', width: 8, height: 8 }}
        isConnectable={true}
      />
      <Handle
        type="source"
        position={Position.Left}
        id="left"
        style={{ background: '#555', width: 8, height: 8 }}
        isConnectable={true}
      />
      <Handle
        type="target"
        position={Position.Left}
        id="left"
        style={{ background: '#555', width: 8, height: 8 }}
        isConnectable={true}
      />
      <Handle
        type="source"
        position={Position.Top}
        id="top"
        style={{ background: '#555', width: 8, height: 8 }}
        isConnectable={true}
      />
      <Handle
        type="target"
        position={Position.Top}
        id="top"
        style={{ background: '#555', width: 8, height: 8 }}
        isConnectable={true}
      />
      <Handle
        type="source"
        position={Position.Bottom}
        id="bottom"
        style={{ background: '#555', width: 8, height: 8 }}
        isConnectable={true}
      />
      <Handle
        type="target"
        position={Position.Bottom}
        id="bottom"
        style={{ background: '#555', width: 8, height: 8 }}
        isConnectable={true}
      />
      <div style={{ fontWeight: 'bold', fontSize: isMobile ? '0.95rem' : '1.1rem', marginBottom: '3px', color: '#222' }}>
        {data.label}
      </div>
      {data.attributes && data.attributes.length > 0 && (
        <div style={{ borderTop: '1px solid #ccc', marginTop: '3px', paddingTop: '3px', color: '#222', fontSize: isMobile ? '0.8rem' : '0.9rem' }}>
          {data.attributes.map((attr: string, i: number) => (
            <div key={i} style={{ color: '#222', padding: '2px 0' }}>{attr}</div>
          ))}
        </div>
      )}
    </div>
  );
};

export default CustomNode;
