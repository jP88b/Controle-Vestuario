package com.inter4sem.controlevestuario.service;

import java.util.List;

import java.util.Optional;
import org.springframework.stereotype.Service;

import com.inter4sem.controlevestuario.entity.MovimentacaoEntity;
import com.inter4sem.controlevestuario.repository.MovimentacaoRepository;
import lombok.RequiredArgsConstructor;

@Service
@RequiredArgsConstructor

public class MovimentacaoService {
    private final MovimentacaoRepository MovimentacaoRepository;

    public List<MovimentacaoEntity> listarTodos() {
        return MovimentacaoRepository.findAll();
    }

    public MovimentacaoEntity editar(int id, MovimentacaoEntity Movimentacao) {
        // Verifique se o Movimentacao existe
        Optional<MovimentacaoEntity> MovimentacaoExistente = MovimentacaoRepository.findById(id);

        if (MovimentacaoExistente.isPresent()) {
            // Atualiza o Movimentacao
            MovimentacaoEntity MovimentacaoAtualizada = MovimentacaoExistente.get();
            MovimentacaoAtualizada.setTipo(Movimentacao.getTipo()); // Atualiza os campos necessários
            MovimentacaoAtualizada.setData(Movimentacao.getData()); // Atualiza os campos necessários
            MovimentacaoAtualizada.setQuantidade(Movimentacao.getQuantidade()); // Atualiza os campos necessários
            return MovimentacaoRepository.save(MovimentacaoAtualizada); // Salva o Movimentacao atualizado
        } else {
            // Caso o Movimentacao não exista, retorna null
            return null;
        }
    }

    public void excluir(Integer id) {
        MovimentacaoRepository.deleteById(id);
    }

    public MovimentacaoEntity incluir(MovimentacaoEntity Movimentacao) {
        return MovimentacaoRepository.save(Movimentacao);
    }
}


