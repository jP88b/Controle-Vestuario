/* ============================================================
   ATUALIZAÇÃO SEGURA - HISTÓRICO DE DELETE + LANÇAMENTO VALIDADO
   Banco: ControleVestuario

   Este script NÃO apaga tabelas e NÃO remove dados.
   Ele só corrige:
   1) DELETE de produto aparecendo em atividades recentes/histórico.
   2) Procedure de lançamento rejeitando quantidade/valores negativos.
   3) View de atividade recente ordenada.
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
ORDER BY data_evento DESC, id DESC;
GO

CREATE OR ALTER PROCEDURE sp_registrar_lancamento_estoque
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
        IF @tipoNormalizado IN ('ENTRADA') SET @tipoNormalizado = 'ENTRADA';

        IF @tipoNormalizado NOT IN ('ENTRADA', 'SAIDA')
            THROW 53000, 'Tipo inválido. Use ENTRADA ou SAIDA.', 1;

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
        FROM produtos WITH (UPDLOCK, ROWLOCK)
        WHERE id = @idproduto;

        IF @estoqueAtual IS NULL
            THROW 53002, 'Produto não encontrado.', 1;

        SET @preco_custo = ISNULL(@preco_custo, @precoCustoAtual);
        SET @preco_venda = ISNULL(@preco_venda, @precoVendaAtual);

        IF @tipoNormalizado = 'SAIDA' AND @estoqueAtual < @quantidade
            THROW 53003, 'Estoque insuficiente para saída.', 1;

        UPDATE produtos
        SET
            quantidade = CASE WHEN @tipoNormalizado = 'ENTRADA' THEN quantidade + @quantidade ELSE quantidade - @quantidade END,
            preco_custo = @preco_custo,
            preco_venda = @preco_venda
        WHERE id = @idproduto;

        INSERT INTO movimentacoes (tipo, data, quantidade, idproduto, preco_custo, preco_venda)
        VALUES (@tipoNormalizado, SYSDATETIME(), @quantidade, @idproduto, @preco_custo, @preco_venda);

        COMMIT TRANSACTION;

        SELECT
            SCOPE_IDENTITY() AS idmovimentacao,
            @idproduto AS idproduto,
            @tipoNormalizado AS tipo,
            @quantidade AS quantidade,
            @preco_custo AS precoCusto,
            @preco_venda AS precoVenda,
            'Lançamento registrado com sucesso' AS mensagem;
    END TRY
    BEGIN CATCH
        IF @@TRANCOUNT > 0 ROLLBACK TRANSACTION;
        DECLARE @ErrorMessage NVARCHAR(4000) = ERROR_MESSAGE();
        THROW 53099, @ErrorMessage, 1;
    END CATCH
END;
GO

CREATE OR ALTER TRIGGER trg_produto_historico
ON produtos
AFTER INSERT, UPDATE, DELETE
AS
BEGIN
    SET NOCOUNT ON;

    /* INSERT e UPDATE */
    INSERT INTO HistoricoSistema (tabela, acao, registro_id, descricao, usuario)
    SELECT
        'Produto',
        CASE WHEN d.id IS NULL THEN 'INSERT' ELSE 'UPDATE' END,
        i.id,
        CASE
            WHEN d.id IS NULL THEN CONCAT('Produto cadastrado: ', i.nome)
            ELSE CONCAT('Produto atualizado: ', i.nome, ' | Estoque atual: ', i.quantidade, ' | Custo R$ ', i.preco_custo, ' | Venda R$ ', i.preco_venda)
        END,
        SYSTEM_USER
    FROM inserted i
    LEFT JOIN deleted d ON d.id = i.id;

    /* DELETE: registra o produto removido para aparecer nas atividades recentes e no histórico */
    INSERT INTO HistoricoSistema (tabela, acao, registro_id, descricao, usuario)
    SELECT
        'Produto',
        'DELETE',
        d.id,
        CONCAT('Produto excluído: ', d.nome, ' | Estoque anterior: ', d.quantidade, ' | Custo R$ ', d.preco_custo, ' | Venda R$ ', d.preco_venda),
        SYSTEM_USER
    FROM deleted d
    LEFT JOIN inserted i ON i.id = d.id
    WHERE i.id IS NULL;
END;
GO

SELECT TOP 20 * FROM dbo.vw_atividade_recente;
GO
