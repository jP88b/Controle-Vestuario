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
import com.inter4sem.controlevestuario.entity.VendaEntity;
import com.inter4sem.controlevestuario.repository.VendaRepository;
import com.inter4sem.controlevestuario.service.VendaService;
@RestController
@RequiredArgsConstructor
@RequestMapping(value = "/Venda")
public class VendaController {
private final VendaRepository VendaRepository;
private final VendaService VendaService;

    @GetMapping
    public ResponseEntity<List<VendaEntity>> listarTodos() {
        List<VendaEntity> lista = VendaService.listarTodos();
        return ResponseEntity.ok().body(lista);
    }

    @PostMapping
    public ResponseEntity<VendaEntity> incluir(@RequestBody 
    VendaEntity Venda) {
        VendaEntity novo = VendaService.incluir(Venda);
        if (novo != null) {
            return new ResponseEntity<>(novo, HttpStatus.CREATED);
        } else {
            return new ResponseEntity<>(HttpStatus.BAD_REQUEST);
        }
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