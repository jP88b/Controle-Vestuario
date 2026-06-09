package com.inter4sem.controlevestuario.controller;

import java.util.List;
import java.util.Map;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import lombok.RequiredArgsConstructor;

import com.inter4sem.controlevestuario.service.DashboardService;

@RestController
@RequiredArgsConstructor
@RequestMapping("/dashboard")
@CrossOrigin(origins = "*")
public class DashboardController {

    private final DashboardService dashboardService;

    @GetMapping("/kpis")
    public ResponseEntity<Map<String, Object>> buscarKpis() {
        Map<String, Object> kpis = dashboardService.buscarKpis();
        return ResponseEntity.ok().body(kpis);
    }

    @GetMapping("/categorias")
    public ResponseEntity<List<Map<String, Object>>> buscarProdutosPorCategoria() {
        List<Map<String, Object>> lista = dashboardService.buscarProdutosPorCategoria();
        return ResponseEntity.ok().body(lista);
    }

    @GetMapping("/criticos")
    public ResponseEntity<List<Map<String, Object>>> buscarEstoqueCritico() {
        List<Map<String, Object>> lista = dashboardService.buscarEstoqueCritico();
        return ResponseEntity.ok().body(lista);
    }
}