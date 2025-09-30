import React from 'react';
import type { TableEntity, Relation } from '../types';
import { RELATION_TYPES } from '../constants';

interface RelationFormProps {
  visible: boolean;
  isMobile: boolean;
  tables: TableEntity[];
  onSave: (relation: Partial<Relation>) => void;
  onCancel: () => void;
  initialRelation?: Partial<Relation>;
}

/**
 * Formulario para crear o editar relaciones entre tablas
 */
const RelationshipForm: React.FC<RelationFormProps> = ({
  visible,
  isMobile,
  tables,
  onSave,
  onCancel,
  initialRelation
}) => {
  const [sourceTableId, setSourceTableId] = React.useState<string>(initialRelation?.sourceTableId || '');
  const [targetTableId, setTargetTableId] = React.useState<string>(initialRelation?.targetTableId || '');
  const [sourceAttribute, setSourceAttribute] = React.useState<string>(initialRelation?.sourceAttribute || '');
  const [targetAttribute, setTargetAttribute] = React.useState<string>(initialRelation?.targetAttribute || '');
  const [relationType, setRelationType] = React.useState<string>(initialRelation?.relationType || RELATION_TYPES.ONE_TO_MANY);
  const [relationName, setRelationName] = React.useState<string>(initialRelation?.name || '');

  const sourceTable = tables.find(t => t.id === sourceTableId);
  const targetTable = tables.find(t => t.id === targetTableId);

  const handleSave = () => {
    if (!sourceTableId || !targetTableId || !relationType) {
      alert('Por favor seleccione tablas origen y destino, y tipo de relación');
      return;
    }

    // Solo requerimos los atributos cuando no son relaciones many-to-many
    if (relationType !== RELATION_TYPES.MANY_TO_MANY && (!sourceAttribute || !targetAttribute)) {
      alert('Por favor seleccione atributos para la relación');
      return;
    }

    // Incluir el ID original si estamos editando una relación existente
    const payload = {
      id: initialRelation?.id,
      sourceTableId,
      targetTableId,
      sourceAttribute,
      targetAttribute,
      relationType,
      name: relationName
    };

    console.log('RelationshipForm: guardando relación con payload:', payload);

    onSave(payload);
  };

  if (!visible) return null;

  return (
    <div style={{ position: 'fixed', top: 0, left: 0, width: '100vw', height: '100vh', background: 'rgba(0,0,0,0.4)', zIndex: 10001, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: isMobile ? '20px' : '0' }}>
      <div style={{ background: '#222', padding: isMobile ? '20px' : '24px', borderRadius: '8px', minWidth: isMobile ? 'calc(100% - 40px)' : '320px', maxWidth: isMobile ? 'calc(100% - 40px)' : '500px', color: 'white', boxShadow: '0 2px 10px rgba(0,0,0,0.3)' }}>
        <h2 style={{ marginBottom: '16px', fontSize: isMobile ? '1.1rem' : '1.2rem' }}>
          {initialRelation ? 'Editar relación' : 'Nueva relación'}
        </h2>

        {/* Nombre de la relación (opcional) */}
        <div style={{ marginBottom: '16px' }}>
          <label style={{ display: 'block', fontSize: isMobile ? '14px' : '16px', marginBottom: '4px' }}>
            Nombre de la relación:
          </label>
          <input
            type="text"
            value={relationName}
            onChange={(e) => setRelationName(e.target.value)}
            style={{ width: '100%', padding: isMobile ? '6px' : '8px', borderRadius: '4px', border: '1px solid #555', background: '#333', color: 'white', fontSize: isMobile ? '14px' : '16px' }}
            placeholder="(Opcional) Nombre descriptivo"
          />
        </div>

        {/* Tipo de relación */}
        <div style={{ marginBottom: '16px' }}>
          <label style={{ display: 'block', fontSize: isMobile ? '14px' : '16px', marginBottom: '4px' }}>
            Tipo de relación:
          </label>
          <select
            value={relationType}
            onChange={(e) => setRelationType(e.target.value)}
            style={{ width: '100%', padding: isMobile ? '6px' : '8px', borderRadius: '4px', border: '1px solid #555', background: '#333', color: 'white', fontSize: isMobile ? '14px' : '16px' }}
          >
            <option value={RELATION_TYPES.ONE_TO_ONE}>Uno a Uno (OneToOne)</option>
            <option value={RELATION_TYPES.ONE_TO_MANY}>Uno a Muchos (OneToMany)</option>
            <option value={RELATION_TYPES.MANY_TO_ONE}>Muchos a Uno (ManyToOne)</option>
            <option value={RELATION_TYPES.MANY_TO_MANY}>Muchos a Muchos (ManyToMany)</option>
          </select>
        </div>

        <div style={{ display: 'flex', flexDirection: isMobile ? 'column' : 'row', gap: '16px', marginBottom: '16px' }}>
          {/* Tabla origen */}
          <div style={{ flex: 1 }}>
            <label style={{ display: 'block', fontSize: isMobile ? '14px' : '16px', marginBottom: '4px' }}>
              Tabla origen:
            </label>
            <select
              value={sourceTableId}
              onChange={(e) => {
                setSourceTableId(e.target.value);
                setSourceAttribute(''); // Resetear atributo al cambiar tabla
              }}
              style={{ width: '100%', padding: isMobile ? '6px' : '8px', borderRadius: '4px', border: '1px solid #555', background: '#333', color: 'white', fontSize: isMobile ? '14px' : '16px' }}
            >
              <option value="">Seleccionar tabla</option>
              {tables.map(table => (
                <option key={table.id} value={table.id}>{table.name}</option>
              ))}
            </select>
          </div>

          {/* Tabla destino */}
          <div style={{ flex: 1 }}>
            <label style={{ display: 'block', fontSize: isMobile ? '14px' : '16px', marginBottom: '4px' }}>
              Tabla destino:
            </label>
            <select
              value={targetTableId}
              onChange={(e) => {
                setTargetTableId(e.target.value);
                setTargetAttribute(''); // Resetear atributo al cambiar tabla
              }}
              style={{ width: '100%', padding: isMobile ? '6px' : '8px', borderRadius: '4px', border: '1px solid #555', background: '#333', color: 'white', fontSize: isMobile ? '14px' : '16px' }}
            >
              <option value="">Seleccionar tabla</option>
              {tables.filter(t => t.id !== sourceTableId).map(table => (
                <option key={table.id} value={table.id}>{table.name}</option>
              ))}
            </select>
          </div>
        </div>

        <div style={{ display: 'flex', flexDirection: isMobile ? 'column' : 'row', gap: '16px', marginBottom: '16px' }}>
          {/* Atributo origen */}
          <div style={{ flex: 1 }}>
            <label style={{ display: 'block', fontSize: isMobile ? '14px' : '16px', marginBottom: '4px' }}>
              Atributo origen:
            </label>
            <select
              value={sourceAttribute}
              onChange={(e) => setSourceAttribute(e.target.value)}
              disabled={!sourceTableId}
              style={{ width: '100%', padding: isMobile ? '6px' : '8px', borderRadius: '4px', border: '1px solid #555', background: '#333', color: 'white', fontSize: isMobile ? '14px' : '16px' }}
            >
              <option value="">Seleccionar atributo</option>
              {sourceTable?.attributes.map(attr => (
                <option key={attr.name} value={attr.name}>{attr.name}</option>
              ))}
            </select>
          </div>

          {/* Atributo destino */}
          <div style={{ flex: 1 }}>
            <label style={{ display: 'block', fontSize: isMobile ? '14px' : '16px', marginBottom: '4px' }}>
              Atributo destino:
            </label>
            <select
              value={targetAttribute}
              onChange={(e) => setTargetAttribute(e.target.value)}
              disabled={!targetTableId}
              style={{ width: '100%', padding: isMobile ? '6px' : '8px', borderRadius: '4px', border: '1px solid #555', background: '#333', color: 'white', fontSize: isMobile ? '14px' : '16px' }}
            >
              <option value="">Seleccionar atributo</option>
              {targetTable?.attributes.map(attr => (
                <option key={attr.name} value={attr.name}>{attr.name}</option>
              ))}
            </select>
          </div>
        </div>

        {/* Descripción de la relación según el tipo seleccionado */}
        <div style={{ background: '#333', padding: '12px', borderRadius: '4px', marginBottom: '20px', fontSize: isMobile ? '13px' : '14px' }}>
          {relationType === RELATION_TYPES.ONE_TO_ONE && (
            <p>La tabla {sourceTable?.name || 'origen'} tendrá una relación uno a uno con {targetTable?.name || 'destino'}. Cada registro en {sourceTable?.name || 'origen'} se relaciona con exactamente un registro en {targetTable?.name || 'destino'}.</p>
          )}
          {relationType === RELATION_TYPES.ONE_TO_MANY && (
            <p>La tabla {sourceTable?.name || 'origen'} tendrá una relación uno a muchos con {targetTable?.name || 'destino'}. Cada registro en {sourceTable?.name || 'origen'} puede tener muchos registros relacionados en {targetTable?.name || 'destino'}.</p>
          )}
          {relationType === RELATION_TYPES.MANY_TO_ONE && (
            <p>La tabla {sourceTable?.name || 'origen'} tendrá una relación muchos a uno con {targetTable?.name || 'destino'}. Muchos registros en {sourceTable?.name || 'origen'} pueden relacionarse con un único registro en {targetTable?.name || 'destino'}.</p>
          )}
          {relationType === RELATION_TYPES.MANY_TO_MANY && (
            <p>La tabla {sourceTable?.name || 'origen'} tendrá una relación muchos a muchos con {targetTable?.name || 'destino'}. Se creará una tabla intermedia para gestionar esta relación.</p>
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
            onClick={handleSave}
            style={{ padding: isMobile ? '8px' : '8px 16px', background: '#4CAF50', color: 'white', border: 'none', borderRadius: '4px', cursor: 'pointer', fontSize: isMobile ? '14px' : '16px' }}
          >
            {initialRelation ? 'Actualizar' : 'Crear'}
          </button>
        </div>
      </div>
    </div>
  );
};

export default RelationshipForm;
