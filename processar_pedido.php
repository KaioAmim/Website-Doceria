<?php
include 'conn.php';
//processar pedidos e enviar para WhatsApp

// Configurações
define('TAXA_ENTREGA', 7.00);
define('NUMERO_WHATSAPP', '5517992792100'); 



// Definir tipo de conteúdo
header('Content-Type: application/json');

// Verificar se a requisição é POST
if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
    http_response_code(405);
    echo json_encode(['erro' => 'Método não permitido']);
    exit;
}

// Obter dados do formulário
$nome = isset($_POST['nome']) ? sanitizar($_POST['nome']) : '';
$telefone = isset($_POST['telefone']) ? sanitizar($_POST['telefone']) : '';
$endereco = isset($_POST['endereco']) ? sanitizar($_POST['endereco']) : '';
$bairro = isset($_POST['bairro']) ? sanitizar($_POST['bairro']) : '';
$complemento = isset($_POST['complemento']) ? sanitizar($_POST['complemento']) : '';
$pagamento = isset($_POST['pagamento']) ? sanitizar($_POST['pagamento']) : '';
$troco = isset($_POST['troco']) ? sanitizar($_POST['troco']) : '';
$itens = isset($_POST['itens']) ? json_decode($_POST['itens'], true) : [];

// Validar campos obrigatórios
if (empty($nome) || empty($telefone) || empty($endereco) || empty($bairro) || empty($pagamento)) {
    http_response_code(400);
    echo json_encode(['erro' => 'Campos obrigatórios não preenchidos']);
    exit;
}

// Validar telefone
if (!validar_telefone($telefone)) {
    http_response_code(400);
    echo json_encode(['erro' => 'Telefone inválido']);
    exit;
}

// Validar itens
if (empty($itens)) {
    http_response_code(400);
    echo json_encode(['erro' => 'Carrinho vazio']);
    exit;
}

// Construir mensagem para WhatsApp
$mensagem = construir_mensagem($nome, $telefone, $endereco, $bairro, $complemento, $pagamento, $troco, $itens);

// Codificar mensagem para URL
$mensagem_codificada = urlencode($mensagem);

// Construir URL do WhatsApp
$url_whatsapp = "https://wa.me/" . NUMERO_WHATSAPP . "?text=" . $mensagem_codificada;

// Registrar pedido no banco de dados
$venda_id = registrar_pedido_bd($nome, $telefone, $endereco, $bairro, $complemento, $pagamento, $itens);

// Se o registro no BD falhar, ainda tentamos enviar para o WhatsApp
if ($venda_id === false) {
    registrar_pedido_arquivo($nome, $telefone, $endereco, $bairro, $complemento, $pagamento, $troco, $itens);
}

// Retornar resposta com sucesso
http_response_code(200);
echo json_encode([
    'sucesso' => true,
    'mensagem' => 'Pedido processado com sucesso',
    'url_whatsapp' => $url_whatsapp
]);



/**
 * Construir mensagem para WhatsApp
 */
function construir_mensagem($nome, $telefone, $endereco, $bairro, $complemento, $pagamento, $troco, $itens) {
    $mensagem = "*NOVO PEDIDO - CANTINHO DOCE DA DANI*\n\n";
    
    $mensagem .= "*DADOS DO CLIENTE:*\n";
    $mensagem .= "Nome: " . $nome . "\n";
    $mensagem .= "Telefone: " . $telefone . "\n";
    $mensagem .= "Endereço: " . $endereco . ", " . $bairro;
    if (!empty($complemento)) {
        $mensagem .= " - " . $complemento;
    }
    $mensagem .= "\n\n";
    
    $mensagem .= "*ITENS DO PEDIDO:*\n";
    $subtotal = 0;
    
    foreach ($itens as $index => $item) {
        $preco = floatval(str_replace('R$ ', '', $item['preco']));
        $quantidade = intval($item['quantidade']);
        $total_item = $preco * $quantidade;
        $subtotal += $total_item;
        
        $mensagem .= ($index + 1) . ". " . $item['nome'] . "\n";
        $mensagem .= "   Quantidade: " . $quantidade . "x\n";
        $mensagem .= "   Preço unitário: " . $item['preco'] . "\n";
        $mensagem .= "   Subtotal: R$ " . number_format($total_item, 2, ',', '.') . "\n\n";
    }
    
    $mensagem .= "*RESUMO FINANCEIRO:*\n";
    $mensagem .= "Subtotal: R$ " . number_format($subtotal, 2, ',', '.') . "\n";
    $mensagem .= "Taxa de Entrega: R$ " . number_format(TAXA_ENTREGA, 2, ',', '.') . "\n";
    
    $total = $subtotal + TAXA_ENTREGA;
    $mensagem .= "*TOTAL: R$ " . number_format($total, 2, ',', '.') . "*\n\n";
    
    $mensagem .= "*MÉTODO DE PAGAMENTO:*\n";
    if ($pagamento === 'pix') {
        $mensagem .= "PIX\n";
    } elseif ($pagamento === 'cartao') {
        $mensagem .= "Cartão de Crédito/Débito (na entrega)\n";
    } elseif ($pagamento === 'dinheiro') {
        $mensagem .= "Dinheiro";
        if (!empty($troco)) {
            $mensagem .= " (Troco para R$ " . number_format(floatval($troco), 2, ',', '.') . ")\n";
        } else {
            $mensagem .= "\n";
        }
    }
    
    return $mensagem;
}

