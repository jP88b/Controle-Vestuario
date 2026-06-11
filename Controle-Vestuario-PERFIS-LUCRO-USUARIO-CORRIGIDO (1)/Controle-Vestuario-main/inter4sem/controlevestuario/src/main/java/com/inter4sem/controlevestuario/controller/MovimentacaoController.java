package com.inter4sem.controlevestuario.controller;

import java.math.BigDecimal;
import java.util.List;
import java.util.Map;

import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.web.bind.annotation.CrossOrigin;
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
import com.inter4sem.controlevestuario.entity.MovimentacaoEntity;
import com.inter4sem.controlevestuario.repository.MovimentacaoRepository;
import com.inter4sem.controlevestuario.service.MovimentacaoService;

@RestController
@RequiredArgsConstructor
@CrossOrigin(origins = "*")
@RequestMapping(value = {"/movimentacao", "/Movimentacao"})
public class MovimentacaoController {
    private final MovimentacaoRepository MovimentacaoRepository;
    private final MovimentacaoService MovimentacaoService;
    private final JdbcTemplate jdbcTemplate;

    @GetMapping
    public ResponseEntity<List<MovimentacaoEntity>> listarTodos() {
        List<MovimentacaoEntity> lista = MovimentacaoService.listarTodos();
        return ResponseEntity.ok().body(lista);
    }

    @PostMapping
    public ResponseEntity<MovimentacaoEntity> incluir(@RequestBody MovimentacaoEntity Movimentacao){
        MovimentacaoEntity novo = MovimentacaoService.incluir(Movimentacao);
        if (novo != null) {
            return new ResponseEntity<>(novo, HttpStatus.CREATED);
        }
        return new ResponseEntity<>(HttpStatus.BAD_REQUEST);
    }

    @PostMapping("/lancar")
    public ResponseEntity<?> lancarMovimentacao(@RequestBody LancamentoRequest request,
            @RequestHeader(value = "X-Usuario-Sistema", required = false) String usuarioSistema,
            @RequestHeader(value = "X-Perfil-Usuario", required = false) String perfilUsuario) {
        if (request == null || request.getIdproduto() == null || request.getIdproduto() <= 0) {
            return ResponseEntity.badRequest().body("Selecione um produto válido.");
        }

        if (request.getTipo() == null ||
                !(request.getTipo().equalsIgnoreCase("ENTRADA") || request.getTipo().equalsIgnoreCase("SAIDA") || request.getTipo().equalsIgnoreCase("SAÍDA"))) {
            return ResponseEntity.badRequest().body("Tipo inválido. Use ENTRADA ou SAIDA.");
        }

        String perfilNormalizado = perfilUsuario == null ? "" : perfilUsuario.trim().toUpperCase();
        if (perfilNormalizado.equals("FUNCIONÁRIO")) perfilNormalizado = "FUNCIONARIO";
        String tipoNormalizado = request.getTipo().trim().toUpperCase().replace("Í", "I");
        if ("FUNCIONARIO".equals(perfilNormalizado) && "SAIDA".equals(tipoNormalizado)) {
            return ResponseEntity.status(HttpStatus.FORBIDDEN).body("Funcionário só pode lançar ENTRADA.");
        }

        if (request.getQuantidade() == null || request.getQuantidade() <= 0) {
            return ResponseEntity.badRequest().body("Quantidade deve ser maior que zero.");
        }

        BigDecimal precoCusto = request.getPrecoCusto() == null ? BigDecimal.ZERO : request.getPrecoCusto();
        BigDecimal precoVenda = request.getPrecoVenda() == null ? BigDecimal.ZERO : request.getPrecoVenda();

        if (precoCusto.compareTo(BigDecimal.ZERO) < 0 || precoVenda.compareTo(BigDecimal.ZERO) < 0) {
            return ResponseEntity.badRequest().body("Valores de custo e venda não podem ser negativos.");
        }

        String usuario = usuarioSistema;
        if (usuario == null || usuario.trim().isEmpty()) usuario = request.getUsuarioSistema();
        if (usuario == null || usuario.trim().isEmpty()) usuario = "Sistema";

        String perfil = perfilUsuario;
        if (perfil == null || perfil.trim().isEmpty()) perfil = request.getPerfilUsuario();
        if (perfil == null || perfil.trim().isEmpty()) perfil = "";

        Map<String, Object> resultado = jdbcTemplate.queryForMap(
            "EXEC sp_registrar_lancamento_estoque ?, ?, ?, ?, ?, ?, ?",
            request.getIdproduto(),
            request.getTipo(),
            request.getQuantidade(),
            precoCusto,
            precoVenda,
            usuario,
            perfil
        );

        return ResponseEntity.ok(resultado);
    }

    @PutMapping("/{id}")
    public ResponseEntity<MovimentacaoEntity> editar(@PathVariable int id, @RequestBody MovimentacaoEntity Movimentacao){
        MovimentacaoEntity atualizado = MovimentacaoService.editar(id,Movimentacao);
        if (atualizado != null) {
            return new ResponseEntity<>(atualizado, HttpStatus.OK);
        }
        return new ResponseEntity<>(HttpStatus.NOT_FOUND);
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<Void> excluir(@PathVariable int id) {
        MovimentacaoService.excluir(id);
        return new ResponseEntity<>(HttpStatus.NO_CONTENT);
    }
}
