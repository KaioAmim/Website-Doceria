
// Variáveis globais
let carrinho = [];
let paginaAtual = window.location.pathname.split('/').pop() || 'index.html';
let modalProdutoNome = ''; // Variável global para armazenar o nome do produto atualmente visualizado

// 1. INICIALIZAÇÃO
document.addEventListener('DOMContentLoaded', function() {
    inicializarPagina();
    carregarCarrinho();
    configurarEventos();
});

function inicializarPagina() {
    // Determinar qual página está sendo exibida
    if (paginaAtual.includes('sobre')) {
        inicializarSobre();
    } else if (paginaAtual.includes('contato')) {
        inicializarContato();
    } else if (paginaAtual.includes('produtos')) {
        inicializarProdutos();
    } else {
        inicializarHome();
    }
}

function configurarEventos() {
    // Smooth scroll para links âncora
    document.querySelectorAll('a[href^="#"]').forEach(link => {
        link.addEventListener('click', function(e) {
            const href = this.getAttribute('href');
            if (href !== '#' && href !== '#carrinho') {
                e.preventDefault();
                const target = document.querySelector(href);
                if (target) {
                    target.scrollIntoView({ behavior: 'smooth' });
                }
            }
        });
    });

    // Atualizar badge do carrinho
    atualizarBadgeCarrinho();

    // Adicionar efeito de scroll na navbar
    window.addEventListener('scroll', function() {
        const navbar = document.querySelector('.navbar');
        if (window.scrollY > 50) {
            navbar.style.boxShadow = '0 8px 32px rgba(0,0,0,0.16)';
        } else {
            navbar.style.boxShadow = '0 4px 16px rgba(0,0,0,0.12)';
        }
    });
}

function inicializarHome() {
    // Animar números de estatísticas
    const stats = document.querySelectorAll('.stat-number');
    const observer = new IntersectionObserver((entries) => {
        entries.forEach(entry => {
            if (entry.isIntersecting) {
                animarNumero(entry.target);
                observer.unobserve(entry.target);
            }
        });
    });

    stats.forEach(stat => observer.observe(stat));

    // Adicionar interação aos cards de destaques
    const destaqueCards = document.querySelectorAll('.destaque-card');
    destaqueCards.forEach(card => {
        card.addEventListener('mouseenter', function() {
            this.style.transform = 'translateY(-10px) scale(1.02)';
        });
        card.addEventListener('mouseleave', function() {
            this.style.transform = 'translateY(0) scale(1)';
        });
    });
}

function animarNumero(elemento) {
    const numero = parseInt(elemento.textContent);
    const duracao = 1000;
    const incremento = numero / (duracao / 16);
    let atual = 0;

    const intervalo = setInterval(() => {
        atual += incremento;
        if (atual >= numero) {
            elemento.textContent = numero + '+';
            clearInterval(intervalo);
        } else {
            elemento.textContent = Math.floor(atual) + '+';
        }
    }, 16);
}

// ============================================
// 4. PÁGINA PRODUTOS
// ============================================
function inicializarProdutos() {
    // Configurar filtros
    const filtros = document.querySelectorAll('.filtro-btn');
    filtros.forEach(btn => {
        btn.addEventListener('click', function() {
            // Remover classe active de todos os botões
            filtros.forEach(b => b.classList.remove('active'));
            // Adicionar classe active ao botão clicado
            this.classList.add('active');

            // Filtrar produtos
            const categoria = this.getAttribute('data-filter');
            filtrarProdutos(categoria);
        });
    });

    // Adicionar interação aos botões de adicionar ao carrinho
    const addCartBtns = document.querySelectorAll('.add-cart-btn');
    addCartBtns.forEach(btn => {
        btn.addEventListener('click', function(e) {
            e.preventDefault();
            const card = this.closest('.produto-card');
            const nome = card.querySelector('h3').textContent;
            const preco = card.querySelector('.price-value').textContent;
            const imagem = card.querySelector('.produto-image img').getAttribute('src');

            adicionarAoCarrinho(nome, preco, imagem);
            
            // Efeito visual
            this.style.transform = 'scale(1.2)';
            setTimeout(() => {
                this.style.transform = 'scale(1)';
            }, 200);
        });
    });

    // Adicionar interação aos botões de visualizar
    const quickViewBtns = document.querySelectorAll('.quick-view-btn');
    quickViewBtns.forEach(btn => {
        btn.addEventListener('click', function(e) {
            e.preventDefault();
            const card = this.closest('.produto-card');
            const nome = card.querySelector('h3').textContent;
            const descricao = card.querySelector('p').textContent;
            const preco = card.querySelector('.price-value').textContent;
            const imagem = card.querySelector('.produto-image img').getAttribute('src');

            mostrarDetalhes(nome, descricao, preco, imagem);
        });
    });

    // Criar modal de visualização se não existir
    criarModalVisualizacao();

    // Carregar avaliações iniciais
    carregarTodasAvaliacoes();
}

