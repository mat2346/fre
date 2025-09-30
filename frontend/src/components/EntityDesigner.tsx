import React, { useState } from 'react';

interface Entity {
  name: string;
  fields: string[];
}

const EntityDesigner: React.FC = () => {
  const [entities, setEntities] = useState<Entity[]>([]);

  const addEntity = () => {
    const name = prompt('Nombre de la entidad:');
    if (name) {
      setEntities([...entities, { name, fields: [] }]);
    }
  };

  const addField = (entityIndex: number) => {
    const fieldName = prompt('Nombre del campo:');
    if (fieldName) {
      const updatedEntities = [...entities];
      updatedEntities[entityIndex].fields.push(fieldName);
      setEntities(updatedEntities);
    }
  };

  return (
    <div>
      <h2>Diseñador de Entidades</h2>
      <button onClick={addEntity}>Agregar Entidad</button>
      <div>
        {entities.map((entity, index) => (
          <div key={index}>
            <h3>{entity.name}</h3>
            <button onClick={() => addField(index)}>Agregar Campo</button>
            <ul>
              {entity.fields.map((field, fieldIndex) => (
                <li key={fieldIndex}>{field}</li>
              ))}
            </ul>
          </div>
        ))}
      </div>
    </div>
  );
};

export default EntityDesigner;
