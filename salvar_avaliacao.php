<?php
//receber e processar as avaliações dos produtos

include 'conn.php';

header('Content-Type: application/json');

// 1. Verificar se a requisição é POST
if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
    http_response_code(405);
    echo json_encode(['sucesso' => false, 'erro' => 'Método não permitido']);
    exit;
}

// 2. Obter e validar dados
$produto_nome = isset($_POST['produto_nome']) ? sanitizar($_POST['produto_nome']) : '';
$nota = isset($_POST['nota']) ? intval($_POST['nota']) : 0;

if (empty($produto_nome) || $nota < 1 || $nota > 5) {
    http_response_code(400);
    echo json_encode(['sucesso' => false, 'erro' => 'Dados inválidos. Nome do produto ou nota ausente/inválida.']);
    exit;
}

// A conexão $conn é estabelecida via include 'conn.php'; na linha 4.
if (!$conn) {
    http_response_code(500);
    echo json_encode(['sucesso' => false, 'erro' => 'Erro de conexão com o banco de dados: ' . mysqli_connect_error()]);
    exit;
}

// 4. Inserir a avaliação no banco de dados
$stmt = mysqli_prepare($conn, "INSERT INTO avaliacoes (produto_nome, nota) VALUES (?, ?)");
mysqli_stmt_bind_param($stmt, "si", $produto_nome, $nota);

if (mysqli_stmt_execute($stmt)) {
    echo json_encode(['sucesso' => true, 'mensagem' => 'Avaliação salva com sucesso!']);
} else {
    http_response_code(500);
    echo json_encode(['sucesso' => false, 'erro' => 'Erro ao salvar avaliação: ' . mysqli_stmt_error($stmt)]);
}

mysqli_stmt_close($stmt);



?>