function filtrarProdutos(categoria) {
    const produtos = document.querySelectorAll('.produto-card');
    
    produtos.forEach(produto => {
        if (categoria === 'todos' || produto.getAttribute('data-categoria') === categoria) {
            produto.style.display = 'block';
            produto.style.animation = 'fadeIn 0.6s ease-out';
        } else {
            produto.style.display = 'none';
        }
    });
}

function criarModalVisualizacao() {
    // Verificar se o modal já existe
    if (document.getElementById('modal-visualizacao')) {
        return;
    }

    const modal = document.createElement('div');
    modal.id = 'modal-visualizacao';
    modal.className = 'modal-visualizacao';
    modal.innerHTML = `
        <div class="modal-content-visualizacao">
            <span class="modal-close">&times;</span>
            <img id="modal-imagem" src="" alt="">
            <div class="modal-info">
                <h2 id="modal-nome"></h2>
		                <div id="modal-rating-display" class="produto-rating">
		                    <!-- As estrelas serão preenchidas dinamicamente -->
		                </div>
	                <p id="modal-descricao"></p>
	                <div class="rating-summary">
	                    <p>Avaliação Média: <span id="avg-rating-value">0.0</span> (<span id="total-votes-value">0</span> votos)</p>
	                </div>
                <div class="modal-preco">
                    <span class="price-label">A partir de</span>
                    <span id="modal-preco-valor" class="price-value"></span>
                </div>
                <div class="rating-container">
	                    <h3>Avalie este Produto</h3>
	                    <div class="star-rating" id="star-rating-form">
	                        <input type="radio" id="star5" name="rating" value="5" /><label for="star5" title="5 estrelas">5 <i class="fa-solid fa-star"></i></label>
	                        <input type="radio" id="star4" name="rating" value="4" /><label for="star4" title="4 estrelas">4 <i class="fa-solid fa-star"></i></label>
	                        <input type="radio" id="star3" name="rating" value="3" /><label for="star3" title="3 estrelas">3 <i class="fa-solid fa-star"></i></label>
	                        <input type="radio" id="star2" name="rating" value="2" /><label for="star2" title="2 estrelas">2 <i class="fa-solid fa-star"></i></label>
	                        <input type="radio" id="star1" name="rating" value="1" /><label for="star1" title="1 estrela">1 <i class="fa-solid fa-star"></i></label>
	                    </div>
	                    <button id="btn-enviar-avaliacao" class="btn-avaliar">
	                        <i class="fa-solid fa-paper-plane"></i> Enviar Avaliação
	                    </button>
	                    <p id="rating-message" class="rating-message" style="display: none;"></p>
	                </div>
	                <button id="modal-add-cart" class="btn-add-cart-modal">
                    <i class="fa-solid fa-cart-plus"></i> Adicionar ao Carrinho
                </button>
            </div>
        </div>
    `;
    document.body.appendChild(modal);

    // Fechar modal ao clicar no X
    const closeBtn = modal.querySelector('.modal-close');
    closeBtn.addEventListener('click', function() {
        modal.style.display = 'none';
    });

    // Fechar modal ao clicar fora do conteúdo
    modal.addEventListener('click', function(e) {
        if (e.target === modal) {
            modal.style.display = 'none';
        }
    });
}

