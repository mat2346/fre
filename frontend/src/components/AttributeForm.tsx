import React from 'react';
import type { Attribute } from '../types';


interface AttributeFormProps {
  isMobile: boolean;
  visible: boolean;
  attribute: Attribute;
  setAttributeField: (field: string, value: any) => void;
  onCancel: () => void;
  onSave: () => void;
  isEdit?: boolean;
}

/**
 * Formulario mejorado para crear o editar atributos de una tabla
 * Incluye opciones para restricciones como PK, NOT NULL, UNIQUE, etc.
 */
const AttributeForm: React.FC<AttributeFormProps> = ({
  isMobile,
  visible,
  attribute,
  setAttributeField,
  onCancel,
  onSave,
  isEdit = false
}) => {
  if (!visible) return null;

  return (
    <div style={{ position: 'fixed', top: 0, left: 0, width: '100vw', height: '100vh', background: 'rgba(0,0,0,0.4)', zIndex: 10001, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: isMobile ? '20px' : '0' }}>
      <div style={{ background: '#222', padding: isMobile ? '20px' : '24px', borderRadius: '8px', minWidth: isMobile ? 'calc(100% - 40px)' : '320px', maxWidth: isMobile ? 'calc(100% - 40px)' : '400px', color: 'white', boxShadow: '0 2px 10px rgba(0,0,0,0.3)' }}>
        <h2 style={{ marginBottom: '16px', fontSize: isMobile ? '1.1rem' : '1.2rem' }}>
          {isEdit ? 'Editar atributo' : 'Nuevo atributo'}
        </h2>
        
        {/* Nombre del atributo */}
        <div style={{ marginBottom: '12px' }}>
          <label style={{ display: 'block', fontSize: isMobile ? '14px' : '16px', marginBottom: '4px' }}>
            Nombre:
          </label>
          <input
            type="text"
            value={attribute.name}
            onChange={(e) => setAttributeField('name', e.target.value)}
            style={{ width: '100%', padding: isMobile ? '6px' : '8px', borderRadius: '4px', border: '1px solid #555', background: '#333', color: 'white', fontSize: isMobile ? '14px' : '16px' }}
            autoFocus
          />
        </div>
        
        {/* Tipo de dato */}
        <div style={{ marginBottom: '12px' }}>
          <label style={{ display: 'block', fontSize: isMobile ? '14px' : '16px', marginBottom: '4px' }}>
            Tipo:
          </label>
          <input
            type="text"
            value={attribute.type}
            onChange={(e) => setAttributeField('type', e.target.value)}
            style={{ width: '100%', padding: isMobile ? '6px' : '8px', borderRadius: '4px', border: '1px solid #555', background: '#333', color: 'white', fontSize: isMobile ? '14px' : '16px' }}
            placeholder="String, Integer, Long, etc."
          />
        </div>
        
        {/* Restricciones */}
        <div style={{ marginBottom: '16px' }}>
          <label style={{ display: 'block', fontSize: isMobile ? '14px' : '16px', marginBottom: '8px' }}>
            Restricciones:
          </label>
          
          {/* Clave primaria */}
          <div style={{ marginBottom: '8px', display: 'flex', alignItems: 'center' }}>
            <input
              type="checkbox"
              id="isPrimaryKey"
              checked={attribute.isPrimaryKey}
              onChange={(e) => setAttributeField('isPrimaryKey', e.target.checked)}
              style={{ marginRight: '8px' }}
            />
            <label htmlFor="isPrimaryKey" style={{ fontSize: isMobile ? '14px' : '16px', cursor: 'pointer' }}>
              Clave primaria
            </label>
          </div>
          
          {/* NOT NULL */}
          <div style={{ marginBottom: '8px', display: 'flex', alignItems: 'center' }}>
            <input
              type="checkbox"
              id="isNullable"
              checked={!attribute.isNullable}
              onChange={(e) => setAttributeField('isNullable', !e.target.checked)}
              style={{ marginRight: '8px' }}
            />
            <label htmlFor="isNullable" style={{ fontSize: isMobile ? '14px' : '16px', cursor: 'pointer' }}>
              NOT NULL
            </label>
          </div>
          
          {/* UNIQUE */}
          <div style={{ marginBottom: '8px', display: 'flex', alignItems: 'center' }}>
            <input
              type="checkbox"
              id="isUnique"
              checked={attribute.isUnique}
              onChange={(e) => setAttributeField('isUnique', e.target.checked)}
              style={{ marginRight: '8px' }}
            />
            <label htmlFor="isUnique" style={{ fontSize: isMobile ? '14px' : '16px', cursor: 'pointer' }}>
              UNIQUE
            </label>
          </div>
        </div>
        
        {/* Valor por defecto */}
        <div style={{ marginBottom: '12px' }}>
          <label style={{ display: 'block', fontSize: isMobile ? '14px' : '16px', marginBottom: '4px' }}>
            Valor por defecto:
          </label>
          <input
            type="text"
            value={attribute.defaultValue || ''}
            onChange={(e) => setAttributeField('defaultValue', e.target.value)}
            style={{ width: '100%', padding: isMobile ? '6px' : '8px', borderRadius: '4px', border: '1px solid #555', background: '#333', color: 'white', fontSize: isMobile ? '14px' : '16px' }}
            placeholder="(Opcional)"
          />
        </div>
        
        {/* Comentario */}
        <div style={{ marginBottom: '16px' }}>
          <label style={{ display: 'block', fontSize: isMobile ? '14px' : '16px', marginBottom: '4px' }}>
            Comentario:
          </label>
          <textarea
            value={attribute.comment || ''}
            onChange={(e) => setAttributeField('comment', e.target.value)}
            style={{ width: '100%', padding: isMobile ? '6px' : '8px', borderRadius: '4px', border: '1px solid #555', background: '#333', color: 'white', fontSize: isMobile ? '14px' : '16px', minHeight: '60px', resize: 'vertical' }}
            placeholder="Descripción o documentación (opcional)"
          />
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
            onClick={onSave}
            style={{ padding: isMobile ? '8px' : '8px 16px', background: '#4CAF50', color: 'white', border: 'none', borderRadius: '4px', cursor: 'pointer', fontSize: isMobile ? '14px' : '16px' }}
          >
            {isEdit ? 'Actualizar' : 'Agregar'}
          </button>
        </div>
      </div>
    </div>
  );
};

export default AttributeForm;
