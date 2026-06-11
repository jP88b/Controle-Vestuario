/* ============================================================
   CONTROLE DE VESTUÁRIO - SQL SERVER
   Script completo corrigido: tabelas + views + procedures + triggers + function
   Banco: ControleVestuario

   Observação:
   - Este script recria o ambiente acadêmico de testes.
   - Para NÃO apagar dados de um banco já populado, use o arquivo:
     ATUALIZACAO_SEGURA_BI_LANCAMENTO.sql
   ============================================================ */

IF DB_ID('ControleVestuario') IS NULL
BEGIN
    CREATE DATABASE ControleVestuario;
END;
GO

USE ControleVestuario;
GO

DROP VIEW IF EXISTS vw_powerbi_lancamentos;
DROP VIEW IF EXISTS vw_atividade_recente;
DROP VIEW IF EXISTS vw_relatorio_gerencial_produtos;
DROP VIEW IF EXISTS vw_powerbi_movimentacoes;
DROP VIEW IF EXISTS vw_powerbi_vendas;
DROP VIEW IF EXISTS vw_powerbi_estoque;
DROP VIEW IF EXISTS vw_estoque_critico;
DROP VIEW IF EXISTS vw_produtos_por_categoria;
DROP VIEW IF EXISTS vw_dashboard_kpis;
DROP VIEW IF EXISTS vw_estoque_baixo;
DROP VIEW IF EXISTS vw_relatorio_vendas;
DROP VIEW IF EXISTS vw_produtos_completo;
GO

DROP FUNCTION IF EXISTS dbo.fn_produtos_por_status_estoque;
GO

DROP PROCEDURE IF EXISTS sp_registrar_lancamento_estoque;
DROP PROCEDURE IF EXISTS sp_realizar_venda_transacional;
DROP PROCEDURE IF EXISTS sp_realizar_venda;
DROP PROCEDURE IF EXISTS sp_registrar_entrada_estoque;
DROP PROCEDURE IF EXISTS sp_inserir_produto;
DROP PROCEDURE IF EXISTS sp_atualizar_estoque;
DROP PROCEDURE IF EXISTS sp_listar_produtos;
GO

DROP TRIGGER IF EXISTS trg_movimentacao_historico;
DROP TRIGGER IF EXISTS trg_produto_historico;
GO

DROP TABLE IF EXISTS HistoricoSistema;
DROP TABLE IF EXISTS movimentacoes;
DROP TABLE IF EXISTS itens_venda;
DROP TABLE IF EXISTS vendas;
DROP TABLE IF EXISTS produtos;
DROP TABLE IF EXISTS usuarios;
DROP TABLE IF EXISTS fornecedores;
DROP TABLE IF EXISTS categorias;
GO

CREATE TABLE categorias (
    id INT PRIMARY KEY IDENTITY(1,1),
    nome VARCHAR(100) NOT NULL
);
GO

CREATE TABLE fornecedores (
    id INT PRIMARY KEY IDENTITY(1,1),
    nome VARCHAR(150) NOT NULL,
    cnpj VARCHAR(20),
    telefone VARCHAR(20),
    email VARCHAR(150)
);
GO

CREATE TABLE usuarios (
    id INT PRIMARY KEY IDENTITY(1,1),
    nome VARCHAR(150) NOT NULL,
    email VARCHAR(150) NOT NULL,
    senha VARCHAR(255) NOT NULL
);
GO

CREATE TABLE produtos (
    id INT PRIMARY KEY IDENTITY(1,1),
    nome VARCHAR(150) NOT NULL,
    descricao VARCHAR(255),
    preco_custo DECIMAL(10,2) NOT NULL CONSTRAINT DF_produtos_preco_custo DEFAULT 0,
    preco_venda DECIMAL(10,2) NOT NULL,
    quantidade INT NOT NULL,
    idcategoria INT,
    idfornecedor INT,
    CONSTRAINT FK_PRODUTO_CATEGORIA FOREIGN KEY (idcategoria) REFERENCES categorias(id),
    CONSTRAINT FK_PRODUTO_FORNECEDOR FOREIGN KEY (idfornecedor) REFERENCES fornecedores(id)
);
GO

