package com.inter4sem.controlevestuario.controller;
import java.util.List;

import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;
import lombok.RequiredArgsConstructor;
import com.inter4sem.controlevestuario.entity.MovimentacaoEntity;
import com.inter4sem.controlevestuario.repository.MovimentacaoRepository;
import com.inter4sem.controlevestuario.service.MovimentacaoService;
@RestController
@RequiredArgsConstructor
@RequestMapping(value = "/Movimentacao")
public class MovimentacaoController {
private final MovimentacaoRepository MovimentacaoRepository;
private final MovimentacaoService MovimentacaoService;

    @GetMapping
    public ResponseEntity<List<MovimentacaoEntity>> listarTodos() {
        List<MovimentacaoEntity> lista = MovimentacaoService.listarTodos();
        return ResponseEntity.ok().body(lista);
    }

    @PostMapping
    public ResponseEntity<MovimentacaoEntity> incluir(@RequestBody 
    MovimentacaoEntity Movimentacao){
        MovimentacaoEntity novo = MovimentacaoService.incluir(Movimentacao);
        if (novo != null) {
            return new ResponseEntity<>(novo, HttpStatus.CREATED);
        } else {
            return new ResponseEntity<>(HttpStatus.BAD_REQUEST);
        }
    }

    @PutMapping("/{id}")
    public ResponseEntity<MovimentacaoEntity> editar(@PathVariable int id, 
    @RequestBody MovimentacaoEntity Movimentacao){
        MovimentacaoEntity atualizado = MovimentacaoService.editar(id,Movimentacao);
        if (atualizado != null) {
            return new ResponseEntity<>(atualizado, HttpStatus.OK);
        } else {
            return new ResponseEntity<>(HttpStatus.NOT_FOUND);
        }
    }

    
    @DeleteMapping("/{id}")
    public ResponseEntity<Void> excluir(@PathVariable int id) {
        MovimentacaoService.excluir(id);
        return new ResponseEntity<>(HttpStatus.NO_CONTENT);
    }
}