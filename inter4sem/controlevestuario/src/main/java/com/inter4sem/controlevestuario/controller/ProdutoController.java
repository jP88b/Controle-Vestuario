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
import com.inter4sem.controlevestuario.entity.ProdutoEntity;
import com.inter4sem.controlevestuario.repository.ProdutoRepository;
import com.inter4sem.controlevestuario.service.ProdutoService;
@RestController
@RequiredArgsConstructor
@RequestMapping(value = "/Produto")
public class ProdutoController {
private final ProdutoRepository ProdutoRepository;
private final ProdutoService ProdutoService;

    @GetMapping
    public ResponseEntity<List<ProdutoEntity>> listarTodos() {
        List<ProdutoEntity> lista = ProdutoService.listarTodos();
        return ResponseEntity.ok().body(lista);
    }

    @PostMapping
    public ResponseEntity<ProdutoEntity> incluir(@RequestBody 
    ProdutoEntity Produto) {
        ProdutoEntity novo = ProdutoService.incluir(Produto);
        if (novo != null) {
            return new ResponseEntity<>(novo, HttpStatus.CREATED);
        } else {
            return new ResponseEntity<>(HttpStatus.BAD_REQUEST);
        }
    }

    @PutMapping("/{id}")
    public ResponseEntity<ProdutoEntity> editar(@PathVariable int id, 
    @RequestBody ProdutoEntity Produto) {
        ProdutoEntity atualizado = ProdutoService.editar(id,Produto);
        if (atualizado != null) {
            return new ResponseEntity<>(atualizado, HttpStatus.OK);
        } else {
            return new ResponseEntity<>(HttpStatus.NOT_FOUND);
        }
    }

    
    @DeleteMapping("/{id}")
    public ResponseEntity<Void> excluir(@PathVariable int id) {
        ProdutoService.excluir(id);
        return new ResponseEntity<>(HttpStatus.NO_CONTENT);
    }
}