CREATE TABLE vendas (
    id INT PRIMARY KEY IDENTITY(1,1),
    data DATETIME2 NOT NULL CONSTRAINT DF_vendas_data DEFAULT SYSDATETIME(),
    valor_total DECIMAL(10,2) NOT NULL CONSTRAINT DF_vendas_valor_total DEFAULT 0,
    idusuario INT,
    CONSTRAINT FK_VENDA_USUARIO FOREIGN KEY (idusuario) REFERENCES usuarios(id)
);
GO

CREATE TABLE itens_venda (
    id INT PRIMARY KEY IDENTITY(1,1),
    idproduto INT NOT NULL,
    idvenda INT NOT NULL,
    quantidade INT NOT NULL,
    preco_unitario DECIMAL(10,2) NOT NULL,
    CONSTRAINT FK_ITEM_PRODUTO FOREIGN KEY (idproduto) REFERENCES produtos(id),
    CONSTRAINT FK_ITEM_VENDA FOREIGN KEY (idvenda) REFERENCES vendas(id)
);
GO

CREATE TABLE movimentacoes (
    id INT PRIMARY KEY IDENTITY(1,1),
    tipo VARCHAR(20) NOT NULL,
    data DATETIME2 NOT NULL CONSTRAINT DF_movimentacoes_data DEFAULT SYSDATETIME(),
    quantidade INT NOT NULL,
    idproduto INT NOT NULL,
    preco_custo DECIMAL(10,2) NULL,
    preco_venda DECIMAL(10,2) NULL,
    CONSTRAINT FK_MOV_PRODUTO FOREIGN KEY (idproduto) REFERENCES produtos(id)
);
GO

CREATE TABLE HistoricoSistema (
    id BIGINT IDENTITY(1,1) PRIMARY KEY,
    tabela VARCHAR(100) NOT NULL,
    acao VARCHAR(30) NOT NULL,
    registro_id BIGINT NULL,
    descricao VARCHAR(500) NOT NULL,
    data_evento DATETIME2 NOT NULL DEFAULT SYSDATETIME(),
    usuario VARCHAR(100) NULL
);
GO

INSERT INTO categorias(nome) VALUES ('Camisetas'), ('Calças'), ('Tênis');
GO

INSERT INTO fornecedores(nome, cnpj, telefone, email) VALUES
('Nike Brasil', '11.111.111/0001-11', '(17)99999-9999', 'nike@email.com'),
('Adidas Brasil', '22.222.222/0001-22', '(17)98888-8888', 'adidas@email.com');
GO

INSERT INTO usuarios(nome, email, senha) VALUES
('Administrador', 'admin@email.com', '123456');
GO

INSERT INTO produtos(nome, descricao, preco_custo, preco_venda, quantidade, idcategoria, idfornecedor) VALUES
('Camiseta Dry Fit', 'Camiseta esportiva', 40.00, 79.90, 20, 1, 1),
('Calça Moletom', 'Calça confortável', 65.00, 129.90, 8, 2, 2),
('Tênis Running', 'Tênis para corrida', 150.00, 299.90, 4, 3, 1);
GO

/* Movimentos iniciais para os relatórios BI não abrirem vazios no ambiente de demonstração */
INSERT INTO movimentacoes(tipo, data, quantidade, idproduto, preco_custo, preco_venda)
SELECT 'ENTRADA', SYSDATETIME(), quantidade, id, preco_custo, preco_venda
FROM produtos;
GO

/* ===================== VIEWS DO DASHBOARD ===================== */
CREATE OR ALTER VIEW vw_dashboard_kpis AS
SELECT
    COUNT(p.id) AS total_produtos,
    ISNULL(SUM(p.quantidade), 0) AS total_itens_estoque,
    ISNULL(SUM(p.quantidade * p.preco_venda), 0) AS valor_total_estoque,
    ISNULL(SUM(p.quantidade * p.preco_custo), 0) AS custo_total_estoque,
    ISNULL(SUM(p.quantidade * (p.preco_venda - p.preco_custo)), 0) AS lucro_potencial_estoque,
    ISNULL(SUM(CASE WHEN p.quantidade <= 5 THEN 1 ELSE 0 END), 0) AS total_estoque_critico
