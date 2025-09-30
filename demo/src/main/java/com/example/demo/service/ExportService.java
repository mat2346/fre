package com.example.demo.service;

import com.example.demo.model.Canvas;
import com.example.demo.repository.CanvasRepository;
import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.fasterxml.jackson.databind.node.ArrayNode;
import com.fasterxml.jackson.databind.node.ObjectNode;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;
import org.springframework.web.multipart.MultipartFile;

import java.io.File;
import java.io.FileOutputStream;
import java.io.IOException;
import java.io.PrintWriter;
import java.nio.charset.StandardCharsets;
import java.nio.file.Files;
import java.nio.file.Path;
import java.nio.file.Paths;
import java.util.ArrayList;
import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.stream.Collectors;
import java.util.zip.ZipEntry;
import java.util.zip.ZipInputStream;
import java.util.zip.ZipOutputStream;

@Service
public class ExportService {

    private final CanvasRepository canvasRepository;
    private final ObjectMapper objectMapper;
    
    @Value("${app.export.directory:exports}")
    private String exportDirectory;
    
    @Value("${app.public.directory:public}")
    private String publicDirectory;

    public ExportService(CanvasRepository canvasRepository, ObjectMapper objectMapper) {
        this.canvasRepository = canvasRepository;
        this.objectMapper = objectMapper;
    }
    
    /**
     * Genera archivos Java para Spring Boot basados en un esquema de base de datos
     * @param dbSchema El esquema de base de datos en formato JSON (tablas, columnas, relaciones)
     * @return ZIP con archivos Java generados (entidades, repos, controllers)
     */
    public byte[] generateSpringBootProject(String dbSchema) throws IOException {
        // Crear directorios temporales para el proyecto
        Path tempDir = Files.createTempDirectory("spring-boot-export");
        Path srcDir = tempDir.resolve(Paths.get("src/main/java/com/example/demo"));
        Files.createDirectories(srcDir);
        
        // Directorios para los diferentes tipos de archivos
        Path modelDir = srcDir.resolve("model");
        Path repoDir = srcDir.resolve("repository");
        Path controllerDir = srcDir.resolve("controller");
        Path configDir = srcDir.resolve("config");
        Path resourcesDir = tempDir.resolve("src/main/resources");
        
        Files.createDirectories(modelDir);
        Files.createDirectories(repoDir);
        Files.createDirectories(controllerDir);
        Files.createDirectories(configDir);
        Files.createDirectories(resourcesDir);
        
        // Parseamos el schema JSON
        JsonNode schemaNode = objectMapper.readTree(dbSchema);
        
        // Estructura esperada: { tables: [...], relationships: [...] }
        if (!schemaNode.has("tables") || !schemaNode.has("relationships")) {
            throw new IllegalArgumentException("El esquema debe tener 'tables' y 'relationships'");
        }
        
        // Generar archivos de entidad para cada tabla
        List<String> entityNames = generateEntityFiles(schemaNode.get("tables"), modelDir);
        
        // Generar repositorios para cada entidad
        generateRepositoryFiles(entityNames, repoDir);
        
        // Generar controladores REST
        generateControllerFiles(entityNames, controllerDir);
        
        // Generar archivos de configuración
        generateConfigFiles(configDir);
        
        // Generar application.properties
        generateApplicationProperties(resourcesDir);
        
        // Generar pom.xml o build.gradle
        generateBuildGradle(tempDir);
        
        // Comprimir en un ZIP
        File zipFile = File.createTempFile("springboot-export", ".zip");
        try (FileOutputStream fos = new FileOutputStream(zipFile);
             ZipOutputStream zos = new ZipOutputStream(fos)) {
            
            // Agregar todos los archivos al ZIP
            Files.walk(tempDir)
                .filter(path -> !Files.isDirectory(path))
                .forEach(path -> {
                    try {
                        String relativePath = tempDir.relativize(path).toString();
                        ZipEntry entry = new ZipEntry(relativePath);
                        zos.putNextEntry(entry);
                        zos.write(Files.readAllBytes(path));
                        zos.closeEntry();
                    } catch (IOException e) {
                        e.printStackTrace();
                    }
                });
        }
        
        // Leer el ZIP y retornar
        byte[] zipContent = Files.readAllBytes(zipFile.toPath());
        
        // Limpiar archivos temporales
        Files.walk(tempDir)
            .sorted((a, b) -> -a.compareTo(b))
            .forEach(path -> {
                try {
                    Files.delete(path);
                } catch (IOException e) {
                    e.printStackTrace();
                }
            });
        Files.delete(zipFile.toPath());
        
        return zipContent;
    }
    
