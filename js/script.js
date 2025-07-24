const salarioInput = document.getElementById('salario');
const categoriesDiv = document.getElementById('categories');
const resultsDiv = document.getElementById('results');
const cacheInfoDiv = document.getElementById('cache-info');

// Elementos de entrada das categorias
const inputs = {
    moradia: document.getElementById('moradia-valor'),
    alimentacao: document.getElementById('alimentacao-valor'),
    transporte: document.getElementById('transporte-valor'),
    gastos: document.getElementById('gastos-valor'),
    investimentos: document.getElementById('investimentos-valor'),
    poupanca: document.getElementById('poupanca-valor'),
    lazer: document.getElementById('lazer-valor'),
    doacoes: document.getElementById('doacoes-valor')
};

// Elementos de exibição dos percentuais
const percentDisplays = {
    moradia: document.getElementById('moradia-percent'),
    alimentacao: document.getElementById('alimentacao-percent'),
    transporte: document.getElementById('transporte-percent'),
    gastos: document.getElementById('gastos-percent'),
    investimentos: document.getElementById('investimentos-percent'),
    poupanca: document.getElementById('poupanca-percent'),
    lazer: document.getElementById('lazer-percent'),
    doacoes: document.getElementById('doacoes-percent')
};

// Faixas ideais para cada categoria (em percentual)
const faixasIdeais = {
    moradia: { min: 20, max: 30, ideal: 25 },
    alimentacao: { min: 10, max: 15, ideal: 12.5 },
    transporte: { min: 8, max: 12, ideal: 10 },
    gastos: { min: 5, max: 10, ideal: 7.5 },
    investimentos: { min: 10, max: 20, ideal: 15 },
    poupanca: { min: 5, max: 10, ideal: 7.5 },
    lazer: { min: 5, max: 15, ideal: 10 },
    doacoes: { min: 0, max: 5, ideal: 2.5 }
};

// Elementos dos resultados
const limiteCartao = document.getElementById('limite-cartao');
const totalGasto = document.getElementById('total-gasto');
const saldoRestante = document.getElementById('saldo-restante');
const utilizacaoTotal = document.getElementById('utilizacao-total');

// Chave para salvar no localStorage
const STORAGE_KEY = 'controle-financeiro-dados-v2';

// Flag para controlar se os dados já foram carregados
let dadosCarregados = false;

// Armazenar subcategorias
let subcategorias = {
    moradia: [],
    alimentacao: [],
    transporte: [],
    gastos: [],
    investimentos: [],
    poupanca: [],
    lazer: [],
    doacoes: []
};

// Função para alternar visibilidade das subcategorias
function toggleSubcategories(categoria) {
    const subcategoriesDiv = document.getElementById(`${categoria}-subcategories`);
    const expandBtn = subcategoriesDiv.previousElementSibling.querySelector('.expand-btn');
    
    if (subcategoriesDiv.classList.contains('expanded')) {
        subcategoriesDiv.classList.remove('expanded');
        expandBtn.classList.remove('expanded');
        expandBtn.textContent = '+';
    } else {
        subcategoriesDiv.classList.add('expanded');
        expandBtn.classList.add('expanded');
        expandBtn.textContent = '+';
    }
}

// Função para adicionar nova subcategoria
function addSubcategory(categoria) {
    const subcategoriesDiv = document.getElementById(`${categoria}-subcategories`);
    const itemsContainer = subcategoriesDiv.querySelector('.add-subcategory');
    
    const itemDiv = document.createElement('div');
    itemDiv.className = 'subcategory-item';
    itemDiv.innerHTML = `
        <input type="text" placeholder="Descrição (ex: Aluguel)" class="subcategory-name">
        <input type="number" placeholder="R$ 0,00" min="0" step="0.01" class="subcategory-value">
        <button class="remove-subcategory" onclick="removeSubcategory(this, '${categoria}')" title="Remover item">×</button>
    `;
    
    // Inserir antes do botão "Adicionar item"
    subcategoriesDiv.insertBefore(itemDiv, itemsContainer);
    
    // Adicionar eventos para atualização automática
    const valueInput = itemDiv.querySelector('.subcategory-value');
    const nameInput = itemDiv.querySelector('.subcategory-name');
    
    valueInput.addEventListener('input', () => updateCategoryTotal(categoria));
    nameInput.addEventListener('input', () => salvarDados());
    
    // Focar no campo de descrição
    nameInput.focus();
}

