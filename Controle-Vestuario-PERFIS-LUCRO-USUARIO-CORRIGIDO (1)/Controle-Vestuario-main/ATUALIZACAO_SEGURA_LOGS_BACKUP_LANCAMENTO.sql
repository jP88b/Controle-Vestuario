/* ============================================================
   ATUALIZAÇÃO SEGURA - LOGS CATEGORIAS/FORNECEDORES + LANÇAMENTO + BACKUP
   Banco: ControleVestuario

   Este script NÃO apaga dados. Ele apenas garante triggers, procedure,
   views e function necessárias para histórico, lançamento e BI.
   ============================================================ */

USE ControleVestuario;
GO

IF OBJECT_ID('dbo.HistoricoSistema', 'U') IS NULL
BEGIN
    CREATE TABLE dbo.HistoricoSistema (
        id BIGINT IDENTITY(1,1) PRIMARY KEY,
        tabela VARCHAR(100) NOT NULL,
        acao VARCHAR(30) NOT NULL,
        registro_id BIGINT NULL,
        descricao VARCHAR(500) NOT NULL,
        data_evento DATETIME2 NOT NULL DEFAULT SYSDATETIME(),
        usuario VARCHAR(100) NULL
    );
END;
GO

IF COL_LENGTH('dbo.produtos', 'preco_custo') IS NULL
BEGIN
    ALTER TABLE dbo.produtos ADD preco_custo DECIMAL(10,2) NOT NULL CONSTRAINT DF_produtos_preco_custo DEFAULT 0;
END;
GO

IF COL_LENGTH('dbo.produtos', 'preco_venda') IS NULL
BEGIN
    ALTER TABLE dbo.produtos ADD preco_venda DECIMAL(10,2) NULL;
    IF COL_LENGTH('dbo.produtos', 'preco') IS NOT NULL
        EXEC('UPDATE dbo.produtos SET preco_venda = ISNULL(preco_venda, preco)');
    EXEC('UPDATE dbo.produtos SET preco_venda = ISNULL(preco_venda, 0)');
    ALTER TABLE dbo.produtos ALTER COLUMN preco_venda DECIMAL(10,2) NOT NULL;
END;
GO

IF COL_LENGTH('dbo.movimentacoes', 'preco_custo') IS NULL
    ALTER TABLE dbo.movimentacoes ADD preco_custo DECIMAL(10,2) NULL;
GO
IF COL_LENGTH('dbo.movimentacoes', 'preco_venda') IS NULL
    ALTER TABLE dbo.movimentacoes ADD preco_venda DECIMAL(10,2) NULL;
GO

CREATE OR ALTER VIEW dbo.vw_dashboard_kpis AS
SELECT
    COUNT(p.id) AS total_produtos,
    ISNULL(SUM(p.quantidade), 0) AS total_itens_estoque,
    ISNULL(SUM(p.quantidade * p.preco_venda), 0) AS valor_total_estoque,
    ISNULL(SUM(p.quantidade * p.preco_custo), 0) AS custo_total_estoque,
    ISNULL(SUM(p.quantidade * (p.preco_venda - p.preco_custo)), 0) AS lucro_potencial_estoque,
    ISNULL(SUM(CASE WHEN p.quantidade <= 5 THEN 1 ELSE 0 END), 0) AS total_estoque_critico
FROM dbo.produtos p;
GO

CREATE OR ALTER VIEW dbo.vw_produtos_por_categoria AS
SELECT
    c.id AS categoria_id,
    c.nome AS categoria,
    COUNT(p.id) AS quantidade_produtos,
    ISNULL(SUM(p.quantidade), 0) AS total_itens,
    ISNULL(SUM(p.quantidade * p.preco_venda), 0) AS valor_total,
    ISNULL(SUM(p.quantidade * p.preco_custo), 0) AS custo_total,
    ISNULL(SUM(p.quantidade * (p.preco_venda - p.preco_custo)), 0) AS lucro_potencial