    private List<String> generateEntityFiles(JsonNode tables, Path modelDir) throws IOException {
        List<String> entityNames = new ArrayList<>();
        
        for (JsonNode table : tables) {
            String tableName = table.get("name").asText();
            String entityName = toClassName(tableName);
            entityNames.add(entityName);
            
            StringBuilder entityCode = new StringBuilder();
            entityCode.append("package com.example.demo.model;\n\n");
            entityCode.append("import jakarta.persistence.*;\n");
            entityCode.append("import java.util.*;\n\n");
            
            entityCode.append("@Entity\n");
            entityCode.append("@Table(name = \"").append(tableName).append("\")\n");
            entityCode.append("public class ").append(entityName).append(" {\n\n");
            
            // ID y columnas
            entityCode.append("    @Id\n");
            entityCode.append("    @GeneratedValue(strategy = GenerationType.IDENTITY)\n");
            entityCode.append("    private Long id;\n\n");
            
            // Otras columnas
            if (table.has("columns") && table.get("columns").isArray()) {
                for (JsonNode column : table.get("columns")) {
                    String columnName = column.get("name").asText();
                    String columnType = column.get("type").asText();
                    String javaType = mapToJavaType(columnType);
                    
                    if (!columnName.equals("id")) {
                        entityCode.append("    private ").append(javaType).append(" ").append(toCamelCase(columnName)).append(";\n\n");
                    }
                }
            }
            
            // Getters y setters
            entityCode.append("    // Getters and Setters\n");
            entityCode.append("    public Long getId() {\n");
            entityCode.append("        return id;\n");
            entityCode.append("    }\n\n");
            entityCode.append("    public void setId(Long id) {\n");
            entityCode.append("        this.id = id;\n");
            entityCode.append("    }\n\n");
            
            if (table.has("columns") && table.get("columns").isArray()) {
                for (JsonNode column : table.get("columns")) {
                    String columnName = column.get("name").asText();
                    String columnType = column.get("type").asText();
                    String javaType = mapToJavaType(columnType);
                    
                    if (!columnName.equals("id")) {
                        String fieldName = toCamelCase(columnName);
                        String capitalizedField = capitalize(fieldName);
                        
                        entityCode.append("    public ").append(javaType).append(" get").append(capitalizedField).append("() {\n");
                        entityCode.append("        return ").append(fieldName).append(";\n");
                        entityCode.append("    }\n\n");
                        entityCode.append("    public void set").append(capitalizedField).append("(").append(javaType).append(" ").append(fieldName).append(") {\n");
                        entityCode.append("        this.").append(fieldName).append(" = ").append(fieldName).append(";\n");
                        entityCode.append("    }\n\n");
                    }
                }
            }
            
            entityCode.append("}\n");
            
            // Escribir el archivo de entidad
            Files.write(modelDir.resolve(entityName + ".java"), entityCode.toString().getBytes());
        }
        
        return entityNames;
    }
    
