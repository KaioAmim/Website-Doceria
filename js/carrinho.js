// ============================================
// CARRINHO.JS
// Lógica de manipulação do carrinho de compras
// ============================================

const TAXA_ENTREGA = 7.00;

// Inicializar carrinho quando a página carrinho.html é carregada
document.addEventListener('DOMContentLoaded', function() {
    if (window.location.pathname.includes('carrinho.html')) {
        inicializarCarrinho();
        configurarFormularioCheckout();
    }
});

// Inicializar a página do carrinho
function inicializarCarrinho() {
    exibirItensCarrinho();
    atualizarResumo();
    aplicarMascaraTelefoneNoInput();
}

// Exibir itens do carrinho
function exibirItensCarrinho() {
    const listaItens = document.getElementById('lista-itens-carrinho');
    const carrinho = obterCarrinho();

    if (carrinho.length === 0) {
        listaItens.innerHTML = '<p class="carrinho-vazio-msg">Seu carrinho está vazio. Adicione algumas delícias!</p>';
        return;
    }

    let html = '';
    carrinho.forEach((item, index) => {
        html += '<div class="item-carrinho">';
        html += '<div class="item-info">';
        
        // Adicionar imagem do produto
        if (item.imagem) {
            html += '<img src="' + item.imagem + '" alt="' + item.nome + '">';
        }
        
        html += '<div class="item-detalhes">';
        html += '<h4>' + item.nome + '</h4>';
        html += '<p>' + item.preco + '</p>';
        html += '</div>';
        html += '</div>';
        
        html += '<div class="item-quantidade">';
        html += '<button type="button" onclick="diminuirQuantidade(' + index + ')">-</button>';
        html += '<input type="number" value="' + item.quantidade + '" min="1" onchange="atualizarQuantidade(' + index + ', this.value)">';
        html += '<button type="button" onclick="aumentarQuantidade(' + index + ')">+</button>';
        html += '</div>';
        
        const precoUnitario = parseFloat(item.preco.replace('R$ ', '').replace(',', '.'));
        const totalItem = (precoUnitario * item.quantidade).toFixed(2).replace('.', ',');
        html += '<div class="item-preco">R$ ' + totalItem + '</div>';
        html += '<button type="button" class="remover-item" onclick="removerDoCarrinho(' + index + ')">';
        html += '<i class="fa-solid fa-trash"></i>';
        html += '</button>';
        html += '</div>';
    });

    listaItens.innerHTML = html;
}

// Atualizar resumo do pedido
function atualizarResumo() {
    const carrinho = obterCarrinho();
    let subtotal = 0;

    carrinho.forEach(item => {
        // O preço vem como "R$ 29,99". Precisamos remover "R$ ", trocar a vírgula por ponto e converter para float.
        const precoString = item.preco.replace('R$ ', '').replace(',', '.');
        const preco = parseFloat(precoString);
        
        // Adiciona o valor do item ao subtotal
        subtotal += preco * item.quantidade;
    });
    
    // Arredondar o subtotal para duas casas decimais após a soma para evitar imprecisão de ponto flutuante
    subtotal = parseFloat(subtotal.toFixed(2));

    const total = subtotal + TAXA_ENTREGA;

    document.getElementById('subtotal-valor').textContent = 'R$ ' + subtotal.toFixed(2).replace('.', ',');
    document.getElementById('total-valor').textContent = 'R$ ' + total.toFixed(2).replace('.', ',');
}

// Aumentar quantidade
function aumentarQuantidade(index) {
    const carrinho = obterCarrinho();
    if (carrinho[index]) {
        carrinho[index].quantidade += 1;
        salvarCarrinho(carrinho);
        exibirItensCarrinho();
        atualizarResumo();
    }
}

// Diminuir quantidade
function diminuirQuantidade(index) {
    const carrinho = obterCarrinho();
    if (carrinho[index] && carrinho[index].quantidade > 1) {
        carrinho[index].quantidade -= 1;
        salvarCarrinho(carrinho);
        exibirItensCarrinho();
        atualizarResumo();
    }
}

