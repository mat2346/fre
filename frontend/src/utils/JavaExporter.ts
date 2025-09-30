import type { TableEntity, Relation,  ExportOptions } from '../types';
import { RELATION_TYPES } from '../constants';

/**
 * Utilidades para exportar diagramas de base de datos a código Java y Spring Boot
 */
export default class JavaExporter {
  /**
   * Genera código de entidad Java para Spring Boot
   * @param table Tabla para la que generar código
   * @param relations Relaciones que involucran a esta tabla
   * @param allTables Todas las tablas del diagrama
   * @returns Código Java completo de la entidad
   */
  static generateEntityCode(table: TableEntity, relations: Relation[], allTables: TableEntity[]): string {
    // Imports necesarios
    let imports = [
      'import javax.persistence.*;',
      'import java.io.Serializable;',
      'import java.util.*;',
      'import lombok.Data;',
      ''
    ];

    // Añadir imports según tipos de datos
    if (table.attributes.some(attr => attr.type.includes('LocalDate') || 
                                     attr.type.includes('LocalTime') || 
                                     attr.type.includes('LocalDateTime'))) {
      imports.push('import java.time.*;');
    }

    if (table.attributes.some(attr => attr.type.includes('BigInteger') || 
                                     attr.type.includes('BigDecimal'))) {
      imports.push('import java.math.*;');
    }

    // Generar clase
    const className = this.toPascalCase(table.name);
    let classCode = [
      '@Data',
      '@Entity',
      `@Table(name = "${table.name.toLowerCase()}")`,
      `public class ${className} implements Serializable {`,
      '',
      '    @Id',
    ];

    // Si hay una columna marcada como clave primaria, usarla
    // De lo contrario, crear una columna id autogenerada
    const primaryKey = table.attributes.find(attr => attr.isPrimaryKey);
    if (primaryKey) {
      // Usar la columna existente
      if (primaryKey.type === 'Long' || primaryKey.type === 'long' || primaryKey.type === 'Integer' || primaryKey.type === 'int') {
        classCode.push('    @GeneratedValue(strategy = GenerationType.IDENTITY)');
      }
      classCode.push(`    private ${primaryKey.type} ${primaryKey.name};`);
    } else {
      // Crear una columna id autogenerada
      classCode.push('    @GeneratedValue(strategy = GenerationType.IDENTITY)');
      classCode.push('    private Long id;');
    }

    classCode.push('');

    // Generar campos normales (no primarios)
    table.attributes
      .filter(attr => !attr.isPrimaryKey)
      .forEach(attr => {
        const annotations = [];
        
        if (!attr.isNullable) {
          annotations.push('    @Column(nullable = false)');
        }
        
        if (attr.isUnique) {
          annotations.push('    @Column(unique = true)');
        }
        
        if (attr.comment) {
          annotations.push(`    // ${attr.comment}`);
        }
        
        // Añadir anotaciones si las hay
        if (annotations.length > 0) {
          classCode = [...classCode, ...annotations];
        }
        
        classCode.push(`    private ${attr.type} ${attr.name};`);
        classCode.push('');
      });

    // Generar relaciones
    relations.forEach(relation => {
      // Esta tabla es el origen de la relación
      if (relation.sourceTableId === table.id) {
        const targetTable = allTables.find(t => t.id === relation.targetTableId);
        if (targetTable) {
          const targetClassName = this.toPascalCase(targetTable.name);
          
          switch (relation.relationType) {
            case RELATION_TYPES.ONE_TO_ONE:
              classCode.push('    @OneToOne');
              classCode.push(`    @JoinColumn(name = "${relation.sourceAttribute}")`)
              classCode.push(`    private ${targetClassName} ${this.toCamelCase(targetTable.name)};`);
              break;
            case RELATION_TYPES.ONE_TO_MANY:
              classCode.push('    @OneToMany(mappedBy = "' + this.toCamelCase(table.name) + '", cascade = CascadeType.ALL, orphanRemoval = true)');
              classCode.push(`    private List<${targetClassName}> ${this.toCamelCase(targetTable.name)}List = new ArrayList<>();`);
              break;
            case RELATION_TYPES.MANY_TO_ONE:
              classCode.push('    @ManyToOne');
              classCode.push(`    @JoinColumn(name = "${relation.sourceAttribute}")`)
              classCode.push(`    private ${targetClassName} ${this.toCamelCase(targetTable.name)};`);
              break;
            case RELATION_TYPES.MANY_TO_MANY:
              classCode.push(`    @ManyToMany`);
              classCode.push(`    @JoinTable(name = "${table.name.toLowerCase()}_${targetTable.name.toLowerCase()}",`);
              classCode.push(`        joinColumns = @JoinColumn(name = "${relation.sourceAttribute}"),`);
              classCode.push(`        inverseJoinColumns = @JoinColumn(name = "${relation.targetAttribute}"))`);
              classCode.push(`    private Set<${targetClassName}> ${this.toCamelCase(targetTable.name)}Set = new HashSet<>();`);
              break;
          }
          classCode.push('');
        }
      }
      // Esta tabla es el destino de la relación (generar solo para MANY_TO_ONE ya que ONE_TO_MANY se genera del otro lado)
      else if (relation.targetTableId === table.id && relation.relationType === RELATION_TYPES.MANY_TO_ONE) {
        const sourceTable = allTables.find(t => t.id === relation.sourceTableId);
        if (sourceTable) {
          const sourceClassName = this.toPascalCase(sourceTable.name);
          classCode.push('    @OneToMany(mappedBy = "' + this.toCamelCase(table.name) + '", cascade = CascadeType.ALL)');
          classCode.push(`    private List<${sourceClassName}> ${this.toCamelCase(sourceTable.name)}List = new ArrayList<>();`);
          classCode.push('');
        }
      }
    });

    // Cerrar la clase
    classCode.push('}');

    // Unir todo
    return [...imports, ...classCode].join('\n');
  }

