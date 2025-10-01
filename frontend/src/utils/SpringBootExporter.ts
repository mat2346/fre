// SpringBootExporter.ts
import type { TableEntity, Relation } from '../types';
import JSZip from 'jszip';

/**
 * Exportador especializado para generar proyectos Spring Boot completos
 * a partir de un diagrama de base de datos
 */
class SpringBootExporter {
  /**
   * Genera un proyecto Spring Boot completo basado en el esquema de la base de datos
   * @param diagramData Datos del diagrama (tablas y relaciones)
   * @returns Blob con el archivo ZIP del proyecto
   */
  async generateProject(diagramData: { 
    tables: TableEntity[], 
    relations: Relation[],
    name: string
  }): Promise<Blob> {
    const zip = new JSZip();
    
    // Crear estructura de directorios asegurándonos de que existan
    const srcMainJava = zip.folder("src/main/java/com/example/demo");
    if (!srcMainJava) throw new Error("Error al crear directorio src/main/java/com/example/demo");
    
    const modelDir = srcMainJava.folder("model");
    if (!modelDir) throw new Error("Error al crear directorio model");
    
    const repoDir = srcMainJava.folder("repository");
    if (!repoDir) throw new Error("Error al crear directorio repository");
    
    const controllerDir = srcMainJava.folder("controller");
    if (!controllerDir) throw new Error("Error al crear directorio controller");
    
    const configDir = srcMainJava.folder("config");
    if (!configDir) throw new Error("Error al crear directorio config");
    
    const resourcesDir = zip.folder("src/main/resources");
    if (!resourcesDir) throw new Error("Error al crear directorio resources");
    
    try {
      // Crear archivos para cada tabla
      for (const table of diagramData.tables) {
        // Generar entidad JPA
        const entityCode = this.generateEntityCode(table, diagramData.relations, diagramData.tables);
        const className = this.toPascalCase(table.name);
        modelDir.file(`${className}.java`, entityCode);
        
        // Generar repositorio
        const repoCode = this.generateRepositoryCode(className);
        repoDir.file(`${className}Repository.java`, repoCode);
        
        // Generar controlador REST
        const controllerCode = this.generateControllerCode(className);
        controllerDir.file(`${className}Controller.java`, controllerCode);
      }
      
      // Generar archivos de configuración
      configDir.file("WebConfig.java", this.generateWebConfig());
      configDir.file("SwaggerConfig.java", this.generateSwaggerConfig());
      
      // Generar application.properties
      resourcesDir.file("application.properties", this.generateApplicationProperties());
      
      // Generar build.gradle
      zip.file("build.gradle", this.generateBuildGradle());
      
      // Generar DemoApplication.java (clase principal)
      srcMainJava.file("DemoApplication.java", this.generateMainClass());
      
      // Generar README.md
      zip.file("README.md", this.generateReadme(diagramData.name));
      
      // Comprimir y devolver como blob
      return await zip.generateAsync({ type: "blob" });
    } catch (error) {
      console.error("Error generando el proyecto Spring Boot:", error);
      throw error;
    }
  }
  
