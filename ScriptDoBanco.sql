CREATE DATABASE ControleVestuario;
GO

USE ControleVestuario;
GO

CREATE TABLE categorias (
    id INT PRIMARY KEY IDENTITY(1,1),
    nome VARCHAR(100) NOT NULL
);


CREATE TABLE fornecedores (
    id INT PRIMARY KEY IDENTITY(1,1),
    nome VARCHAR(150) NOT NULL,
    cnpj VARCHAR(20),
    telefone VARCHAR(20),
    email VARCHAR(150)
);

select * from fornecedores

CREATE TABLE usuarios (
    id INT PRIMARY KEY IDENTITY(1,1),
    nome VARCHAR(150) NOT NULL,
    email VARCHAR(150) NOT NULL,
    senha VARCHAR(255) NOT NULL
);

SELECT * from usuarios

SELECT * from categorias

select * from produtos

select * from vendas

CREATE TABLE produtos (
    id INT PRIMARY KEY IDENTITY(1,1),
    nome VARCHAR(150) NOT NULL,
    descricao VARCHAR(255),
    preco DECIMAL(10,2) NOT NULL,
    quantidade INT NOT NULL,

    idcategoria INT,
    idfornecedor INT,

    CONSTRAINT FK_PRODUTO_CATEGORIA
        FOREIGN KEY (idcategoria)
        REFERENCES categorias(id),

    CONSTRAINT FK_PRODUTO_FORNECEDOR
        FOREIGN KEY (idfornecedor)
        REFERENCES fornecedores(id)
);

CREATE TABLE vendas (
    id INT PRIMARY KEY IDENTITY(1,1),
    data DATETIME DEFAULT GETDATE(),
    valorTotal DECIMAL(10,2),

    idusuario INT,

    CONSTRAINT FK_VENDA_USUARIO
        FOREIGN KEY (idusuario)
        REFERENCES usuarios(id)
);

select * from itens_venda

CREATE TABLE itens_venda (
    id INT PRIMARY KEY IDENTITY(1,1),

    idproduto INT,
    idvenda INT,

    quantidade INT NOT NULL,
    precoUnitario DECIMAL(10,2) NOT NULL,

    CONSTRAINT FK_ITEM_PRODUTO
        FOREIGN KEY (idproduto)
        REFERENCES produtos(id),

    CONSTRAINT FK_ITEM_VENDA
        FOREIGN KEY (idvenda)
        REFERENCES vendas(id)
);

CREATE TABLE movimentacoes (
    id INT PRIMARY KEY IDENTITY(1,1),
    tipo VARCHAR(20),
    data DATETIME DEFAULT GETDATE(),
    quantidade INT,

    idproduto INT,

    CONSTRAINT FK_MOV_PRODUTO
        FOREIGN KEY (idproduto)
        REFERENCES produtos(id)
);

--Teste--

INSERT INTO categorias(nome)
VALUES
('Camisetas'),
('Calças'),
('Tênis');

INSERT INTO fornecedores(nome, cnpj, telefone, email)
VALUES
('Nike Brasil', '11.111.111/0001-11', '(17)99999-9999', 'nike@email.com'),
('Adidas Brasil', '22.222.222/0001-22', '(17)98888-8888', 'adidas@email.com');

INSERT INTO usuarios(nome, email, senha)
VALUES
('Administrador', 'admin@email.com', '123456');
GO

CREATE VIEW vw_produtos_completo AS
SELECT
    p.id,
    p.nome AS produto,
    p.descricao,
    p.preco_venda,
    p.quantidade,
    c.nome AS categoria,
    f.nome AS fornecedor
FROM produtos p
LEFT JOIN categorias c
    ON p.idcategoria = c.id
LEFT JOIN fornecedores f
    ON p.idfornecedor = f.id;
GO

CREATE VIEW vw_relatorio_vendas AS
SELECT
    v.id,
    v.data,
    u.nome AS usuario,
    v.valor_total
FROM vendas v
INNER JOIN usuarios u
    ON v.idusuario = u.id;
