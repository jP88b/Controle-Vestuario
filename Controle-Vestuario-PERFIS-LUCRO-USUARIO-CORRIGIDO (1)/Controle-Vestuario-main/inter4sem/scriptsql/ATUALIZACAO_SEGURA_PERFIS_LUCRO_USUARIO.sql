USE ControleVestuario;
GO

/*
    Ajustes de perfil, lucro e auditoria do usuário do sistema.
    Esse arquivo é para rodar por cima do banco que já está funcionando.
    Não apaga dados, só adiciona a coluna perfil quando faltar e recria objetos do banco.
*/

/* perfil do usuário no sistema: FUNCIONARIO, GERENTE ou ADMINISTRADOR */
IF COL_LENGTH('dbo.usuarios', 'perfil') IS NULL
BEGIN
    ALTER TABLE dbo.usuarios
    ADD perfil VARCHAR(30) NOT NULL
        CONSTRAINT DF_usuarios_perfil DEFAULT 'FUNCIONARIO';
END;
GO

/* deixa usuários antigos com um perfil válido */
UPDATE dbo.usuarios
SET perfil = 'FUNCIONARIO'
WHERE perfil IS NULL OR LTRIM(RTRIM(perfil)) = '';
GO

/* usuário padrão de demonstração fica como administrador */
UPDATE dbo.usuarios
SET perfil = 'ADMINISTRADOR'
WHERE LOWER(email) IN ('admin@email.com', 'administrador@email.com')
   OR LOWER(nome) LIKE '%admin%';
GO

/* KPI do dashboard. O lucro estimado vinha zerado quando o Java não recebia essa coluna. */
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

/* Visão usada pelos gráficos BI de estoque. */
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
    CASE
        WHEN p.quantidade = 0 THEN 'Esgotado'
        WHEN p.quantidade <= 5 THEN 'Crítico'
        ELSE 'Normal'
    END AS status_estoque
FROM dbo.produtos p
LEFT JOIN dbo.categorias c ON c.id = p.idcategoria
LEFT JOIN dbo.fornecedores f ON f.id = p.idfornecedor;
GO

/* Lançamentos para a linha de tendência e para análise financeira.
   O lucro_estimado é calculado pelo preço de venda menos custo multiplicado pela quantidade. */
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

/* Histórico sempre mais novo primeiro e com nomes de campos que o Java entende. */
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

