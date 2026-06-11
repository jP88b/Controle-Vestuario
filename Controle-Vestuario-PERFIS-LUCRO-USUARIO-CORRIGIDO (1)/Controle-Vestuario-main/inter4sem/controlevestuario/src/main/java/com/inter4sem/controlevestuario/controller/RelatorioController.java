package com.inter4sem.controlevestuario.controller;

import java.util.List;
import java.util.Map;

import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.web.bind.annotation.CrossOrigin;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import lombok.RequiredArgsConstructor;

@RestController
@RequiredArgsConstructor
@CrossOrigin(origins = "*")
@RequestMapping("/relatorios")
public class RelatorioController {
    private final JdbcTemplate jdbcTemplate;

    @GetMapping("/produtos-gerencial")
    public List<Map<String, Object>> relatorioGerencialProdutos() {
        return jdbcTemplate.queryForList("SELECT * FROM vw_relatorio_gerencial_produtos");
    }

    @GetMapping("/powerbi-estoque")
    public List<Map<String, Object>> powerBiEstoque() {
        return jdbcTemplate.queryForList("SELECT * FROM vw_powerbi_estoque");
    }

    @GetMapping("/powerbi-vendas")
    public List<Map<String, Object>> powerBiVendas() {
        return jdbcTemplate.queryForList("SELECT * FROM vw_powerbi_vendas");
    }

    @GetMapping("/powerbi-movimentacoes")
    public List<Map<String, Object>> powerBiMovimentacoes() {
        return jdbcTemplate.queryForList("SELECT * FROM vw_powerbi_movimentacoes");
    }

    @GetMapping("/powerbi-lancamentos")
    public List<Map<String, Object>> powerBiLancamentos() {
        return jdbcTemplate.queryForList("SELECT * FROM vw_powerbi_lancamentos");
    }
}
