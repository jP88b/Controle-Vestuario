package com.inter4sem.controlevestuario.service;

import java.util.List;

import java.util.Optional;
import org.springframework.stereotype.Service;

import com.inter4sem.controlevestuario.entity.VendaEntity;
import com.inter4sem.controlevestuario.repository.VendaRepository;

import lombok.RequiredArgsConstructor;

@Service
@RequiredArgsConstructor

public class VendaService {
    private final VendaRepository VendasRepository;

    public List<VendaEntity> listarTodos() {
        return VendasRepository.findAll();
    }

    public VendaEntity editar(int id, VendaEntity Vendas) {
        // Verifique se a Vendas existe
        Optional<VendaEntity> VendasExistente = VendasRepository.findById(id);

        if (VendasExistente.isPresent()) {
            // Atualiza a Vendas
            VendaEntity VendasAtualizada = VendasExistente.get();
            VendasAtualizada.setData(Vendas.getData()); // Atualiza os campos necessários
            VendasAtualizada.setValorTotal(Vendas.getValorTotal()); // Atualiza os campos necessários
            VendasAtualizada.setUsuario(Vendas.getUsuario()); // Atualiza os campos necessários
            return VendasRepository.save(VendasAtualizada); // Salva a Vendas atualizada
        } else {
            // Caso a Vendas não exista, retorna null
            return null;
        }
    }

    public void excluir(Integer id) {
        VendasRepository.deleteById(id);
    }

    public VendaEntity incluir(VendaEntity Vendas) {
        return VendasRepository.save(Vendas);
    }
}