GO

CREATE VIEW vw_estoque_baixo AS
SELECT
    id,
    nome,
    quantidade
FROM produtos
WHERE quantidade < 5;
GO

CREATE PROCEDURE sp_inserir_produto
(
    @nome VARCHAR(150),
    @descricao VARCHAR(255),
    @preco DECIMAL(10,2),
    @quantidade INT,
    @idcategoria INT,
    @idfornecedor INT
)
AS
BEGIN

    INSERT INTO produtos
    (
        nome,
        descricao,
        preco_venda,
        quantidade,
        idcategoria,
        idfornecedor
    )
    VALUES
    (
        @nome,
        @descricao,
        @preco,
        @quantidade,
        @idcategoria,
        @idfornecedor
    );

END;
GO

CREATE PROCEDURE sp_atualizar_estoque
(
    @idproduto INT,
    @quantidade INT
)
AS
BEGIN

    UPDATE produtos
    SET quantidade = quantidade + @quantidade
    WHERE id = @idproduto;

END;
GO

CREATE PROCEDURE sp_listar_produtos
AS
BEGIN

    SELECT *
    FROM vw_produtos_completo;

END;
GO

CREATE PROCEDURE sp_realizar_venda
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

        DECLARE @preco DECIMAL(10,2);
        DECLARE @estoque INT;
        DECLARE @valorTotal DECIMAL(10,2);
        DECLARE @idvenda INT;

       
        SELECT
            @preco = preco_venda,
            @estoque = quantidade
        FROM produtos WITH (UPDLOCK)
        WHERE id = @idproduto;

        
        IF @estoque < @quantidade
        BEGIN
            
            RAISERROR('Estoque insuficiente.', 16, 1);
        END

        SET @valorTotal = @preco * @quantidade;

      
        INSERT INTO vendas (data, valor_total, idusuario)
        VALUES (GETDATE(), @valorTotal, @idusuario);

        SET @idvenda = SCOPE_IDENTITY();

        
        INSERT INTO itens_venda (idproduto, idvenda, quantidade, preco_unitario)
        VALUES (@idproduto, @idvenda, @quantidade, @preco);

       
        UPDATE produtos
        SET quantidade = quantidade - @quantidade
        WHERE id = @idproduto;

        
        INSERT INTO movimentacoes (tipo, data, idproduto, quantidade)
        VALUES ('SAIDA', GETDATE(), @idproduto, @quantidade);

        
        COMMIT TRANSACTION;

    END TRY
    BEGIN CATCH
        
        IF @@TRANCOUNT > 0
        BEGIN
            ROLLBACK TRANSACTION;
        END

        
        DECLARE @ErrorMessage NVARCHAR(4000) = ERROR_MESSAGE();
        DECLARE @ErrorSeverity INT = ERROR_SEVERITY();
        DECLARE @ErrorState INT = ERROR_STATE();

        RAISERROR (@ErrorMessage, @ErrorSeverity, @ErrorState);
    END CATCH
END;
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

CREATE OR ALTER VIEW vw_dashboard_kpis AS
SELECT
    COUNT(p.id) AS total_produtos,
    ISNULL(SUM(p.quantidade), 0) AS total_itens_estoque,
    ISNULL(SUM(p.quantidade * p.preco_venda), 0) AS valor_total_estoque,
    ISNULL(SUM(CASE WHEN p.quantidade <= 5 THEN 1 ELSE 0 END), 0) AS total_estoque_critico
FROM produtos p;
GO

select * from produtos
go

CREATE OR ALTER VIEW vw_produtos_por_categoria AS
SELECT
    c.id AS categoria_id,
    c.nome AS categoria,
    COUNT(p.id) AS quantidade_produtos,
    ISNULL(SUM(p.quantidade), 0) AS total_itens,
    ISNULL(SUM(p.quantidade * p.preco_venda), 0) AS valor_total
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

