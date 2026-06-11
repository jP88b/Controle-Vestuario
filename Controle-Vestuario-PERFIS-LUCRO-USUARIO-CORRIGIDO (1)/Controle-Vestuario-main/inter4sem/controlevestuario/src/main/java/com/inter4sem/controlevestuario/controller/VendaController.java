package com.inter4sem.controlevestuario.controller;
import java.util.List;

import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;
import lombok.RequiredArgsConstructor;
import com.inter4sem.controlevestuario.entity.VendaEntity;
import com.inter4sem.controlevestuario.repository.VendaRepository;
import com.inter4sem.controlevestuario.service.VendaService;
import org.springframework.jdbc.core.JdbcTemplate;
import java.util.Map;

@RestController
@RequiredArgsConstructor
@RequestMapping(value = "/Venda")
public class VendaController {
    private final VendaRepository VendaRepository;
    private final VendaService VendaService;
    private final JdbcTemplate jdbcTemplate;

    @GetMapping
    public ResponseEntity<List<VendaEntity>> listarTodos() {
        List<VendaEntity> lista = VendaService.listarTodos();
        return ResponseEntity.ok().body(lista);
    }

    @PostMapping("/realizar")
    public ResponseEntity<?> realizarVenda(@RequestBody VendaRequest request) {
        Map<String, Object> resultado = jdbcTemplate.queryForMap(
            "EXEC sp_realizar_venda_transacional ?, ?, ?",
            request.getIdproduto(),
            request.getIdusuario(),
            request.getQuantidade()
        );

        return ResponseEntity.ok(resultado);
    }

    @PutMapping("/{id}")
    public ResponseEntity<VendaEntity> editar(@PathVariable int id, 
    @RequestBody VendaEntity Venda) {
        VendaEntity atualizado = VendaService.editar(id,Venda);
        if (atualizado != null) {
            return new ResponseEntity<>(atualizado, HttpStatus.OK);
        } else {
            return new ResponseEntity<>(HttpStatus.NOT_FOUND);
        }
    }

    
    @DeleteMapping("/{id}")
    public ResponseEntity<Void> excluir(@PathVariable int id) {
        VendaService.excluir(id);
        return new ResponseEntity<>(HttpStatus.NO_CONTENT);
    }
}