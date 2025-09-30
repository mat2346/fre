import React from 'react';

interface TopBarProps {
  isMobile: boolean;
  onToggleSidebar: () => void;
  onExport?: () => void;
  onValidate?: () => void;
  onSaveProject?: () => void;
  onLoadProject?: () => void;
  onLogout?: () => void;
  onNewProject?: () => void;
  onJoinCanvas?: (canvas: any) => void;
}

/**
 * Barra superior con botones de acción
 */
const TopBar: React.FC<TopBarProps> = ({
  isMobile,
  onToggleSidebar,
  onExport,
  onValidate,
  onSaveProject,
  onLoadProject,
  onLogout,
  onNewProject,
  onJoinCanvas
}) => {
  // Estilo común para botones
  const buttonStyle = {
    background: '#333',
    color: 'white',
    border: 'none',
    borderRadius: 4,
    padding: isMobile ? '4px 8px' : '6px 14px',
    cursor: 'pointer',
    fontSize: isMobile ? '0.8rem' : '1rem',
    transition: 'background 0.2s',
    margin: isMobile ? '2px 0' : '0'
  };

  const handleShowCode = () => {
    const storedCode = localStorage.getItem('join_code');
    console.log('Botón Mostrar código pulsado. join_code en localStorage:', storedCode);
    if (storedCode) {
      alert(`Código de colaboración: ${storedCode}`);
    } else {
      alert('No hay código disponible para este diagrama.');
    }
  };

  const handleJoinByCode = async () => {
    const code = prompt('Introduce el código de colaboración para unirse:');
    if (!code || !code.trim()) return;
    try {
      const res = await import('../services/api').then(m => m.default.get(`/canvases/join?code=${code.trim()}`));
      const canvas = res.data;
      if (canvas.join_code) {
        localStorage.setItem('join_code', canvas.join_code);
      }
      alert(`Diagrama cargado: ${canvas.name}\nPropietario: ${canvas.owner || 'Desconocido'}\nCódigo: ${canvas.join_code}`);
      if (onJoinCanvas) {
        onJoinCanvas(canvas);
      }
    } catch (e: any) {
      if (e?.response?.status === 404) {
        alert('No se encontró el diagrama con ese código');
      } else {
        alert('Error al conectar con el backend');
      }
    }
  };

  return (
    <>
      <div style={{ 
        width: '100%', 
        background: '#191919', 
        color: 'white', 
        padding: isMobile ? '12px 0 6px 16px' : '18px 0 8px 20px', 
        fontWeight: 'bold', 
        fontSize: isMobile ? '1.3rem' : '1.7rem', 
        textAlign: 'left', 
        letterSpacing: '1px', 
        borderBottom: '1px solid #333', 
        zIndex: 10003,
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center'
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '18px' }}>
          <span>{isMobile ? 'Diseñador DB' : 'Diseñador de Base de Datos'}</span>
          <button onClick={handleShowCode} style={{ background: '#23272a', color: '#4caf50', borderRadius: '6px', padding: '6px 12px', fontSize: '1rem', fontWeight: 500, border: 'none', cursor: 'pointer' }}>
            Mostrar código
          </button>
          <button onClick={handleJoinByCode} style={{ background: '#23272a', color: '#2196f3', borderRadius: '6px', padding: '6px 12px', fontSize: '1rem', fontWeight: 500, border: 'none', cursor: 'pointer' }}>
            Unirse
          </button>
        </div>
        
        <div style={{ display: 'flex', gap: '8px', marginRight: '20px' }}>
          {onNewProject && (
            <button 
              onClick={onNewProject} 
              title="Crear nuevo proyecto"
              style={{ background: 'none', border: 'none', color: 'white', cursor: 'pointer', fontSize: '1rem' }}
            >
              Nuevo
            </button>
          )}

          {onSaveProject && (
            <button 
              onClick={onSaveProject} 
              title="Guardar proyecto"
              style={{ background: 'none', border: 'none', color: 'white', cursor: 'pointer', fontSize: '1rem' }}
            >
              Guardar
            </button>
          )}
          
          {onLoadProject && (
            <button 
              onClick={onLoadProject} 
              title="Cargar proyecto"
              style={{ background: 'none', border: 'none', color: 'white', cursor: 'pointer', fontSize: '1rem' }}
            >
              Cargar
            </button>
          )}

          {onLogout && (
            <button 
              onClick={onLogout} 
              title="Cerrar sesión"
              style={{ background: 'none', border: 'none', color: 'white', cursor: 'pointer', fontSize: '1rem' }}
            >
              Logout
            </button>
          )}
        </div>
      </div>
      
      <div style={{ 
        width: '100%', 
        background: '#222', 
        color: 'white', 
        padding: isMobile ? '6px 16px' : '8px 20px', 
        display: 'flex', 
        gap: isMobile ? 8 : 12, 
        alignItems: 'center', 
        justifyContent: 'flex-start', 
        borderBottom: '1px solid #333', 
        zIndex: 10002, 
        flexWrap: 'wrap'
      }}>
        {/* Grupo de botones principales */}
        <div style={{ display: 'flex', gap: '8px', flexGrow: 1, flexWrap: isMobile ? 'wrap' : 'nowrap' }}>
          {onExport && (
            <button 
              onClick={onExport} 
              style={{...buttonStyle, background: '#4caf50'}}
            >
              {isMobile ? 'Exportar' : 'Exportar proyecto'}
            </button>
          )}
          
          {onValidate && (
            <button 
              onClick={onValidate} 
              style={{...buttonStyle, background: '#2196f3'}}
            >
              {isMobile ? 'Validar' : 'Validar diagrama'}
            </button>
          )}
        </div>
        
        {/* Botón para móviles de mostrar/ocultar sidebar */}
        {isMobile && (
          <button 
            onClick={onToggleSidebar} 
            style={{...buttonStyle, marginLeft: 'auto', background: '#444'}}
          >
            Tablas
          </button>
        )}
      </div>
    </>
  );
};

export default TopBar;
