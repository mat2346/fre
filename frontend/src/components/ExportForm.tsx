import React from 'react';
import type { DiagramData, ExportOptions } from '../types';
import { DATABASE_PLATFORMS, PDF_THEMES } from '../constants';

interface ExportFormProps {
  visible: boolean;
  isMobile: boolean;
  onExport: (options: ExportOptions) => void;
  onCancel: () => void;
  diagramData: DiagramData;
}

/**
 * Formulario para configurar opciones de exportación (SQL, Java, PDF)
 */
const ExportForm: React.FC<ExportFormProps> = ({
  visible,
  isMobile,
  onExport,
  onCancel,
  diagramData
}) => {
  // Opciones de exportación
  const [options, setOptions] = React.useState<ExportOptions>({
    includeEntities: true,
    includeRepositories: true,
    includeServices: true,
    includeDtos: false,
    includeControllers: false,
    database: DATABASE_PLATFORMS.POSTGRESQL,
    generatePdf: true,
    pdfTheme: PDF_THEMES.DEFAULT
  });

  const updateOption = (field: keyof ExportOptions, value: any) => {
    setOptions(prev => ({ ...prev, [field]: value }));
  };

  const handleSubmit = () => {
    onExport(options);
  };

  if (!visible) return null;

  return (
    <div style={{ position: 'fixed', top: 0, left: 0, width: '100vw', height: '100vh', background: 'rgba(0,0,0,0.4)', zIndex: 10001, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: isMobile ? '20px' : '0' }}>
      <div style={{ background: '#222', padding: isMobile ? '20px' : '24px', borderRadius: '8px', minWidth: isMobile ? 'calc(100% - 40px)' : '320px', maxWidth: isMobile ? 'calc(100% - 40px)' : '550px', width: '100%', color: 'white', boxShadow: '0 2px 10px rgba(0,0,0,0.3)', maxHeight: '90vh', overflowY: 'auto' }}>
        <h2 style={{ marginBottom: '16px', fontSize: isMobile ? '1.1rem' : '1.2rem' }}>
          Exportar diagrama: {diagramData.name}
        </h2>

        <div style={{ marginBottom: '16px' }}>
          <h3 style={{ fontSize: isMobile ? '1rem' : '1.1rem', marginBottom: '8px' }}>
            Base de datos
          </h3>

          <label style={{ display: 'block', fontSize: isMobile ? '14px' : '16px', marginBottom: '4px' }}>
            Tipo de base de datos:
          </label>
          <select
            value={options.database}
            onChange={(e) => updateOption('database', e.target.value)}
            style={{ width: '100%', padding: isMobile ? '6px' : '8px', borderRadius: '4px', border: '1px solid #555', background: '#333', color: 'white', fontSize: isMobile ? '14px' : '16px', marginBottom: '12px' }}
          >
            <option value={DATABASE_PLATFORMS.POSTGRESQL}>{DATABASE_PLATFORMS.POSTGRESQL}</option>
            <option value={DATABASE_PLATFORMS.MYSQL}>{DATABASE_PLATFORMS.MYSQL}</option>
            <option value={DATABASE_PLATFORMS.H2}>{DATABASE_PLATFORMS.H2}</option>
          </select>
        </div>

        <div style={{ marginBottom: '16px' }}>
          <h3 style={{ fontSize: isMobile ? '1rem' : '1.1rem', marginBottom: '8px' }}>
            Código Java a generar
          </h3>

          <div style={{ marginBottom: '8px', display: 'flex', alignItems: 'center' }}>
            <input
              type="checkbox"
              id="includeEntities"
              checked={options.includeEntities}
              onChange={(e) => updateOption('includeEntities', e.target.checked)}
              style={{ marginRight: '8px' }}
            />
            <label htmlFor="includeEntities" style={{ fontSize: isMobile ? '14px' : '16px', cursor: 'pointer' }}>
              Entidades JPA
            </label>
          </div>

          <div style={{ marginBottom: '8px', display: 'flex', alignItems: 'center' }}>
            <input
              type="checkbox"
              id="includeRepositories"
              checked={options.includeRepositories}
              onChange={(e) => updateOption('includeRepositories', e.target.checked)}
              style={{ marginRight: '8px' }}
            />
            <label htmlFor="includeRepositories" style={{ fontSize: isMobile ? '14px' : '16px', cursor: 'pointer' }}>
              Repositorios JPA
            </label>
          </div>

          <div style={{ marginBottom: '8px', display: 'flex', alignItems: 'center' }}>
            <input
              type="checkbox"
              id="includeServices"
              checked={options.includeServices}
              onChange={(e) => updateOption('includeServices', e.target.checked)}
              style={{ marginRight: '8px' }}
            />
            <label htmlFor="includeServices" style={{ fontSize: isMobile ? '14px' : '16px', cursor: 'pointer' }}>
              Servicios CRUD
            </label>
          </div>

          <div style={{ marginBottom: '8px', display: 'flex', alignItems: 'center' }}>
            <input
              type="checkbox"
              id="includeDtos"
              checked={options.includeDtos}
              onChange={(e) => updateOption('includeDtos', e.target.checked)}
              style={{ marginRight: '8px' }}
            />
            <label htmlFor="includeDtos" style={{ fontSize: isMobile ? '14px' : '16px', cursor: 'pointer' }}>
              DTOs
            </label>
          </div>

          <div style={{ marginBottom: '8px', display: 'flex', alignItems: 'center' }}>
            <input
              type="checkbox"
              id="includeControllers"
              checked={options.includeControllers}
              onChange={(e) => updateOption('includeControllers', e.target.checked)}
              style={{ marginRight: '8px' }}
            />
            <label htmlFor="includeControllers" style={{ fontSize: isMobile ? '14px' : '16px', cursor: 'pointer' }}>
              Controladores REST
            </label>
          </div>
        </div>

        <div style={{ marginBottom: '16px' }}>
          <h3 style={{ fontSize: isMobile ? '1rem' : '1.1rem', marginBottom: '8px' }}>
            PDF
          </h3>

          <div style={{ marginBottom: '12px', display: 'flex', alignItems: 'center' }}>
            <input
              type="checkbox"
              id="generatePdf"
              checked={options.generatePdf}
              onChange={(e) => updateOption('generatePdf', e.target.checked)}
              style={{ marginRight: '8px' }}
            />
            <label htmlFor="generatePdf" style={{ fontSize: isMobile ? '14px' : '16px', cursor: 'pointer' }}>
              Generar PDF con diagrama y código
            </label>
          </div>

          {options.generatePdf && (
            <div style={{ marginBottom: '12px' }}>
              <label style={{ display: 'block', fontSize: isMobile ? '14px' : '16px', marginBottom: '4px' }}>
                Tema del PDF:
              </label>
              <select
                value={options.pdfTheme}
                onChange={(e) => updateOption('pdfTheme', e.target.value)}
                style={{ width: '100%', padding: isMobile ? '6px' : '8px', borderRadius: '4px', border: '1px solid #555', background: '#333', color: 'white', fontSize: isMobile ? '14px' : '16px' }}
              >
                <option value={PDF_THEMES.DEFAULT}>Estándar</option>
                <option value={PDF_THEMES.DARK}>Oscuro</option>
                <option value={PDF_THEMES.LIGHT}>Claro</option>
                <option value={PDF_THEMES.COLORFUL}>Colorido</option>
              </select>
            </div>
          )}
        </div>

        {/* Botones */}
        <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '8px', flexDirection: isMobile ? 'column' : 'row' }}>
          <button
            onClick={onCancel}
            style={{ padding: isMobile ? '8px' : '8px 16px', background: '#555', color: 'white', border: 'none', borderRadius: '4px', cursor: 'pointer', fontSize: isMobile ? '14px' : '16px' }}
          >
            Cancelar
          </button>
          <button
            onClick={handleSubmit}
            style={{ padding: isMobile ? '8px' : '8px 16px', background: '#4CAF50', color: 'white', border: 'none', borderRadius: '4px', cursor: 'pointer', fontSize: isMobile ? '14px' : '16px' }}
          >
            Exportar
          </button>
        </div>
      </div>
    </div>
  );
};

export default ExportForm;