CREATE OR ALTER VIEW vw_powerbi_estoque AS
SELECT
    p.id AS produto_id,
    p.nome AS produto,
    p.descricao,
    c.nome AS categoria,
    f.nome AS fornecedor,
    p.quantidade,
    p.preco_venda,
    p.quantidade * p.preco_venda AS valor_total_produto,
    CASE
        WHEN p.quantidade = 0 THEN 'Esgotado'
        WHEN p.quantidade <= 5 THEN 'Crítico'
        ELSE 'Normal'
    END AS status_estoque
FROM produtos p
LEFT JOIN categorias c ON c.id = p.idcategoria
LEFT JOIN fornecedores f ON f.id = p.idfornecedor;
GO

CREATE OR ALTER VIEW vw_atividade_recente AS
SELECT TOP 100
    id,
    tabela,
    acao,
    registro_id,
    descricao,
    data_evento,
    usuario
FROM HistoricoSistema
ORDER BY data_evento DESC;
GO

CREATE OR ALTER TRIGGER trg_produto_historico
ON produtos
AFTER INSERT, UPDATE, DELETE
AS
BEGIN
    SET NOCOUNT ON;

    -- Cenário de Inserção ou Atualização
    IF EXISTS (SELECT * FROM inserted)
    BEGIN
        INSERT INTO HistoricoSistema (tabela, acao, registro_id, descricao, usuario)
        SELECT
            'Produto',
            CASE WHEN d.id IS NULL THEN 'INSERT' ELSE 'UPDATE' END,
            i.id,
            CASE 
                WHEN d.id IS NULL THEN CONCAT('Produto cadastrado: ', i.nome)
                ELSE CONCAT('Produto atualizado: ', i.nome, ' (Qtd em estoque: ', i.quantidade, ')')
            END,
            SYSTEM_USER
        FROM inserted i
        LEFT JOIN deleted d ON d.id = i.id;
    END
    -- Cenário de Exclusão (DELETE)
    ELSE
    BEGIN
        INSERT INTO HistoricoSistema (tabela, acao, registro_id, descricao, usuario)
        SELECT
            'Produto',
            'DELETE',
            d.id,
            CONCAT('Produto removido do sistema: ', d.nome),
            SYSTEM_USER
        FROM deleted d;
    END
END;
GO

CREATE OR ALTER TRIGGER trg_movimentacao_historico
ON movimentacoes
AFTER INSERT
AS
BEGIN
    SET NOCOUNT ON;

    -- 1. Grava no Histórico do Sistema (Corrigido o JOIN para o campo correto do produto)
    INSERT INTO HistoricoSistema (tabela, acao, registro_id, descricao, usuario)
    SELECT
        'Movimentacao',
        'INSERT',
        i.id,
        CONCAT(
            'Movimentação registrada: ', i.tipo, 
            ' de ', i.quantidade, 
            ' unidade(s) do produto ', p.nome
        ),
        SYSTEM_USER
    FROM inserted i
    INNER JOIN produtos p ON p.id = i.idproduto; -- 🔥 CORREÇÃO: i.idproduto em vez de i.id

    -- 2. Atualiza o estoque real do produto para refletir instantaneamente nas Views do Dashboard
    UPDATE p
    SET p.quantidade = CASE 
        WHEN i.tipo = 'Entrada' THEN p.quantidade + i.quantidade
        WHEN i.tipo = 'Saída'   THEN p.quantidade - i.quantidade
        ELSE p.quantidade
    END
    FROM produtos p
    INNER JOIN inserted i ON p.id = i.idproduto;
END;
GO

SELECT * FROM vw_dashboard_kpis;
SELECT * FROM vw_estoque_critico;
SELECT * FROM vw_atividade_recente;

IF COL_LENGTH('produtos', 'custo') IS NULL
BEGIN
    ALTER TABLE produtos
    ADD custo DECIMAL(10,2) NOT NULL
        CONSTRAINT DF_produtos_custo DEFAULT 0;
END;
GO

