import React from 'react';
import type { ValidationError } from '../types';

interface ValidationResultsPanelProps {
  visible: boolean;
  isMobile: boolean;
  errors: ValidationError[];
  onClose: () => void;
  onNavigateToError: (error: ValidationError) => void;
}

/**
 * Panel para mostrar resultados de validación y sugerencias de normalización
 */
const ValidationResultsPanel: React.FC<ValidationResultsPanelProps> = ({
  visible,
  isMobile,
  errors,
  onClose,
  onNavigateToError
}) => {
  // Agrupar errores por tipo
  const errorsByType = React.useMemo(() => {
    const grouped = {
      ERROR: [] as ValidationError[],
      WARNING: [] as ValidationError[],
      INFO: [] as ValidationError[]
    };

    errors.forEach(error => {
      if (error.type === 'ERROR' || error.type === 'WARNING' || error.type === 'INFO') {
        grouped[error.type].push(error);
      }
    });

    return grouped;
  }, [errors]);

  if (!visible) return null;

  // Determinar si hay errores
  const hasErrors = errorsByType.ERROR.length > 0;
  // Determinar si hay advertencias
  const hasWarnings = errorsByType.WARNING.length > 0;
  // Determinar si hay sugerencias
  const hasInfo = errorsByType.INFO.length > 0;

  return (
    <div style={{ position: 'fixed', top: isMobile ? 0 : 'auto', bottom: isMobile ? 0 : '20px', right: '20px', width: isMobile ? '100vw' : '400px', maxHeight: isMobile ? '100vh' : 'calc(100vh - 160px)', background: '#222', color: 'white', boxShadow: '0 2px 10px rgba(0,0,0,0.3)', borderRadius: isMobile ? '0' : '8px', zIndex: 10001, display: 'flex', flexDirection: 'column' }}>
      <div style={{ padding: '12px 16px', borderBottom: '1px solid #444', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <h2 style={{ margin: 0, fontSize: '1rem' }}>
          Resultados de validación
        </h2>
        <button
          onClick={onClose}
          style={{ background: 'none', border: 'none', color: 'white', cursor: 'pointer', fontSize: '1.2rem' }}
        >
          ✕
        </button>
      </div>

      <div style={{ padding: '16px', overflowY: 'auto', flex: 1 }}>
        {/* Resumen */}
        <div style={{ marginBottom: '20px' }}>
          <div style={{ display: 'flex', gap: '12px', marginBottom: '8px' }}>
            <span style={{ background: hasErrors ? '#f44336' : '#666', padding: '4px 8px', borderRadius: '4px', fontSize: '0.8rem' }}>
              {errorsByType.ERROR.length} Errores
            </span>
            <span style={{ background: hasWarnings ? '#ff9800' : '#666', padding: '4px 8px', borderRadius: '4px', fontSize: '0.8rem' }}>
              {errorsByType.WARNING.length} Advertencias
            </span>
            <span style={{ background: hasInfo ? '#2196f3' : '#666', padding: '4px 8px', borderRadius: '4px', fontSize: '0.8rem' }}>
              {errorsByType.INFO.length} Sugerencias
            </span>
          </div>

          {hasErrors && (
            <p style={{ fontSize: '0.9rem', marginTop: '8px', color: '#f44336' }}>
              Hay errores que deben ser corregidos
            </p>
          )}
        </div>

        {/* Errores */}
        {hasErrors && (
          <div style={{ marginBottom: '20px' }}>
            <h3 style={{ fontSize: '1rem', marginBottom: '8px', color: '#f44336' }}>Errores</h3>
            {errorsByType.ERROR.map((error, index) => (
              <div key={`error-${index}`} style={{ background: 'rgba(244, 67, 54, 0.1)', padding: '12px', borderRadius: '4px', marginBottom: '8px', borderLeft: '3px solid #f44336' }}>
                <p style={{ margin: '0 0 8px 0', fontWeight: 'bold' }}>{error.message}</p>
                {error.suggestion && (
                  <p style={{ margin: '0 0 8px 0', fontSize: '0.9rem' }}>
                    <strong>Sugerencia:</strong> {error.suggestion}
                  </p>
                )}
                <button
                  onClick={() => onNavigateToError(error)}
                  style={{ background: 'none', border: '1px solid #f44336', color: '#f44336', padding: '4px 8px', borderRadius: '4px', cursor: 'pointer', fontSize: '0.8rem', marginTop: '4px' }}
                >
                  Ir al elemento
                </button>
              </div>
            ))}
          </div>
        )}

        {/* Advertencias */}
        {hasWarnings && (
          <div style={{ marginBottom: '20px' }}>
            <h3 style={{ fontSize: '1rem', marginBottom: '8px', color: '#ff9800' }}>Advertencias</h3>
            {errorsByType.WARNING.map((error, index) => (
              <div key={`warning-${index}`} style={{ background: 'rgba(255, 152, 0, 0.1)', padding: '12px', borderRadius: '4px', marginBottom: '8px', borderLeft: '3px solid #ff9800' }}>
                <p style={{ margin: '0 0 8px 0', fontWeight: 'bold' }}>{error.message}</p>
                {error.suggestion && (
                  <p style={{ margin: '0 0 8px 0', fontSize: '0.9rem' }}>
                    <strong>Sugerencia:</strong> {error.suggestion}
                  </p>
                )}
                <button
                  onClick={() => onNavigateToError(error)}
                  style={{ background: 'none', border: '1px solid #ff9800', color: '#ff9800', padding: '4px 8px', borderRadius: '4px', cursor: 'pointer', fontSize: '0.8rem', marginTop: '4px' }}
                >
                  Ir al elemento
                </button>
              </div>
            ))}
          </div>
        )}

        {/* Información/Sugerencias */}
        {hasInfo && (
          <div>
            <h3 style={{ fontSize: '1rem', marginBottom: '8px', color: '#2196f3' }}>Sugerencias de normalización</h3>
            {errorsByType.INFO.map((error, index) => (
              <div key={`info-${index}`} style={{ background: 'rgba(33, 150, 243, 0.1)', padding: '12px', borderRadius: '4px', marginBottom: '8px', borderLeft: '3px solid #2196f3' }}>
                <p style={{ margin: '0 0 8px 0', fontWeight: 'bold' }}>{error.message}</p>
                {error.suggestion && (
                  <p style={{ margin: '0 0 8px 0', fontSize: '0.9rem' }}>
                    <strong>Sugerencia:</strong> {error.suggestion}
                  </p>
                )}
                <button
                  onClick={() => onNavigateToError(error)}
                  style={{ background: 'none', border: '1px solid #2196f3', color: '#2196f3', padding: '4px 8px', borderRadius: '4px', cursor: 'pointer', fontSize: '0.8rem', marginTop: '4px' }}
                >
                  Ir al elemento
                </button>
              </div>
            ))}
          </div>
        )}

        {/* Mensaje si no hay problemas */}
        {!hasErrors && !hasWarnings && !hasInfo && (
          <p style={{ textAlign: 'center', padding: '20px 0' }}>
            No se encontraron problemas en el diagrama. ¡Todo está correcto!
          </p>
        )}
      </div>
    </div>
  );
};

export default ValidationResultsPanel;
