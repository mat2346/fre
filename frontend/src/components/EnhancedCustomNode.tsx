import React from 'react';
import type { TableEntity } from '../types';

interface CustomNodeProps {
  data: {
    label: string;
    attributes: string[] | any[];
    isTable: boolean;
    isAbstract?: boolean;
    inheritanceType?: string;
    parentTable?: string;
    discriminatorValue?: string;
    tableEntity?: TableEntity; // Entidad completa
  };
  id: string;
}

/**
 * Nodo personalizado mejorado para visualizar tablas con sus atributos
 * Incluye estilos mejorados y soporte para mostrar restricciones
 */
const EnhancedCustomNode: React.FC<CustomNodeProps> = ({ data, id }) => {
  // Detectar si es móvil
  const isMobile = window.innerWidth < 768;
  
  // Handler para el menú contextual
  const handleContextMenu = (event: React.MouseEvent) => {
    event.preventDefault();
    event.stopPropagation();
    // Usar la posición del cursor directamente
    window.dispatchEvent(
      new CustomEvent('custom-context-menu', {
        detail: {
          nodeId: id,
          data,
          x: event.clientX,
          y: event.clientY
        }
      })
    );
  };

  // Determinar si es una tabla o una entidad abstracta
 
  
  // Procesar atributos para mostrar información completa
  const processedAttributes = React.useMemo(() => {
    if (!data.attributes) return [];
    
    return data.attributes.map((attr: any) => {
      // Si el atributo es un string simple (formato anterior)
      if (typeof attr === 'string') {
        const [name, type] = attr.split(':');
        return { name, type, isPrimaryKey: false, isNullable: true, isUnique: false };
      }
      
      // Si el atributo es un objeto completo (nuevo formato)
      return attr;
    });
  }, [data.attributes]);

  return (
    <div
      className="node-wrapper"
      onContextMenu={handleContextMenu}
      style={{
        position: 'relative',
        background: 'white',
        border: '1px solid #1a192b',
        borderRadius: '5px',
        padding: isMobile ? '6px' : '8px',
        minWidth: isMobile ? '100px' : '140px',
        maxWidth: isMobile ? '150px' : '220px',
        fontSize: isMobile ? '0.85rem' : '0.95rem',
        cursor: 'context-menu',
        color: '#222',
        boxShadow: '0 2px 5px rgba(0,0,0,0.15)'
      }}
    >
      {/* Cabecera de la tabla con información de herencia */}
      <div style={{ 
        fontWeight: 'bold', 
        fontSize: isMobile ? '0.95rem' : '1.1rem', 
        marginBottom: '5px', 
        color: '#222',
        padding: '2px 4px',
        borderBottom: '1px solid #e0e0e0',
        backgroundColor: data.isAbstract ? '#e3f2fd' : data.parentTable ? '#e8f5e9' : data.inheritanceType ? '#fff8e1' : '#f5f5f5'
      }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <span>{data.label}</span>
          
          {/* Indicadores de herencia */}
          <div style={{ display: 'flex', gap: '4px' }}>
            {data.isAbstract && (
              <span 
                title="Clase abstracta" 
                style={{ fontSize: '0.7rem', padding: '1px 3px', background: '#2196f3', color: 'white', borderRadius: '3px' }}
              >
                A
              </span>
            )}
            {data.parentTable && (
              <span 
                title="Clase hija" 
                style={{ fontSize: '0.7rem', padding: '1px 3px', background: '#4caf50', color: 'white', borderRadius: '3px' }}
              >
                C
              </span>
            )}
            {data.inheritanceType && !data.parentTable && (
              <span 
                title="Clase base" 
                style={{ fontSize: '0.7rem', padding: '1px 3px', background: '#ff9800', color: 'white', borderRadius: '3px' }}
              >
                B
              </span>
            )}
          </div>
        </div>
        
        {/* Información adicional sobre herencia */}
        {data.parentTable && data.discriminatorValue && (
          <div style={{ fontSize: '0.7rem', marginTop: '2px', color: '#4caf50' }}>
            @DiscriminatorValue("{data.discriminatorValue}")
          </div>
        )}
        {data.inheritanceType && !data.parentTable && (
          <div style={{ fontSize: '0.7rem', marginTop: '2px', color: '#ff9800' }}>
            @Inheritance(strategy={data.inheritanceType})
          </div>
        )}
        {data.isAbstract && (
          <div style={{ fontSize: '0.7rem', marginTop: '2px', color: '#2196f3' }}>
            @MappedSuperclass
          </div>
        )}
      </div>
      
      {/* Lista de atributos */}
      {processedAttributes.length > 0 && (
        <div style={{ 
          marginTop: '3px', 
          paddingTop: '3px', 
          color: '#333', 
          fontSize: isMobile ? '0.8rem' : '0.9rem' 
        }}>
          {processedAttributes.map((attr: any, i: number) => {
            // Para atributos en formato antiguo
            if (typeof attr === 'string') {
              return <div key={i} style={{ color: '#222', padding: '2px 0' }}>{attr}</div>;
            }
            
            // Para atributos en nuevo formato
            const constraints = [];
            if (attr.isPrimaryKey) constraints.push('PK');
            if (!attr.isNullable) constraints.push('NOT NULL');
            if (attr.isUnique) constraints.push('UQ');
            
            const constraintStr = constraints.length > 0 
              ? ` [${constraints.join(', ')}]` 
              : '';
            
            return (
              <div key={i} style={{ 
                color: attr.isPrimaryKey ? '#5C6BC0' : '#333',
                fontWeight: attr.isPrimaryKey ? 'bold' : 'normal',
                fontSize: isMobile ? '0.75rem' : '0.85rem',
                display: 'flex',
                justifyContent: 'space-between',
                padding: '3px 0',
                borderBottom: '1px dotted #e0e0e0'
              }}>
                <span>{attr.name}</span>
                <span style={{ color: '#666', fontSize: '0.8em', display: 'flex', gap: '4px' }}>
                  <span>{attr.type}</span>
                  {constraintStr && <span style={{ color: '#9E9E9E', fontSize: '0.9em' }}>{constraintStr}</span>}
                </span>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};

export default EnhancedCustomNode;