  /**
   * Genera código del repositorio JPA para una entidad
   * @param table Tabla para la que generar el repositorio
   * @returns Código Java del repositorio
   */
  static generateRepositoryCode(table: TableEntity): string {
    const className = this.toPascalCase(table.name);
    const idType = table.attributes.find(attr => attr.isPrimaryKey)?.type || 'Long';
    
    return [
      'import org.springframework.data.jpa.repository.JpaRepository;',
      'import org.springframework.stereotype.Repository;',
      '',
      '@Repository',
      `public interface ${className}Repository extends JpaRepository<${className}, ${idType}> {`,
      '    // Puedes añadir métodos de consulta personalizados aquí',
      '}'
    ].join('\n');
  }

  /**
   * Genera código del servicio CRUD para una entidad
   * @param table Tabla para la que generar el servicio
   * @returns Código Java del servicio
   */
  static generateServiceCode(table: TableEntity): string {
    const className = this.toPascalCase(table.name);
    const instanceName = this.toCamelCase(table.name);
    const idType = table.attributes.find(attr => attr.isPrimaryKey)?.type || 'Long';
    
    return [
      'import java.util.List;',
      'import java.util.Optional;',
      'import org.springframework.beans.factory.annotation.Autowired;',
      'import org.springframework.stereotype.Service;',
      'import org.springframework.transaction.annotation.Transactional;',
      '',
      '@Service',
      '@Transactional',
      `public class ${className}Service {`,
      '',
      '    private final ' + className + 'Repository ' + instanceName + 'Repository;',
      '',
      '    @Autowired',
      `    public ${className}Service(${className}Repository ${instanceName}Repository) {`,
      `        this.${instanceName}Repository = ${instanceName}Repository;`,
      '    }',
      '',
      `    public List<${className}> findAll() {`,
      `        return ${instanceName}Repository.findAll();`,
      '    }',
      '',
      `    public Optional<${className}> findById(${idType} id) {`,
      `        return ${instanceName}Repository.findById(id);`,
      '    }',
      '',
      `    public ${className} save(${className} ${instanceName}) {`,
      `        return ${instanceName}Repository.save(${instanceName});`,
      '    }',
      '',
      `    public void deleteById(${idType} id) {`,
      `        ${instanceName}Repository.deleteById(id);`,
      '    }',
      '}'
    ].join('\n');
  }
  