// Atualizar quantidade manualmente
function atualizarQuantidade(index, novaQuantidade) {
    const carrinho = obterCarrinho();
    const quantidade = parseInt(novaQuantidade);
    
    if (carrinho[index] && quantidade > 0) {
        carrinho[index].quantidade = quantidade;
        salvarCarrinho(carrinho);
        exibirItensCarrinho();
        atualizarResumo();
    }
}

// Remover item do carrinho
function removerDoCarrinho(index) {
    const carrinho = obterCarrinho();
    carrinho.splice(index, 1);
    salvarCarrinho(carrinho);
    exibirItensCarrinho();
    atualizarResumo();
    atualizarBadgeCarrinho();
}

// Obter carrinho do localStorage
function obterCarrinho() {
    const carrinho = localStorage.getItem('carrinho');
    return carrinho ? JSON.parse(carrinho) : [];
}

// Salvar carrinho no localStorage
function salvarCarrinho(carrinho) {
    localStorage.setItem('carrinho', JSON.stringify(carrinho));
}

// Configurar formulário de checkout
function configurarFormularioCheckout() {
    const form = document.getElementById('checkout-form');
    const radiosPagamento = document.querySelectorAll('input[name="pagamento"]');
    
    // Aplicar máscara de telefone no input
    aplicarMascaraTelefoneNoInput();
    const trocoGroup = document.getElementById('troco-group');
    const pixArea = document.getElementById('pix-area');

    // Mostrar/ocultar campo de troco quando selecionar "Dinheiro" e área PIX
    radiosPagamento.forEach(radio => {
        radio.addEventListener('change', function() {
            if (this.value === 'dinheiro') {
                trocoGroup.style.display = 'block';
                pixArea.style.display = 'none';
            } else if (this.value === 'pix') {
                trocoGroup.style.display = 'none';
                pixArea.style.display = 'block';
                gerarQRCodePix();
            } else {
                trocoGroup.style.display = 'none';
                pixArea.style.display = 'none';
            }
        });
    });

    // Configurar botão de copiar chave PIX
    const copiarPixBtn = document.getElementById('copiar-pix');
    if (copiarPixBtn) {
        copiarPixBtn.addEventListener('click', function() {
            const pixChave = document.getElementById('pix-chave');
            pixChave.select();
            document.execCommand('copy');
            
            // Feedback visual
            this.innerHTML = '<i class="fa-solid fa-check"></i> Copiado!';
            setTimeout(() => {
                this.innerHTML = '<i class="fa-solid fa-copy"></i> Copiar';
            }, 2000);
        });
    }

    // Enviar formulário
    form.addEventListener('submit', function(e) {
        e.preventDefault();
        enviarPedidoParaWhatsApp();
    });
}

// Gerar QR Code PIX
function gerarQRCodePix() {
    const carrinho = obterCarrinho();
    let subtotal = 0;

    carrinho.forEach(item => {
        // O preço vem como "R$ 29,99". Precisamos remover "R$ ", trocar a vírgula por ponto e converter para float.
        const precoString = item.preco.replace('R$ ', '').replace(',', '.');
        const preco = parseFloat(precoString);
        
        // Adiciona o valor do item ao subtotal
        subtotal += preco * item.quantidade;
    });
    
    // Arredondar o subtotal para duas casas decimais após a soma para evitar imprecisão de ponto flutuante
    subtotal = parseFloat(subtotal.toFixed(2));

    const total = subtotal + TAXA_ENTREGA;
    
    // Atualizar valor total no PIX
    document.getElementById('pix-valor-total').textContent = 'R$ ' + total.toFixed(2).replace('.', ',');
    
    // ============================================
    // CONFIGURAÇÕES DO PIX - ALTERE AQUI
    // ============================================
    const chavePix = '0733e2e3-4665-4986-9f8e-48c7d26b3270'; // Chave PIX Aleatória
    const nomeBeneficiario = 'Kaio Fernando Amim Nunes'; // Nome que aparecerá no PIX
    const cidade = 'SAO PAULO'; // Cidade do beneficiário
    // ============================================
    
    // Gerar código PIX Copia e Cola (BR Code) válido
    const codigoPix = gerarCodigoPix(
        limparChavePix(chavePix),
        nomeBeneficiario,
        total,
        cidade,
        'PEDIDO' + Date.now().toString().slice(-6) // Identificador único
    );
    
    // Exibir código PIX no campo
    document.getElementById('pix-chave').value = codigoPix;
    
    // Gerar QR Code com o código PIX válido
    const qrcodeContainer = document.getElementById('qrcode');
    qrcodeContainer.innerHTML = ''; // Limpar QR Code anterior
    
    new QRCode(qrcodeContainer, {
        text: codigoPix,
        width: 200,
        height: 200,
        colorDark: '#000000',
        colorLight: '#ffffff',
        correctLevel: QRCode.CorrectLevel.M
    });
}