    private void generateRepositoryFiles(List<String> entityNames, Path repoDir) throws IOException {
        for (String entityName : entityNames) {
            StringBuilder repoCode = new StringBuilder();
            repoCode.append("package com.example.demo.repository;\n\n");
            repoCode.append("import com.example.demo.model.").append(entityName).append(";\n");
            repoCode.append("import org.springframework.data.jpa.repository.JpaRepository;\n");
            repoCode.append("import org.springframework.stereotype.Repository;\n\n");
            
            repoCode.append("@Repository\n");
            repoCode.append("public interface ").append(entityName).append("Repository extends JpaRepository<").append(entityName).append(", Long> {\n");
            repoCode.append("}\n");
            
            // Escribir el archivo de repositorio
            Files.write(repoDir.resolve(entityName + "Repository.java"), repoCode.toString().getBytes());
        }
    }
    
    private void generateControllerFiles(List<String> entityNames, Path controllerDir) throws IOException {
        for (String entityName : entityNames) {
            String resourceName = toCamelCase(entityName) + "s";
            
            StringBuilder controllerCode = new StringBuilder();
            controllerCode.append("package com.example.demo.controller;\n\n");
            controllerCode.append("import com.example.demo.model.").append(entityName).append(";\n");
            controllerCode.append("import com.example.demo.repository.").append(entityName).append("Repository;\n");
            controllerCode.append("import org.springframework.http.ResponseEntity;\n");
            controllerCode.append("import org.springframework.web.bind.annotation.*;\n\n");
            controllerCode.append("import java.util.List;\n\n");
            
            controllerCode.append("@RestController\n");
            controllerCode.append("@RequestMapping(\"/api/").append(resourceName).append("\")\n");
            controllerCode.append("public class ").append(entityName).append("Controller {\n\n");
            controllerCode.append("    private final ").append(entityName).append("Repository repository;\n\n");
            
            controllerCode.append("    public ").append(entityName).append("Controller(").append(entityName).append("Repository repository) {\n");
            controllerCode.append("        this.repository = repository;\n");
            controllerCode.append("    }\n\n");
            
            // Métodos CRUD
            // GET - list
            controllerCode.append("    @GetMapping\n");
            controllerCode.append("    public List<").append(entityName).append("> getAll() {\n");
            controllerCode.append("        return repository.findAll();\n");
            controllerCode.append("    }\n\n");
            
            // GET - detail
            controllerCode.append("    @GetMapping(\"/{id}\")\n");
            controllerCode.append("    public ResponseEntity<").append(entityName).append("> getById(@PathVariable Long id) {\n");
            controllerCode.append("        return repository.findById(id)\n");
            controllerCode.append("                .map(ResponseEntity::ok)\n");
            controllerCode.append("                .orElseGet(() -> ResponseEntity.notFound().build());\n");
            controllerCode.append("    }\n\n");
            
            // POST - create
            controllerCode.append("    @PostMapping\n");
            controllerCode.append("    public ").append(entityName).append(" create(@RequestBody ").append(entityName).append(" entity) {\n");
            controllerCode.append("        return repository.save(entity);\n");
            controllerCode.append("    }\n\n");
            
            // PUT - update
            controllerCode.append("    @PutMapping(\"/{id}\")\n");
            controllerCode.append("    public ResponseEntity<").append(entityName).append("> update(@PathVariable Long id, @RequestBody ").append(entityName).append(" entity) {\n");
            controllerCode.append("        return repository.findById(id)\n");
            controllerCode.append("                .map(existingEntity -> {\n");
            controllerCode.append("                    entity.setId(id);\n");
            controllerCode.append("                    return ResponseEntity.ok(repository.save(entity));\n");
            controllerCode.append("                })\n");
            controllerCode.append("                .orElseGet(() -> ResponseEntity.notFound().build());\n");
            controllerCode.append("    }\n\n");
            
            // DELETE
            controllerCode.append("    @DeleteMapping(\"/{id}\")\n");
            controllerCode.append("    public ResponseEntity<Void> delete(@PathVariable Long id) {\n");
            controllerCode.append("        if (repository.existsById(id)) {\n");
            controllerCode.append("            repository.deleteById(id);\n");
            controllerCode.append("            return ResponseEntity.noContent().build();\n");
            controllerCode.append("        }\n");
            controllerCode.append("        return ResponseEntity.notFound().build();\n");
            controllerCode.append("    }\n");
            
            controllerCode.append("}\n");
            
            // Escribir el archivo de controlador
            Files.write(controllerDir.resolve(entityName + "Controller.java"), controllerCode.toString().getBytes());
        }
    }
    
