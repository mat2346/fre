import type { TableEntity, Relation, ValidationError } from '../types';
import { RELATION_TYPES } from '../constants';

/**
 * Clase para validar consistencia de diagrama ER y sugerir mejoras
 */
export default class ValidationHelper {
  /**
   * Valida un diagrama completo y retorna errores, advertencias y sugerencias
   * @param tables Lista de tablas del diagrama
   * @param relations Lista de relaciones del diagrama
   * @returns Lista de errores de validación
   */
  static validateDiagram(tables: TableEntity[], relations: Relation[]): ValidationError[] {
    const errors: ValidationError[] = [];

    // Validar tablas individuales
    tables.forEach(table => {
      errors.push(...this.validateTable(table));
    });

    // Validar relaciones
    relations.forEach(relation => {
      errors.push(...this.validateRelation(relation, tables));
    });

    // Validar normalización
    errors.push(...this.checkNormalization(tables, relations));

    return errors;
  }

  /**
   * Valida una tabla individual
   * @param table Tabla a validar
   * @returns Lista de errores de validación
   */
  private static validateTable(table: TableEntity): ValidationError[] {
    const errors: ValidationError[] = [];

    // Verificar que la tabla tenga al menos un atributo
    if (table.attributes.length === 0) {
      errors.push({
        type: 'WARNING',
        message: `La tabla ${table.name} no tiene atributos`,
        tableId: table.id,
        suggestion: 'Añade al menos un atributo a la tabla'
      });
    }

    // Verificar que exista una clave primaria
    const hasPrimaryKey = table.attributes.some(attr => attr.isPrimaryKey);
    if (!hasPrimaryKey) {
      errors.push({
        type: 'ERROR',
        message: `La tabla ${table.name} no tiene clave primaria`,
        tableId: table.id,
        suggestion: 'Añade una clave primaria para identificar unívocamente cada registro'
      });
    }

    // Verificar nombres duplicados de atributos
    const attributeNames = new Map<string, number>();
    table.attributes.forEach(attr => {
      const name = attr.name.toLowerCase();
      attributeNames.set(name, (attributeNames.get(name) || 0) + 1);
    });

    attributeNames.forEach((count, name) => {
      if (count > 1) {
        errors.push({
          type: 'ERROR',
          message: `La tabla ${table.name} tiene ${count} atributos con el nombre '${name}'`,
          tableId: table.id,
          suggestion: 'Renombra los atributos para que sean únicos'
        });
      }
    });

    // Si la tabla tiene herencia, verificar configuración
    if (table.parentTable) {
      if (!table.discriminatorValue) {
        errors.push({
          type: 'WARNING',
          message: `La tabla hija ${table.name} no tiene valor discriminador`,
          tableId: table.id,
          suggestion: 'Define un valor discriminador para esta entidad hija'
        });
      }
    }

    if (table.inheritanceType && !table.discriminatorColumn) {
      errors.push({
        type: 'WARNING',
        message: `La tabla base ${table.name} no tiene columna discriminadora`,
        tableId: table.id,
        suggestion: 'Define una columna discriminadora para la herencia'
      });
    }

    return errors;
  }