FROM produtos p;
GO

CREATE OR ALTER VIEW vw_produtos_por_categoria AS
SELECT
    c.id AS categoria_id,
    c.nome AS categoria,
    COUNT(p.id) AS quantidade_produtos,
    ISNULL(SUM(p.quantidade), 0) AS total_itens,
    ISNULL(SUM(p.quantidade * p.preco_venda), 0) AS valor_total,
    ISNULL(SUM(p.quantidade * p.preco_custo), 0) AS custo_total,
    ISNULL(SUM(p.quantidade * (p.preco_venda - p.preco_custo)), 0) AS lucro_potencial
FROM categorias c
LEFT JOIN produtos p ON p.idcategoria = c.id
GROUP BY c.id, c.nome;
GO

CREATE OR ALTER VIEW vw_estoque_critico AS
SELECT
    p.id AS produto_id,
    p.nome AS produto,
    c.nome AS categoria,
    f.nome AS fornecedor,
    p.quantidade,
    p.preco_custo,
    p.preco_venda,
    p.quantidade * p.preco_venda AS valor_em_estoque,
    CASE
        WHEN p.quantidade = 0 THEN 'Esgotado'
        WHEN p.quantidade <= 5 THEN 'Crítico'
        ELSE 'Normal'
    END AS status_estoque
FROM produtos p
LEFT JOIN categorias c ON c.id = p.idcategoria
LEFT JOIN fornecedores f ON f.id = p.idfornecedor
WHERE p.quantidade <= 5;
GO

/* ===================== VIEWS BI / RELATÓRIOS ===================== */
CREATE OR ALTER VIEW vw_powerbi_estoque AS
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
FROM produtos p
LEFT JOIN categorias c ON c.id = p.idcategoria
LEFT JOIN fornecedores f ON f.id = p.idfornecedor;
GO

CREATE OR ALTER VIEW vw_powerbi_movimentacoes AS
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
FROM movimentacoes m
INNER JOIN produtos p ON p.id = m.idproduto
LEFT JOIN categorias c ON c.id = p.idcategoria
LEFT JOIN fornecedores f ON f.id = p.idfornecedor;
GO

CREATE OR ALTER VIEW vw_powerbi_lancamentos AS
SELECT * FROM vw_powerbi_movimentacoes;
GO

CREATE OR ALTER VIEW vw_powerbi_vendas AS
SELECT
    v.id AS venda_id,
    v.data AS data_venda,
    u.nome AS usuario,
    p.nome AS produto,
    c.nome AS categoria,
    iv.quantidade,
    iv.preco_unitario,
    p.preco_custo,
    iv.quantidade * iv.preco_unitario AS faturamento,
    iv.quantidade * p.preco_custo AS custo_total,
    iv.quantidade * (iv.preco_unitario - p.preco_custo) AS lucro_total
FROM vendas v
INNER JOIN usuarios u ON u.id = v.idusuario
INNER JOIN itens_venda iv ON iv.idvenda = v.id
INNER JOIN produtos p ON p.id = iv.idproduto
LEFT JOIN categorias c ON c.id = p.idcategoria;
GO

CREATE OR ALTER VIEW vw_relatorio_gerencial_produtos AS
SELECT
    p.id AS produto_id,
    p.nome AS produto,
    c.nome AS categoria,
    f.nome AS fornecedor,
    p.quantidade AS estoque_atual,
    p.preco_custo,
    p.preco_venda,
    p.preco_venda - p.preco_custo AS lucro_unitario,
    CASE WHEN p.preco_venda > 0 THEN ((p.preco_venda - p.preco_custo) / p.preco_venda) * 100 ELSE 0 END AS margem_percentual,
    ISNULL(SUM(iv.quantidade), 0) AS total_vendido,
    ISNULL(SUM(iv.quantidade * iv.preco_unitario), 0) AS faturamento_total,
    ISNULL(SUM(iv.quantidade * p.preco_custo), 0) AS custo_total_vendido,
    ISNULL(SUM(iv.quantidade * (iv.preco_unitario - p.preco_custo)), 0) AS lucro_total,
    ISNULL((SELECT SUM(m1.quantidade) FROM movimentacoes m1 WHERE m1.idproduto = p.id AND UPPER(m1.tipo) = 'ENTRADA'), 0) AS total_entradas,
    ISNULL((SELECT SUM(m2.quantidade) FROM movimentacoes m2 WHERE m2.idproduto = p.id AND UPPER(m2.tipo) = 'SAIDA'), 0) AS total_saidas,
    CASE
        WHEN p.quantidade = 0 THEN 'Esgotado'
        WHEN p.quantidade <= 5 THEN 'Crítico'
        ELSE 'Normal'
    END AS status_estoque
