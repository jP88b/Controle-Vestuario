package com.inter4sem.controlevestuario.service;

import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.stereotype.Service;
import lombok.RequiredArgsConstructor;

import java.util.List;
import java.util.Map;

@Service
@RequiredArgsConstructor
public class DashboardService {

    private final JdbcTemplate jdbcTemplate;

    public Map<String, Object> buscarKpis() {
    return jdbcTemplate.queryForMap("""
        SELECT 
            total_produtos,
            total_itens_estoque,
            valor_total_estoque,
            custo_total_estoque,
            lucro_potencial_estoque,
            total_estoque_critico
        FROM vw_dashboard_kpis
    """);
    }

    public List<Map<String, Object>> buscarProdutosPorCategoria() {
        return jdbcTemplate.queryForList("""
            SELECT
                categoria_id,
                categoria,
                quantidade_produtos,
                total_itens,
                valor_total
            FROM vw_produtos_por_categoria
            ORDER BY quantidade_produtos DESC
        """);
    }

    public List<Map<String, Object>> buscarEstoqueCritico() {
        return jdbcTemplate.queryForList("""
            SELECT
                produto_id,
                produto,
                categoria,
                fornecedor,
                quantidade,
                preco_venda,
                valor_em_estoque,
                status_estoque
            FROM vw_estoque_critico
            ORDER BY quantidade ASC
        """);
    }
}