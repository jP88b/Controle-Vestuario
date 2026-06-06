package com.inter4sem.controlevestuario.service;

import java.util.List;

import java.util.Optional;
import org.springframework.stereotype.Service;


import com.inter4sem.controlevestuario.entity.FornecedorEntity;
import com.inter4sem.controlevestuario.repository.FornecedoresRepository;
import lombok.RequiredArgsConstructor;

@Service
@RequiredArgsConstructor

public class FornecedoresService {
    private final FornecedoresRepository FornecedoresRepository;

    public List<FornecedorEntity> listarTodos() {
        return FornecedoresRepository.findAll();
    }

    public FornecedorEntity editar(int id, FornecedorEntity Fornecedores) {
        // Verifique se o Fornecedores existe
        Optional<FornecedorEntity> FornecedoresExistente = FornecedoresRepository.findById(id);

        if (FornecedoresExistente.isPresent()) {
            // Atualiza o Fornecedores
            FornecedorEntity FornecedoresAtualizada = FornecedoresExistente.get();
            FornecedoresAtualizada.setNome(Fornecedores.getNome()); // Atualiza os campos necessários
            FornecedoresAtualizada.setCnpj(Fornecedores.getCnpj()); // Atualiza os campos necessários
            FornecedoresAtualizada.setTelefone(Fornecedores.getTelefone()); // Atualiza os campos necessários
            FornecedoresAtualizada.setEmail(Fornecedores.getEmail()); // Atualiza os campos necessários
            return FornecedoresRepository.save(FornecedoresAtualizada); // Salva o Fornecedores atualizado
        } else {
            // Caso o Fornecedores não exista, retorna null
            return null;
        }
    }

    public void excluir(Integer id) {
        FornecedoresRepository.deleteById(id);
    }

    public FornecedorEntity incluir(FornecedorEntity Fornecedores) {
        return FornecedoresRepository.save(Fornecedores);
    }
}


