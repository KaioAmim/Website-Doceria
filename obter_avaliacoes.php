<?php
include 'conn.php';

header('Content-Type: application/json');

// 1. Obter e validar dados
$produto_nome = isset($_GET['produto_nome']) ? sanitizar($_GET['produto_nome']) : '';

if (empty($produto_nome)) {
    http_response_code(400);
    echo json_encode(['sucesso' => false, 'erro' => 'Nome do produto ausente.']);
    exit;
}

// 2. Buscar a média e o total de avaliações
$sql = "SELECT COALESCE(AVG(nota), 0) AS media_nota, COUNT(nota) AS total_votos FROM avaliacoes WHERE produto_nome = ?";
$stmt = mysqli_prepare($conn, $sql);

if (!$stmt) {
    http_response_code(500);
    echo json_encode(['sucesso' => false, 'erro' => 'Erro na preparação da consulta: ' . mysqli_error($conn)]);
    exit;
}

mysqli_stmt_bind_param($stmt, "s", $produto_nome);
mysqli_stmt_execute($stmt);
$resultado = mysqli_stmt_get_result($stmt);

if ($linha = mysqli_fetch_assoc($resultado)) {
    // 3. Retornar os dados
    $media_nota = round(floatval($linha['media_nota']), 1); // Arredonda para 1 casa decimal
    $total_votos = intval($linha['total_votos']);
    
    echo json_encode([
        'sucesso' => true,
        'media_nota' => $media_nota,
        'total_votos' => $total_votos
    ]);
} else {
    echo json_encode([
        'sucesso' => true,
        'media_nota' => 0.0,
        'total_votos' => 0
    ]);
}

mysqli_stmt_close($stmt);
?>
