import React, { useState } from 'react';

interface TableSidebarProps {
  tables: Array<{ id: string; label: string; attributes: string[] }>;
  onToggle?: (isVisible: boolean) => void;
  isMobile?: boolean;
  isVisible?: boolean;
}

const TableSidebar: React.FC<TableSidebarProps> = ({ 
  tables, 
  onToggle, 
  isMobile = false, 
  isVisible: propVisible 
}) => {
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [visible, setVisible] = useState(propVisible !== undefined ? propVisible : true);

  // Sincronizar con prop externa
  React.useEffect(() => {
    if (propVisible !== undefined) {
      setVisible(propVisible);
    }
  }, [propVisible]);

  const handleToggle = () => {
    const newVisible = !visible;
    setVisible(newVisible);
    onToggle?.(newVisible);
  };

  return (
    <div style={{
      position: 'fixed',
      top: isMobile ? 100 : 120, // Posición ajustada para móviles
      left: 0,
      height: isMobile ? 'calc(100vh - 100px)' : 'calc(100vh - 120px)',
      width: isMobile 
        ? (visible ? 280 : 0) // En móviles, ocultar completamente
        : (visible ? 260 : 40), // En desktop, mostrar botón
      background: '#222',
      color: 'white',
      zIndex: isMobile ? 10004 : 10002, // Mayor z-index en móviles para overlay
      boxShadow: isMobile && visible ? '2px 0 12px rgba(0,0,0,0.3)' : '2px 0 8px rgba(0,0,0,0.15)',
      transition: 'width 0.3s ease',
      overflow: 'hidden',
      display: 'flex',
      flexDirection: 'column',
      // En móviles, agregar overlay cuando está visible
      ...(isMobile && visible && {
        position: 'fixed',
        zIndex: 10004,
      }),
    }}>
      {/* Botón toggle - solo visible en desktop cuando colapsado o siempre en móviles */}
      {(!isMobile || !visible) && (
        <button
          style={{
            background: 'none',
            border: 'none',
            color: 'white',
            fontSize: isMobile ? '1.2rem' : '1.5rem',
            padding: isMobile ? '6px' : '8px',
            cursor: 'pointer',
            alignSelf: 'flex-end',
          }}
          onClick={handleToggle}
          title={visible ? 'Ocultar menú' : 'Mostrar menú'}
        >
          {visible ? '⮜' : '⮞'}
        </button>
      )}
      
      {visible && (
        <div style={{ padding: '8px 0', flex: 1, overflowY: 'auto' }}>
          {/* En móviles, agregar botón de cerrar en la parte superior */}
          {isMobile && (
            <div style={{ 
              display: 'flex', 
              justifyContent: 'space-between', 
              alignItems: 'center', 
              padding: '8px 16px',
              borderBottom: '1px solid #333',
              marginBottom: '8px'
            }}>
              <h2 style={{ fontSize: '1.1rem', margin: 0 }}>Tablas</h2>
              <button
                onClick={handleToggle}
                style={{
                  background: 'none',
                  border: 'none',
                  color: 'white',
                  fontSize: '1.2rem',
                  cursor: 'pointer',
                  padding: '4px',
                }}
              >
                ✕
              </button>
            </div>
          )}
          
          {!isMobile && (
            <h2 style={{ fontSize: '1.1rem', margin: '0 0 12px 16px' }}>Tablas</h2>
          )}
          
          {tables.length === 0 && <div style={{ marginLeft: 16, color: '#aaa' }}>No hay tablas</div>}
          {tables.map(table => (
            <div key={table.id} style={{ marginBottom: 8 }}>
              <div
                style={{
                  padding: '8px 16px',
                  background: expandedId === table.id ? '#333' : 'none',
                  cursor: 'pointer',
                  borderRadius: '4px',
                  fontWeight: 'bold',
                  transition: 'background 0.2s',
                  fontSize: isMobile ? '0.95rem' : '1rem',
                }}
                onClick={() => setExpandedId(expandedId === table.id ? null : table.id)}
              >
                {table.label}
              </div>
              {expandedId === table.id && (
                <div style={{ 
                  padding: '8px 24px', 
                  background: '#292929', 
                  borderRadius: '4px', 
                  marginTop: 4,
                  fontSize: isMobile ? '0.85rem' : '0.95rem',
                }}>
                  <div style={{ marginBottom: 4, color: '#aaa' }}>Atributos:</div>
                  {table.attributes.length === 0 ? (
                    <div style={{ color: '#bbb' }}>Sin atributos</div>
                  ) : (
                    <ul style={{ paddingLeft: 16, margin: 0 }}>
                      {table.attributes.map((attr, i) => (
                        <li key={i} style={{ color: '#eee', marginBottom: 2 }}>{attr}</li>
                      ))}
                    </ul>
                  )}
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default TableSidebar;