    private void generateConfigFiles(Path configDir) throws IOException {
        // CORS Configuration
        StringBuilder corsConfig = new StringBuilder();
        corsConfig.append("package com.example.demo.config;\n\n");
        corsConfig.append("import org.springframework.context.annotation.Configuration;\n");
        corsConfig.append("import org.springframework.web.servlet.config.annotation.CorsRegistry;\n");
        corsConfig.append("import org.springframework.web.servlet.config.annotation.WebMvcConfigurer;\n\n");
        
        corsConfig.append("@Configuration\n");
        corsConfig.append("public class WebConfig implements WebMvcConfigurer {\n\n");
        corsConfig.append("    @Override\n");
        corsConfig.append("    public void addCorsMappings(CorsRegistry registry) {\n");
        corsConfig.append("        registry.addMapping(\"/api/**\")\n");
        corsConfig.append("                .allowedOrigins(\"http://localhost:3000\", \"http://localhost:5173\")\n");
        corsConfig.append("                .allowedMethods(\"GET\", \"POST\", \"PUT\", \"DELETE\", \"OPTIONS\")\n");
        corsConfig.append("                .allowCredentials(true);\n");
        corsConfig.append("    }\n");
        corsConfig.append("}\n");
        
        Files.write(configDir.resolve("WebConfig.java"), corsConfig.toString().getBytes());
        
        // Swagger/OpenAPI Configuration
        StringBuilder swaggerConfig = new StringBuilder();
        swaggerConfig.append("package com.example.demo.config;\n\n");
        swaggerConfig.append("import io.swagger.v3.oas.models.OpenAPI;\n");
        swaggerConfig.append("import io.swagger.v3.oas.models.info.Info;\n");
        swaggerConfig.append("import org.springframework.context.annotation.Bean;\n");
        swaggerConfig.append("import org.springframework.context.annotation.Configuration;\n\n");
        
        swaggerConfig.append("@Configuration\n");
        swaggerConfig.append("public class SwaggerConfig {\n\n");
        swaggerConfig.append("    @Bean\n");
        swaggerConfig.append("    public OpenAPI customOpenAPI() {\n");
        swaggerConfig.append("        return new OpenAPI()\n");
        swaggerConfig.append("                .info(new Info()\n");
        swaggerConfig.append("                        .title(\"Generated Spring Boot API\")\n");
        swaggerConfig.append("                        .version(\"1.0\")\n");
        swaggerConfig.append("                        .description(\"Automatically generated API from database diagram\"));\n");
        swaggerConfig.append("    }\n");
        swaggerConfig.append("}\n");
        
        Files.write(configDir.resolve("SwaggerConfig.java"), swaggerConfig.toString().getBytes());
    }
    
    private void generateApplicationProperties(Path resourcesDir) throws IOException {
        StringBuilder props = new StringBuilder();
        props.append("# Datasource configuration\n");
        props.append("spring.datasource.url=${DATABASE_URL:jdbc:postgresql://localhost:5432/dbname}\n");
        props.append("spring.datasource.username=${DB_USERNAME:postgres}\n");
        props.append("spring.datasource.password=${DB_PASSWORD:password}\n\n");
        
        props.append("# JPA/Hibernate\n");
        props.append("spring.jpa.hibernate.ddl-auto=update\n");
        props.append("spring.jpa.show-sql=true\n");
        props.append("spring.jpa.properties.hibernate.format_sql=true\n\n");
        
        props.append("# Server\n");
        props.append("server.port=8080\n\n");
        
        props.append("# SpringDoc OpenAPI\n");
        props.append("springdoc.api-docs.path=/api-docs\n");
        props.append("springdoc.swagger-ui.path=/swagger-ui.html\n");
        
        Files.write(resourcesDir.resolve("application.properties"), props.toString().getBytes());
    }
    