/* Garante que produtos antigos fiquem com custo inicial coerente.
   Aqui usamos 60% do preço como custo estimado apenas para não deixar zerado.
   Depois o usuário pode editar o custo real no sistema. */
UPDATE produtos
SET custo = preco_venda * 0.60
WHERE custo = 0 AND preco_venda > 0;
GO

select * from produtos
/* ============================================================
   2. TABELA DE HISTÓRICO
   Usada pelas triggers e pela aba de histórico/atividade recente
   ============================================================ */

IF OBJECT_ID('HistoricoSistema', 'U') IS NULL
BEGIN
    CREATE TABLE HistoricoSistema (
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

/* ============================================================
   3. VIEWS DO DASHBOARD / BI
   Corrigidas para usar produtos.preco e produtos.custo
   ============================================================ */

CREATE OR ALTER VIEW vw_dashboard_kpis AS
SELECT
    COUNT(p.id) AS total_produtos,
    ISNULL(SUM(p.quantidade), 0) AS total_itens_estoque,
    ISNULL(SUM(p.quantidade * p.preco_venda), 0) AS valor_total_venda_estoque,
    ISNULL(SUM(p.quantidade * p.custo), 0) AS custo_total_estoque,
    ISNULL(SUM(p.quantidade * (p.preco_venda - p.custo)), 0) AS lucro_potencial_estoque,
    ISNULL(SUM(CASE WHEN p.quantidade <= 5 THEN 1 ELSE 0 END), 0) AS total_estoque_critico
FROM produtos p;
GO

CREATE OR ALTER VIEW vw_produtos_por_categoria AS
SELECT
    c.id AS categoria_id,
    c.nome AS categoria,
    COUNT(p.id) AS quantidade_produtos,
    ISNULL(SUM(p.quantidade), 0) AS total_itens,
    ISNULL(SUM(p.quantidade * p.preco_venda), 0) AS valor_total_venda,
    ISNULL(SUM(p.quantidade * p.custo), 0) AS custo_total,
    ISNULL(SUM(p.quantidade * (p.preco_venda - p.custo)), 0) AS lucro_potencial
FROM categorias c
LEFT JOIN produtos p
    ON p.idcategoria = c.id
GROUP BY
    c.id,
    c.nome;
GO

CREATE OR ALTER VIEW vw_estoque_critico AS
SELECT
    p.id AS produto_id,
    p.nome AS produto,
    p.descricao,
    c.nome AS categoria,
    f.nome AS fornecedor,
    p.quantidade,
    p.custo,
    p.preco_venda AS preco_venda,
    p.quantidade * p.custo AS custo_em_estoque,
    p.quantidade * p.preco_venda AS valor_venda_em_estoque,
    p.quantidade * (p.preco_venda - p.custo) AS lucro_potencial,
    CASE
        WHEN p.quantidade = 0 THEN 'Esgotado'
        WHEN p.quantidade <= 5 THEN 'Crítico'
        ELSE 'Normal'
    END AS status_estoque
FROM produtos p
LEFT JOIN categorias c
    ON c.id = p.idcategoria
LEFT JOIN fornecedores f
    ON f.id = p.idfornecedor
WHERE p.quantidade <= 5;
GO

CREATE OR ALTER VIEW vw_powerbi_estoque AS
SELECT
    p.id AS produto_id,
    p.nome AS produto,
    p.descricao,
    c.nome AS categoria,
    f.nome AS fornecedor,
    p.quantidade,
    p.custo,
    p.preco_venda AS preco_venda,
    p.quantidade * p.custo AS custo_total_produto,
    p.quantidade * p.preco_venda AS valor_total_venda,
    p.quantidade * (p.preco_venda - p.custo) AS lucro_potencial,
    CASE
        WHEN p.quantidade = 0 THEN 'Esgotado'
        WHEN p.quantidade <= 5 THEN 'Crítico'
        ELSE 'Normal'
    END AS status_estoque
FROM produtos p
LEFT JOIN categorias c
    ON c.id = p.idcategoria
LEFT JOIN fornecedores f
    ON f.id = p.idfornecedor;
GO

/* ============================================================
   4. VIEW COMPLEXA
   Critério: Deve realizar uma consulta complexa por meio de uma VIEW
   chamada pelo sistema Java.

   Essa view junta produtos, categorias, fornecedores, vendas,
   itens de venda e movimentações, trazendo indicadores gerenciais.
   ============================================================ */

CREATE OR ALTER VIEW vw_relatorio_gerencial_produtos AS
SELECT
    p.id AS produto_id,
    p.nome AS produto,
    p.descricao,
    c.nome AS categoria,
    f.nome AS fornecedor,
    p.quantidade AS estoque_atual,
    p.custo,
    p.preco_venda AS preco_venda,
    (p.preco_venda - p.custo) AS lucro_unitario,
    CASE
        WHEN p.preco_venda = 0 THEN 0
        ELSE CAST(((p.preco_venda - p.custo) / p.preco_venda) * 100 AS DECIMAL(10,2))
    END AS margem_percentual,
    ISNULL(SUM(iv.quantidade), 0) AS total_vendido,
    ISNULL(SUM(iv.quantidade * iv.preco_unitario), 0) AS faturamento_total,
    ISNULL(SUM(iv.quantidade * p.custo), 0) AS custo_total_vendido,
    ISNULL(SUM(iv.quantidade * (iv.preco_unitario - p.custo)), 0) AS lucro_estimado,
    ISNULL((
        SELECT SUM(m.quantidade)
        FROM movimentacoes m
        WHERE m.idproduto = p.id
          AND UPPER(m.tipo) = 'ENTRADA'
    ), 0) AS total_entradas,
    ISNULL((
        SELECT SUM(m.quantidade)
        FROM movimentacoes m
        WHERE m.idproduto = p.id
          AND UPPER(m.tipo) = 'SAIDA'
    ), 0) AS total_saidas,
    CASE
        WHEN p.quantidade = 0 THEN 'Esgotado'
        WHEN p.quantidade <= 5 THEN 'Crítico'
        WHEN p.quantidade <= 15 THEN 'Atenção'
        ELSE 'Normal'
    END AS status_estoque
FROM produtos p
LEFT JOIN categorias c
    ON c.id = p.idcategoria
LEFT JOIN fornecedores f
    ON f.id = p.idfornecedor
LEFT JOIN itens_venda iv
    ON iv.idproduto = p.id
LEFT JOIN vendas v
    ON v.id = iv.idvenda
GROUP BY
    p.id,
    p.nome,
    p.descricao,
    c.nome,
    f.nome,
    p.quantidade,
    p.custo,
    p.preco_venda;
GO

/* ============================================================
   5. FUNCTION QUE RETORNA TABELA
   Critério: Desenvolver uma FUNCTION que retorne uma tabela e
   usar essa função para consulta no Java.

   Exemplo de uso:
   SELECT * FROM dbo.fn_produtos_por_status_estoque(5);
   ============================================================ */

CREATE OR ALTER FUNCTION dbo.fn_produtos_por_status_estoque
(
    @estoqueMinimo INT
)
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
        p.custo,
        p.preco_venda AS preco_venda,
        (p.preco_venda - p.custo) AS lucro_unitario,
        CASE
            WHEN p.quantidade = 0 THEN 'Esgotado'
            WHEN p.quantidade <= @estoqueMinimo THEN 'Abaixo do mínimo'
            ELSE 'Dentro do estoque'
        END AS status_estoque
    FROM produtos p
    LEFT JOIN categorias c
        ON c.id = p.idcategoria
    LEFT JOIN fornecedores f
        ON f.id = p.idfornecedor
    WHERE p.quantidade <= @estoqueMinimo
);
GO

