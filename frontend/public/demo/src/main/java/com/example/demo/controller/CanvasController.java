package com.example.demo.controller;

import com.example.demo.model.Canvas;
import com.example.demo.repository.CanvasRepository;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/canvases")
public class CanvasController {

    private final CanvasRepository repo;

    public CanvasController(CanvasRepository repo) {
        this.repo = repo;
    }

    @GetMapping
    public List<Canvas> list() {
        return repo.findAll();
    }

    @GetMapping("/{id}")
    public ResponseEntity<Canvas> get(@PathVariable Long id) {
        return repo.findById(id).map(ResponseEntity::ok).orElseGet(() -> ResponseEntity.notFound().build());
    }

    @PostMapping
    public ResponseEntity<Canvas> create(@RequestBody Canvas canvas) {
        Canvas saved = repo.save(canvas);
        return ResponseEntity.ok(saved);
    }

    @PutMapping("/{id}")
    public ResponseEntity<Canvas> update(@PathVariable Long id, @RequestBody Canvas canvas) {
        return repo.findById(id).map(existing -> {
            existing.setName(canvas.getName());
            existing.setData(canvas.getData());
            repo.save(existing);
            return ResponseEntity.ok(existing);
        }).orElseGet(() -> ResponseEntity.notFound().build());
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<Void> delete(@PathVariable Long id) {
        if (repo.existsById(id)) {
            repo.deleteById(id);
            return ResponseEntity.noContent().build();
        }
        return ResponseEntity.notFound().build();
    }
}
