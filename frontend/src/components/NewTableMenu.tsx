// Menú que aparece al hacer click derecho en el canvas y permite crear una nueva tabla
import React from 'react';

const NewTableMenu = ({ x, y, isMobile = false, onTableNameSubmit, onCancel }: any) => {
  const [tableName, setTableName] = React.useState('');

  React.useEffect(() => {
    // Resetear cuando se abre en una nueva posición
    setTableName('');
  }, [x, y]);

  if (x === undefined || x === null) return null;

  const handleCreate = () => {
    const name = (tableName || '').trim();
    if (!name) return;
    if (typeof onTableNameSubmit === 'function') onTableNameSubmit(name);
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') {
      handleCreate();
    } else if (e.key === 'Escape') {
      if (typeof onCancel === 'function') onCancel();
    }
  };

  return (
    <div style={{ position: 'absolute', top: y, left: x, background: '#2A2A2A', border: '1px solid #555', padding: isMobile ? '12px' : '16px', zIndex: 10001, borderRadius: '4px', boxShadow: '0 2px 10px rgba(0,0,0,0.3)', minWidth: isMobile ? '200px' : '220px', maxWidth: isMobile ? '280px' : 'none', fontFamily: 'Arial, sans-serif', fontSize: isMobile ? '13px' : '14px', color: 'white', transform: 'none' }}>
      <h3 style={{ marginBottom: '12px', fontSize: isMobile ? '1rem' : '1.1rem' }}>{isMobile ? 'Nueva tabla' : 'Crear nueva tabla'}</h3>
      <input
        type="text"
        value={tableName}
        onChange={(e) => setTableName(e.target.value)}
        onKeyDown={handleKeyDown}
        placeholder='Nombre de la tabla'
        style={{ width: '100%', marginBottom: '12px', padding: isMobile ? '6px' : '8px', borderRadius: '4px', border: '1px solid #555', background: '#333', color: 'white', fontSize: isMobile ? '13px' : '14px' }}
        autoFocus
      />
      <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '8px' }}>
        <button onClick={() => typeof onCancel === 'function' ? onCancel() : null} style={{ padding: isMobile ? '6px 12px' : '8px 16px', background: '#555', color: 'white', border: 'none', borderRadius: '4px', cursor: 'pointer', fontSize: isMobile ? '12px' : '14px' }}>Cancelar</button>
        <button onClick={handleCreate} style={{ padding: isMobile ? '6px 12px' : '8px 16px', background: '#4CAF50', color: 'white', border: 'none', borderRadius: '4px', cursor: 'pointer', fontSize: isMobile ? '12px' : '14px' }}>Crear</button>
      </div>
    </div>
  );
};

export default NewTableMenu;
