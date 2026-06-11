package com.inter4sem.controlevestuario.controller;
import java.util.List;
import java.util.Map;

import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestHeader;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;
import lombok.RequiredArgsConstructor;
import com.inter4sem.controlevestuario.entity.ProdutoEntity;
import com.inter4sem.controlevestuario.repository.ProdutoRepository;
import com.inter4sem.controlevestuario.service.ProdutoService;
@RestController
@RequiredArgsConstructor
@RequestMapping(value = "/Produto")
public class ProdutoController {
private final ProdutoRepository ProdutoRepository;
private final ProdutoService ProdutoService;
private final JdbcTemplate jdbcTemplate;

    private String normalizarPerfil(String perfil) {
        if (perfil == null || perfil.trim().isEmpty()) return "";
        String valor = perfil.trim().toUpperCase();
        if (valor.equals("FUNCIONÁRIO")) valor = "FUNCIONARIO";
        return valor;
    }

    private boolean ehFuncionario(String perfil) {
        return "FUNCIONARIO".equals(normalizarPerfil(perfil));
    }

    private boolean ehAdministrador(String perfil) {
        return "ADMINISTRADOR".equals(normalizarPerfil(perfil));
    }

    private boolean temPerfil(String perfil) {
        return perfil != null && !perfil.trim().isEmpty();
    }

    @GetMapping
    public ResponseEntity<List<ProdutoEntity>> listarTodos() {
        List<ProdutoEntity> lista = ProdutoService.listarTodos();
        return ResponseEntity.ok().body(lista);
    }

    @PostMapping
    public ResponseEntity<ProdutoEntity> incluir(@RequestBody ProdutoEntity Produto,
            @RequestHeader(value = "X-Usuario-Sistema", required = false) String usuarioSistema,
            @RequestHeader(value = "X-Perfil-Usuario", required = false) String perfilUsuario) {
        if (ehFuncionario(perfilUsuario)) return new ResponseEntity<>(HttpStatus.FORBIDDEN);

        ProdutoEntity novo = ProdutoService.incluir(Produto, usuarioSistema);
        if (novo != null) {
            return new ResponseEntity<>(novo, HttpStatus.CREATED);
        } else {
            return new ResponseEntity<>(HttpStatus.BAD_REQUEST);
        }
    }

    @PutMapping("/{id}")
    public ResponseEntity<ProdutoEntity> editar(@PathVariable int id, @RequestBody ProdutoEntity Produto,
            @RequestHeader(value = "X-Usuario-Sistema", required = false) String usuarioSistema,
            @RequestHeader(value = "X-Perfil-Usuario", required = false) String perfilUsuario) {
        if (ehFuncionario(perfilUsuario)) return new ResponseEntity<>(HttpStatus.FORBIDDEN);

        ProdutoEntity atualizado = ProdutoService.editar(id, Produto, usuarioSistema);
        if (atualizado != null) {
            return new ResponseEntity<>(atualizado, HttpStatus.OK);
        } else {
            return new ResponseEntity<>(HttpStatus.NOT_FOUND);
        }
    }

    @GetMapping("/estoque-status")
    public ResponseEntity<List<Map<String, Object>>> produtosPorStatusEstoque(@org.springframework.web.bind.annotation.RequestParam(defaultValue = "5") Integer limite) {
        List<Map<String, Object>> lista = jdbcTemplate.queryForList(
            "SELECT * FROM dbo.fn_produtos_por_status_estoque(?)",
            limite
        );
        return ResponseEntity.ok(lista);
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<Void> excluir(@PathVariable int id,
            @RequestHeader(value = "X-Usuario-Sistema", required = false) String usuarioSistema,
            @RequestHeader(value = "X-Perfil-Usuario", required = false) String perfilUsuario) {
        // Quando o perfil vem do sistema, somente Administrador remove produto.
        // Se não houver header, mantém compatibilidade com testes antigos.
        if (temPerfil(perfilUsuario) && !ehAdministrador(perfilUsuario)) {
            return new ResponseEntity<>(HttpStatus.FORBIDDEN);
        }

        ProdutoService.excluir(id, usuarioSistema);
        return new ResponseEntity<>(HttpStatus.NO_CONTENT);
    }
}