// Função para remover subcategoria
function removeSubcategory(button, categoria) {
    button.parentElement.remove();
    updateCategoryTotal(categoria);
}

// Função para atualizar o total de uma categoria
function updateCategoryTotal(categoria) {
    const subcategoriesDiv = document.getElementById(`${categoria}-subcategories`);
    const items = subcategoriesDiv.querySelectorAll('.subcategory-item');
    let total = 0;
    
    items.forEach(item => {
        const value = parseFloat(item.querySelector('.subcategory-value').value) || 0;
        total += value;
    });
    
    // Atualizar o campo principal da categoria
    inputs[categoria].value = total.toFixed(2);
    
    // Atualizar o display do total na subcategoria
    const totalDisplay = subcategoriesDiv.querySelector('.subcategory-total');
    totalDisplay.textContent = `Total: ${formatarMoeda(total)}`;
    
    // Recalcular orçamento
    calcularOrcamento();
}

// Função para limpar subcategorias existentes
function limparSubcategorias(categoria) {
    const subcategoriesDiv = document.getElementById(`${categoria}-subcategories`);
    const items = subcategoriesDiv.querySelectorAll('.subcategory-item');
    items.forEach(item => item.remove());
    
    // Resetar total
    const totalDisplay = subcategoriesDiv.querySelector('.subcategory-total');
    totalDisplay.textContent = 'Total: R$ 0,00';
}

// Função para salvar dados no localStorage
function salvarDados() {
    if (!dadosCarregados) return; // Não salvar durante o carregamento inicial
    
    const dados = {
        salario: salarioInput.value,
        moradia: inputs.moradia.value,
        alimentacao: inputs.alimentacao.value,
        transporte: inputs.transporte.value,
        gastos: inputs.gastos.value,
        investimentos: inputs.investimentos.value,
        poupanca: inputs.poupanca.value,
        lazer: inputs.lazer.value,
        doacoes: inputs.doacoes.value,
        subcategorias: {},
        timestamp: new Date().getTime()
    };
    
    // Salvar subcategorias
    for (const categoria in subcategorias) {
        const subcategoriesDiv = document.getElementById(`${categoria}-subcategories`);
        const items = subcategoriesDiv.querySelectorAll('.subcategory-item');
        dados.subcategorias[categoria] = [];
        
        items.forEach(item => {
            const name = item.querySelector('.subcategory-name').value;
            const value = item.querySelector('.subcategory-value').value;
            if (name || value) {
                dados.subcategorias[categoria].push({ name, value });
            }
        });
    }
    
    localStorage.setItem(STORAGE_KEY, JSON.stringify(dados));
    
    // Mostrar info do cache apenas se houver dados salvos
    if (dados.salario || Object.values(inputs).some(input => input.value)) {
        cacheInfoDiv.style.display = 'block';
    }
}

// Função para carregar dados do localStorage
function carregarDados() {
    if (dadosCarregados) return; // Evitar carregamento múltiplo
    
    try {
        const dadosSalvos = localStorage.getItem(STORAGE_KEY);
        if (dadosSalvos) {
            const dados = JSON.parse(dadosSalvos);
            
            // Verificar se os dados não são muito antigos (opcional - 30 dias)
            const agora = new Date().getTime();
            const diasAntigos = (agora - dados.timestamp) / (1000 * 60 * 60 * 24);
            
            if (diasAntigos < 30) { // Manter dados por 30 dias
                salarioInput.value = dados.salario || '';
                inputs.moradia.value = dados.moradia || '';
                inputs.alimentacao.value = dados.alimentacao || '';
                inputs.transporte.value = dados.transporte || '';
                inputs.gastos.value = dados.gastos || '';
                inputs.investimentos.value = dados.investimentos || '';
                inputs.poupanca.value = dados.poupanca || '';
                inputs.lazer.value = dados.lazer || '';
                inputs.doacoes.value = dados.doacoes || '';
                
                // Carregar subcategorias
                if (dados.subcategorias) {
                    for (const categoria in dados.subcategorias) {
                        // Limpar subcategorias existentes antes de carregar
                        limparSubcategorias(categoria);
                        
                        const items = dados.subcategorias[categoria];
                        items.forEach(item => {
                            if (item.name || item.value) { // Só adicionar se houver dados
                                addSubcategory(categoria);
                                const subcategoriesDiv = document.getElementById(`${categoria}-subcategories`);
                                const lastItem = subcategoriesDiv.querySelector('.subcategory-item:last-of-type');
                                if (lastItem) {
                                    lastItem.querySelector('.subcategory-name').value = item.name || '';
                                    lastItem.querySelector('.subcategory-value').value = item.value || '';
                                }
                            }
                        });
                        updateCategoryTotal(categoria);
                    }
                }
                
                // Mostrar info do cache se houver dados carregados
                if (dados.salario || Object.values(dados).some(valor => valor && valor !== dados.timestamp)) {
                    cacheInfoDiv.style.display = 'block';
                }
                
                // Marcar que os dados foram carregados
                dadosCarregados = true;
                
                // Recalcular após carregar
                calcularOrcamento();
            }
        } else {
            // Marcar como carregado mesmo sem dados salvos
            dadosCarregados = true;
        }
    } catch (error) {
        console.error('Erro ao carregar dados do cache:', error);
        dadosCarregados = true; // Marcar como carregado para evitar loops
    }
}