function mostrarDetalhes(nome, descricao, preco, imagem) {
    // Armazenar o nome do produto atualmente visualizado para uso na avaliação
    modalProdutoNome = nome;
    const modal = document.getElementById('modal-visualizacao');
    if (!modal) return;

    // Preencher dados do modal
    document.getElementById('modal-imagem').src = imagem;
    document.getElementById('modal-imagem').alt = nome;
    document.getElementById('modal-nome').textContent = nome;
    document.getElementById('modal-descricao').textContent = descricao;
    document.getElementById('modal-preco-valor').textContent = preco;

// Configurar botão de adicionar ao carrinho
	    const addCartBtn = document.getElementById('modal-add-cart');
	    addCartBtn.onclick = function() {
	        adicionarAoCarrinho(nome, preco, imagem);
	        modal.style.display = 'none';
	    };

	    	// Carregar avaliação do produto no modal
		    carregarAvaliacaoProduto(nome);

		    // Configurar botão de enviar avaliação
		    const enviarAvaliacaoBtn = document.getElementById("btn-enviar-avaliacao");    enviarAvaliacaoBtn.onclick = function() {
	        enviarAvaliacao(nome);
	    };

	    // Limpar seleção de estrelas e mensagem de avaliação ao abrir o modal
	    document.querySelectorAll('#star-rating-form input').forEach(radio => radio.checked = false);
	    document.getElementById('rating-message').style.display = 'none';

    // Exibir modal
    modal.style.display = 'flex';
}

// ============================================
// 5. PÁGINA SOBRE
// ============================================
function inicializarSobre() {
    // Expandir cards de valores ao clicar
    const valorCards = document.querySelectorAll('.valor-card');
    valorCards.forEach(card => {
        card.addEventListener('click', function() {
            // Remover classe expanded de todos os cards
            valorCards.forEach(c => c.classList.remove('expanded'));
            // Adicionar classe expanded ao card clicado
            this.classList.add('expanded');
        });
    });

    // Animar timeline ao scroll
    const timelineItems = document.querySelectorAll('.timeline-item');
    const timelineObserver = new IntersectionObserver((entries) => {
        entries.forEach(entry => {
            if (entry.isIntersecting) {
                entry.target.style.opacity = '1';
                entry.target.style.transform = 'translateY(0)';
            }
        });
    });

    timelineItems.forEach(item => {
        item.style.opacity = '0';
        item.style.transform = 'translateY(20px)';
        timelineObserver.observe(item);
    });

    // Animar depoimentos ao scroll
    const depoimentos = document.querySelectorAll('.depoimento-card');
    const depoimentoObserver = new IntersectionObserver((entries) => {
        entries.forEach((entry, index) => {
            if (entry.isIntersecting) {
                setTimeout(() => {
                    entry.target.style.opacity = '1';
                    entry.target.style.transform = 'translateY(0)';
                }, index * 100);
            }
        });
    });

    depoimentos.forEach(depo => {
        depo.style.opacity = '0';
        depo.style.transform = 'translateY(20px)';
        depoimentoObserver.observe(depo);
    });
}

// ============================================
// 5. AVALIAÇÕES (NOVO)
// ============================================

function carregarAvaliacaoProduto(nomeProduto) {
    fetch(`obter_avaliacoes.php?produto_nome=${encodeURIComponent(nomeProduto)}`)
        .then(response => response.json())
        .then(data => {
            if (data.sucesso) {
                atualizarVisualizacaoAvaliacao(data.media_nota, data.total_votos);
            } else {
                console.error('Erro ao carregar avaliação:', data.erro);
                atualizarVisualizacaoAvaliacao(0, 0);
            }
        })
        .catch(error => {
            console.error('Erro na requisição de avaliação:', error);
            atualizarVisualizacaoAvaliacao(0, 0);
        });
}

function enviarAvaliacao(nomeProduto, nota) {
    const ratingMessage = document.getElementById('rating-message');
    ratingMessage.style.display = 'block';
    ratingMessage.style.color = 'blue';
    ratingMessage.textContent = 'Enviando avaliação...';

    const formData = new FormData();
    formData.append('produto_nome', nomeProduto);
    formData.append('nota', nota);

    fetch('salvar_avaliacao.php', {
        method: 'POST',
        body: formData
    })
    .then(response => response.json())
    .then(data => {
        if (data.sucesso) {
            ratingMessage.style.color = 'green';
            ratingMessage.textContent = data.mensagem;
            carregarAvaliacaoProduto(nomeProduto); // Recarrega a avaliação no modal
            carregarTodasAvaliacoes(); // Recarrega todas as avaliações nos cards
        } else {
            ratingMessage.style.color = 'red';
            ratingMessage.textContent = 'Erro: ' + data.erro;
        }
    })
    .catch(error => {
        ratingMessage.style.color = 'red';
        ratingMessage.textContent = 'Erro de rede ao enviar avaliação.';
        console.error('Erro:', error);
    });
}