FROM dbo.categorias c
LEFT JOIN dbo.produtos p ON p.idcategoria = c.id
GROUP BY c.id, c.nome;
GO

CREATE OR ALTER VIEW dbo.vw_estoque_critico AS
SELECT
    p.id AS produto_id,
    p.nome AS produto,
    c.nome AS categoria,
    f.nome AS fornecedor,
    p.quantidade,
    p.preco_custo,
    p.preco_venda,
    p.quantidade * p.preco_venda AS valor_em_estoque,
    CASE WHEN p.quantidade = 0 THEN 'Esgotado' WHEN p.quantidade <= 5 THEN 'Crítico' ELSE 'Normal' END AS status_estoque
FROM dbo.produtos p
LEFT JOIN dbo.categorias c ON c.id = p.idcategoria
LEFT JOIN dbo.fornecedores f ON f.id = p.idfornecedor
WHERE p.quantidade <= 5;
GO

CREATE OR ALTER VIEW dbo.vw_powerbi_estoque AS
SELECT
    p.id AS produto_id,
    p.nome AS produto,
    p.descricao,
    c.nome AS categoria,
    f.nome AS fornecedor,
    p.quantidade,
    p.preco_custo,
    p.preco_venda,
    p.preco_venda - p.preco_custo AS lucro_unitario,
    p.quantidade * p.preco_venda AS valor_total_estoque,
    p.quantidade * p.preco_custo AS custo_total_estoque,
    p.quantidade * (p.preco_venda - p.preco_custo) AS lucro_potencial_estoque,
    CASE WHEN p.quantidade = 0 THEN 'Esgotado' WHEN p.quantidade <= 5 THEN 'Crítico' ELSE 'Normal' END AS status_estoque
FROM dbo.produtos p
LEFT JOIN dbo.categorias c ON c.id = p.idcategoria
LEFT JOIN dbo.fornecedores f ON f.id = p.idfornecedor;
GO

CREATE OR ALTER VIEW dbo.vw_powerbi_movimentacoes AS
SELECT
    m.id AS movimentacao_id,
    m.data,
    m.tipo,
    m.quantidade,
    p.nome AS produto,
    c.nome AS categoria,
    f.nome AS fornecedor,
    ISNULL(m.preco_custo, p.preco_custo) AS preco_custo,
    ISNULL(m.preco_venda, p.preco_venda) AS preco_venda,
    m.quantidade * ISNULL(m.preco_custo, p.preco_custo) AS valor_custo,
    m.quantidade * ISNULL(m.preco_venda, p.preco_venda) AS valor_venda,
    m.quantidade * (ISNULL(m.preco_venda, p.preco_venda) - ISNULL(m.preco_custo, p.preco_custo)) AS lucro_estimado
FROM dbo.movimentacoes m
INNER JOIN dbo.produtos p ON p.id = m.idproduto
LEFT JOIN dbo.categorias c ON c.id = p.idcategoria
LEFT JOIN dbo.fornecedores f ON f.id = p.idfornecedor;
GO

CREATE OR ALTER VIEW dbo.vw_powerbi_lancamentos AS
SELECT * FROM dbo.vw_powerbi_movimentacoes;
GO

CREATE OR ALTER VIEW dbo.vw_atividade_recente AS
SELECT TOP 100
    id,
    tabela,
    acao,
    registro_id AS registroId,
    descricao,
    data_evento AS dataEvento,
    usuario
FROM dbo.HistoricoSistema
ORDER BY data_evento DESC;
GO

