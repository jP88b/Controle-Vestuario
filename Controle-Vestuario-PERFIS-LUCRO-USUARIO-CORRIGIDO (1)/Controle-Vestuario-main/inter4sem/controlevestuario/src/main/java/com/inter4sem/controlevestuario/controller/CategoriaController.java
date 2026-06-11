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
import org.springframework.web.bind.annotation.RequestHeader;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;
import lombok.RequiredArgsConstructor;
import com.inter4sem.controlevestuario.entity.CategoriaEntity;
import com.inter4sem.controlevestuario.service.CategoriaService;
@RestController
@RequiredArgsConstructor
@RequestMapping(value = "/categoria")
public class CategoriaController {
private final CategoriaService CategoriaService;
    @GetMapping
    public ResponseEntity<List<CategoriaEntity>> listarTodos() {
        List<CategoriaEntity> lista = CategoriaService.listarTodos();
        return ResponseEntity.ok().body(lista);
    }

    @PostMapping
    public ResponseEntity<CategoriaEntity> incluir(@RequestBody CategoriaEntity Categoria,
            @RequestHeader(value = "X-Usuario-Sistema", required = false) String usuarioSistema) {
        CategoriaEntity novo = CategoriaService.incluir(Categoria, usuarioSistema);
        if (novo != null) {
            return new ResponseEntity<>(novo, HttpStatus.CREATED);
        } else {
            return new ResponseEntity<>(HttpStatus.BAD_REQUEST);
        }
    }

    @PutMapping("/{id}")
    public ResponseEntity<CategoriaEntity> editar(@PathVariable int id, @RequestBody CategoriaEntity Categoria,
            @RequestHeader(value = "X-Usuario-Sistema", required = false) String usuarioSistema) {
        CategoriaEntity atualizado = CategoriaService.editar(id, Categoria, usuarioSistema);
        if (atualizado != null) {
            return new ResponseEntity<>(atualizado, HttpStatus.OK);
        } else {
            return new ResponseEntity<>(HttpStatus.NOT_FOUND);
        }
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<Void> excluir(@PathVariable int id,
            @RequestHeader(value = "X-Usuario-Sistema", required = false) String usuarioSistema) {
        CategoriaService.excluir(id, usuarioSistema);
        return new ResponseEntity<>(HttpStatus.NO_CONTENT);
    }
}
