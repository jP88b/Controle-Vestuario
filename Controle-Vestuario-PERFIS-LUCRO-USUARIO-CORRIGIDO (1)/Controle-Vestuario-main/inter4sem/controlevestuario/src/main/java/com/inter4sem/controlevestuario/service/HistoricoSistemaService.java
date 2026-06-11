package com.inter4sem.controlevestuario.service;

import java.util.List;
import java.util.Optional;
import org.springframework.stereotype.Service;
import lombok.RequiredArgsConstructor;

import com.inter4sem.controlevestuario.entity.HistoricoSistemaEntity;
import com.inter4sem.controlevestuario.repository.HistoricoSistemaRepository;

@Service
@RequiredArgsConstructor
public class HistoricoSistemaService {

    private final HistoricoSistemaRepository historicoRepository;

    public List<HistoricoSistemaEntity> listarTodos() {
        return historicoRepository.findAllByOrderByIdDesc();
    }

    public HistoricoSistemaEntity incluir(HistoricoSistemaEntity historico) {
        try {
            return historicoRepository.save(historico);
        } catch (Exception e) {
            return null;
        }
    }

    public HistoricoSistemaEntity editar(Long id, HistoricoSistemaEntity historicoAtualizado) {
        Optional<HistoricoSistemaEntity> existente = historicoRepository.findById(id);
        if (existente.isPresent()) {
            HistoricoSistemaEntity historico = existente.get();
            historico.setTabela(historicoAtualizado.getTabela());
            historico.setAcao(historicoAtualizado.getAcao());
            historico.setRegistroId(historicoAtualizado.getRegistroId());
            historico.setDescricao(historicoAtualizado.getDescricao());
            historico.setUsuario(historicoAtualizado.getUsuario());
            return historicoRepository.save(historico);
        }
        return null;
    }

    public void excluir(Long id) {
        if (historicoRepository.existsById(id)) {
            historicoRepository.deleteById(id);
        }
    }
}