  /**
   * Genera el código Java para una entidad JPA
   */
  private generateEntityCode(table: TableEntity, relations: Relation[], allTables: TableEntity[]): string {
    // Imports necesarios
    let imports = [
      'package com.example.demo.model;',
      '',
      'import jakarta.persistence.*;',
      'import java.io.Serializable;',
      'import java.util.*;',
      '',
    ];

    // Añadir imports según tipos de datos
    const hasDateTypes = table.attributes.some(attr => {
      const type = typeof attr === 'string' 
        ? (attr as string).split(':')[1] 
        : (attr as any).type;
      return type && (type.includes('Date') || type.includes('Time'));
    });
    
    if (hasDateTypes) {
      imports.push('import java.time.*;');
    }

    // Generar clase
    const className = this.toPascalCase(table.name);
    let classCode = [
      '@Entity',
      `@Table(name = "${table.name.toLowerCase()}")`,
      `public class ${className} implements Serializable {`,
      '',
      '    private static final long serialVersionUID = 1L;',
      '',
      '    @Id',
      '    @GeneratedValue(strategy = GenerationType.IDENTITY)',
      '    private Long id;',
      '',
    ];

    // Procesar atributos
    const processedAttrs = this.processAttributes(table.attributes);
    
    // Generar campos
    processedAttrs.forEach(attr => {
      if (attr.name === 'id') return; // Ignorar id (ya definido)
      
      if (attr.isPrimaryKey) {
        classCode.push('    @Id');
        if (attr.type === 'Long' || attr.type === 'Integer') {
          classCode.push('    @GeneratedValue(strategy = GenerationType.IDENTITY)');
        }
      }
      
      classCode.push(`    private ${attr.type} ${attr.name};`);
      classCode.push('');
    });

    // Generar relaciones
    const tableRelations = relations.filter(r => 
      r.sourceTableId === table.id || r.targetTableId === table.id
    );
    
    tableRelations.forEach(relation => {
      let targetTable: TableEntity | undefined;
      let isBidirectional = false;
      
      // Determinar la tabla destino y si es bidireccional
      if (relation.sourceTableId === table.id) {
        targetTable = allTables.find(t => t.id === relation.targetTableId);
      } else {
        targetTable = allTables.find(t => t.id === relation.sourceTableId);
        isBidirectional = true;
      }
      
      if (!targetTable) return;
      
      const targetClassName = this.toPascalCase(targetTable.name);
      const relationName = this.toCamelCase(targetTable.name) + (isBidirectional ? "" : "s");
      
      switch (relation.relationType) {
        case 'ONE_TO_MANY':
          if (!isBidirectional) {
            classCode.push(`    @OneToMany(mappedBy = "${this.toCamelCase(className)}", cascade = CascadeType.ALL)`);
            classCode.push(`    private List<${targetClassName}> ${relationName} = new ArrayList<>();`);
          } else {
            classCode.push(`    @ManyToOne`);
            classCode.push(`    @JoinColumn(name = "${this.toCamelCase(targetTable.name)}_id")`);
            classCode.push(`    private ${targetClassName} ${this.toCamelCase(targetTable.name)};`);
          }
          classCode.push('');
          break;
          
        case 'ONE_TO_ONE':
          if (!isBidirectional) {
            classCode.push(`    @OneToOne(cascade = CascadeType.ALL)`);
            classCode.push(`    @JoinColumn(name = "${this.toCamelCase(targetTable.name)}_id")`);
            classCode.push(`    private ${targetClassName} ${this.toCamelCase(targetTable.name)};`);
          } else {
            classCode.push(`    @OneToOne(mappedBy = "${this.toCamelCase(className)}")`);
            classCode.push(`    private ${targetClassName} ${this.toCamelCase(targetTable.name)};`);
          }
          classCode.push('');
          break;
          
        case 'MANY_TO_MANY':
          if (!isBidirectional) {
            classCode.push(`    @ManyToMany(cascade = { CascadeType.PERSIST, CascadeType.MERGE })`);
            classCode.push(`    @JoinTable(name = "${table.name.toLowerCase()}_${targetTable.name.toLowerCase()}",`);
            classCode.push(`        joinColumns = @JoinColumn(name = "${table.name.toLowerCase()}_id"),`);
            classCode.push(`        inverseJoinColumns = @JoinColumn(name = "${targetTable.name.toLowerCase()}_id"))`);
            classCode.push(`    private Set<${targetClassName}> ${relationName} = new HashSet<>();`);
          } else {
            classCode.push(`    @ManyToMany(mappedBy = "${this.toCamelCase(targetTable.name)}s")`);
            classCode.push(`    private Set<${targetClassName}> ${relationName} = new HashSet<>();`);
          }
          classCode.push('');
          break;
      }
    });

    // Getters y setters
    classCode.push('    // Getters and Setters');
    classCode.push('    public Long getId() {');
    classCode.push('        return id;');
    classCode.push('    }');
    classCode.push('');
    classCode.push('    public void setId(Long id) {');
    classCode.push('        this.id = id;');
    classCode.push('    }');
    classCode.push('');
    
    // Getter y setter para cada atributo
    processedAttrs.forEach(attr => {
      if (attr.name === 'id') return; // Ignorar id (ya definido)
      
      const capitalizedName = attr.name.charAt(0).toUpperCase() + attr.name.slice(1);
      
      classCode.push(`    public ${attr.type} get${capitalizedName}() {`);
      classCode.push(`        return ${attr.name};`);
      classCode.push('    }');
      classCode.push('');
      classCode.push(`    public void set${capitalizedName}(${attr.type} ${attr.name}) {`);
      classCode.push(`        this.${attr.name} = ${attr.name};`);
      classCode.push('    }');
      classCode.push('');
    });

    classCode.push('}');
    
    return [...imports, ...classCode].join('\n');
  }