function carregarTodasAvaliacoes() {
    const produtos = document.querySelectorAll('.produto-card');
    produtos.forEach(card => {
        const nomeProduto = card.querySelector('h3').textContent;
        const ratingElement = card.querySelector('.produto-rating');

        fetch(`obter_avaliacoes.php?produto_nome=${encodeURIComponent(nomeProduto)}`)
            .then(response => response.json())
            .then(data => {
                if (data.sucesso) {
                    ratingElement.innerHTML = gerarEstrelasHTML(data.media_nota) + `<span>(${data.total_votos})</span>`;
                } else {
                    ratingElement.innerHTML = gerarEstrelasHTML(0) + `<span>(0)</span>`;
                }
            })
            .catch(error => {
                console.error(`Erro ao carregar avaliação para ${nomeProduto}:`, error);
                ratingElement.innerHTML = gerarEstrelasHTML(0) + `<span>(0)</span>`;
            });
    });
}

function atualizarVisualizacaoAvaliacao(media, totalVotos) {
    document.getElementById('avg-rating-value').textContent = media.toFixed(1);
    document.getElementById('total-votes-value').textContent = totalVotos;

    const ratingDisplay = document.getElementById('modal-rating-display');
    ratingDisplay.innerHTML = gerarEstrelasHTML(media) + `<span>(${media.toFixed(1)})</span>`;
}

function gerarEstrelasHTML(media) {
    let html = '';
    const notaArredondada = Math.round(media * 2) / 2;

    for (let i = 1; i <= 5; i++) {
        if (i <= notaArredondada) {
            html += '<i class="fa-solid fa-star"></i>';
        } else if (i - 0.5 === notaArredondada) {
            html += '<i class="fa-solid fa-star-half-stroke"></i>';
        } else {
            html += '<i class="fa-regular fa-star"></i>';
        }
    }
    return html;
}

// ============================================
// 6. PÁGINA CARRINHO
// ============================================
function inicializarContato() {
    // Configurar formulário
    const form = document.getElementById('contactForm');
    if (form) {
        // Aplicar máscara de telefone
        const telefoneInput = document.getElementById('telefone');
        if (telefoneInput) {
            telefoneInput.addEventListener('input', function() {
                aplicarMascaraTelefone(this);
            });
        }

        form.addEventListener('submit', function(e) {
            e.preventDefault();
            validarEEnviarFormulario();
        });

        // Validação em tempo real
        const inputs = form.querySelectorAll('input, select, textarea');
        inputs.forEach(input => {
            input.addEventListener('blur', function() {
                validarCampo(this);
            });
        });
    }

    // Configurar FAQ
    const faqQuestions = document.querySelectorAll('.faq-question');
    faqQuestions.forEach(question => {
        question.addEventListener('click', function() {
            const faqItem = this.closest('.faq-item');
            
            // Fechar outros itens
            document.querySelectorAll('.faq-item').forEach(item => {
                if (item !== faqItem) {
                    item.classList.remove('active');
                }
            });

            // Alternar item atual
            faqItem.classList.toggle('active');
        });
    });
}

// ============================================
// 7. VALIDAÇÃO DE FORMULÁRIO
// ============================================
function validarCampo(campo) {
    const formGroup = campo.closest('.form-group');
    const errorMessage = formGroup.querySelector('.error-message');
    let isValid = true;
    let mensagem = '';

    if (campo.id === 'nome') {
        if (campo.value.trim().length < 3) {
            isValid = false;
            mensagem = 'Nome deve ter pelo menos 3 caracteres';
        }
    } else if (campo.id === 'email') {
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        if (!emailRegex.test(campo.value)) {
            isValid = false;
            mensagem = 'Email inválido';
        }
    } else if (campo.id === 'telefone') {
        if (campo.value && campo.value.length < 10) {
            isValid = false;
            mensagem = 'Telefone inválido';
        }
    } else if (campo.id === 'assunto') {
        if (!campo.value) {
            isValid = false;
            mensagem = 'Selecione um assunto';
        }
    } else if (campo.id === 'mensagem') {
        if (campo.value.trim().length < 10) {
            isValid = false;
            mensagem = 'Mensagem deve ter pelo menos 10 caracteres';
        }
    }

    if (isValid) {
        formGroup.classList.remove('error');
        errorMessage.textContent = '';
    } else {
        formGroup.classList.add('error');
        errorMessage.textContent = mensagem;
    }

    return isValid;
}

