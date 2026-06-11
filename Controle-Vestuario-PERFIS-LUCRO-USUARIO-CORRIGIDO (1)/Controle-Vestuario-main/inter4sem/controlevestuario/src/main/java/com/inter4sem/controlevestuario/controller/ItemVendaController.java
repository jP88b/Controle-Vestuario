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
import com.inter4sem.controlevestuario.entity.ItemVendaEntity;
import com.inter4sem.controlevestuario.repository.ItemVendaRepository;
import com.inter4sem.controlevestuario.service.ItemVendaService;
@RestController
@RequiredArgsConstructor
@RequestMapping(value = "/item-venda")
public class ItemVendaController {
private final ItemVendaRepository ItemVendaRepository;
private final ItemVendaService ItemVendaService;

    @GetMapping
    public ResponseEntity<List<ItemVendaEntity>> listarTodos() {
        List<ItemVendaEntity> lista = ItemVendaService.listarTodos();
        return ResponseEntity.ok().body(lista);
    }

    @PostMapping
    public ResponseEntity<ItemVendaEntity> incluir(@RequestBody 
    ItemVendaEntity ItemVenda) {
        ItemVendaEntity novo = ItemVendaService.incluir(ItemVenda);
        if (novo != null) {
            return new ResponseEntity<>(novo, HttpStatus.CREATED);
        } else {
            return new ResponseEntity<>(HttpStatus.BAD_REQUEST);
        }
    }

    @PutMapping("/{id}")
    public ResponseEntity<ItemVendaEntity> editar(@PathVariable int id, 
    @RequestBody ItemVendaEntity ItemVenda) {
        ItemVendaEntity atualizado = ItemVendaService.editar(id,ItemVenda);
        if (atualizado != null) {
            return new ResponseEntity<>(atualizado, HttpStatus.OK);
        } else {
            return new ResponseEntity<>(HttpStatus.NOT_FOUND);
        }
    }

    
    @DeleteMapping("/{id}")
    public ResponseEntity<Void> excluir(@PathVariable int id) {
        ItemVendaService.excluir(id);
        return new ResponseEntity<>(HttpStatus.NO_CONTENT);
    }
}