/*
    Procedure de lançamento.
    Agora recebe usuário/perfil do sistema para auditoria e para bloquear saída feita por funcionário.
*/
CREATE OR ALTER PROCEDURE dbo.sp_registrar_lancamento_estoque
(
    @idproduto INT,
    @tipo VARCHAR(20),
    @quantidade INT,
    @preco_custo DECIMAL(10,2),
    @preco_venda DECIMAL(10,2),
    @usuario_sistema VARCHAR(150) = NULL,
    @perfil_usuario VARCHAR(30) = NULL
)
AS
BEGIN
    SET NOCOUNT ON;

    BEGIN TRY
        BEGIN TRANSACTION;

        DECLARE @tipoNormalizado VARCHAR(20) = UPPER(LTRIM(RTRIM(@tipo)));
        DECLARE @perfilNormalizado VARCHAR(30) = UPPER(LTRIM(RTRIM(ISNULL(@perfil_usuario, ''))));
        DECLARE @usuarioLog VARCHAR(150) = NULLIF(LTRIM(RTRIM(ISNULL(@usuario_sistema, ''))), '');
        DECLARE @estoqueAtual INT;
        DECLARE @precoCustoAtual DECIMAL(10,2);
        DECLARE @precoVendaAtual DECIMAL(10,2);

        IF @usuarioLog IS NULL SET @usuarioLog = SYSTEM_USER;
        IF @perfilNormalizado = 'FUNCIONÁRIO' SET @perfilNormalizado = 'FUNCIONARIO';
        IF @tipoNormalizado IN ('SAÍDA', 'SAIDA') SET @tipoNormalizado = 'SAIDA';
        IF @tipoNormalizado = 'ENTRADA' SET @tipoNormalizado = 'ENTRADA';

        /* guarda o usuário na sessão para a trigger gravar o mesmo nome no histórico */
        EXEC sys.sp_set_session_context @key = N'usuario_sistema', @value = @usuarioLog;

        IF @tipoNormalizado NOT IN ('ENTRADA', 'SAIDA')
            THROW 53000, 'Tipo inválido. Use ENTRADA ou SAIDA.', 1;

        IF @perfilNormalizado = 'FUNCIONARIO' AND @tipoNormalizado = 'SAIDA'
            THROW 53006, 'Funcionário só pode lançar ENTRADA.', 1;

        IF @quantidade IS NULL OR @quantidade <= 0
            THROW 53001, 'Quantidade deve ser maior que zero.', 1;

        IF @preco_custo IS NOT NULL AND @preco_custo < 0
            THROW 53004, 'Valor de custo não pode ser negativo.', 1;

        IF @preco_venda IS NOT NULL AND @preco_venda < 0
            THROW 53005, 'Valor de venda não pode ser negativo.', 1;

        SELECT
            @estoqueAtual = quantidade,
            @precoCustoAtual = preco_custo,
            @precoVendaAtual = preco_venda
        FROM dbo.produtos WITH (UPDLOCK, ROWLOCK)
        WHERE id = @idproduto;

        IF @estoqueAtual IS NULL
            THROW 53002, 'Produto não encontrado.', 1;

        SET @preco_custo = ISNULL(@preco_custo, @precoCustoAtual);
        SET @preco_venda = ISNULL(@preco_venda, @precoVendaAtual);

        IF @tipoNormalizado = 'SAIDA' AND @estoqueAtual < @quantidade
            THROW 53003, 'Estoque insuficiente para saída.', 1;

        UPDATE dbo.produtos
        SET
            quantidade = CASE WHEN @tipoNormalizado = 'ENTRADA' THEN quantidade + @quantidade ELSE quantidade - @quantidade END,
            preco_custo = @preco_custo,
            preco_venda = @preco_venda
        WHERE id = @idproduto;

        INSERT INTO dbo.movimentacoes (tipo, data, quantidade, idproduto, preco_custo, preco_venda)
        VALUES (@tipoNormalizado, SYSDATETIME(), @quantidade, @idproduto, @preco_custo, @preco_venda);

        DECLARE @idmovimentacao INT = CONVERT(INT, SCOPE_IDENTITY());

        COMMIT TRANSACTION;

        SELECT
            @idmovimentacao AS idmovimentacao,
            @idproduto AS idproduto,
            @tipoNormalizado AS tipo,
            @quantidade AS quantidade,
            @preco_custo AS precoCusto,
            @preco_venda AS precoVenda,
            @usuarioLog AS usuarioSistema,
            'Lançamento registrado com sucesso' AS mensagem;
    END TRY
    BEGIN CATCH
        IF @@TRANCOUNT > 0 ROLLBACK TRANSACTION;
        DECLARE @ErrorMessage NVARCHAR(4000) = ERROR_MESSAGE();
        THROW 53099, @ErrorMessage, 1;
    END CATCH
END;
GO

/* Entrada simples continua funcionando para códigos antigos. */
CREATE OR ALTER PROCEDURE dbo.sp_registrar_entrada_estoque
(
    @idproduto INT,
    @quantidade INT,
    @usuario_sistema VARCHAR(150) = NULL
)
AS
BEGIN
    SET NOCOUNT ON;

    DECLARE @custo DECIMAL(10,2);
    DECLARE @venda DECIMAL(10,2);

    SELECT @custo = preco_custo, @venda = preco_venda
    FROM dbo.produtos
    WHERE id = @idproduto;

    EXEC dbo.sp_registrar_lancamento_estoque @idproduto, 'ENTRADA', @quantidade, @custo, @venda, @usuario_sistema, 'ADMINISTRADOR';
END;
GO

/* Produto: histórico com usuário do sistema quando veio do Java. */
CREATE OR ALTER TRIGGER dbo.trg_produto_historico
ON dbo.produtos
AFTER INSERT, UPDATE, DELETE
AS
BEGIN
    SET NOCOUNT ON;

    DECLARE @usuarioLog VARCHAR(100) = COALESCE(NULLIF(CONVERT(VARCHAR(100), SESSION_CONTEXT(N'usuario_sistema')), ''), SYSTEM_USER);

    INSERT INTO dbo.HistoricoSistema (tabela, acao, registro_id, descricao, usuario)
    SELECT
        'Produto',
        CASE WHEN d.id IS NULL THEN 'INSERT' ELSE 'UPDATE' END,
        i.id,
        CASE
            WHEN d.id IS NULL THEN CONCAT('Produto cadastrado: ', i.nome)
            ELSE CONCAT('Produto atualizado: ', i.nome, ' | Estoque atual: ', i.quantidade, ' | Custo R$ ', i.preco_custo, ' | Venda R$ ', i.preco_venda)
        END,
        @usuarioLog
    FROM inserted i
    LEFT JOIN deleted d ON d.id = i.id;

    INSERT INTO dbo.HistoricoSistema (tabela, acao, registro_id, descricao, usuario)
    SELECT
        'Produto',
        'DELETE',
        d.id,
        CONCAT('Produto excluído: ', d.nome, ' | Estoque anterior: ', d.quantidade, ' | Custo R$ ', d.preco_custo, ' | Venda R$ ', d.preco_venda),
        @usuarioLog
    FROM deleted d
    LEFT JOIN inserted i ON i.id = d.id
    WHERE i.id IS NULL;
