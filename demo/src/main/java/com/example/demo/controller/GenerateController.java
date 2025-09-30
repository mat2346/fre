package com.example.demo.controller;

import com.example.demo.service.ExportService;
import org.springframework.http.HttpHeaders;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.io.IOException;

@RestController
@RequestMapping("/api/generate")
public class GenerateController {

    private final ExportService exportService;

    public GenerateController(ExportService exportService) {
        this.exportService = exportService;
    }

    /**
     * Endpoint para generar un proyecto Spring Boot a partir del esquema de base de datos
     * @param dbSchema JSON con la definición del esquema de base de datos
     * @return ZIP con el proyecto Spring Boot generado
     */
    @PostMapping(value = "/springboot", produces = MediaType.APPLICATION_OCTET_STREAM_VALUE)
    public ResponseEntity<byte[]> generateSpringBootProject(@RequestBody String dbSchema) {
        try {
            byte[] projectZip = exportService.generateSpringBootProject(dbSchema);
            
            HttpHeaders headers = new HttpHeaders();
            headers.setContentType(MediaType.APPLICATION_OCTET_STREAM);
            headers.setContentDispositionFormData("attachment", "springboot-project.zip");
            
            return ResponseEntity.ok()
                    .headers(headers)
                    .body(projectZip);
        } catch (IOException e) {
            e.printStackTrace();
            return ResponseEntity.internalServerError().build();
        }
    }
}
