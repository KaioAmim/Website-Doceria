
create database bddoceria;
use bddoceria;
CREATE TABLE avaliacoes (
    id INT AUTO_INCREMENT PRIMARY KEY,
    produto_nome VARCHAR(255) NOT NULL,
    nota INT NOT NULL,
    data_avaliacao TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);



-- Tabela para armazenar os dados gerais de cada venda/pedido
CREATE TABLE vendas (
    id INT AUTO_INCREMENT PRIMARY KEY,
    nome_cliente VARCHAR(255) NOT NULL,
    telefone_cliente VARCHAR(20) NOT NULL,
    endereco_entrega TEXT NOT NULL,
    bairro VARCHAR(100) NOT NULL,
    complemento VARCHAR(255),
    metodo_pagamento VARCHAR(50) NOT NULL,
    valor_total DECIMAL(10, 2) NOT NULL,
    status_venda VARCHAR(50) NOT NULL DEFAULT 'Pendente',
    data_venda TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Tabela para armazenar os itens de cada venda/pedido
CREATE TABLE itens_venda (
    id INT AUTO_INCREMENT PRIMARY KEY,
    venda_id INT NOT NULL,
    produto_nome VARCHAR(255) NOT NULL,
    quantidade INT NOT NULL,
    preco_unitario DECIMAL(10, 2) NOT NULL,
    
    -- Chave estrangeira para ligar o item à venda
    FOREIGN KEY (venda_id) REFERENCES vendas(id) ON DELETE CASCADE
);
