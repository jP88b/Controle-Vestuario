package com.inter4sem.controlevestuario.service;

import java.util.List;
import java.util.Optional;

import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import com.inter4sem.controlevestuario.entity.ProdutoEntity;
import com.inter4sem.controlevestuario.repository.ProdutoRepository;
import lombok.RequiredArgsConstructor;

@Service
@RequiredArgsConstructor
public class ProdutoService {
    private final ProdutoRepository ProdutoRepository;
    private final JdbcTemplate jdbcTemplate;

    public List<ProdutoEntity> listarTodos() {
        return ProdutoRepository.findAll();
    }

    private boolean produtoInvalido(ProdutoEntity produto) {
        if (produto == null) return true;
        if (produto.getNome() == null || produto.getNome().trim().isEmpty()) return true;
        if (produto.getQuantidade() == null || produto.getQuantidade() < 0) return true;
        if (produto.getPrecoCusto() < 0) return true;
        if (produto.getPrecoVenda() < 0) return true;
        return false;
    }

    private void definirUsuarioSistema(String usuarioSistema) {
        String usuario = (usuarioSistema == null || usuarioSistema.trim().isEmpty()) ? "Sistema" : usuarioSistema.trim();
        jdbcTemplate.update("EXEC sys.sp_set_session_context @key = N'usuario_sistema', @value = ?", usuario);
    }

    @Transactional
    public ProdutoEntity editar(int id, ProdutoEntity Produto, String usuarioSistema) {
        if (produtoInvalido(Produto)) return null;
        definirUsuarioSistema(usuarioSistema);

        Optional<ProdutoEntity> ProdutoExistente = ProdutoRepository.findById(id);

        if (ProdutoExistente.isPresent()) {
            ProdutoEntity ProdutoAtualizada = ProdutoExistente.get();
            ProdutoAtualizada.setNome(Produto.getNome().trim());
            ProdutoAtualizada.setDescricao(Produto.getDescricao());
            ProdutoAtualizada.setPrecoCusto(Produto.getPrecoCusto());
            ProdutoAtualizada.setPrecoVenda(Produto.getPrecoVenda());
            ProdutoAtualizada.setQuantidade(Produto.getQuantidade());
            ProdutoAtualizada.setCategoria(Produto.getCategoria());
            ProdutoAtualizada.setFornecedor(Produto.getFornecedor());
            return ProdutoRepository.save(ProdutoAtualizada);
        }

        return null;
    }

    public ProdutoEntity editar(int id, ProdutoEntity Produto) {
        return editar(id, Produto, "Sistema");
    }

    @Transactional
    public void excluir(Integer id, String usuarioSistema) {
        definirUsuarioSistema(usuarioSistema);
        ProdutoRepository.deleteById(id);
    }

    public void excluir(Integer id) {
        excluir(id, "Sistema");
    }

    @Transactional
    public ProdutoEntity incluir(ProdutoEntity Produto, String usuarioSistema) {
        if (produtoInvalido(Produto)) return null;
        definirUsuarioSistema(usuarioSistema);
        Produto.setNome(Produto.getNome().trim());
        return ProdutoRepository.save(Produto);
    }

    public ProdutoEntity incluir(ProdutoEntity Produto) {
        return incluir(Produto, "Sistema");
    }
}