/* ============================================================
   6. TRIGGER DE HISTÓRICO EM PRODUTOS
   Registra INSERT, UPDATE e DELETE em produtos
   ============================================================ */

CREATE OR ALTER TRIGGER trg_produto_historico
ON produtos
AFTER INSERT, UPDATE, DELETE
AS
BEGIN
    SET NOCOUNT ON;

    -- INSERT
    INSERT INTO HistoricoSistema (tabela, acao, registro_id, descricao, usuario)
    SELECT
        'produtos',
        'INSERT',
        i.id,
        CONCAT(
            'Produto cadastrado: ', i.nome,
            ' | Custo: R$ ', FORMAT(i.custo, 'N2', 'pt-BR'),
            ' | Preço venda: R$ ', FORMAT(i.preco_venda, 'N2', 'pt-BR')
        ),
        SYSTEM_USER
    FROM inserted i
    LEFT JOIN deleted d
        ON d.id = i.id
    WHERE d.id IS NULL;

    -- UPDATE
    INSERT INTO HistoricoSistema (tabela, acao, registro_id, descricao, usuario)
    SELECT
        'produtos',
        'UPDATE',
        i.id,
        CONCAT(
            'Produto atualizado: ', i.nome,
            ' | Qtd: ', d.quantidade, ' -> ', i.quantidade,
            ' | Custo: R$ ', FORMAT(d.custo, 'N2', 'pt-BR'), ' -> R$ ', FORMAT(i.custo, 'N2', 'pt-BR'),
            ' | Preço: R$ ', FORMAT(d.preco_venda, 'N2', 'pt-BR'), ' -> R$ ', FORMAT(i.preco_venda, 'N2', 'pt-BR')
        ),
        SYSTEM_USER
    FROM inserted i
    INNER JOIN deleted d
        ON d.id = i.id
    WHERE
        ISNULL(i.nome, '') <> ISNULL(d.nome, '')
        OR ISNULL(i.descricao, '') <> ISNULL(d.descricao, '')
        OR ISNULL(i.quantidade, 0) <> ISNULL(d.quantidade, 0)
        OR ISNULL(i.custo, 0) <> ISNULL(d.custo, 0)
        OR ISNULL(i.preco_venda, 0) <> ISNULL(d.preco_venda, 0)
        OR ISNULL(i.idcategoria, 0) <> ISNULL(d.idcategoria, 0)
        OR ISNULL(i.idfornecedor, 0) <> ISNULL(d.idfornecedor, 0);

    -- DELETE
    INSERT INTO HistoricoSistema (tabela, acao, registro_id, descricao, usuario)
    SELECT
        'produtos',
        'DELETE',
        d.id,
        CONCAT('Produto removido: ', d.nome),
        SYSTEM_USER
    FROM deleted d
    LEFT JOIN inserted i
        ON i.id = d.id
    WHERE i.id IS NULL;
