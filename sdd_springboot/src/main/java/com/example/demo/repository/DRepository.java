package com.example.demo.repository;

import com.example.demo.model.D;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

@Repository
public interface DRepository extends JpaRepository<D, Long> {
    // Puedes añadir métodos de consulta personalizados aquí
}
