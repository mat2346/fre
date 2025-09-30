
import { ATTRIBUTE_TYPES } from '../constants';

interface AttributeModalProps {
  isMobile?: boolean;
  visible: boolean;
  name: string;
  setName: (name: string) => void;
  type: string;
  setType: (type: string) => void;
  isPrimaryKey: boolean;
  setIsPrimaryKey: (isPk: boolean) => void;
  isEdit?: boolean;
  onCancel: () => void;
  onConfirm: () => void;
}

// Modal para agregar o editar atributos de un nodo
const AttributeModal = ({
  isMobile,
  visible,
  name,
  setName,
  type,
  setType,
  isPrimaryKey = false,
  setIsPrimaryKey,
  isEdit = false,
  onCancel,
  onConfirm
}: AttributeModalProps) => {
  if (!visible) return null;
  return (
    <div style={{ position: 'fixed', top: 0, left: 0, width: '100vw', height: '100vh', background: 'rgba(0,0,0,0.4)', zIndex: 10001, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: isMobile ? '20px' : '0' }}>
      <div style={{ background: '#222', padding: isMobile ? '20px' : '24px', borderRadius: '8px', minWidth: isMobile ? 'calc(100% - 40px)' : '320px', maxWidth: isMobile ? 'calc(100% - 40px)' : '400px', color: 'white', boxShadow: '0 2px 10px rgba(0,0,0,0.3)' }}>
        <h2 style={{ marginBottom: '16px', fontSize: isMobile ? '1.1rem' : '1.2rem' }}>{isEdit ? 'Editar atributo' : 'Agregar atributo'}</h2>
        <label style={{ fontSize: isMobile ? '14px' : '16px' }}>Nombre:</label>
        <input type="text" value={name} onChange={(e:any) => setName(e.target.value)} style={{ width: '100%', marginBottom: '12px', padding: isMobile ? '6px' : '8px', borderRadius: '4px', border: '1px solid #555', background: '#333', color: 'white', fontSize: isMobile ? '14px' : '16px' }} autoFocus />
        <label style={{ fontSize: isMobile ? '14px' : '16px' }}>Tipo:</label>
        <select value={type} onChange={(e:any) => setType(e.target.value)} style={{ width: '100%', marginBottom: '12px', padding: isMobile ? '6px' : '8px', borderRadius: '4px', border: '1px solid #555', background: '#333', color: 'white', fontSize: isMobile ? '14px' : '16px' }}>
          {ATTRIBUTE_TYPES.map((t:any) => <option key={t} value={t}>{t}</option>)}
        </select>
        <div style={{ marginBottom: '16px' }}>
          <label style={{ fontSize: isMobile ? '14px' : '16px', marginRight: '8px' }}>
            <input type="checkbox" checked={isPrimaryKey} onChange={e => setIsPrimaryKey(e.target.checked)} />{' '}
            Clave primaria
          </label>
        </div>
        <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '8px', flexDirection: isMobile ? 'column' : 'row' }}>
          <button onClick={onCancel} style={{ padding: isMobile ? '8px' : '8px 16px', background: '#555', color: 'white', border: 'none', borderRadius: '4px', cursor: 'pointer', fontSize: isMobile ? '14px' : '16px' }}>Cancelar</button>
          <button onClick={onConfirm} style={{ padding: isMobile ? '8px' : '8px 16px', background: '#4CAF50', color: 'white', border: 'none', borderRadius: '4px', cursor: 'pointer', fontSize: isMobile ? '14px' : '16px' }}>{isEdit ? 'Guardar' : 'Agregar'}</button>
        </div>
      </div>
    </div>
  );
};

export default AttributeModal;
