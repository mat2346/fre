// Definición de tipos para el diagrama ER y generación de código

// EXPORTACIONES EN TIEMPO DE EJECUCIÓN - Necesarias para ciertas extensiones del navegador
export const DiagramData = {};
export const TableEntity = {};
export const Relation = {};
export const Attribute = {};
export const ValidationError = {};
export const ExportOptions = {};
export const Position = {};
export const JoinTableInfo = {};
// FIN DE EXPORTACIONES EN TIEMPO DE EJECUCIÓN

export interface Attribute {
  name: string;
  type: string;
  isPrimaryKey?: boolean;
  isNullable?: boolean;
  isUnique?: boolean;
  isForeignKey?: boolean;
  isAutoIncrement?: boolean;
  referencedTable?: string;
  referencedColumn?: string;
  defaultValue?: any;
  comment?: string;
  nodeId?: string; // <-- añadido: referencia opcional al nodo propietario
}

export interface Relation {
  id: string;
  name?: string;
  sourceTableId: string;
  targetTableId: string;
  sourceAttribute?: string | null;
  targetAttribute?: string | null;
  relationType?: string; // e.g. 'ONE_TO_MANY' | 'MANY_TO_MANY' | ...
  fetchType?: 'EAGER' | 'LAZY' | string;
  optional?: boolean;
  mappedBy?: string | null;
  cascadeTypes?: string[] | null;
  orphanRemoval?: boolean;
  joinTable?: JoinTableInfo | null;
  isBidirectional?: boolean;
}

export interface JoinTableInfo {
  name: string;
  joinColumns?: { name: string; referencedColumnName: string }[];
  inverseJoinColumns?: { name: string; referencedColumnName: string }[];
}

export interface Position {
  x: number;
  y: number;
}

export interface TableEntity {
  id: string;
  name: string;
  attributes: Attribute[];
  position?: Position | null;
  comment?: string | null;
  isAbstract?: boolean;
  inheritanceType?: string | null;
  discriminatorColumn?: string | null;
  discriminatorType?: string | null;
  discriminatorValue?: string | null;
  parentTable?: string | null;
  tableName?: string | null;
}

export interface DiagramData {
  id: string;
  name: string;
  description?: string | null;
  tables: TableEntity[];
  relations: Relation[];
  lastModified?: string | Date | null;
  join_code?: string; // Para colaboración en tiempo real
}

export interface ExportOptions {
  includeEntities?: boolean;
  includeRepositories?: boolean;
  includeServices?: boolean;
  includeDtos?: boolean;
  includeControllers?: boolean;
  includeTests?: boolean;
  includeSwaggerDocs?: boolean;
  database?: string;
  generatePdf?: boolean;
  generateSql?: boolean;
  generateDiagramOnly?: boolean;
  includeValidations?: boolean;
  useLombok?: boolean;
  useSpringDataRest?: boolean;
  packageName?: string;
  pdfTheme?: string;
  outputFormat?: 'SINGLE_FILE' | 'MULTIPLE_FILES';
}

export interface ValidationError {
  type?: 'ERROR' | 'WARNING' | 'INFO' | string;
  message: string;
  tableId?: string | null;
  attributeId?: string | null;
  relationId?: string | null;
  suggestion?: string | null;
}