    private void generateBuildGradle(Path projectDir) throws IOException {
        StringBuilder gradle = new StringBuilder();
        gradle.append("plugins {\n");
        gradle.append("    id 'java'\n");
        gradle.append("    id 'org.springframework.boot' version '3.5.6'\n");
        gradle.append("    id 'io.spring.dependency-management' version '1.1.7'\n");
        gradle.append("}\n\n");
        
        gradle.append("group = 'com.example'\n");
        gradle.append("version = '0.0.1-SNAPSHOT'\n");
        gradle.append("description = 'Generated Spring Boot API Project'\n\n");
        
        gradle.append("java {\n");
        gradle.append("    toolchain {\n");
        gradle.append("        languageVersion = JavaLanguageVersion.of(17)\n");
        gradle.append("    }\n");
        gradle.append("}\n\n");
        
        gradle.append("repositories {\n");
        gradle.append("    mavenCentral()\n");
        gradle.append("}\n\n");
        
        gradle.append("dependencies {\n");
        gradle.append("    implementation 'org.springframework.boot:spring-boot-starter-web'\n");
        gradle.append("    implementation 'org.springframework.boot:spring-boot-starter-data-jpa'\n");
        gradle.append("    implementation 'org.springdoc:springdoc-openapi-starter-webmvc-ui:2.1.0'\n");
        gradle.append("    runtimeOnly 'org.postgresql:postgresql'\n");
        gradle.append("    testImplementation 'org.springframework.boot:spring-boot-starter-test'\n");
        gradle.append("}\n\n");
        
        gradle.append("tasks.named('test') {\n");
        gradle.append("    useJUnitPlatform()\n");
        gradle.append("}\n");
        
        Files.write(projectDir.resolve("build.gradle"), gradle.toString().getBytes());
    }
    
    // Utility methods
    private String mapToJavaType(String dbType) {
        dbType = dbType.toLowerCase();
        if (dbType.contains("varchar") || dbType.contains("text") || dbType.contains("char")) {
            return "String";
        } else if (dbType.contains("int")) {
            return "Integer";
        } else if (dbType.contains("bigint")) {
            return "Long";
        } else if (dbType.contains("float") || dbType.contains("real")) {
            return "Float";
        } else if (dbType.contains("double") || dbType.contains("numeric") || dbType.contains("decimal")) {
            return "Double";
        } else if (dbType.contains("date") && !dbType.contains("timestamp")) {
            return "java.time.LocalDate";
        } else if (dbType.contains("timestamp") || dbType.contains("datetime")) {
            return "java.time.LocalDateTime";
        } else if (dbType.contains("time")) {
            return "java.time.LocalTime";
        } else if (dbType.contains("bool")) {
            return "Boolean";
        } else {
            return "String"; // Default to String for unknown types
        }
    }
    
    private String toClassName(String tableName) {
        // Remove plurals and convert to singular
        if (tableName.endsWith("s")) {
            tableName = tableName.substring(0, tableName.length() - 1);
        }
        
        return Arrays.stream(tableName.split("_"))
                .map(this::capitalize)
                .collect(Collectors.joining());
    }
    
    private String toCamelCase(String s) {
        String[] parts = s.split("_");
        StringBuilder camelCase = new StringBuilder(parts[0]);
        
        for (int i = 1; i < parts.length; i++) {
            camelCase.append(capitalize(parts[i]));
        }
        
        return camelCase.toString();
    }
    
    private String capitalize(String s) {
        if (s == null || s.isEmpty()) {
            return s;
        }
        return Character.toUpperCase(s.charAt(0)) + s.substring(1);
    }

