CREATE DATABASE ConfereAI_DB;
GO
USE ConfereAI_DB;
GO

-- 1. Tabela Usuario (REQUISITO: LOGIN)
CREATE TABLE Usuario (
    Id INT IDENTITY(1,1) PRIMARY KEY,
    Nome VARCHAR(100) NOT NULL,
    Email VARCHAR(100) NOT NULL UNIQUE,
    Senha VARCHAR(255) NOT NULL, -- Em produção, usar hash
    NivelAcesso VARCHAR(20) DEFAULT 'Comum' -- 'Admin' ou 'Comum'
);
GO

-- 2. Tabela Categoria
CREATE TABLE Categoria (
    Id INT IDENTITY(1,1) PRIMARY KEY,
    Nome VARCHAR(50) NOT NULL UNIQUE
);
GO

-- 3. Tabela Fornecedor
CREATE TABLE Fornecedor (
    Id INT IDENTITY(1,1) PRIMARY KEY,
    Nome VARCHAR(100) NOT NULL,
    Cnpj VARCHAR(20),
    Telefone VARCHAR(20),
    Email VARCHAR(100)
);
GO

-- 4. Tabela Produto
CREATE TABLE Produto (
    Id INT IDENTITY(1,1) PRIMARY KEY,
    Nome VARCHAR(100) NOT NULL,
    Sku VARCHAR(50) UNIQUE,
    CategoriaId INT NOT NULL,
    FornecedorId INT,
    Quantidade INT DEFAULT 0,
    PrecoVenda DECIMAL(10, 2) NOT NULL,
    ImagemUrl VARCHAR(MAX),
    CONSTRAINT FK_Produto_Categoria FOREIGN KEY (CategoriaId) REFERENCES Categoria(Id),
    CONSTRAINT FK_Produto_Fornecedor FOREIGN KEY (FornecedorId) REFERENCES Fornecedor(Id)
);
GO

-- 5. Tabela Venda (Para gerar o N x N)
CREATE TABLE Venda (
    Id INT IDENTITY(1,1) PRIMARY KEY,
    UsuarioId INT NOT NULL, -- Quem realizou a venda
    DataVenda DATETIME DEFAULT GETDATE(),
    Total DECIMAL(10, 2),
    CONSTRAINT FK_Venda_Usuario FOREIGN KEY (UsuarioId) REFERENCES Usuario(Id)
);
GO

-- 6. Tabela ItemVenda (REQUISITO: RELACIONAMENTO N x N)
-- Relaciona Venda com Produto (Muitos para Muitos)
CREATE TABLE ItemVenda (
    Id INT IDENTITY(1,1) PRIMARY KEY,
    VendaId INT NOT NULL,
    ProdutoId INT NOT NULL,
    Quantidade INT NOT NULL,
    PrecoUnitario DECIMAL(10, 2) NOT NULL,
    CONSTRAINT FK_ItemVenda_Venda FOREIGN KEY (VendaId) REFERENCES Venda(Id),
    CONSTRAINT FK_ItemVenda_Produto FOREIGN KEY (ProdutoId) REFERENCES Produto(Id)
);
GO

-- 7. Tabela Movimentacao (Log de estoque)
CREATE TABLE Movimentacao (
    Id INT IDENTITY(1,1) PRIMARY KEY,
    ProdutoId INT NOT NULL,
    DataMovimento DATETIME DEFAULT GETDATE(),
    Tipo VARCHAR(20) NOT NULL,
    Quantidade INT NOT NULL,
    CONSTRAINT FK_Movimentacao_Produto FOREIGN KEY (ProdutoId) REFERENCES Produto(Id)
);
GO

-- Inserir um usuário de teste para o Login funcionar
INSERT INTO Usuario (Nome, Email, Senha, NivelAcesso) 
VALUES ('Administrador', 'admin@confereai.com', '123456', 'Admin');
GO