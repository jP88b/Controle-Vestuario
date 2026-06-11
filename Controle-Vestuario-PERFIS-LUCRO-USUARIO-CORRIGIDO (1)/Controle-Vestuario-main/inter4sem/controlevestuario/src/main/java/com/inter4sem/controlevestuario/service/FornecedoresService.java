package com.inter4sem.controlevestuario.service;

import java.util.List;
import java.util.Optional;

import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import com.inter4sem.controlevestuario.entity.FornecedorEntity;
import com.inter4sem.controlevestuario.repository.FornecedoresRepository;
import lombok.RequiredArgsConstructor;

@Service
@RequiredArgsConstructor
public class FornecedoresService {
    private final FornecedoresRepository FornecedoresRepository;
    private final JdbcTemplate jdbcTemplate;

    public List<FornecedorEntity> listarTodos() {
        return FornecedoresRepository.findAll();
    }

    private void definirUsuarioSistema(String usuarioSistema) {
        String usuario = (usuarioSistema == null || usuarioSistema.trim().isEmpty()) ? "Sistema" : usuarioSistema.trim();
        jdbcTemplate.update("EXEC sys.sp_set_session_context @key = N'usuario_sistema', @value = ?", usuario);
    }

    @Transactional
    public FornecedorEntity editar(int id, FornecedorEntity Fornecedores, String usuarioSistema) {
        if (Fornecedores == null || Fornecedores.getNome() == null || Fornecedores.getNome().trim().isEmpty()) return null;
        definirUsuarioSistema(usuarioSistema);

        Optional<FornecedorEntity> FornecedoresExistente = FornecedoresRepository.findById(id);

        if (FornecedoresExistente.isPresent()) {
            FornecedorEntity FornecedoresAtualizada = FornecedoresExistente.get();
            FornecedoresAtualizada.setNome(Fornecedores.getNome().trim());
            FornecedoresAtualizada.setCnpj(Fornecedores.getCnpj());
            FornecedoresAtualizada.setTelefone(Fornecedores.getTelefone());
            FornecedoresAtualizada.setEmail(Fornecedores.getEmail());
            return FornecedoresRepository.save(FornecedoresAtualizada);
        }
        return null;
    }

    public FornecedorEntity editar(int id, FornecedorEntity Fornecedores) {
        return editar(id, Fornecedores, "Sistema");
    }

    @Transactional
    public void excluir(Integer id, String usuarioSistema) {
        definirUsuarioSistema(usuarioSistema);
        FornecedoresRepository.deleteById(id);
    }

    public void excluir(Integer id) {
        excluir(id, "Sistema");
    }

    @Transactional
    public FornecedorEntity incluir(FornecedorEntity Fornecedores, String usuarioSistema) {
        if (Fornecedores == null || Fornecedores.getNome() == null || Fornecedores.getNome().trim().isEmpty()) return null;
        definirUsuarioSistema(usuarioSistema);
        Fornecedores.setNome(Fornecedores.getNome().trim());
        return FornecedoresRepository.save(Fornecedores);
    }

    public FornecedorEntity incluir(FornecedorEntity Fornecedores) {
        return incluir(Fornecedores, "Sistema");
    }
}