  /**
   * Procesa los atributos de una tabla para obtener nombres y tipos consistentes
   */
  private processAttributes(attributes: any[]): { name: string; type: string; isPrimaryKey: boolean }[] {
    return attributes.map(attr => {
      // Si el atributo es una cadena, parsearlo
      if (typeof attr === 'string') {
        const parts = attr.split(':');
        const name = parts[0].trim();
        let type = parts.length > 1 ? parts[1].trim() : 'String';
        
        // Convertir tipos de datos si es necesario
        type = this.mapToJavaType(type);
        
        return {
          name,
          type,
          isPrimaryKey: name === 'id',
        };
      } else {
        // Si es un objeto, usar sus propiedades
        return {
          name: attr.name,
          type: this.mapToJavaType(attr.type || 'String'),
          isPrimaryKey: !!attr.isPrimaryKey,
        };
      }
    });
  }
  
  /**
   * Genera código para un repositorio Spring Data JPA
   */
  private generateRepositoryCode(className: string): string {
    return `package com.example.demo.repository;

import com.example.demo.model.${className};
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

@Repository
public interface ${className}Repository extends JpaRepository<${className}, Long> {
    // Puedes añadir métodos de consulta personalizados aquí
}
`;
  }
  
  /**
   * Genera código para un controlador REST
   */
  private generateControllerCode(className: string): string {
    const resourceName = this.toCamelCase(className) + 's';
    
    return `package com.example.demo.controller;

import com.example.demo.model.${className};
import com.example.demo.repository.${className}Repository;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/${resourceName}")
public class ${className}Controller {

    private final ${className}Repository repository;

    public ${className}Controller(${className}Repository repository) {
        this.repository = repository;
    }

    @GetMapping
    public List<${className}> getAll() {
        return repository.findAll();
    }

    @GetMapping("/{id}")
    public ResponseEntity<${className}> getById(@PathVariable Long id) {
        return repository.findById(id)
                .map(ResponseEntity::ok)
                .orElseGet(() -> ResponseEntity.notFound().build());
    }

    @PostMapping
    public ${className} create(@RequestBody ${className} entity) {
        return repository.save(entity);
    }

    @PutMapping("/{id}")
    public ResponseEntity<${className}> update(@PathVariable Long id, @RequestBody ${className} entity) {
        return repository.findById(id)
                .map(existingEntity -> {
                    entity.setId(id);
                    return ResponseEntity.ok(repository.save(entity));
                })
                .orElseGet(() -> ResponseEntity.notFound().build());
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<Void> delete(@PathVariable Long id) {
        if (repository.existsById(id)) {
            repository.deleteById(id);
            return ResponseEntity.noContent().build();
        }
        return ResponseEntity.notFound().build();
    }
}
`;
  }

  /**
   * Genera configuración de CORS
   */
  private generateWebConfig(): string {
    return `package com.example.demo.config;

import org.springframework.context.annotation.Configuration;
import org.springframework.web.servlet.config.annotation.CorsRegistry;
import org.springframework.web.servlet.config.annotation.WebMvcConfigurer;

@Configuration
public class WebConfig implements WebMvcConfigurer {

    @Override
    public void addCorsMappings(CorsRegistry registry) {
        registry.addMapping("/api/**")
                .allowedOrigins("https://temporary-carolin-nnnnafslsa-b8032478.koyeb.app", "http://localhost:3000", "http://localhost:5173")
                .allowedMethods("GET", "POST", "PUT", "DELETE", "OPTIONS")
                .allowCredentials(true);
    }
}
`;
  }

  /**
   * Genera configuración de Swagger/OpenAPI
   */
  private generateSwaggerConfig(): string {
    return `package com.example.demo.config;

import io.swagger.v3.oas.models.OpenAPI;
import io.swagger.v3.oas.models.info.Info;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;

@Configuration
public class SwaggerConfig {

    @Bean
    public OpenAPI customOpenAPI() {
        return new OpenAPI()
                .info(new Info()
                        .title("Generated Spring Boot API")
                        .version("1.0")
                        .description("API generada automáticamente desde diagrama de base de datos"));
    }
}
`;
  }
  
  /**
   * Genera archivo application.properties
   */
  private generateApplicationProperties(): string {
    return `# Datasource configuration
spring.datasource.url=\${DATABASE_URL:jdbc:postgresql://localhost:5432/dbname}
spring.datasource.username=\${DB_USERNAME:postgres}
spring.datasource.password=\${DB_PASSWORD:password}

# JPA/Hibernate
spring.jpa.hibernate.ddl-auto=update
spring.jpa.show-sql=true
spring.jpa.properties.hibernate.format_sql=true

# Server
server.port=8080

# SpringDoc OpenAPI
springdoc.api-docs.path=/api-docs
springdoc.swagger-ui.path=/swagger-ui.html
`;
  }