FROM produtos p
LEFT JOIN categorias c ON c.id = p.idcategoria
LEFT JOIN fornecedores f ON f.id = p.idfornecedor
LEFT JOIN itens_venda iv ON iv.idproduto = p.id
GROUP BY p.id, p.nome, c.nome, f.nome, p.quantidade, p.preco_custo, p.preco_venda;
GO

CREATE OR ALTER VIEW vw_atividade_recente AS
SELECT TOP 100
    id,
    tabela,
    acao,
    registro_id AS registroId,
    descricao,
    data_evento AS dataEvento,
    usuario
FROM HistoricoSistema
ORDER BY data_evento DESC;
GO

/* ===================== FUNCTION ===================== */
CREATE OR ALTER FUNCTION dbo.fn_produtos_por_status_estoque (@limite INT)
RETURNS TABLE
AS
RETURN
(
    SELECT
        p.id AS produto_id,
        p.nome AS produto,
        c.nome AS categoria,
        f.nome AS fornecedor,
        p.quantidade,
        p.preco_custo,
        p.preco_venda,
        p.preco_venda - p.preco_custo AS lucro_unitario,
        CASE
            WHEN p.quantidade = 0 THEN 'Esgotado'
            WHEN p.quantidade <= @limite THEN 'Crítico'
            ELSE 'Normal'
        END AS status_estoque
    FROM produtos p
    LEFT JOIN categorias c ON c.id = p.idcategoria
    LEFT JOIN fornecedores f ON f.id = p.idfornecedor
    WHERE p.quantidade <= @limite
);
GO

/* ===================== PROCEDURES ===================== */
CREATE OR ALTER PROCEDURE sp_inserir_produto
(
    @nome VARCHAR(150),
    @descricao VARCHAR(255),
    @preco_custo DECIMAL(10,2),
    @preco_venda DECIMAL(10,2),
    @quantidade INT,
    @idcategoria INT,
    @idfornecedor INT
)
AS
BEGIN
    SET NOCOUNT ON;

    INSERT INTO produtos (nome, descricao, preco_custo, preco_venda, quantidade, idcategoria, idfornecedor)
    VALUES (@nome, @descricao, @preco_custo, @preco_venda, @quantidade, @idcategoria, @idfornecedor);

    SELECT SCOPE_IDENTITY() AS id_produto_criado;
END;
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

CREATE OR ALTER PROCEDURE sp_registrar_entrada_estoque
(
    @idproduto INT,
    @quantidade INT
)
AS
BEGIN
    SET NOCOUNT ON;
    DECLARE @custo DECIMAL(10,2);
    DECLARE @venda DECIMAL(10,2);

    SELECT @custo = preco_custo, @venda = preco_venda
    FROM produtos
    WHERE id = @idproduto;

    EXEC sp_registrar_lancamento_estoque @idproduto, 'ENTRADA', @quantidade, @custo, @venda;
END;
GO