END;
GO

/* ============================================================
   7. TRIGGER DISPARADA PELA TRANSAÇÃO DO BANCO
   Critério: Um trigger deve ser disparado por uma transação
   realizada no Banco de Dados. Essa transação será chamada pelo Java
   através da procedure sp_realizar_venda_transacional.

   Importante:
   Esta trigger NÃO baixa estoque para evitar baixa duplicada.
   Ela apenas grava histórico quando uma movimentação é criada.
   ============================================================ */

CREATE OR ALTER TRIGGER trg_movimentacao_historico
ON movimentacoes
AFTER INSERT
AS
BEGIN
    SET NOCOUNT ON;

    INSERT INTO HistoricoSistema (tabela, acao, registro_id, descricao, usuario)
    SELECT
        'movimentacoes',
        'INSERT',
        i.id,
        CONCAT(
            'Movimentação registrada: ',
            UPPER(i.tipo),
            ' de ',
            i.quantidade,
            ' unidade(s) do produto ',
            p.nome
        ),
        SYSTEM_USER
    FROM inserted i
    INNER JOIN produtos p
        ON p.id = i.idproduto;
END;
GO

/* ============================================================
   8. PROCEDURE BEM ELABORADA COM TRANSAÇÃO
   Critério: procedure chamada pelo Java e que realiza transação programada.

   O que ela faz:
   - valida usuário;
   - valida produto;
   - bloqueia a linha do produto durante a venda;
   - valida estoque;
   - calcula valor total;
   - cria venda;
   - cria item da venda;
   - baixa estoque;
   - cria movimentação;
   - a movimentação dispara a trigger trg_movimentacao_historico;
   - confirma com COMMIT ou desfaz com ROLLBACK.
   ============================================================ */

