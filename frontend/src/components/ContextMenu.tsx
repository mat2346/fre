import React from 'react';
import type { Node } from 'reactflow';

type ContextMenuProps = {
  x: number;
  y: number;
  node?: Node | undefined; // <-- añadido
  onDelete?: (nodeId?: string) => void;
  onAddAttribute?: (nodeId?: string) => void;
  onConfigureInheritance?: (nodeId?: string) => void;
  onAddRelation?: (nodeId?: string) => void; // nueva prop opcional
  onClose?: () => void; // nueva prop para cerrar el menú
};

/**
 * Menú contextual que se muestra cuando se hace click derecho sobre un nodo
 */
const ContextMenu: React.FC<ContextMenuProps> = ({
  x, 
  y, 
  node, 
  onAddAttribute, 
  onDelete, 
  onConfigureInheritance,
  onAddRelation,
  onClose
}) => {
  const rootRef = React.useRef<HTMLDivElement | null>(null);

  React.useEffect(() => {
    const handleOutside = (e: MouseEvent) => {
      if (!rootRef.current) return;
      const target = e.target as any as globalThis.Node;
      if (!rootRef.current.contains(target as any)) {
        if (typeof onClose === 'function') onClose();
      }
    };
    const handleEsc = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        if (typeof onClose === 'function') onClose();
      }
    };
    document.addEventListener('mousedown', handleOutside);
    document.addEventListener('keydown', handleEsc);
    return () => {
      document.removeEventListener('mousedown', handleOutside);
      document.removeEventListener('keydown', handleEsc);
    };
  }, [onClose]);

  return (
    <div
      ref={rootRef}
      style={{
        position: 'fixed',
        left: x,
        top: y,
        zIndex: 10005,
        background: 'white',
        padding: 8,
        borderRadius: 6,
        boxShadow: '0 2px 8px rgba(0,0,0,0.2)'
      }}
    >
      <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
        <button onClick={() => {
          if (typeof onClose === 'function') onClose();
          // Ejecutar acción después de cerrar el menú para evitar que el cierre anule la apertura del modal
          setTimeout(() => { if (typeof onAddAttribute === 'function') onAddAttribute(node?.id); }, 50);
        }} style={{ cursor: 'pointer' }}>
          Añadir atributo
        </button>
        <button onClick={() => {
          if (typeof onClose === 'function') onClose();
          setTimeout(() => { if (typeof onAddRelation === 'function') onAddRelation(node?.id); }, 50);
        }} style={{ cursor: 'pointer' }} disabled={!node}>
          Añadir relación
        </button>
        <button onClick={() => {
          if (typeof onClose === 'function') onClose();
          setTimeout(() => { if (typeof onConfigureInheritance === 'function') onConfigureInheritance(node?.id); }, 50);
        }} style={{ cursor: 'pointer' }} disabled={!node}>
          Configurar herencia
        </button>
        <button onClick={() => {
          if (typeof onClose === 'function') onClose();
          setTimeout(() => { if (typeof onDelete === 'function') onDelete(node?.id); }, 50);
        }} style={{ cursor: 'pointer', color: 'red' }}>
          Eliminar
        </button>
      </div>
    </div>
  );
};

export default ContextMenu;