CREATE OR ALTER PROCEDURE dbo.sp_registrar_lancamento_estoque
(
    @idproduto INT,
    @tipo VARCHAR(20),
    @quantidade INT,
    @preco_custo DECIMAL(10,2),
    @preco_venda DECIMAL(10,2)
)
AS
BEGIN
    SET NOCOUNT ON;

    BEGIN TRY
        BEGIN TRANSACTION;

        DECLARE @tipoNormalizado VARCHAR(20) = UPPER(LTRIM(RTRIM(@tipo)));
        DECLARE @estoqueAtual INT;
        DECLARE @precoCustoAtual DECIMAL(10,2);
        DECLARE @precoVendaAtual DECIMAL(10,2);

        IF @tipoNormalizado IN ('SAÍDA', 'SAIDA') SET @tipoNormalizado = 'SAIDA';
        IF @tipoNormalizado = 'ENTRADA' SET @tipoNormalizado = 'ENTRADA';

        IF @tipoNormalizado NOT IN ('ENTRADA', 'SAIDA')
            THROW 53000, 'Tipo inválido. Use ENTRADA ou SAIDA.', 1;
        IF @quantidade IS NULL OR @quantidade <= 0
            THROW 53001, 'Quantidade deve ser maior que zero.', 1;
        IF @preco_custo IS NOT NULL AND @preco_custo < 0
            THROW 53004, 'Valor de custo não pode ser negativo.', 1;
        IF @preco_venda IS NOT NULL AND @preco_venda < 0
            THROW 53005, 'Valor de venda não pode ser negativo.', 1;

        SELECT @estoqueAtual = quantidade, @precoCustoAtual = preco_custo, @precoVendaAtual = preco_venda
        FROM dbo.produtos WITH (UPDLOCK, ROWLOCK)
        WHERE id = @idproduto;

        IF @estoqueAtual IS NULL
            THROW 53002, 'Produto não encontrado.', 1;

        SET @preco_custo = ISNULL(@preco_custo, @precoCustoAtual);
        SET @preco_venda = ISNULL(@preco_venda, @precoVendaAtual);

        IF @tipoNormalizado = 'SAIDA' AND @estoqueAtual < @quantidade
            THROW 53003, 'Estoque insuficiente para saída.', 1;

        UPDATE dbo.produtos
        SET quantidade = CASE WHEN @tipoNormalizado = 'ENTRADA' THEN quantidade + @quantidade ELSE quantidade - @quantidade END,
            preco_custo = @preco_custo,
            preco_venda = @preco_venda
        WHERE id = @idproduto;

        INSERT INTO dbo.movimentacoes (tipo, data, quantidade, idproduto, preco_custo, preco_venda)
        VALUES (@tipoNormalizado, SYSDATETIME(), @quantidade, @idproduto, @preco_custo, @preco_venda);

        COMMIT TRANSACTION;

        SELECT SCOPE_IDENTITY() AS idmovimentacao, @idproduto AS idproduto, @tipoNormalizado AS tipo,
               @quantidade AS quantidade, @preco_custo AS precoCusto, @preco_venda AS precoVenda,
               'Lançamento registrado com sucesso' AS mensagem;
    END TRY
    BEGIN CATCH
        IF @@TRANCOUNT > 0 ROLLBACK TRANSACTION;
        DECLARE @ErrorMessage NVARCHAR(4000) = ERROR_MESSAGE();
        THROW 53099, @ErrorMessage, 1;
    END CATCH
END;
GO

CREATE OR ALTER TRIGGER dbo.trg_categoria_historico
ON dbo.categorias
AFTER INSERT, UPDATE, DELETE
AS
BEGIN
    SET NOCOUNT ON;

    INSERT INTO dbo.HistoricoSistema (tabela, acao, registro_id, descricao, usuario)
    SELECT 'Categoria', CASE WHEN d.id IS NULL THEN 'INSERT' ELSE 'UPDATE' END, i.id,
           CASE WHEN d.id IS NULL THEN CONCAT('Categoria cadastrada: ', i.nome)
                ELSE CONCAT('Categoria atualizada: ', ISNULL(d.nome, ''), ' -> ', i.nome) END,
           SYSTEM_USER
    FROM inserted i
    LEFT JOIN deleted d ON d.id = i.id;

    INSERT INTO dbo.HistoricoSistema (tabela, acao, registro_id, descricao, usuario)
    SELECT 'Categoria', 'DELETE', d.id, CONCAT('Categoria excluída: ', d.nome), SYSTEM_USER
    FROM deleted d
    LEFT JOIN inserted i ON i.id = d.id
    WHERE i.id IS NULL;
