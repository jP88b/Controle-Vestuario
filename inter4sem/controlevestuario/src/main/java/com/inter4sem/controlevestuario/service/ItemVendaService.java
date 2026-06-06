package com.inter4sem.controlevestuario.service;

import java.util.List;

import java.util.Optional;
import org.springframework.stereotype.Service;

import com.inter4sem.controlevestuario.entity.ItemVendaEntity;
import com.inter4sem.controlevestuario.repository.ItemVendaRepository;
import lombok.RequiredArgsConstructor;

@Service
@RequiredArgsConstructor

public class ItemVendaService {
    private final ItemVendaRepository ItemVendaRepository;

    public List<ItemVendaEntity> listarTodos() {
        return ItemVendaRepository.findAll();
    }

    public ItemVendaEntity editar(int id, ItemVendaEntity ItemVenda) {
        // Verifique se o ItemVenda existe
        Optional<ItemVendaEntity> ItemVendaExistente = ItemVendaRepository.findById(id);

        if (ItemVendaExistente.isPresent()) {
            // Atualiza o ItemVenda
            ItemVendaEntity ItemVendaAtualizada = ItemVendaExistente.get();
            ItemVendaAtualizada.setProduto(ItemVenda.getProduto()); // Atualiza os campos necessários
            ItemVendaAtualizada.setQuantidade(ItemVenda.getQuantidade()); // Atualiza os campos necessários
            ItemVendaAtualizada.setPrecoUnitario(ItemVenda.getPrecoUnitario()); // Atualiza os campos necessários
            ItemVendaAtualizada.setVenda(ItemVenda.getVenda()); // Atualiza os campos necessários
            return ItemVendaRepository.save(ItemVendaAtualizada); // Salva o ItemVenda atualizado
        } else {
            // Caso o ItemVenda não exista, retorna null
            return null;
        }
    }

    public void excluir(Integer id) {
        ItemVendaRepository.deleteById(id);
    }

    public ItemVendaEntity incluir(ItemVendaEntity ItemVenda) {
        return ItemVendaRepository.save(ItemVenda);
    }
}