function validarEEnviarFormulario() {
    const form = document.getElementById('contactForm');
    const campos = form.querySelectorAll('input, select, textarea');
    let todosValidos = true;

    campos.forEach(campo => {
        if (!validarCampo(campo)) {
            todosValidos = false;
        }
    });

    if (todosValidos) {
// Enviar para o WhatsApp
	        const nome = document.getElementById('nome').value;
	        const email = document.getElementById('email').value;
	        const telefone = document.getElementById('telefone').value;
	        const assunto = document.getElementById('assunto').value;
	        const mensagem = document.getElementById('mensagem').value;

	        const textoMensagem = `*Nova Mensagem de Contato - Cantinho Doce da Dani*\n\n` +
	                             `*Nome:* ${nome}\n` +
	                             `*Telefone:* ${telefone}\n` +
	                             `*Email:* ${email}\n` +
	                             `*Assunto:* ${assunto}\n\n` +
	                             `*Mensagem:*\n${mensagem}`;

	        const numeroWhatsApp = '5517992792100';
	        const urlWhatsApp = `https://wa.me/${numeroWhatsApp}?text=${encodeURIComponent(textoMensagem)}`;

	        window.open(urlWhatsApp, '_blank');

	        const formMessage = document.getElementById('formMessage');
	        formMessage.className = 'form-message success';
	        formMessage.textContent = '✓ Mensagem enviada com sucesso! Você será redirecionado para o WhatsApp.';
	        formMessage.style.display = 'block';

	        // Limpar formulário
	        form.reset();

	        // Remover mensagem após 5 segundos
	        setTimeout(() => {
	            formMessage.style.display = 'none';
	        }, 5000);
    }
}

// ============================================
	// 8. SISTEMA DE AVALIAÇÃO
	// ============================================

	function enviarAvaliacao(produtoNome) {
	    const notaElement = document.querySelector('#star-rating-form input:checked');
	    const ratingMessage = document.getElementById('rating-message');

	    if (!notaElement) {
	        ratingMessage.textContent = 'Por favor, selecione uma nota de 1 a 5.';
	        ratingMessage.style.color = '#dc3545';
	        ratingMessage.style.display = 'block';
	        return;
	    }

	    const nota = notaElement.value;
	    const formData = new FormData();
	    formData.append('produto_nome', produtoNome);
	    formData.append('nota', nota);

	    // Enviar para o backend PHP
	    fetch('salvar_avaliacao.php', {
	        method: 'POST',
	        body: formData
	    })
	    .then(response => response.json())
	    .then(data => {
	        if (data.sucesso) {
	            ratingMessage.textContent = '✓ Avaliação enviada com sucesso! Obrigado!';
	            ratingMessage.style.color = '#28a745';
	            document.querySelectorAll('#star-rating-form input').forEach(radio => radio.checked = false); // Limpa a seleção
	        } else {
	            ratingMessage.textContent = 'Erro ao enviar avaliação: ' + (data.erro || 'Erro desconhecido');
	            ratingMessage.style.color = '#dc3545';
	        }
	        ratingMessage.style.display = 'block';
	        
	        // Ocultar mensagem após 5 segundos
	        setTimeout(() => {
	            ratingMessage.style.display = 'none';
	        }, 5000);
	    })
		    .catch(error => {
		        console.error('Erro:', error);
		        ratingMessage.textContent = 'Erro de conexão ao enviar avaliação. Tente novamente.';
		        ratingMessage.style.color = '#dc3545';
		        ratingMessage.style.display = 'block';
		    });
		}

		// ============================================
		// 9. MÁSCARA DE TELEFONE
		// ============================================
		function aplicarMascaraTelefone(input) {
		    let value = input.value.replace(/\D/g, ''); // Remove tudo que não é dígito
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

		    input.value = formattedValue;
		}

		// ============================================
		// 10. CARRINHO DE COMPRAS
	// ============================================
function adicionarAoCarrinho(nome, preco, imagem) {
    const item = {
        id: Date.now(),
        nome: nome,
        preco: preco,
        imagem: imagem, // Adiciona a URL da imagem
        quantidade: 1
    };

    carrinho.push(item);
    salvarCarrinho();
    atualizarBadgeCarrinho();

    // Mostrar notificação
    mostrarNotificacao(`${nome} adicionado ao carrinho!`);
}

function salvarCarrinho() {
    localStorage.setItem('carrinho', JSON.stringify(carrinho));
}

function carregarCarrinho() {
    const carrinhoSalvo = localStorage.getItem('carrinho');
    if (carrinhoSalvo) {
        carrinho = JSON.parse(carrinhoSalvo);
    }
}

