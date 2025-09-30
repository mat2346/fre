// Clases runtime para evitar problemas con importaciones de tipos
// Estas clases existen en tiempo de ejecución y pueden ser importadas por JS

export class DiagramData {
  id: string = '';
  name: string = '';
  tables: any[] = [];
  relations: any[] = [];
  lastModified: Date = new Date();
}

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

export class ExportOptions {}
export class ValidationError {}
export class Position {}
export class JoinTableInfo {}