  /**
   * Valida una relación
   * @param relation Relación a validar
   * @param tables Lista de todas las tablas del diagrama
   * @returns Lista de errores de validación
   */
  private static validateRelation(relation: Relation, tables: TableEntity[]): ValidationError[] {
    const errors: ValidationError[] = [];

    // Verificar que existan las tablas fuente y destino
    const sourceTable = tables.find(t => t.id === relation.sourceTableId);
    const targetTable = tables.find(t => t.id === relation.targetTableId);

    if (!sourceTable) {
      errors.push({
        type: 'ERROR',
        message: `La tabla origen de la relación ${relation.id} no existe`,
        relationId: relation.id,
        suggestion: 'Elimina esta relación'
      });
      return errors; // No seguir validando si no existe la tabla
    }

    if (!targetTable) {
      errors.push({
        type: 'ERROR',
        message: `La tabla destino de la relación ${relation.id} no existe`,
        relationId: relation.id,
        suggestion: 'Elimina esta relación'
      });
      return errors; // No seguir validando si no existe la tabla
    }

    // Verificar que los atributos existan en sus tablas
    const sourceAttr = sourceTable.attributes.find(a => a.name === relation.sourceAttribute);
    const targetAttr = targetTable.attributes.find(a => a.name === relation.targetAttribute);

    if (!sourceAttr) {
      errors.push({
        type: 'ERROR',
        message: `El atributo '${relation.sourceAttribute}' no existe en la tabla ${sourceTable.name}`,
        relationId: relation.id,
        tableId: relation.sourceTableId,
        suggestion: 'Selecciona un atributo válido o crea uno nuevo'
      });
    }

    if (!targetAttr) {
      errors.push({
        type: 'ERROR',
        message: `El atributo '${relation.targetAttribute}' no existe en la tabla ${targetTable.name}`,
        relationId: relation.id,
        tableId: relation.targetTableId,
        suggestion: 'Selecciona un atributo válido o crea uno nuevo'
      });
    }

    // Verificar coherencia de relación
    if (relation.relationType === RELATION_TYPES.ONE_TO_ONE) {
      if (sourceAttr && !sourceAttr.isUnique) {
        errors.push({
          type: 'WARNING',
          message: `El atributo '${sourceAttr.name}' de la relación uno a uno debería ser único`,
          relationId: relation.id,
          tableId: relation.sourceTableId,
          attributeId: sourceAttr.name,
          suggestion: 'Marca el atributo como UNIQUE'
        });
      }
      if (targetAttr && !targetAttr.isUnique && !targetAttr.isPrimaryKey) {
        errors.push({
          type: 'WARNING',
          message: `El atributo '${targetAttr.name}' de la relación uno a uno debería ser único`,
          relationId: relation.id,
          tableId: relation.targetTableId,
          attributeId: targetAttr.name,
          suggestion: 'Marca el atributo como UNIQUE'
        });
      }
    }

    // Si es muchos a muchos, verificar si se especificó la tabla de unión
    if (relation.relationType === RELATION_TYPES.MANY_TO_MANY && !relation.joinTable) {
      errors.push({
        type: 'INFO',
        message: `La relación muchos a muchos entre ${sourceTable.name} y ${targetTable.name} no tiene tabla de unión definida`,
        relationId: relation.id,
        suggestion: 'Define una tabla de unión para almacenar ambas claves foráneas'
      });
    }

    return errors;
  }

  /**
   * Verifica si el diagrama cumple con las formas normales básicas
   * @param tables Lista de tablas
   * @param relations Lista de relaciones
   * @returns Lista de errores/sugerencias de normalización
   */
  private static checkNormalization(tables: TableEntity[], _relations: Relation[]): ValidationError[] {
    const errors: ValidationError[] = [];

    // Verificar 1NF (valores atómicos)
    tables.forEach(table => {
      // Buscar posibles violaciones de 1NF (atributos que podrían contener múltiples valores)
      const nonAtomicAttrs = table.attributes.filter(attr => 
        attr.type.includes('[]') || 
        attr.type.includes('List') ||
        attr.type.includes('Set') ||
        attr.type.includes('Collection') ||
        attr.type.includes('Map')
      );

      if (nonAtomicAttrs.length > 0) {
        errors.push({
          type: 'INFO',
          message: `Posible violación de 1NF en tabla ${table.name}: atributos que podrían contener múltiples valores`,
          tableId: table.id,
          suggestion: 'Considera crear una tabla separada para estos valores relacionados'
        });
      }
    });

    // Verificar 2NF (dependencias funcionales completas)
    tables.forEach(table => {
      // Identificar claves primarias compuestas
      const pkAttributes = table.attributes.filter(attr => attr.isPrimaryKey);
      
      if (pkAttributes.length > 1) {
        // Tabla con clave compuesta, revisar atributos no clave
        // Identificar atributos no clave
        // Verificamos si hay atributos no clave
        table.attributes.filter(attr => !attr.isPrimaryKey);
        
        errors.push({
          type: 'INFO',
          message: `Tabla ${table.name} con clave primaria compuesta: verifica la 2NF`,
          tableId: table.id,
          suggestion: 'Asegúrate que cada atributo no clave depende de toda la clave primaria'
        });
      }
    });

    // Verificar 3NF (sin dependencias transitivas)
    tables.forEach(table => {
      // Buscar posibles dependencias transitivas
      // Esto es más difícil sin conocer la semántica, pero podemos dar consejos generales
      if (table.attributes.length > 5) {
        errors.push({
          type: 'INFO',
          message: `Tabla ${table.name} con muchos atributos: considera revisar 3NF`,
          tableId: table.id,
          suggestion: 'Verifica si hay dependencias entre atributos no clave'
        });
      }
    });

    return errors;
  }
}