END;
GO

/* Categoria: registra cadastro, edição e exclusão. */
CREATE OR ALTER TRIGGER dbo.trg_categoria_historico
ON dbo.categorias
AFTER INSERT, UPDATE, DELETE
AS
BEGIN
    SET NOCOUNT ON;

    DECLARE @usuarioLog VARCHAR(100) = COALESCE(NULLIF(CONVERT(VARCHAR(100), SESSION_CONTEXT(N'usuario_sistema')), ''), SYSTEM_USER);

    INSERT INTO dbo.HistoricoSistema (tabela, acao, registro_id, descricao, usuario)
    SELECT
        'Categoria',
        CASE WHEN d.id IS NULL THEN 'INSERT' ELSE 'UPDATE' END,
        i.id,
        CASE
            WHEN d.id IS NULL THEN CONCAT('Categoria cadastrada: ', i.nome)
            ELSE CONCAT('Categoria atualizada: ', ISNULL(d.nome, ''), ' -> ', i.nome)
        END,
        @usuarioLog
    FROM inserted i
    LEFT JOIN deleted d ON d.id = i.id;

    INSERT INTO dbo.HistoricoSistema (tabela, acao, registro_id, descricao, usuario)
    SELECT
        'Categoria',
        'DELETE',
        d.id,
        CONCAT('Categoria excluída: ', d.nome),
        @usuarioLog
    FROM deleted d
    LEFT JOIN inserted i ON i.id = d.id
    WHERE i.id IS NULL;
END;
GO

/* Fornecedor: registra cadastro, edição e exclusão. */
CREATE OR ALTER TRIGGER dbo.trg_fornecedor_historico
ON dbo.fornecedores
AFTER INSERT, UPDATE, DELETE
AS
BEGIN
    SET NOCOUNT ON;

    DECLARE @usuarioLog VARCHAR(100) = COALESCE(NULLIF(CONVERT(VARCHAR(100), SESSION_CONTEXT(N'usuario_sistema')), ''), SYSTEM_USER);

    INSERT INTO dbo.HistoricoSistema (tabela, acao, registro_id, descricao, usuario)
    SELECT
        'Fornecedor',
        CASE WHEN d.id IS NULL THEN 'INSERT' ELSE 'UPDATE' END,
        i.id,
        CASE
            WHEN d.id IS NULL THEN CONCAT('Fornecedor cadastrado: ', i.nome)
            ELSE CONCAT('Fornecedor atualizado: ', ISNULL(d.nome, ''), ' -> ', i.nome, ' | CNPJ: ', ISNULL(i.cnpj, '-'))
        END,
        @usuarioLog
    FROM inserted i
    LEFT JOIN deleted d ON d.id = i.id;

    INSERT INTO dbo.HistoricoSistema (tabela, acao, registro_id, descricao, usuario)
    SELECT
        'Fornecedor',
        'DELETE',
        d.id,
        CONCAT('Fornecedor excluído: ', d.nome, ' | CNPJ: ', ISNULL(d.cnpj, '-')),
        @usuarioLog
    FROM deleted d
    LEFT JOIN inserted i ON i.id = d.id
    WHERE i.id IS NULL;
END;
GO

/* Movimentação: lançamento feito pelo sistema. */
CREATE OR ALTER TRIGGER dbo.trg_movimentacao_historico
ON dbo.movimentacoes
AFTER INSERT
AS
BEGIN
    SET NOCOUNT ON;

    DECLARE @usuarioLog VARCHAR(100) = COALESCE(NULLIF(CONVERT(VARCHAR(100), SESSION_CONTEXT(N'usuario_sistema')), ''), SYSTEM_USER);

    INSERT INTO dbo.HistoricoSistema (tabela, acao, registro_id, descricao, usuario)
    SELECT
        'Movimentacao',
        'INSERT',
        i.id,
        CONCAT('Lançamento de ', i.tipo, ': ', i.quantidade, ' unidade(s) do produto ', p.nome, ' | Custo R$ ', ISNULL(i.preco_custo, p.preco_custo), ' | Venda R$ ', ISNULL(i.preco_venda, p.preco_venda)),
        @usuarioLog
    FROM inserted i
    INNER JOIN dbo.produtos p ON p.id = i.idproduto;
END;
GO

/* Conferência rápida */
SELECT * FROM dbo.vw_dashboard_kpis;
SELECT TOP 10 * FROM dbo.vw_powerbi_estoque;
SELECT TOP 10 * FROM dbo.vw_powerbi_lancamentos;
GO