CREATE OR ALTER PROCEDURE sp_realizar_venda_transacional
(
    @idproduto INT,
    @idusuario INT,
    @quantidade INT
)
AS
BEGIN
    SET NOCOUNT ON;

    BEGIN TRY
        BEGIN TRANSACTION;

        IF @quantidade IS NULL OR @quantidade <= 0
            THROW 51000, 'Quantidade deve ser maior que zero.', 1;

        IF NOT EXISTS (SELECT 1 FROM usuarios WHERE id = @idusuario)
            THROW 51001, 'Usuário não encontrado.', 1;

        DECLARE @preco DECIMAL(10,2);
        DECLARE @custo DECIMAL(10,2);
        DECLARE @estoque INT;
        DECLARE @valorTotal DECIMAL(10,2);
        DECLARE @idvenda INT;

        SELECT @preco = preco_venda, @custo = preco_custo, @estoque = quantidade
        FROM produtos WITH (UPDLOCK, ROWLOCK)
        WHERE id = @idproduto;

        IF @preco IS NULL
            THROW 51002, 'Produto não encontrado.', 1;

        IF @estoque < @quantidade
            THROW 51003, 'Estoque insuficiente.', 1;

        SET @valorTotal = @preco * @quantidade;

        INSERT INTO vendas (data, valor_total, idusuario)
        VALUES (SYSDATETIME(), @valorTotal, @idusuario);

        SET @idvenda = SCOPE_IDENTITY();

        INSERT INTO itens_venda (idproduto, idvenda, quantidade, preco_unitario)
        VALUES (@idproduto, @idvenda, @quantidade, @preco);

        UPDATE produtos
        SET quantidade = quantidade - @quantidade
        WHERE id = @idproduto;

        INSERT INTO movimentacoes (tipo, data, idproduto, quantidade, preco_custo, preco_venda)
        VALUES ('SAIDA', SYSDATETIME(), @idproduto, @quantidade, @custo, @preco);

        INSERT INTO HistoricoSistema (tabela, acao, registro_id, descricao, usuario)
        VALUES ('Venda', 'INSERT', @idvenda, CONCAT('Venda realizada. Produto ID ', @idproduto, ' | Quantidade ', @quantidade, ' | Total R$ ', @valorTotal), SYSTEM_USER);

        COMMIT TRANSACTION;

        SELECT
            @idvenda AS idvenda,
            @idproduto AS idproduto,
            @idusuario AS idusuario,
            @quantidade AS quantidade,
            @valorTotal AS valorTotal,
            'Venda realizada com sucesso' AS mensagem;
    END TRY
    BEGIN CATCH
        IF @@TRANCOUNT > 0 ROLLBACK TRANSACTION;
        DECLARE @ErrorMessage NVARCHAR(4000) = ERROR_MESSAGE();
        THROW 51099, @ErrorMessage, 1;
    END CATCH
END;
GO

CREATE OR ALTER PROCEDURE sp_realizar_venda
(
    @idproduto INT,
    @idusuario INT,
    @quantidade INT
)
AS
BEGIN
    EXEC sp_realizar_venda_transacional @idproduto, @idusuario, @quantidade;
END;
GO

CREATE OR ALTER PROCEDURE sp_listar_produtos
AS
BEGIN
    SET NOCOUNT ON;
    SELECT * FROM vw_powerbi_estoque;
END;
GO

/* ===================== TRIGGERS ===================== */
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

CREATE OR ALTER TRIGGER trg_movimentacao_historico
ON movimentacoes
AFTER INSERT
AS
BEGIN
    SET NOCOUNT ON;

    INSERT INTO HistoricoSistema (tabela, acao, registro_id, descricao, usuario)
    SELECT
        'Movimentacao',
        'INSERT',
        i.id,
        CONCAT('Lançamento de ', i.tipo, ': ', i.quantidade, ' unidade(s) do produto ', p.nome, ' | Custo R$ ', ISNULL(i.preco_custo, p.preco_custo), ' | Venda R$ ', ISNULL(i.preco_venda, p.preco_venda)),
        SYSTEM_USER
    FROM inserted i
    INNER JOIN produtos p ON p.id = i.idproduto;
END;
GO

/* ===================== TESTES RÁPIDOS ===================== */
SELECT * FROM vw_dashboard_kpis;
SELECT * FROM vw_produtos_por_categoria;
SELECT * FROM vw_estoque_critico;
SELECT * FROM vw_powerbi_estoque;
SELECT * FROM vw_powerbi_movimentacoes;
SELECT * FROM vw_powerbi_lancamentos;
SELECT * FROM vw_relatorio_gerencial_produtos;
SELECT * FROM dbo.fn_produtos_por_status_estoque(5);
SELECT * FROM vw_atividade_recente;
GO