    /**
     * Exporta todos los canvases y archivos asociados a un archivo zip
     * @return El archivo zip como array de bytes
     */
    public byte[] exportAll() throws IOException {
        // Crear directorios si no existen
        Path exportPath = Paths.get(exportDirectory);
        Files.createDirectories(exportPath);
        
        // Archivo temporal para el zip
        File zipFile = File.createTempFile("export", ".zip", exportPath.toFile());
        
        try (FileOutputStream fos = new FileOutputStream(zipFile);
             ZipOutputStream zos = new ZipOutputStream(fos)) {
            
            // 1. Exportar datos de los canvases
            List<Canvas> canvases = canvasRepository.findAll();
            String canvasesJson = objectMapper.writeValueAsString(canvases);
            
            ZipEntry canvasesEntry = new ZipEntry("canvases.json");
            zos.putNextEntry(canvasesEntry);
            zos.write(canvasesJson.getBytes());
            zos.closeEntry();
            
            // 2. Exportar archivos públicos si existen
            Path publicPath = Paths.get(publicDirectory);
            if (Files.exists(publicPath)) {
                Files.walk(publicPath)
                    .filter(path -> !Files.isDirectory(path))
                    .forEach(path -> {
                        try {
                            String entryName = "public/" + publicPath.relativize(path).toString();
                            ZipEntry fileEntry = new ZipEntry(entryName);
                            zos.putNextEntry(fileEntry);
                            zos.write(Files.readAllBytes(path));
                            zos.closeEntry();
                        } catch (IOException e) {
                            e.printStackTrace();
                        }
                    });
            }
        }
        
        // Leer el archivo zip en un array de bytes
        byte[] zipContent = Files.readAllBytes(zipFile.toPath());
        
        // Eliminar el archivo temporal
        Files.delete(zipFile.toPath());
        
        return zipContent;
    }
    
    /**
     * Importa canvases y archivos públicos desde un archivo zip
     * @param zipFile El archivo zip a importar
     * @return Un mapa con el resultado de la importación
     */
    public Map<String, Object> importAll(MultipartFile zipFile) throws IOException {
        Map<String, Object> result = new HashMap<>();
        int canvasesImported = 0;
        int filesImported = 0;
        
        // Crear directorio public si no existe
        Path publicPath = Paths.get(publicDirectory);
        Files.createDirectories(publicPath);
        
        try (ZipInputStream zis = new ZipInputStream(zipFile.getInputStream())) {
            ZipEntry entry;
            while ((entry = zis.getNextEntry()) != null) {
                String entryName = entry.getName();
                
                if (entryName.equals("canvases.json")) {
                    // Importar canvases
                    byte[] bytes = readAllBytes(zis);
                    String json = new String(bytes);
                    Canvas[] canvases = objectMapper.readValue(json, Canvas[].class);
                    
                    // Guardar cada canvas en la base de datos
                    for (Canvas canvas : canvases) {
                        // Eliminar ID para evitar conflictos
                        canvas.setId(null);
                        canvasRepository.save(canvas);
                        canvasesImported++;
                    }
                } else if (entryName.startsWith("public/")) {
                    // Importar archivo público
                    String relativePath = entryName.substring(7); // Quitar "public/"
                    Path filePath = publicPath.resolve(relativePath);
                    
                    // Crear directorios padre si no existen
                    Files.createDirectories(filePath.getParent());
                    
                    // Escribir archivo
                    byte[] bytes = readAllBytes(zis);
                    Files.write(filePath, bytes);
                    filesImported++;
                }
                
                zis.closeEntry();
            }
        }
        
        result.put("canvasesImported", canvasesImported);
        result.put("filesImported", filesImported);
        return result;
    }
    
    /**
     * Lee todos los bytes de un ZipInputStream sin cerrar el stream
     */
    private byte[] readAllBytes(ZipInputStream zis) throws IOException {
        byte[] buffer = new byte[1024];
        int bytesRead;
        byte[] content = new byte[0];
        
        while ((bytesRead = zis.read(buffer)) != -1) {
            byte[] newContent = new byte[content.length + bytesRead];
            System.arraycopy(content, 0, newContent, 0, content.length);
            System.arraycopy(buffer, 0, newContent, content.length, bytesRead);
            content = newContent;
        }
        
        return content;
    }
}