  /**
   * Genera código DTO para una entidad
   * @param table Tabla para la que generar el DTO
   * @returns Código Java del DTO
   */
  static generateDtoCode(table: TableEntity): string {
    const className = this.toPascalCase(table.name);
    
    // Imports necesarios
    let imports = [
      'import lombok.Data;',
      'import java.io.Serializable;',
      ''
    ];

    // Añadir imports según tipos de datos
    if (table.attributes.some(attr => attr.type.includes('LocalDate') || 
                                   attr.type.includes('LocalTime') || 
                                   attr.type.includes('LocalDateTime'))) {
      imports.push('import java.time.*;');
    }

    if (table.attributes.some(attr => attr.type.includes('BigInteger') || 
                                   attr.type.includes('BigDecimal'))) {
      imports.push('import java.math.*;');
    }

    // Generar clase
    let classCode = [
      '@Data',
      `public class ${className}Dto implements Serializable {`,
      ''
    ];

    // Añadir campos
    table.attributes.forEach(attr => {
      if (attr.comment) {
        classCode.push(`    // ${attr.comment}`);
      }
      classCode.push(`    private ${attr.type} ${attr.name};`);
      classCode.push('');
    });

    // Cerrar la clase
    classCode.push('}');

    // Unir todo
    return [...imports, ...classCode].join('\n');
  }

  /**
   * Convierte un string a formato PascalCase
   * @param str String a convertir
   * @returns String en formato PascalCase
   */
  static toPascalCase(str: string): string {
    return str
      .split(/[-_\s]/)
      .map(word => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase())
      .join('');
  }

  /**
   * Convierte un string a formato camelCase
   * @param str String a convertir
   * @returns String en formato camelCase
   */
  static toCamelCase(str: string): string {
    const pascal = this.toPascalCase(str);
    return pascal.charAt(0).toLowerCase() + pascal.slice(1);
  }

  /**
   * Genera código para todas las entidades y componentes según opciones
   * @param tables Tablas del diagrama
   * @param relations Relaciones entre tablas
   * @param options Opciones de exportación
   * @returns Objeto con códigos generados por tipo y nombre de clase
   */
  static generateAllCode(tables: TableEntity[], relations: Relation[], options: ExportOptions) {
    const result: Record<string, Record<string, string>> = {
      entities: {},
      repositories: {},
      services: {},
      dtos: {}
    };

    // Generar entidades
    if (options.includeEntities) {
      tables.forEach(table => {
        const tableRelations = relations.filter(r => 
          r.sourceTableId === table.id || r.targetTableId === table.id
        );
        const className = this.toPascalCase(table.name);
        result.entities[className] = this.generateEntityCode(table, tableRelations, tables);
      });
    }

    // Generar repositorios
    if (options.includeRepositories) {
      tables.forEach(table => {
        const className = this.toPascalCase(table.name);
        result.repositories[className + 'Repository'] = this.generateRepositoryCode(table);
      });
    }

    // Generar servicios
    if (options.includeServices) {
      tables.forEach(table => {
        const className = this.toPascalCase(table.name);
        result.services[className + 'Service'] = this.generateServiceCode(table);
      });
    }

    // Generar DTOs
    if (options.includeDtos) {
      tables.forEach(table => {
        const className = this.toPascalCase(table.name);
        result.dtos[className + 'Dto'] = this.generateDtoCode(table);
      });
    }

    return result;
  }
}
