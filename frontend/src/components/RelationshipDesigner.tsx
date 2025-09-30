import React, { useState } from 'react';

interface Relationship {
  from: string;
  to: string;
}

const RelationshipDesigner: React.FC = () => {
  const [relationships, setRelationships] = useState<Relationship[]>([]);

  const addRelationship = () => {
    const from = prompt('Entidad origen:');
    const to = prompt('Entidad destino:');
    if (from && to) {
      setRelationships([...relationships, { from, to }]);
    }
  };

  return (
    <div>
      <h2>Diseñador de Relaciones</h2>
      <button onClick={addRelationship}>Agregar Relación</button>
      <ul>
        {relationships.map((rel, index) => (
          <li key={index}>{rel.from} → {rel.to}</li>
        ))}
      </ul>
    </div>
  );
};

export default RelationshipDesigner;
