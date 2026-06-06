package com.inter4sem.controlevestuario.service;

import java.util.List;

import java.util.Optional;
import org.springframework.stereotype.Service;

import com.inter4sem.controlevestuario.entity.CategoriaEntity;
import com.inter4sem.controlevestuario.repository.CategoriaRepository;
import lombok.RequiredArgsConstructor;

@Service
@RequiredArgsConstructor

public class CategoriaService {
    private final CategoriaRepository CategoriaRepository;

    public List<CategoriaEntity> listarTodos() {
        return CategoriaRepository.findAll();
    }

    public CategoriaEntity editar(int id, CategoriaEntity Categoria) {
        // Verifique se o Categoria existe
        Optional<CategoriaEntity> CategoriaExistente = CategoriaRepository.findById(id);

        if (CategoriaExistente.isPresent()) {
            // Atualiza o Categoria
            CategoriaEntity CategoriaAtualizada = CategoriaExistente.get();
            CategoriaAtualizada.setNome(Categoria.getNome()); // Atualiza os campos necessários
            return CategoriaRepository.save(CategoriaAtualizada); // Salva o Categoria atualizado
        } else {
            // Caso o Categoria não exista, retorna null
            return null;
        }
    }

    public void excluir(Integer id) {
        CategoriaRepository.deleteById(id);
    }

    public CategoriaEntity incluir(CategoriaEntity Categoria) {
        return CategoriaRepository.save(Categoria);
    }
}


