package com.inter4sem.controlevestuario.service;

import java.util.List;
import java.util.Optional;

import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import com.inter4sem.controlevestuario.entity.CategoriaEntity;
import com.inter4sem.controlevestuario.repository.CategoriaRepository;
import lombok.RequiredArgsConstructor;

@Service
@RequiredArgsConstructor
public class CategoriaService {
    private final CategoriaRepository CategoriaRepository;
    private final JdbcTemplate jdbcTemplate;

    public List<CategoriaEntity> listarTodos() {
        return CategoriaRepository.findAll();
    }

    private void definirUsuarioSistema(String usuarioSistema) {
        String usuario = (usuarioSistema == null || usuarioSistema.trim().isEmpty()) ? "Sistema" : usuarioSistema.trim();
        jdbcTemplate.update("EXEC sys.sp_set_session_context @key = N'usuario_sistema', @value = ?", usuario);
    }

    @Transactional
    public CategoriaEntity editar(int id, CategoriaEntity Categoria, String usuarioSistema) {
        if (Categoria == null || Categoria.getNome() == null || Categoria.getNome().trim().isEmpty()) return null;
        definirUsuarioSistema(usuarioSistema);

        Optional<CategoriaEntity> CategoriaExistente = CategoriaRepository.findById(id);

        if (CategoriaExistente.isPresent()) {
            CategoriaEntity CategoriaAtualizada = CategoriaExistente.get();
            CategoriaAtualizada.setNome(Categoria.getNome().trim());
            return CategoriaRepository.save(CategoriaAtualizada);
        }
        return null;
    }

    public CategoriaEntity editar(int id, CategoriaEntity Categoria) {
        return editar(id, Categoria, "Sistema");
    }

    @Transactional
    public void excluir(Integer id, String usuarioSistema) {
        definirUsuarioSistema(usuarioSistema);
        CategoriaRepository.deleteById(id);
    }

    public void excluir(Integer id) {
        excluir(id, "Sistema");
    }

    @Transactional
    public CategoriaEntity incluir(CategoriaEntity Categoria, String usuarioSistema) {
        if (Categoria == null || Categoria.getNome() == null || Categoria.getNome().trim().isEmpty()) return null;
        definirUsuarioSistema(usuarioSistema);
        Categoria.setNome(Categoria.getNome().trim());
        return CategoriaRepository.save(Categoria);
    }

    public CategoriaEntity incluir(CategoriaEntity Categoria) {
        return incluir(Categoria, "Sistema");
    }
}