function atualizarBadgeCarrinho() {
    const badge = document.querySelector('.cart-badge');
    if (badge) {
        badge.textContent = carrinho.length;
        
        if (carrinho.length > 0) {
            badge.style.display = 'inline-block';
        } else {
            badge.style.display = 'none';
        }
    }
}

// ============================================
// 9. NOTIFICAÇÕES
// ============================================
function mostrarNotificacao(mensagem) {
    // Criar elemento de notificação
    const notificacao = document.createElement('div');
    notificacao.className = 'notificacao';
    notificacao.innerHTML = `
        <i class="fa-solid fa-check-circle"></i>
        <span>${mensagem}</span>
    `;

    // Adicionar estilos
    notificacao.style.cssText = `
        position: fixed;
        bottom: 30px;
        right: 30px;
        background: linear-gradient(135deg, #ff69b4, #ff1493);
        color: white;
        padding: 16px 25px;
        border-radius: 50px;
        box-shadow: 0 8px 24px rgba(255, 105, 180, 0.3);
        display: flex;
        align-items: center;
        gap: 12px;
        font-weight: 600;
        z-index: 10000;
        animation: slideInUp 0.3s ease-out;
    `;

    document.body.appendChild(notificacao);

    // Remover após 3 segundos
    setTimeout(() => {
        notificacao.style.animation = 'slideOutDown 0.3s ease-out';
        setTimeout(() => {
            notificacao.remove();
        }, 300);
    }, 3000);
}

// ============================================
// 10. ANIMAÇÕES CSS ADICIONAIS
// ============================================
const style = document.createElement('style');
style.textContent = `
    @keyframes slideInUp {
        from {
            opacity: 0;
            transform: translateY(30px);
        }
        to {
            opacity: 1;
            transform: translateY(0);
        }
    }

    @keyframes slideOutDown {
        from {
            opacity: 1;
            transform: translateY(0);
        }
        to {
            opacity: 0;
            transform: translateY(30px);
        }
    }

    @keyframes fadeIn {
        from {
            opacity: 0;
            transform: translateY(20px);
        }
        to {
            opacity: 1;
            transform: translateY(0);
        }
    }

    .notificacao {
        font-family: 'Poppins', sans-serif;
    }

    .notificacao i {
        font-size: 20px;
    }
`;
document.head.appendChild(style);

// ============================================
// 11. FUNÇÕES UTILITÁRIAS
// ============================================

// Função para formatar moeda
function formatarMoeda(valor) {
    return new Intl.NumberFormat('pt-BR', {
        style: 'currency',
        currency: 'BRL'
    }).format(valor);
}

// Função para scroll suave
function scrollParaElemento(elemento) {
    elemento.scrollIntoView({
        behavior: 'smooth',
        block: 'start'
    });
}

// Função para debounce
function debounce(func, delay) {
    let timeoutId;
    return function(...args) {
        clearTimeout(timeoutId);
        timeoutId = setTimeout(() => func(...args), delay);
    };
}

// ============================================
// 12. EFEITOS DE HOVER GLOBAIS
// ============================================
document.addEventListener('DOMContentLoaded', function() {
    // Adicionar efeito de ripple ao clicar em botões
    document.querySelectorAll('.btn, button').forEach(btn => {
        btn.addEventListener('click', function(e) {
            const ripple = document.createElement('span');
            const rect = this.getBoundingClientRect();
            const size = Math.max(rect.width, rect.height);
            const x = e.clientX - rect.left - size / 2;
            const y = e.clientY - rect.top - size / 2;

            ripple.style.cssText = `
                position: absolute;
                width: ${size}px;
                height: ${size}px;
                background: rgba(255, 255, 255, 0.5);
                border-radius: 50%;
                left: ${x}px;
                top: ${y}px;
                pointer-events: none;
                animation: rippleEffect 0.6s ease-out;
            `;

            this.style.position = 'relative';
            this.style.overflow = 'hidden';
            this.appendChild(ripple);

            setTimeout(() => ripple.remove(), 600);
        });
    });

    // Adicionar animação de ripple ao CSS
    if (!document.querySelector('style[data-ripple]')) {
        const rippleStyle = document.createElement('style');
        rippleStyle.setAttribute('data-ripple', 'true');
        rippleStyle.textContent = `
            @keyframes rippleEffect {
                to {
                    transform: scale(4);
                    opacity: 0;
                }
            }
        `;
        document.head.appendChild(rippleStyle);
    }
});

// ============================================
// FIM DO SCRIPT
// ============================================
