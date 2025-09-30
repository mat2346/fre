// Versión runtime de los tipos para que estén disponibles para importación en JS
// Estos objetos existen en runtime, a diferencia de las interfaces que solo existen en tiempo de compilación

// Importamos las clases runtime
export { DiagramData, TableEntity, Relation, Attribute, ExportOptions, ValidationError, Position, JoinTableInfo } from './runtimeClasses';

// Reexportamos los tipos de index.ts
export type {
  DiagramData as DiagramDataType,
  TableEntity as TableEntityType,
  Relation as RelationType,
  Attribute as AttributeType,
  ExportOptions as ExportOptionsType,
  ValidationError as ValidationErrorType,
  Position as PositionType,
  JoinTableInfo as JoinTableInfoType
} from './index';