CREATE OR ALTER PROCEDURE sp_realizar_venda_transacional
(
    @idproduto INT,
    @idusuario INT,
    @quantidade INT
)
AS
BEGIN
    SET NOCOUNT ON;
    SET XACT_ABORT ON;

    BEGIN TRY
        BEGIN TRANSACTION;

        DECLARE @preco DECIMAL(10,2);
        DECLARE @custo DECIMAL(10,2);
        DECLARE @estoque INT;
        DECLARE @valorTotal DECIMAL(10,2);
        DECLARE @idvenda INT;
        

        IF @quantidade IS NULL OR @quantidade <= 0
        BEGIN
            THROW 50001, 'A quantidade da venda deve ser maior que zero.', 1;
        END;

        IF NOT EXISTS (SELECT 1 FROM usuarios WHERE id = @idusuario)
        BEGIN
            THROW 50002, 'Usuário não encontrado.', 1;
        END;

        SELECT
            @preco = preco_venda,
            @custo = custo,
            @estoque = quantidade
        FROM produtos WITH (UPDLOCK, HOLDLOCK)
        WHERE id = @idproduto;

        IF @preco IS NULL
        BEGIN
            THROW 50003, 'Produto não encontrado.', 1;
        END;

        IF @estoque < @quantidade
        BEGIN
            THROW 50004, 'Estoque insuficiente para realizar a venda.', 1;
        END;

        SET @valorTotal = @preco * @quantidade;

        INSERT INTO vendas (data, valor_total, idusuario)
        VALUES (GETDATE(), @valorTotal, @idusuario);

        SET @idvenda = SCOPE_IDENTITY();

        INSERT INTO itens_venda
        (
            idproduto,
            idvenda,
            quantidade,
            preco_unitario
        )
        VALUES
        (
            @idproduto,
            @idvenda,
            @quantidade,
            @preco
        );

        UPDATE produtos
        SET quantidade = quantidade - @quantidade
        WHERE id = @idproduto;

        INSERT INTO movimentacoes
        (
            tipo,
            data,
            quantidade,
            idproduto
        )
        VALUES
        (
            'SAIDA',
            GETDATE(),
            @quantidade,
            @idproduto
        );

        INSERT INTO HistoricoSistema
        (
            tabela,
            acao,
            registro_id,
            descricao,
            usuario
        )
        VALUES
        (
            'vendas',
            'INSERT',
            @idvenda,
            CONCAT(
                'Venda realizada. Produto ID: ',
                @idproduto,
                ' | Quantidade: ',
                @quantidade,
                ' | Valor total: R$ ',
                FORMAT(@valorTotal, 'N2', 'pt-BR')
            ),
            SYSTEM_USER
        );

        COMMIT TRANSACTION;

        SELECT
            @idvenda AS idvenda,
            @idproduto AS idproduto,
            @idusuario AS idusuario,
            @quantidade AS quantidade,
            @preco AS preco_unitario,
            @custo AS custo_unitario,
            @valorTotal AS valor_total,
            (@preco - @custo) * @quantidade AS lucro_estimado,
            'Venda realizada com sucesso.' AS mensagem;

    END TRY
    BEGIN CATCH
        IF @@TRANCOUNT > 0
        BEGIN
            ROLLBACK TRANSACTION;
        END;

        DECLARE @MensagemErro NVARCHAR(4000) = ERROR_MESSAGE();
        THROW 51000, @MensagemErro, 1;
    END CATCH;
END;
GO

/* ============================================================
   9. PROCEDURE DE CADASTRO DE PRODUTO COM CUSTO
   Corrige o cadastro para receber custo e preço de venda separados
   ============================================================ */

