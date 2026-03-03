<?php
include 'conn.php';

date_default_timezone_set('America/Sao_Paulo');
$hoje = date('Y-m-d');


// Total de Vendas do Dia
$sql_total_vendas = "SELECT COUNT(id) AS total_vendas, SUM(valor_total) AS total_arrecadado FROM vendas WHERE DATE(data_venda) = '$hoje' AND status_venda = 'Pendente'";
$res_total_vendas = mysqli_query($conn, $sql_total_vendas);
$resumo_vendas = mysqli_fetch_assoc($res_total_vendas);

// Valor Arrecadado em Dinheiro no Dia
$sql_dinheiro_dia = "SELECT SUM(valor_total) AS total_dinheiro FROM vendas WHERE DATE(data_venda) = '$hoje' AND metodo_pagamento = 'dinheiro' AND status_venda = 'Pendente'";
$res_dinheiro_dia = mysqli_query($conn, $sql_dinheiro_dia);
$resumo_dinheiro = mysqli_fetch_assoc($res_dinheiro_dia);

// Detalhes dos Itens Vendidos no Dia
$sql_detalhes = "
    SELECT 
        v.data_venda,
        v.nome_cliente,
        v.telefone_cliente,
        v.metodo_pagamento,
        iv.produto_nome,
        iv.quantidade,
        iv.preco_unitario
    FROM vendas v
    JOIN itens_venda iv ON v.id = iv.venda_id
    WHERE DATE(v.data_venda) = '$hoje'
    ORDER BY v.data_venda DESC
";
$res_detalhes = mysqli_query($conn, $sql_detalhes);

// Resumo de Produtos Vendidos
$sql_produtos_vendidos = "
    SELECT 
        iv.produto_nome,
        SUM(iv.quantidade) AS quantidade_total
    FROM vendas v
    JOIN itens_venda iv ON v.id = iv.venda_id
    WHERE DATE(v.data_venda) = '$hoje'
    GROUP BY iv.produto_nome
    ORDER BY quantidade_total DESC
";
$res_produtos_vendidos = mysqli_query($conn, $sql_produtos_vendidos);


?>

<!DOCTYPE html>
<html lang="pt-br">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Administração - Cantinho Doce</title>
    <link rel="stylesheet" href="https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.4.0/css/all.min.css">
    <style>
        body {
            font-family: 'Poppins', sans-serif;
            background-color: #f4f7f9;
            color: #333;
            padding: 20px;
        }
        .container {
            max-width: 1400px;
            margin: 0 auto;
            background: #fff;
            padding: 30px;
            border-radius: 10px;
            box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
        }
        h1 {
            color: #ff69b4;
            border-bottom: 3px solid #ff69b4;
            padding-bottom: 10px;
            margin-bottom: 30px;
        }
        .resumo-grid {
            display: grid;
            grid-template-columns: repeat(auto-fit, minmax(250px, 1fr));
            gap: 20px;
            margin-bottom: 40px;
        }
        .card {
            background: #fff5f8;
            padding: 20px;
            border-radius: 8px;
            box-shadow: 0 2px 4px rgba(0, 0, 0, 0.05);
            border-left: 5px solid #ff69b4;
        }
        .card h2 {
            font-size: 1.1em;
            color: #666;
            margin-bottom: 5px;
        }
        .card p {
            font-size: 2em;
            font-weight: 700;
            color: #ff1493;
        }
        table {
            width: 100%;
            border-collapse: collapse;
            margin-top: 20px;
        }
        th, td {
            padding: 12px 15px;
            text-align: left;
            border-bottom: 1px solid #ddd;
        }
        th {
            background-color: #ff69b4;
            color: white;
            font-weight: 600;
        }
        tr:nth-child(even) {
            background-color: #f9f9f9;
        }
        .section-title {
            color: #ff1493;
            margin-top: 40px;
            margin-bottom: 20px;
            font-size: 1.5em;
        }
        .no-data {
            text-align: center;
            padding: 30px;
            background: #f0f0f0;
            border-radius: 5px;
            color: #999;
        }
    </style>
</head>
<body>
    <div class="container">
        <h1><i class="fa-solid fa-chart-line"></i> Painel de Administração de Vendas</h1>
        
        <h2>Resumo do Dia (<?php echo date('d/m/Y'); ?>)</h2>
        <div class="resumo-grid">
            <div class="card">
                <h2>Total de Pedidos (Pendente)</h2>
                <p><?php echo isset($resumo_vendas['total_vendas']) ? $resumo_vendas['total_vendas'] : 0; ?></p>
            </div>
            <div class="card">
                <h2>Valor Total (Pendente)</h2>
                <p><?php echo formatar_moeda(isset($resumo_vendas['total_arrecadado']) ? $resumo_vendas['total_arrecadado'] : 0); ?></p>
            </div>
            <div class="card">
                <h2>Arrecadado em Dinheiro</h2>
                <p><?php echo formatar_moeda(isset($resumo_dinheiro['total_dinheiro']) ? $resumo_dinheiro['total_dinheiro'] : 0); ?></p>
            </div>
        </div>

        <h2 class="section-title"><i class="fa-solid fa-list-check"></i> Produtos Vendidos Hoje</h2>
        <?php if (mysqli_num_rows($res_produtos_vendidos) > 0): ?>
            <table>
                <thead>
                    <tr>
                        <th>Produto</th>
                        <th>Quantidade Total</th>
                    </tr>
                </thead>
                <tbody>
                    <?php while($row = mysqli_fetch_assoc($res_produtos_vendidos)): ?>
                        <tr>
                            <td><?php echo htmlspecialchars($row['produto_nome']); ?></td>
                            <td><?php echo $row['quantidade_total']; ?></td>
                        </tr>
                    <?php endwhile; ?>
                </tbody>
            </table>
        <?php else: ?>
            <div class="no-data">Nenhum produto vendido hoje.</div>
        <?php endif; ?>

        <h2 class="section-title"><i class="fa-solid fa-receipt"></i> Detalhes dos Pedidos do Dia</h2>
        <?php if (mysqli_num_rows($res_detalhes) > 0): ?>
            <table>
                <thead>
                    <tr>
                        <th>Hora</th>
                        <th>Produto</th>
                        <th>Qtd</th>
                        <th>Preço Unitário</th>
                        <th>Cliente</th>
                        <th>Telefone</th>
                        <th>Pagamento</th>
                    </tr>
                </thead>
                <tbody>
                    <?php while($row = mysqli_fetch_assoc($res_detalhes)): ?>
                        <tr>
                            <td><?php echo date('H:i:s', strtotime($row['data_venda'])); ?></td>
                            <td><?php echo htmlspecialchars($row['produto_nome']); ?></td>
                            <td><?php echo $row['quantidade']; ?></td>
                            <td><?php echo formatar_moeda($row['preco_unitario']); ?></td>
                            <td><?php echo htmlspecialchars($row['nome_cliente']); ?></td>
                            <td><?php echo htmlspecialchars($row['telefone_cliente']); ?></td>
                            <td><?php echo ucfirst(htmlspecialchars($row['metodo_pagamento'])); ?></td>
                        </tr>
                    <?php endwhile; ?>
                </tbody>
            </table>
        <?php else: ?>
            <div class="no-data">Nenhum pedido detalhado encontrado para hoje.</div>
        <?php endif; ?>
    </div>
</body>
</html>