/**
	 * Registrar pedido em arquivo
	 */
	function registrar_pedido_arquivo($nome, $telefone, $endereco, $bairro, $complemento, $pagamento, $troco, $itens) {
	    $arquivo_pedidos = __DIR__ . '/pedidos_fallback.log';
	    
	    $pedido = [
	        'data' => date('Y-m-d H:i:s'),
	        'nome' => $nome,
	        'telefone' => $telefone,
	        'endereco' => $endereco,
	        'bairro' => $bairro,
	        'complemento' => $complemento,
	        'pagamento' => $pagamento,
	        'troco' => $troco,
	        'itens' => $itens
	    ];
	    
	    $linha_pedido = json_encode($pedido, JSON_UNESCAPED_UNICODE) . "\n";
	    
	    // Registrar em arquivo (criar se não existir)
	    if (!file_exists($arquivo_pedidos)) {
	        file_put_contents($arquivo_pedidos, '');
	        chmod($arquivo_pedidos, 0666);
	    }
	    
	    file_put_contents($arquivo_pedidos, $linha_pedido, FILE_APPEND);
	}

	/**
	 * Registrar pedido no banco de dados (tabelas vendas e itens_venda)
	 * Retorna o ID da venda ou false em caso de falha.
	 */
	function registrar_pedido_bd($nome, $telefone, $endereco, $bairro, $complemento, $pagamento, $itens) {
global $conn;
		    if (!$conn) {
		        // Em caso de erro de conexão, retorna false
		        error_log("Erro de conexão com o BD em processar_pedido.php: " . mysqli_connect_error());
		        return false;
		    }

	    // 1. Calcular o valor total
	    $subtotal = 0;
	    foreach ($itens as $item) {
	        $preco = floatval(str_replace('R$ ', '', $item['preco']));
	        $subtotal += $preco * $item['quantidade'];
	    }
	    $total = $subtotal + TAXA_ENTREGA;

	    // 2. Inserir na tabela 'vendas'
	    $stmt_venda = mysqli_prepare($conn, "INSERT INTO vendas (nome_cliente, telefone_cliente, endereco_entrega, bairro, complemento, metodo_pagamento, valor_total, status_venda) VALUES (?, ?, ?, ?, ?, ?, ?, 'Pendente')");
	    mysqli_stmt_bind_param($stmt_venda, "ssssssd", $nome, $telefone, $endereco, $bairro, $complemento, $pagamento, $total);

	    if (!mysqli_stmt_execute($stmt_venda)) {
	        error_log("Erro ao inserir venda: " . mysqli_stmt_error($stmt_venda));
	        mysqli_stmt_close($stmt_venda);
	        
	        return false;
	    }

	    $venda_id = mysqli_insert_id($conn);
	    mysqli_stmt_close($stmt_venda);

	    // 3. Inserir na tabela 'itens_venda'
	    $stmt_item = mysqli_prepare($conn, "INSERT INTO itens_venda (venda_id, produto_nome, quantidade, preco_unitario) VALUES (?, ?, ?, ?)");

	    foreach ($itens as $item) {
	        $preco = floatval(str_replace('R$ ', '', $item['preco']));
	        $quantidade = intval($item['quantidade']);
	        $produto_nome = sanitizar($item['nome']);
	        
	        mysqli_stmt_bind_param($stmt_item, "isid", $venda_id, $produto_nome, $quantidade, $preco);
	        mysqli_stmt_execute($stmt_item);
	    }

	    mysqli_stmt_close($stmt_item);
	    
	    
	    return $venda_id;
	}

?>
