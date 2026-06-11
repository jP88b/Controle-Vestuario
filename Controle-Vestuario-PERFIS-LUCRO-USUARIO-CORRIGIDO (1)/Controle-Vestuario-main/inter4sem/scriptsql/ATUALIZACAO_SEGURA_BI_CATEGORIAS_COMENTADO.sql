/*
    Ajuste seguro para Relatórios BI e listagem de Categorias
    Banco usado pelo projeto: ControleVestuario

    Observação prática:
    - Este arquivo não apaga tabelas.
    - Este arquivo não apaga dados.
    - Ele só recria as views usadas pelo dashboard/BI para garantir que os gráficos tenham dados.
    - As rotinas de lançamento, backup e cadastro continuam como estão.
*/

USE ControleVestuario;
GO

/*
    View: vw_powerbi_estoque
    Para que serve:
    - Alimenta gráfico de categorias e gráfico financeiro da aba Relatórios BI.
    - Mostra o estoque atual do produto, com categoria, fornecedor, custo e venda.
    - O valor total é calculado com a quantidade atual do estoque.
*/
CREATE OR ALTER VIEW dbo.vw_powerbi_estoque AS
SELECT
    p.id AS produto_id,                                  -- código do produto
    p.nome AS produto,                                  -- nome para aparecer no relatório
    ISNULL(p.descricao, '') AS descricao,                -- descrição pode estar vazia
    ISNULL(c.nome, 'Sem categoria') AS categoria,        -- evita gráfico sem rótulo
    ISNULL(f.nome, 'Sem fornecedor') AS fornecedor,      -- fornecedor do produto
    ISNULL(p.quantidade, 0) AS quantidade,               -- quantidade atual no estoque
    ISNULL(p.preco_custo, 0) AS preco_custo,             -- valor que a empresa pagou
    ISNULL(p.preco_venda, 0) AS preco_venda,             -- valor de venda do produto
    ISNULL(p.preco_venda, 0) - ISNULL(p.preco_custo, 0) AS lucro_unitario,
    ISNULL(p.quantidade, 0) * ISNULL(p.preco_venda, 0) AS valor_total_estoque,
    ISNULL(p.quantidade, 0) * ISNULL(p.preco_custo, 0) AS custo_total_estoque,
    ISNULL(p.quantidade, 0) * (ISNULL(p.preco_venda, 0) - ISNULL(p.preco_custo, 0)) AS lucro_potencial_estoque,
    CASE
        WHEN ISNULL(p.quantidade, 0) = 0 THEN 'Esgotado'
        WHEN ISNULL(p.quantidade, 0) <= 5 THEN 'Crítico'
        ELSE 'Normal'
    END AS status_estoque
FROM dbo.produtos p
LEFT JOIN dbo.categorias c ON c.id = p.idcategoria
LEFT JOIN dbo.fornecedores f ON f.id = p.idfornecedor;
GO

/*
    View: vw_powerbi_movimentacoes
    Para que serve:
    - Mostra os lançamentos de entrada e saída.
    - Alimenta o gráfico de tendência por dia.
    - Também calcula valor de custo, venda e lucro estimado por movimentação.
*/
CREATE OR ALTER VIEW dbo.vw_powerbi_movimentacoes AS
SELECT
    m.id AS movimentacao_id,
    m.data AS data,
    UPPER(ISNULL(m.tipo, '')) AS tipo,
    ISNULL(m.quantidade, 0) AS quantidade,
    p.id AS produto_id,
    p.nome AS produto,
    ISNULL(c.nome, 'Sem categoria') AS categoria,
    ISNULL(f.nome, 'Sem fornecedor') AS fornecedor,
    ISNULL(m.preco_custo, p.preco_custo) AS preco_custo,
    ISNULL(m.preco_venda, p.preco_venda) AS preco_venda,
    ISNULL(m.quantidade, 0) * ISNULL(m.preco_custo, p.preco_custo) AS valor_custo,
    ISNULL(m.quantidade, 0) * ISNULL(m.preco_venda, p.preco_venda) AS valor_venda,
    ISNULL(m.quantidade, 0) * (ISNULL(m.preco_venda, p.preco_venda) - ISNULL(m.preco_custo, p.preco_custo)) AS lucro_estimado
FROM dbo.movimentacoes m
INNER JOIN dbo.produtos p ON p.id = m.idproduto
LEFT JOIN dbo.categorias c ON c.id = p.idcategoria
LEFT JOIN dbo.fornecedores f ON f.id = p.idfornecedor;
GO

/*
    View: vw_powerbi_lancamentos
    Para que serve:
    - Foi criada com nome separado porque o JavaScript usa esse endpoint para o gráfico de tendência.
    - Hoje ela reutiliza a view de movimentações, assim evita duplicar lógica.
*/
CREATE OR ALTER VIEW dbo.vw_powerbi_lancamentos AS
SELECT *
FROM dbo.vw_powerbi_movimentacoes;
GO