// Enviar pedido para WhatsApp
function enviarPedidoParaWhatsApp() {
    const carrinho = obterCarrinho();

    // Validar se o carrinho não está vazio
    if (carrinho.length === 0) {
        alert('Seu carrinho está vazio!');
        return;
    }

    // Obter dados do formulário
    const nome = document.getElementById('nome').value;
    const telefone = document.getElementById('telefone').value;
    const endereco = document.getElementById('endereco').value;
    const bairro = document.getElementById('bairro').value;
    const complemento = document.getElementById('complemento').value;
    const pagamento = document.querySelector('input[name="pagamento"]:checked').value;
    const troco = document.getElementById('troco').value;

    // Validar campos obrigatórios
    if (!nome || !telefone || !endereco || !bairro || !pagamento) {
        alert('Por favor, preencha todos os campos obrigatórios!');
        return;
    }

    // Preparar dados para envio
    const formData = new FormData();
    formData.append('nome', nome);
    formData.append('telefone', telefone);
    formData.append('endereco', endereco);
    formData.append('bairro', bairro);
    formData.append('complemento', complemento);
    formData.append('pagamento', pagamento);
    formData.append('troco', troco);
    formData.append('itens', JSON.stringify(carrinho));

    // Enviar para o backend PHP
    fetch('processar_pedido.php', {
        method: 'POST',
        body: formData
    })
    .then(response => response.json())
    .then(data => {
        if (data.sucesso) {
            // Redirecionar para WhatsApp
            window.open(data.url_whatsapp, '_blank');
            
            // Limpar carrinho após envio (opcional)
            // salvarCarrinho([]);
            // exibirItensCarrinho();
            // atualizarResumo();
            // alert('Pedido enviado com sucesso!');
        } else {
            alert('Erro ao processar pedido: ' + (data.erro || 'Erro desconhecido'));
        }
    })
    .catch(error => {
        console.error('Erro:', error);
        alert('Erro ao enviar pedido. Tente novamente.');
    });
}

// ============================================
// MÁSCARA DE TELEFONE
// ============================================
function aplicarMascaraTelefoneNoInput() {
    const telefoneInput = document.getElementById('telefone');
    if (telefoneInput) {
        telefoneInput.addEventListener('input', function() {
            let value = this.value.replace(/\D/g, ''); // Remove tudo que não é dígito
            let formattedValue = '';

            if (value.length > 0) {
                formattedValue += '(' + value.substring(0, 2);
            }
            if (value.length > 2) {
                formattedValue += ') ' + value.substring(2, 7);
            }
            if (value.length > 7) {
                formattedValue += '-' + value.substring(7, 11);
            }

            this.value = formattedValue;
        });
    }
}

// Atualizar badge do carrinho
function atualizarBadgeCarrinho() {
    const carrinho = obterCarrinho();
    const badge = document.querySelector('.cart-badge');
    if (badge) {
        const totalItens = carrinho.reduce((total, item) => total + item.quantidade, 0);
        badge.textContent = totalItens;
    }
}
