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
import com.inter4sem.controlevestuario.entity.FornecedorEntity;
import com.inter4sem.controlevestuario.repository.FornecedoresRepository;
import com.inter4sem.controlevestuario.service.FornecedoresService;
@RestController
@RequiredArgsConstructor
@RequestMapping(value = "/fornecedor")
public class FornecedorController {
private final FornecedoresRepository fornecedoresRepository;
private final FornecedoresService FornecedoresService;

    @GetMapping
    public ResponseEntity<List<FornecedorEntity>> listarTodos() {
        List<FornecedorEntity> lista = FornecedoresService.listarTodos();
        return ResponseEntity.ok().body(lista);
    }

    @PostMapping
    public ResponseEntity<FornecedorEntity> incluir(@RequestBody 
    FornecedorEntity Fornecedor) {
        FornecedorEntity novo = FornecedoresService.incluir(Fornecedor);
        if (novo != null) {
            return new ResponseEntity<>(novo, HttpStatus.CREATED);
        } else {
            return new ResponseEntity<>(HttpStatus.BAD_REQUEST);
        }
    }

    @PutMapping("/{id}")
    public ResponseEntity<FornecedorEntity> editar(@PathVariable int id, 
    @RequestBody FornecedorEntity Fornecedor) {
        FornecedorEntity atualizado = FornecedoresService.editar(id,Fornecedor);
        if (atualizado != null) {
            return new ResponseEntity<>(atualizado, HttpStatus.OK);
        } else {
            return new ResponseEntity<>(HttpStatus.NOT_FOUND);
        }
    }

    
    @DeleteMapping("/{id}")
    public ResponseEntity<Void> excluir(@PathVariable int id) {
        FornecedoresService.excluir(id);
        return new ResponseEntity<>(HttpStatus.NO_CONTENT);
    }
}