CREATE OR ALTER PROCEDURE sp_inserir_produto
(
    @nome VARCHAR(150),
    @descricao VARCHAR(255),
    @custo DECIMAL(10,2),
    @preco DECIMAL(10,2),
    @quantidade INT,
    @idcategoria INT,
    @idfornecedor INT
)
AS
BEGIN
    SET NOCOUNT ON;

    IF @custo < 0
    BEGIN
        THROW 52001, 'O custo do produto não pode ser negativo.', 1;
    END;

    IF @preco <= 0
    BEGIN
        THROW 52002, 'O preço de venda do produto deve ser maior que zero.', 1;
    END;

    IF @preco < @custo
    BEGIN
        THROW 52003, 'O preço de venda não pode ser menor que o custo.', 1;
    END;

    INSERT INTO produtos
    (
        nome,
        descricao,
        custo,
        preco_venda,
        quantidade,
        idcategoria,
        idfornecedor
    )
    VALUES
    (
        @nome,
        @descricao,
        @custo,
        @preco,
        @quantidade,
        @idcategoria,
        @idfornecedor
    );

    SELECT SCOPE_IDENTITY() AS idproduto;
END;
GO

/* ============================================================
   10. PROCEDURE PARA ENTRADA DE ESTOQUE
   Pode ser chamada pelo Java para entrada de mercadoria.
   Ela também dispara a trigger trg_movimentacao_historico.
   ============================================================ */

CREATE OR ALTER PROCEDURE sp_registrar_entrada_estoque
(
    @idproduto INT,
    @quantidade INT,
    @novoCusto DECIMAL(10,2) = NULL
)
AS
BEGIN
    SET NOCOUNT ON;
    SET XACT_ABORT ON;

    BEGIN TRY
        BEGIN TRANSACTION;

        IF @quantidade IS NULL OR @quantidade <= 0
        BEGIN
            THROW 53001, 'A quantidade de entrada deve ser maior que zero.', 1;
        END;

        IF NOT EXISTS (SELECT 1 FROM produtos WHERE id = @idproduto)
        BEGIN
            THROW 53002, 'Produto não encontrado.', 1;
        END;

        UPDATE produtos
        SET
            quantidade = quantidade + @quantidade,
            custo = ISNULL(@novoCusto, custo)
        WHERE id = @idproduto;

        INSERT INTO movimentacoes
        (
            tipo,
            data,
            quantidade,
            idproduto
        )
        VALUES
        (
            'ENTRADA',
            GETDATE(),
            @quantidade,
            @idproduto
        );

        COMMIT TRANSACTION;

        SELECT
            @idproduto AS idproduto,
            @quantidade AS quantidade_entrada,
            'Entrada de estoque registrada com sucesso.' AS mensagem;

    END TRY
    BEGIN CATCH
        IF @@TRANCOUNT > 0
        BEGIN
            ROLLBACK TRANSACTION;
        END;

        DECLARE @MensagemErro NVARCHAR(4000) = ERROR_MESSAGE();
        THROW 53099, @MensagemErro, 1;
    END CATCH;
END;
GO

/* ============================================================
   11. VIEW DE ATIVIDADE RECENTE
   ============================================================ */

CREATE OR ALTER VIEW vw_atividade_recente AS
SELECT TOP 100
    id,
    tabela,
    acao,
    registro_id,
    descricao,
    data_evento,
    usuario
FROM HistoricoSistema
ORDER BY data_evento DESC;
GO

/* ============================================================
   12. TESTES RÁPIDOS
   ============================================================ */

-- View complexa
SELECT TOP 10 * FROM vw_relatorio_gerencial_produtos;
GO

-- Function que retorna tabela
SELECT * FROM dbo.fn_produtos_por_status_estoque(5);
GO

-- KPIs
SELECT * FROM vw_dashboard_kpis;
GO

-- Histórico
SELECT TOP 10 * FROM vw_atividade_recente;
GO

