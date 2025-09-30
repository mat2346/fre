import type { TableEntity, DiagramData } from '../types';
import { saveAs } from 'file-saver';

/**
 * Utilidades para exportar diagramas a diferentes formatos
 */
export default class ExportUtil {
  /**
   * Convierte el diagrama a formato JSON para guardar/cargar
   * @param diagramData Datos del diagrama
   * @returns String JSON formateado
   */
  static toJSON(diagramData: DiagramData): string {
    return JSON.stringify(diagramData, null, 2);
  }

  /**
   * Exporta el diagrama como archivo JSON
   * @param diagramData Datos del diagrama
   */
  static exportAsJSON(diagramData: DiagramData): void {
    const json = this.toJSON(diagramData);
    const blob = new Blob([json], { type: 'application/json' });
    saveAs(blob, `${diagramData.name.replace(/\s+/g, '_')}_diagram.json`);
  }

  /**
   * Genera código SQL para la tabla especificada
   * @param table Tabla para la que generar SQL
   * @param databaseType Tipo de base de datos (MySQL, PostgreSQL)
   * @returns Código SQL para crear la tabla
   */
  static generateTableSQL(table: TableEntity, databaseType: string): string {
    const tableName = table.name.toLowerCase();
    
    // Inicio de la sentencia CREATE TABLE
    let sql = `CREATE TABLE ${tableName} (\n`;
    
    // Columnas
    const columns: string[] = [];
    
    // Restricciones que deben ir al final del CREATE TABLE
    const constraints: string[] = [];
    
    // Procesar cada atributo
    table.attributes.forEach(attr => {
      let columnDef = `  ${attr.name} ${this.mapJavaTypeToSQLType(attr.type, databaseType)}`;
      
      // Restricciones de columna
      if (attr.isPrimaryKey) {
        if (databaseType === 'POSTGRESQL' || databaseType === 'PostgreSQL') {
          columnDef += ' PRIMARY KEY';
        } else {
          // En MySQL es común definir PRIMARY KEY por separado
          constraints.push(`  PRIMARY KEY (${attr.name})`);
        }
      }
      
      if (!attr.isNullable) {
        columnDef += ' NOT NULL';
      }
      
      if (attr.isUnique) {
        columnDef += ' UNIQUE';
      }
      
      if (attr.defaultValue) {
        columnDef += ` DEFAULT ${attr.defaultValue}`;
      }
      
      columns.push(columnDef);
    });
    
    // Unir columnas y restricciones
    sql += columns.join(',\n');
    
    if (constraints.length > 0) {
      sql += ',\n' + constraints.join(',\n');
    }
    
    // Cerrar sentencia
    sql += '\n);';
    
    // Añadir comentarios si hay
    table.attributes.forEach(attr => {
      if (attr.comment) {
        if (databaseType === 'POSTGRESQL' || databaseType === 'PostgreSQL') {
          sql += `\nCOMMENT ON COLUMN ${tableName}.${attr.name} IS '${attr.comment.replace(/'/g, "''")}';`;
        } else if (databaseType === 'MYSQL' || databaseType === 'MySQL') {
          // En MySQL, los comentarios se añaden en la definición de la columna
          // No podemos modificar la sentencia CREATE TABLE ya creada, así que lo indicamos
          sql += `\n-- Comment on ${attr.name}: ${attr.comment}`;
        }
      }
    });
    
    return sql;
  }

  /**
   * Genera sentencias SQL para relaciones (claves foráneas)
   * @param sourceTable Tabla origen
   * @param targetTable Tabla destino
   * @param sourceAttr Atributo origen
   * @param targetAttr Atributo destino
   * @returns Código SQL para la relación
   */
  static generateRelationSQL(
    sourceTable: string,
    targetTable: string,
    sourceAttr: string,
    targetAttr: string
  ): string {
    const sourceTableName = sourceTable.toLowerCase();
    const targetTableName = targetTable.toLowerCase();

    return `ALTER TABLE ${sourceTableName}
  ADD CONSTRAINT fk_${sourceTableName}_${targetTableName}
  FOREIGN KEY (${sourceAttr}) 
  REFERENCES ${targetTableName}(${targetAttr})
  ON DELETE CASCADE;`;
  }