  /**
   * Genera build.gradle
   */
  private generateBuildGradle(): string {
    return `plugins {
    id 'java'
    id 'org.springframework.boot' version '3.2.1'
    id 'io.spring.dependency-management' version '1.1.4'
}

group = 'com.example'
version = '0.0.1-SNAPSHOT'
description = 'Generated Spring Boot API Project'

java {
    toolchain {
        languageVersion = JavaLanguageVersion.of(17)
    }
}

repositories {
    mavenCentral()
}

dependencies {
    implementation 'org.springframework.boot:spring-boot-starter-web'
    implementation 'org.springframework.boot:spring-boot-starter-data-jpa'
    implementation 'org.springdoc:springdoc-openapi-starter-webmvc-ui:2.1.0'
    runtimeOnly 'org.postgresql:postgresql'
    runtimeOnly 'com.h2database:h2'
    testImplementation 'org.springframework.boot:spring-boot-starter-test'
}

tasks.named('test') {
    useJUnitPlatform()
}
`;
  }

  /**
   * Genera clase principal de aplicación
   */
  private generateMainClass(): string {
    return `package com.example.demo;

import org.springframework.boot.SpringApplication;
import org.springframework.boot.autoconfigure.SpringBootApplication;

@SpringBootApplication
public class DemoApplication {

    public static void main(String[] args) {
        SpringApplication.run(DemoApplication.class, args);
    }

}
`;
  }

  /**
   * Genera archivo README.md
   */
  private generateReadme(projectName: string): string {
    return `# ${projectName} - Spring Boot API

API REST generada automáticamente a partir de un diagrama de base de datos.

## Ejecutar el proyecto

\`\`\`bash
./gradlew bootRun
\`\`\`

## Documentación de API

Una vez ejecutando, accede a Swagger UI para ver y probar los endpoints:
http://localhost:8080/swagger-ui.html

## Estructura del proyecto

- \`/src/main/java/com/example/demo/model\`: Entidades JPA
- \`/src/main/java/com/example/demo/repository\`: Repositorios Spring Data JPA
- \`/src/main/java/com/example/demo/controller\`: Controladores REST
- \`/src/main/java/com/example/demo/config\`: Configuraciones (CORS, Swagger, etc)

## Base de datos

Por defecto, el proyecto está configurado para usar PostgreSQL. Puedes cambiar esto en \`application.properties\`.
`;
  }
  
  /**
   * Convierte un nombre de tabla a formato PascalCase para nombres de clase Java
   */
  private toPascalCase(str: string): string {
    return str
      .split(/[-_\s]+/)
      .map(word => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase())
      .join('');
  }
  
  /**
   * Convierte un nombre a formato camelCase para variables Java
   */
  private toCamelCase(str: string): string {
    const pascalCase = this.toPascalCase(str);
    return pascalCase.charAt(0).toLowerCase() + pascalCase.slice(1);
  }
  
  /**
   * Mapea un tipo de dato SQL a un tipo Java
   */
  private mapToJavaType(dbType: string): string {
    dbType = dbType.toLowerCase();
    
    if (dbType.includes('varchar') || dbType.includes('text') || dbType.includes('char')) {
      return 'String';
    } else if (dbType.includes('int') && !dbType.includes('bigint')) {
      return 'Integer';
    } else if (dbType.includes('bigint')) {
      return 'Long';
    } else if (dbType.includes('float') || dbType.includes('real')) {
      return 'Float';
    } else if (dbType.includes('double') || dbType.includes('numeric') || dbType.includes('decimal')) {
      return 'Double';
    } else if (dbType.includes('date') && !dbType.includes('timestamp')) {
      return 'LocalDate';
    } else if (dbType.includes('timestamp') || dbType.includes('datetime')) {
      return 'LocalDateTime';
    } else if (dbType.includes('time')) {
      return 'LocalTime';
    } else if (dbType.includes('bool')) {
      return 'Boolean';
    } else if (dbType.includes('json') || dbType.includes('jsonb')) {
      return 'String';  // Se maneja como String y se convierte con Jackson
    }
    
    return 'String';  // Default para tipos desconocidos
  }
}

export default new SpringBootExporter();