/*
    View: vw_powerbi_vendas
    Para que serve:
    - Mantida para relatório de vendas quando a venda for registrada pela tela/procedure de venda.
    - Não depende diretamente do lançamento de estoque.
*/
CREATE OR ALTER VIEW dbo.vw_powerbi_vendas AS
SELECT
    v.id AS venda_id,
    v.data AS data_venda,
    ISNULL(u.nome, 'Usuário não informado') AS usuario,
    p.nome AS produto,
    ISNULL(c.nome, 'Sem categoria') AS categoria,
    ISNULL(iv.quantidade, 0) AS quantidade,
    ISNULL(iv.preco_unitario, 0) AS preco_unitario,
    ISNULL(p.preco_custo, 0) AS preco_custo,
    ISNULL(iv.quantidade, 0) * ISNULL(iv.preco_unitario, 0) AS faturamento,
    ISNULL(iv.quantidade, 0) * ISNULL(p.preco_custo, 0) AS custo_total,
    ISNULL(iv.quantidade, 0) * (ISNULL(iv.preco_unitario, 0) - ISNULL(p.preco_custo, 0)) AS lucro_total
FROM dbo.vendas v
INNER JOIN dbo.usuarios u ON u.id = v.idusuario
INNER JOIN dbo.itens_venda iv ON iv.idvenda = v.id
INNER JOIN dbo.produtos p ON p.id = iv.idproduto
LEFT JOIN dbo.categorias c ON c.id = p.idcategoria;
GO

/*
    View: vw_relatorio_gerencial_produtos
    Para que serve:
    - Relatório mais completo por produto.
    - Junta estoque atual, valores financeiros e totais de entrada/saída.
*/
CREATE OR ALTER VIEW dbo.vw_relatorio_gerencial_produtos AS
SELECT
    p.id AS produto_id,
    p.nome AS produto,
    ISNULL(c.nome, 'Sem categoria') AS categoria,
    ISNULL(f.nome, 'Sem fornecedor') AS fornecedor,
    ISNULL(p.quantidade, 0) AS estoque_atual,
    ISNULL(p.preco_custo, 0) AS preco_custo,
    ISNULL(p.preco_venda, 0) AS preco_venda,
    ISNULL(p.preco_venda, 0) - ISNULL(p.preco_custo, 0) AS lucro_unitario,
    CASE
        WHEN ISNULL(p.preco_venda, 0) > 0
            THEN ((ISNULL(p.preco_venda, 0) - ISNULL(p.preco_custo, 0)) / ISNULL(p.preco_venda, 0)) * 100
        ELSE 0
    END AS margem_percentual,
    ISNULL(SUM(iv.quantidade), 0) AS total_vendido,
    ISNULL(SUM(iv.quantidade * iv.preco_unitario), 0) AS faturamento_total,
    ISNULL(SUM(iv.quantidade * p.preco_custo), 0) AS custo_total_vendido,
    ISNULL(SUM(iv.quantidade * (iv.preco_unitario - p.preco_custo)), 0) AS lucro_total,
    ISNULL((SELECT SUM(m1.quantidade) FROM dbo.movimentacoes m1 WHERE m1.idproduto = p.id AND UPPER(m1.tipo) = 'ENTRADA'), 0) AS total_entradas,
    ISNULL((SELECT SUM(m2.quantidade) FROM dbo.movimentacoes m2 WHERE m2.idproduto = p.id AND UPPER(m2.tipo) = 'SAIDA'), 0) AS total_saidas,
    CASE
        WHEN ISNULL(p.quantidade, 0) = 0 THEN 'Esgotado'
        WHEN ISNULL(p.quantidade, 0) <= 5 THEN 'Crítico'
        ELSE 'Normal'
    END AS status_estoque
FROM dbo.produtos p
LEFT JOIN dbo.categorias c ON c.id = p.idcategoria
LEFT JOIN dbo.fornecedores f ON f.id = p.idfornecedor
LEFT JOIN dbo.itens_venda iv ON iv.idproduto = p.id
GROUP BY p.id, p.nome, c.nome, f.nome, p.quantidade, p.preco_custo, p.preco_venda;
GO

/*
    Conferência rápida.
    Se essas consultas retornarem linhas, o backend /relatorios já tem o que mostrar.
*/
SELECT COUNT(*) AS qtd_produtos_bi FROM dbo.vw_powerbi_estoque;
SELECT COUNT(*) AS qtd_movimentacoes_bi FROM dbo.vw_powerbi_movimentacoes;
SELECT COUNT(*) AS qtd_lancamentos_bi FROM dbo.vw_powerbi_lancamentos;
GO