function formatarMoeda(valor) {
    return new Intl.NumberFormat('pt-BR', {
        style: 'currency',
        currency: 'BRL',
        minimumFractionDigits: 2
    }).format(valor);
}

function calcularOrcamento() {
    const salario = parseFloat(salarioInput.value) || 0;
    
    if (salario > 0) {
        // Mostrar seções de categorias e resultados
        categoriesDiv.style.display = 'block';
        resultsDiv.style.display = 'block';
        
        let totalGastoValor = 0;
        
        // Calcular percentuais para cada categoria
        for (const categoria in inputs) {
            const valor = parseFloat(inputs[categoria].value) || 0;
            const percentual = salario > 0 ? (valor / salario * 100) : 0;
            
            percentDisplays[categoria].textContent = percentual.toFixed(1) + '%';
            
            // Aplicar cores baseadas nas faixas ideais
            const faixa = faixasIdeais[categoria];
            if (percentual > faixa.max) {
                percentDisplays[categoria].style.backgroundColor = '#721c24';
                percentDisplays[categoria].style.color = '#f5c6cb';
                percentDisplays[categoria].style.borderColor = '#dc3545';
            } else if (percentual < faixa.min && percentual > 0) {
                percentDisplays[categoria].style.backgroundColor = '#664d03';
                percentDisplays[categoria].style.color = '#ffecb5';
                percentDisplays[categoria].style.borderColor = '#ffc107';
            } else if (percentual >= faixa.min && percentual <= faixa.max) {
                percentDisplays[categoria].style.backgroundColor = '#0f5132';
                percentDisplays[categoria].style.color = '#d1e7dd';
                percentDisplays[categoria].style.borderColor = '#28a745';
            } else {
                percentDisplays[categoria].style.backgroundColor = '#2c2f36';
                percentDisplays[categoria].style.color = '#ffffff';
                percentDisplays[categoria].style.borderColor = '#5a6268';
            }
            
            totalGastoValor += valor;
        }
        
        // Calcular limite do cartão (lazer + gastos fixos + alimentação)
        const limiteCartaoValor = (parseFloat(inputs.lazer.value) || 0) + 
                                    (parseFloat(inputs.gastos.value) || 0) + 
                                    (parseFloat(inputs.alimentacao.value) || 0);
        
        // Calcular saldo restante
        const saldoRestanteValor = salario - totalGastoValor;
        const utilizacaoPercentual = salario > 0 ? (totalGastoValor / salario * 100) : 0;
        
        // Atualizar valores na tela
        limiteCartao.textContent = formatarMoeda(limiteCartaoValor);
        totalGasto.textContent = formatarMoeda(totalGastoValor);
        saldoRestante.textContent = formatarMoeda(saldoRestanteValor);
        utilizacaoTotal.textContent = utilizacaoPercentual.toFixed(1) + '%';
        
        // Aplicar cores baseadas no saldo
        if (saldoRestanteValor < 0) {
            saldoRestante.className = 'summary-value summary-over';
            utilizacaoTotal.className = 'summary-value summary-over';
        } else if (saldoRestanteValor < salario * 0.1) {
            saldoRestante.className = 'summary-value summary-remaining';
            utilizacaoTotal.className = 'summary-value summary-remaining';
        } else {
            saldoRestante.className = 'summary-value';
            utilizacaoTotal.className = 'summary-value';
        }
        
    } else {
        categoriesDiv.style.display = 'none';
        resultsDiv.style.display = 'none';
    }
    
    // Salvar dados após cada cálculo (só se já carregou)
    if (dadosCarregados) {
        salvarDados();
    }
}