  /**
   * Mapea tipos de Java a tipos de SQL según la base de datos
   * @param javaType Tipo Java
   * @param databaseType Tipo de base de datos
   * @returns Tipo SQL equivalente
   */
  private static mapJavaTypeToSQLType(javaType: string, databaseType: string): string {
    // PostgreSQL
    if (databaseType === 'POSTGRESQL' || databaseType === 'PostgreSQL') {
      switch (javaType.toLowerCase()) {
        case 'string': return 'VARCHAR(255)';
        case 'integer':
        case 'int': return 'INTEGER';
        case 'long': return 'BIGINT';
        case 'float': return 'REAL';
        case 'double': return 'DOUBLE PRECISION';
        case 'boolean': return 'BOOLEAN';
        case 'localdate': return 'DATE';
        case 'localtime': return 'TIME';
        case 'localdatetime': return 'TIMESTAMP';
        case 'bigdecimal': return 'DECIMAL(19,2)';
        case 'uuid': return 'UUID';
        case 'byte[]': return 'BYTEA';
        default: return 'VARCHAR(255)';
      }
    }
    // MySQL
    else {
      switch (javaType.toLowerCase()) {
        case 'string': return 'VARCHAR(255)';
        case 'integer':
        case 'int': return 'INT';
        case 'long': return 'BIGINT';
        case 'float': return 'FLOAT';
        case 'double': return 'DOUBLE';
        case 'boolean': return 'TINYINT(1)';
        case 'localdate': return 'DATE';
        case 'localtime': return 'TIME';
        case 'localdatetime': return 'DATETIME';
        case 'bigdecimal': return 'DECIMAL(19,2)';
        case 'byte[]': return 'BLOB';
        default: return 'VARCHAR(255)';
      }
    }
  }

  /**
   * Genera script SQL completo para todo el diagrama
   * @param diagramData Datos del diagrama
   * @param databaseType Tipo de base de datos
   * @returns Script SQL completo
   */
  static generateCompleteSQL(diagramData: DiagramData, databaseType: string): string {
    const { tables, relations, name } = diagramData;
    
    let sql = `-- Database: ${name}\n`;
    sql += `-- Generated: ${new Date().toLocaleString()}\n\n`;
    
    // Crear tablas
    tables.forEach(table => {
      sql += `-- Table: ${table.name}\n`;
      sql += this.generateTableSQL(table, databaseType);
      sql += '\n\n';
    });
    
    // Crear relaciones (foreign keys)
    if (relations && relations.length > 0) {
      sql += '-- Foreign Key Constraints\n';
      
      relations.forEach(relation => {
        const sourceTable = tables.find(t => t.id === relation.sourceTableId);
        const targetTable = tables.find(t => t.id === relation.targetTableId);
        
        if (sourceTable && targetTable) {
          if (relation.sourceAttribute && relation.targetAttribute) {
            sql += this.generateRelationSQL(
              sourceTable.name,
              targetTable.name,
              relation.sourceAttribute,
              relation.targetAttribute
            );
            sql += '\n\n';
          } else {
            sql += `-- Skipped relation due to missing attribute(s) for tables ${sourceTable.name} and ${targetTable.name}\n\n`;
          }
          sql += '\n\n';
        }
      });
    }
    
    return sql;
  }

  /**
   * Exporta el diagrama como script SQL
   * @param diagramData Datos del diagrama
   * @param databaseType Tipo de base de datos
   */
  static exportAsSQL(diagramData: DiagramData, databaseType: string): void {
    const sql = this.generateCompleteSQL(diagramData, databaseType);
    const blob = new Blob([sql], { type: 'text/plain' });
    saveAs(blob, `${diagramData.name.replace(/\s+/g, '_')}_script.sql`);
  }
}
