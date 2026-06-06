package com.inter4sem.controlevestuario.service;

import java.util.List;

import java.util.Optional;
import org.springframework.stereotype.Service;

import com.inter4sem.controlevestuario.entity.ProdutoEntity;
import com.inter4sem.controlevestuario.repository.ProdutoRepository;
import lombok.RequiredArgsConstructor;

@Service
@RequiredArgsConstructor

public class ProdutoService {
    private final ProdutoRepository ProdutoRepository;

    public List<ProdutoEntity> listarTodos() {
        return ProdutoRepository.findAll();
    }

    public ProdutoEntity editar(int id, ProdutoEntity Produto) {
        // Verifique se o Produto existe
        Optional<ProdutoEntity> ProdutoExistente = ProdutoRepository.findById(id);

        if (ProdutoExistente.isPresent()) {
            // Atualiza o Produto
            ProdutoEntity ProdutoAtualizada = ProdutoExistente.get();
            ProdutoAtualizada.setNome(Produto.getNome()); // Atualiza os campos necessários
            ProdutoAtualizada.setDescricao(Produto.getDescricao()); // Atualiza os campos necessários
            ProdutoAtualizada.setPreco(Produto.getPreco()); // Atualiza os campos necessários
            ProdutoAtualizada.setQuantidade(Produto.getQuantidade()); // Atualiza os campos necessários
            return ProdutoRepository.save(ProdutoAtualizada); // Salva o Produto atualizado
        } else {
            // Caso o Produto não exista, retorna null
            return null;
        }
    }

    public void excluir(Integer id) {
        ProdutoRepository.deleteById(id);
    }

    public ProdutoEntity incluir(ProdutoEntity Produto) {
        return ProdutoRepository.save(Produto);
    }
}


