// Versión simplificada de los tipos que podemos exportar para uso en runtime

// Clase DiagramData con implementación mínima
export class DiagramData {
  id: string = '';
  name: string = '';
  tables: any[] = [];
  relations: any[] = [];
  lastModified: Date = new Date();
}

// Otras clases con implementaciones mínimas
export class TableEntity {
  id: string = '';
  name: string = '';
  attributes: any[] = [];
  position: { x: number; y: number } = { x: 0, y: 0 };
}

export class Relation {
  id: string = '';
  sourceTableId: string = '';
  targetTableId: string = '';
  relationType: string = '';
}

export class Attribute {
  name: string = '';
  type: string = '';
  isPrimaryKey: boolean = false;
}

// Exportar versiones simples de los otros tipos
export class ExportOptions {}
export class ValidationError {}
export class Position {}
export class JoinTableInfo {}