function limparCampos() {
    // Confirmar antes de limpar
    if (confirm('🗑️ Tem certeza que deseja limpar todos os dados? Esta ação não pode ser desfeita.')) {
        // Limpar campos
        salarioInput.value = '';
        for (const categoria in inputs) {
            inputs[categoria].value = '';
            percentDisplays[categoria].textContent = '0%';
            percentDisplays[categoria].style.backgroundColor = '#2c2f36';
            percentDisplays[categoria].style.color = '#ffffff';
            percentDisplays[categoria].style.borderColor = '#5a6268';
            
            // Limpar subcategorias
            limparSubcategorias(categoria);
            
            // Fechar subcategoria se estiver aberta
            const subcategoriesDiv = document.getElementById(`${categoria}-subcategories`);
            const expandBtn = subcategoriesDiv.previousElementSibling.querySelector('.expand-btn');
            subcategoriesDiv.classList.remove('expanded');
            expandBtn.classList.remove('expanded');
            expandBtn.textContent = '+';
        }
        
        // Limpar do localStorage
        localStorage.removeItem(STORAGE_KEY);
        
        // Esconder seções e info do cache
        categoriesDiv.style.display = 'none';
        resultsDiv.style.display = 'none';
        cacheInfoDiv.style.display = 'none';
        
        // Feedback de sucesso
        alert('✅ Todos os dados foram limpos com sucesso!');
    }
}

async function tirarPrint() {
    try {
        // Verificar se há dados para capturar
        if (categoriesDiv.style.display === 'none') {
            alert('❌ Digite sua renda mensal primeiro para visualizar os dados!');
            return;
        }
        
        // Desabilitar o botão temporariamente
        const printBtn = document.querySelector('.print-btn');
        const originalText = printBtn.innerHTML;
        printBtn.innerHTML = '⏳ Gerando...';
        printBtn.disabled = true;
        
        // Selecionar apenas a área com dados (excluindo botões)
        const elementoParaCapturar = document.querySelector('.container');
        
        // Configurações do html2canvas
        const opcoes = {
            allowTaint: true,
            useCORS: true,
            scale: 2, // Melhor qualidade
            backgroundColor: null,
            logging: false,
            width: elementoParaCapturar.offsetWidth,
            height: elementoParaCapturar.offsetHeight,
            onclone: function(clonedDoc) {
                // Remover os botões e info do cache do clone antes de capturar
                const btnsContainer = clonedDoc.querySelector('.btn-container');
                const cacheInfo = clonedDoc.querySelector('.cache-info');
                if (btnsContainer) {
                    btnsContainer.style.display = 'none';
                }
                if (cacheInfo) {
                    cacheInfo.style.display = 'none';
                }
            }
        };
        
        // Gerar o canvas
        const canvas = await html2canvas(elementoParaCapturar, opcoes);
        
        // Converter para blob e fazer download
        canvas.toBlob(function(blob) {
            const url = URL.createObjectURL(blob);
            const link = document.createElement('a');
            
            // Gerar nome do arquivo com data
            const agora = new Date();
            const dataFormatada = agora.toLocaleDateString('pt-BR').replace(/\//g, '-');
            const horaFormatada = agora.toLocaleTimeString('pt-BR').replace(/:/g, '-');
            const nomeArquivo = `controle-financeiro_${dataFormatada}_${horaFormatada}.png`;
            
            link.href = url;
            link.download = nomeArquivo;
            link.click();
            
            // Limpar URL temporária
            URL.revokeObjectURL(url);
            
            // Restaurar botão
            printBtn.innerHTML = originalText;
            printBtn.disabled = false;
            
            // Feedback de sucesso
            alert('✅ Screenshot salvo com sucesso!');
            
        }, 'image/png', 0.95);
        
    } catch (error) {
        console.error('Erro ao gerar screenshot:', error);
        alert('❌ Erro ao gerar screenshot. Tente novamente.');
        
        // Restaurar botão em caso de erro
        const printBtn = document.querySelector('.print-btn');
        printBtn.innerHTML = '📸 Salvar como Imagem';
        printBtn.disabled = false;
    }
}

// Event listeners para cálculo e salvamento em tempo real
salarioInput.addEventListener('input', calcularOrcamento);

// Carregar dados salvos ao inicializar a página
document.addEventListener('DOMContentLoaded', function() {
    carregarDados();
});

// Carregar dados apenas uma vez quando a página carrega
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', carregarDados);
} else {
    carregarDados();
}
