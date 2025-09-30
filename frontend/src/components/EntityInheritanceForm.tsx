import React from 'react';
import type { TableEntity } from '../types';
import { INHERITANCE_STRATEGIES, DISCRIMINATOR_TYPES } from '../constants';

interface EntityInheritanceFormProps {
  visible: boolean;
  isMobile: boolean;
  tables: TableEntity[];
  selectedTable: TableEntity;
  onSave: (updatedTable: Partial<TableEntity>) => void;
  onCancel: () => void;
}

/**
 * Formulario para configurar la herencia de entidades
 */
const EntityInheritanceForm: React.FC<EntityInheritanceFormProps> = ({
  visible,
  isMobile,
  tables,
  selectedTable,
  onSave,
  onCancel
}) => {
  const [isAbstract, setIsAbstract] = React.useState<boolean>(selectedTable.isAbstract || false);
  const [inheritanceType, setInheritanceType] = React.useState<string>(selectedTable.inheritanceType || INHERITANCE_STRATEGIES.SINGLE_TABLE);
  const [parentTable, setParentTable] = React.useState<string>(selectedTable.parentTable || '');
  const [discriminatorColumn, setDiscriminatorColumn] = React.useState<string>(selectedTable.discriminatorColumn || 'dtype');
  const [discriminatorType, setDiscriminatorType] = React.useState<string>(selectedTable.discriminatorType || DISCRIMINATOR_TYPES.STRING);
  const [discriminatorValue, setDiscriminatorValue] = React.useState<string>(selectedTable.discriminatorValue || selectedTable.name.toLowerCase());

  // Lista de tablas que pueden ser padres (excluye la tabla actual)
  const potentialParentTables = tables.filter(t => t.id !== selectedTable.id);

  // Determina si este formulario configura una tabla raíz o una tabla hija
  const isRootEntity = !parentTable;

  const handleSave = () => {
    const updatedTable: Partial<TableEntity> = {
      isAbstract,
      parentTable: parentTable || undefined
    };

    // Si es entidad raíz con herencia, configurar discriminador
    if (isRootEntity && !isAbstract) {
      updatedTable.inheritanceType = inheritanceType;
      updatedTable.discriminatorColumn = discriminatorColumn;
      updatedTable.discriminatorType = discriminatorType;
    }

    // Si es entidad hija, configurar valor discriminador
    if (!isRootEntity) {
      updatedTable.discriminatorValue = discriminatorValue;
    }

    onSave(updatedTable);
  };

  if (!visible) return null;

  return (
    <div style={{ position: 'fixed', top: 0, left: 0, width: '100vw', height: '100vh', background: 'rgba(0,0,0,0.4)', zIndex: 10001, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: isMobile ? '20px' : '0' }}>
      <div style={{ background: '#222', padding: isMobile ? '20px' : '24px', borderRadius: '8px', minWidth: isMobile ? 'calc(100% - 40px)' : '320px', maxWidth: isMobile ? 'calc(100% - 40px)' : '500px', color: 'white', boxShadow: '0 2px 10px rgba(0,0,0,0.3)', maxHeight: '90vh', overflowY: 'auto' }}>
        <h2 style={{ marginBottom: '16px', fontSize: isMobile ? '1.1rem' : '1.2rem' }}>
          Configurar herencia para: {selectedTable.name}
        </h2>
        
        {/* Clase abstracta */}
        <div style={{ marginBottom: '12px' }}>
          <label style={{ display: 'flex', alignItems: 'center', fontSize: isMobile ? '14px' : '16px' }}>
            <input
              type="checkbox"
              checked={isAbstract}
              onChange={(e) => setIsAbstract(e.target.checked)}
              style={{ marginRight: '8px' }}
            />
            Clase abstracta (@MappedSuperclass)
          </label>
        </div>

        {/* Tabla padre */}
        <div style={{ marginBottom: '12px' }}>
          <label style={{ display: 'block', fontSize: isMobile ? '14px' : '16px', marginBottom: '4px' }}>
            Tabla padre:
          </label>
          <select
            value={parentTable}
            onChange={(e) => setParentTable(e.target.value)}
            style={{ width: '100%', padding: isMobile ? '6px' : '8px', borderRadius: '4px', border: '1px solid #555', background: '#333', color: 'white', fontSize: isMobile ? '14px' : '16px' }}
          >
            <option value="">Ninguna (es entidad raíz)</option>
            {potentialParentTables.map(table => (
              <option key={table.id} value={table.id}>
                {table.name}
              </option>
            ))}
          </select>
        </div>

        {/* Si es entidad raíz, mostrar configuración de estrategia de herencia */}
        {isRootEntity && !isAbstract && (
          <>
            <div style={{ marginBottom: '12px' }}>
              <label style={{ display: 'block', fontSize: isMobile ? '14px' : '16px', marginBottom: '4px' }}>
                Estrategia de herencia:
              </label>
              <select
                value={inheritanceType}
                onChange={(e) => setInheritanceType(e.target.value)}
                style={{ width: '100%', padding: isMobile ? '6px' : '8px', borderRadius: '4px', border: '1px solid #555', background: '#333', color: 'white', fontSize: isMobile ? '14px' : '16px' }}
              >
                <option value={INHERITANCE_STRATEGIES.SINGLE_TABLE}>SINGLE_TABLE (Tabla única)</option>
                <option value={INHERITANCE_STRATEGIES.JOINED}>JOINED (Tablas unidas)</option>
                <option value={INHERITANCE_STRATEGIES.TABLE_PER_CLASS}>TABLE_PER_CLASS (Tabla por clase)</option>
              </select>
            </div>

            <div style={{ marginBottom: '12px' }}>
              <label style={{ display: 'block', fontSize: isMobile ? '14px' : '16px', marginBottom: '4px' }}>
                Columna discriminadora:
              </label>
              <input
                type="text"
                value={discriminatorColumn}
                onChange={(e) => setDiscriminatorColumn(e.target.value)}
                style={{ width: '100%', padding: isMobile ? '6px' : '8px', borderRadius: '4px', border: '1px solid #555', background: '#333', color: 'white', fontSize: isMobile ? '14px' : '16px' }}
              />
            </div>

            <div style={{ marginBottom: '12px' }}>
              <label style={{ display: 'block', fontSize: isMobile ? '14px' : '16px', marginBottom: '4px' }}>
                Tipo de discriminador:
              </label>
              <select
                value={discriminatorType}
                onChange={(e) => setDiscriminatorType(e.target.value)}
                style={{ width: '100%', padding: isMobile ? '6px' : '8px', borderRadius: '4px', border: '1px solid #555', background: '#333', color: 'white', fontSize: isMobile ? '14px' : '16px' }}
              >
                <option value={DISCRIMINATOR_TYPES.STRING}>String</option>
                <option value={DISCRIMINATOR_TYPES.CHAR}>Character</option>
                <option value={DISCRIMINATOR_TYPES.INTEGER}>Integer</option>
                <option value={DISCRIMINATOR_TYPES.LONG}>Long</option>
              </select>
            </div>
          </>
        )}

        {/* Si es entidad hija, mostrar valor discriminador */}
        {!isRootEntity && (
          <div style={{ marginBottom: '12px' }}>
            <label style={{ display: 'block', fontSize: isMobile ? '14px' : '16px', marginBottom: '4px' }}>
              Valor discriminador:
            </label>
            <input
              type="text"
              value={discriminatorValue}
              onChange={(e) => setDiscriminatorValue(e.target.value)}
              style={{ width: '100%', padding: isMobile ? '6px' : '8px', borderRadius: '4px', border: '1px solid #555', background: '#333', color: 'white', fontSize: isMobile ? '14px' : '16px' }}
            />
          </div>
        )}

        {/* Botones */}
        <div style={{ marginTop: '24px', display: 'flex', justifyContent: 'flex-end', gap: '12px' }}>
          <button
            onClick={onCancel}
            style={{ padding: '8px 16px', background: '#444', color: 'white', border: 'none', borderRadius: '4px', cursor: 'pointer' }}
          >
            Cancelar
          </button>
          <button
            onClick={handleSave}
            style={{ padding: '8px 16px', background: '#4CAF50', color: 'white', border: 'none', borderRadius: '4px', cursor: 'pointer' }}
          >
            Guardar
          </button>
        </div>
      </div>
    </div>
  );
};

export default EntityInheritanceForm;
