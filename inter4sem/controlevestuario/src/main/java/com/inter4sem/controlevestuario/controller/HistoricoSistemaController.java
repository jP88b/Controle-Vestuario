package com.inter4sem.controlevestuario.controller;

import java.util.List;

import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.CrossOrigin;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;
import lombok.RequiredArgsConstructor;

import com.inter4sem.controlevestuario.entity.HistoricoSistemaEntity;
import com.inter4sem.controlevestuario.service.HistoricoSistemaService;

@RestController
@RequiredArgsConstructor
@CrossOrigin(origins = "*")
@RequestMapping(value = "/historico")
public class HistoricoSistemaController {

    private final HistoricoSistemaService historicoSistemaService;

    @GetMapping
    public ResponseEntity<List<HistoricoSistemaEntity>> listarTodos() {
        List<HistoricoSistemaEntity> lista = historicoSistemaService.listarTodos();
        return ResponseEntity.ok().body(lista);
    }

    @PostMapping
    public ResponseEntity<HistoricoSistemaEntity> incluir(@RequestBody HistoricoSistemaEntity historico) {
        HistoricoSistemaEntity novo = historicoSistemaService.incluir(historico);
        if (novo != null) {
            return new ResponseEntity<>(novo, HttpStatus.CREATED);
        } else {
            return new ResponseEntity<>(HttpStatus.BAD_REQUEST);
        }
    }

    @PutMapping("/{id}")
    public ResponseEntity<HistoricoSistemaEntity> editar(@PathVariable Long id, @RequestBody HistoricoSistemaEntity historico) {
        HistoricoSistemaEntity atualizado = historicoSistemaService.editar(id, historico);
        if (atualizado != null) {
            return new ResponseEntity<>(atualizado, HttpStatus.OK);
        } else {
            return new ResponseEntity<>(HttpStatus.NOT_FOUND);
        }
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<Void> excluir(@PathVariable Long id) {
        historicoSistemaService.excluir(id);
        return new ResponseEntity<>(HttpStatus.NO_CONTENT);
    }
}