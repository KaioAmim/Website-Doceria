<?php
$servername = "localhost"; 
$username = "root";
$password = ""; 
$database = "bddoceria"; 

// Criar conexão
$conn = mysqli_connect($servername, $username, $password, $database);

// Checar conexão
if (!$conn) {
    die("Erro de Conexão com o Banco de Dados: " . mysqli_connect_error() . ". Por favor, verifique as credenciais em conn.php.");
}

mysqli_set_charset($conn, "utf8");

// Função de sanitização básica
function sanitizar($dado) {
    global $conn;
    // Remove tags HTML e PHP
    $dado = strip_tags($dado);
    // Remove barras invertidas
    $dado = stripslashes($dado);
    // Escapa caracteres especiais para uso em consultas SQL
    $dado = mysqli_real_escape_string($conn, $dado);
    return $dado;
}

// Função de validação de telefone
function validar_telefone($telefone) {
    // Remove caracteres não numéricos
    $telefone = preg_replace('/[^0-9]/', '', $telefone);
    return (strlen($telefone) >= 10 && strlen($telefone) <= 11);
}

// Função para formatar valores monetários
function formatar_moeda($valor) {
    $valor = floatval($valor);
    return "R$ " . number_format($valor, 2, ',', '.');
}

?>
