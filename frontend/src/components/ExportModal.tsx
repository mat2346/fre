import React from 'react';

interface ExportModalProps {
  visible: boolean;
  onClose: () => void;
  onExportJSON: () => void;
  onExportSQL: (dbType: string) => void;
  onExportJava: () => void;
}

const ExportModal: React.FC<ExportModalProps> = ({ visible, onClose, onExportJSON, onExportSQL, onExportJava }) => {
  const [dbType, setDbType] = React.useState('MySQL');

  if (!visible) return null;

  return (
    <div style={{ position: 'fixed', top: 0, left: 0, width: '100vw', height: '100vh', background: 'rgba(0,0,0,0.4)', zIndex: 10010, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
      <div style={{ background: '#222', padding: 24, borderRadius: 8, minWidth: 320, color: 'white', boxShadow: '0 2px 10px rgba(0,0,0,0.3)' }}>
        <h2 style={{ marginBottom: 16 }}>Exportar proyecto</h2>
        <div style={{ marginBottom: 20 }}>
          <button onClick={onExportJSON} style={{ width: '100%', marginBottom: 10, padding: 10, background: '#4caf50', color: 'white', border: 'none', borderRadius: 4, cursor: 'pointer' }}>Exportar como JSON</button>
          <div style={{ marginBottom: 10 }}>
            <select value={dbType} onChange={e => setDbType(e.target.value)} style={{ width: '100%', padding: 8, borderRadius: 4, border: '1px solid #555', background: '#333', color: 'white' }}>
              <option value="MySQL">MySQL</option>
              <option value="PostgreSQL">PostgreSQL</option>
            </select>
            <button onClick={() => onExportSQL(dbType)} style={{ width: '100%', marginTop: 8, padding: 10, background: '#2196f3', color: 'white', border: 'none', borderRadius: 4, cursor: 'pointer' }}>Exportar como SQL</button>
          </div>
          <button onClick={onExportJava} style={{ width: '100%', padding: 10, background: '#ff9800', color: 'white', border: 'none', borderRadius: 4, cursor: 'pointer' }}>Exportar proyecto Spring Boot completo (API REST)</button>
        </div>
        <button onClick={onClose} style={{ width: '100%', padding: 8, background: '#555', color: 'white', border: 'none', borderRadius: 4, cursor: 'pointer' }}>Cerrar</button>
      </div>
    </div>
  );
};

export default ExportModal;