END;
GO

CREATE OR ALTER TRIGGER dbo.trg_fornecedor_historico
ON dbo.fornecedores
AFTER INSERT, UPDATE, DELETE
AS
BEGIN
    SET NOCOUNT ON;

    INSERT INTO dbo.HistoricoSistema (tabela, acao, registro_id, descricao, usuario)
    SELECT 'Fornecedor', CASE WHEN d.id IS NULL THEN 'INSERT' ELSE 'UPDATE' END, i.id,
           CASE WHEN d.id IS NULL THEN CONCAT('Fornecedor cadastrado: ', i.nome)
                ELSE CONCAT('Fornecedor atualizado: ', ISNULL(d.nome, ''), ' -> ', i.nome, ' | CNPJ: ', ISNULL(i.cnpj, '-')) END,
           SYSTEM_USER
    FROM inserted i
    LEFT JOIN deleted d ON d.id = i.id;

    INSERT INTO dbo.HistoricoSistema (tabela, acao, registro_id, descricao, usuario)
    SELECT 'Fornecedor', 'DELETE', d.id, CONCAT('Fornecedor excluído: ', d.nome, ' | CNPJ: ', ISNULL(d.cnpj, '-')), SYSTEM_USER
    FROM deleted d
    LEFT JOIN inserted i ON i.id = d.id
    WHERE i.id IS NULL;
END;
GO

CREATE OR ALTER TRIGGER dbo.trg_produto_historico
ON dbo.produtos
AFTER INSERT, UPDATE, DELETE
AS
BEGIN
    SET NOCOUNT ON;

    INSERT INTO dbo.HistoricoSistema (tabela, acao, registro_id, descricao, usuario)
    SELECT 'Produto', CASE WHEN d.id IS NULL THEN 'INSERT' ELSE 'UPDATE' END, i.id,
           CASE WHEN d.id IS NULL THEN CONCAT('Produto cadastrado: ', i.nome)
                ELSE CONCAT('Produto atualizado: ', i.nome, ' | Estoque atual: ', i.quantidade, ' | Custo R$ ', i.preco_custo, ' | Venda R$ ', i.preco_venda) END,
           SYSTEM_USER
    FROM inserted i
    LEFT JOIN deleted d ON d.id = i.id;

    INSERT INTO dbo.HistoricoSistema (tabela, acao, registro_id, descricao, usuario)
    SELECT 'Produto', 'DELETE', d.id,
           CONCAT('Produto excluído: ', d.nome, ' | Estoque anterior: ', d.quantidade, ' | Custo R$ ', d.preco_custo, ' | Venda R$ ', d.preco_venda),
           SYSTEM_USER
    FROM deleted d
    LEFT JOIN inserted i ON i.id = d.id
    WHERE i.id IS NULL;
END;
GO

CREATE OR ALTER TRIGGER dbo.trg_movimentacao_historico
ON dbo.movimentacoes
AFTER INSERT
AS
BEGIN
    SET NOCOUNT ON;

    INSERT INTO dbo.HistoricoSistema (tabela, acao, registro_id, descricao, usuario)
    SELECT 'Movimentacao', 'INSERT', i.id,
           CONCAT('Lançamento de ', i.tipo, ': ', i.quantidade, ' unidade(s) do produto ', p.nome,
                  ' | Custo R$ ', ISNULL(i.preco_custo, p.preco_custo),
                  ' | Venda R$ ', ISNULL(i.preco_venda, p.preco_venda)),
           SYSTEM_USER
    FROM inserted i
    INNER JOIN dbo.produtos p ON p.id = i.idproduto;
END;
GO

SELECT TOP 20 * FROM dbo.vw_atividade_recente;
GO
