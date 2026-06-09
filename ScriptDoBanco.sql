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

SELECT * from fornecedores

select * from produtos

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
    p.preco,
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
    v.valorTotal
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
        preco,
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
            @preco = preco,
            @estoque = quantidade
        FROM produtos WITH (UPDLOCK)
        WHERE id = @idproduto;

        
        IF @estoque < @quantidade
        BEGIN
            
            RAISERROR('Estoque insuficiente.', 16, 1);
        END

        SET @valorTotal = @preco * @quantidade;

      
        INSERT INTO vendas (data, valorTotal, idusuario)
        VALUES (GETDATE(), @valorTotal, @idusuario);

        SET @idvenda = SCOPE_IDENTITY();

        
        INSERT INTO itens_venda (idproduto, idvenda, quantidade, precoUnitario)
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

