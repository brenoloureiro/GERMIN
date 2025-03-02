// Versão atual do dashboard
const DASHBOARD_VERSION = "1.0.13";

// Cache para armazenar as respostas da API
const API_CACHE = new Map();
const CACHE_DURATION = 5 * 60 * 1000; // 5 minutos em milissegundos

// Configuração dos endpoints disponíveis
const ENDPOINTS_ONS = {
    "Geração": {
        "SIN": {
            "Total": "Geracao_SIN_Total_json",
            "Hidráulica": "Geracao_SIN_Hidraulica_json",
            "Térmica": "Geracao_SIN_Termica_json",
            "Eólica": "Geracao_SIN_Eolica_json",
            "Solar": "Geracao_SIN_Solar_json",
            "Nuclear": "Geracao_SIN_Nuclear_json"
        },
        "Norte": {
            "Hidráulica": "Geracao_Norte_Hidraulica_json",
            "Térmica": "Geracao_Norte_Termica_json",
            "Eólica": "Geracao_Norte_Eolica_json",
            "Solar": "Geracao_Norte_Solar_json",
            "Nuclear": "Geracao_Norte_Nuclear_json"
        },
        "Nordeste": {
            "Hidráulica": "Geracao_Nordeste_Hidraulica_json",
            "Térmica": "Geracao_Nordeste_Termica_json",
            "Eólica": "Geracao_Nordeste_Eolica_json",
            "Solar": "Geracao_Nordeste_Solar_json",
            "Nuclear": "Geracao_Nordeste_Nuclear_json"
        },
        "Sudeste/Centro-Oeste": {
            "Hidráulica": "Geracao_SudesteECentroOeste_Hidraulica_json",
            "Térmica": "Geracao_SudesteECentroOeste_Termica_json",
            "Eólica": "Geracao_SudesteECentroOeste_Eolica_json",
            "Solar": "Geracao_SudesteECentroOeste_Solar_json",
            "Nuclear": "Geracao_SudesteECentroOeste_Nuclear_json"
        },
        "Sul": {
            "Hidráulica": "Geracao_Sul_Hidraulica_json",
            "Térmica": "Geracao_Sul_Termica_json",
            "Eólica": "Geracao_Sul_Eolica_json",
            "Solar": "Geracao_Sul_Solar_json",
            "Nuclear": "Geracao_Sul_Nuclear_json"
        }
    },
    "Carga": {
        "Carga Total": "Carga_SIN_json",
        "Carga Norte": "Carga_Norte_json",
        "Carga Nordeste": "Carga_Nordeste_json",
        "Carga Sudeste/Centro-Oeste": "Carga_SudesteECentroOeste_json",
        "Carga Sul": "Carga_Sul_json"
    },
    "Intercâmbio": {
        "Entre Regiões": "Intercambio_Regioes_json"
    },
    "Reservatórios": {
        "Energia Armazenada": "Energia_Armazenada_json",
        "Volume Útil": "Volume_Util_json"
    }
};

// Configuração da API
const API_BASE_URL = "https://integra.ons.org.br/api/energiaagora/Get";
const CORS_PROXY = "https://cors-anywhere.herokuapp.com/";

// Objeto para armazenar as instâncias dos gráficos
const charts = new Map();

// Função para criar os elementos de seleção de endpoints
function createEndpointSelectors() {
    const container = document.querySelector('.endpoint-groups');
    
    Object.entries(ENDPOINTS_ONS).forEach(([category, content]) => {
        const groupDiv = document.createElement('div');
        groupDiv.className = 'endpoint-group';
        
        const title = document.createElement('h3');
        title.textContent = category;
        groupDiv.appendChild(title);
        
        if (category === "Geração") {
            // Criar seleção de sistema/subsistema
            Object.entries(content).forEach(([system, types]) => {
                const systemDiv = document.createElement('div');
                systemDiv.className = 'system-group';
                
                const systemTitle = document.createElement('h4');
                systemTitle.textContent = system;
                systemDiv.appendChild(systemTitle);
                
                Object.entries(types).forEach(([typeName, endpoint]) => {
                    const itemDiv = document.createElement('div');
                    itemDiv.className = 'endpoint-item';
                    
                    const checkbox = document.createElement('input');
                    checkbox.type = 'checkbox';
                    checkbox.id = endpoint;
                    checkbox.addEventListener('change', () => handleEndpointSelection(endpoint, `${system} - ${typeName}`, checkbox.checked));
                    
                    const label = document.createElement('label');
                    label.htmlFor = endpoint;
                    label.textContent = typeName;
                    
                    itemDiv.appendChild(checkbox);
                    itemDiv.appendChild(label);
                    systemDiv.appendChild(itemDiv);
                });
                
                groupDiv.appendChild(systemDiv);
            });
        } else {
            // Manter o comportamento original para outras categorias
            Object.entries(content).forEach(([name, endpoint]) => {
                const itemDiv = document.createElement('div');
                itemDiv.className = 'endpoint-item';
                
                const checkbox = document.createElement('input');
                checkbox.type = 'checkbox';
                checkbox.id = endpoint;
                checkbox.addEventListener('change', () => handleEndpointSelection(endpoint, name, checkbox.checked));
                
                const label = document.createElement('label');
                label.htmlFor = endpoint;
                label.textContent = name;
                
                itemDiv.appendChild(checkbox);
                itemDiv.appendChild(label);
                groupDiv.appendChild(itemDiv);
            });
        }
        
        container.appendChild(groupDiv);
    });
}

// Função para fazer requisição à API
async function fetchONSData(endpoint) {
    try {
        console.log('----------------------------------------');
        console.log(`🌐 ETAPA 1: Iniciando requisição para ${endpoint}`);
        
        // Verificar cache
        const now = Date.now();
        const cachedData = API_CACHE.get(endpoint);
        if (cachedData && (now - cachedData.timestamp) < CACHE_DURATION) {
            console.log('✅ Usando dados do cache');
            return cachedData.data;
        }
        
        const fullUrl = `${CORS_PROXY}${API_BASE_URL}/${endpoint}`;
        console.log(`URL: ${fullUrl}`);
        
        const response = await axios.get(fullUrl, {
            headers: {
                'X-Requested-With': 'XMLHttpRequest'
            }
        });
        
        // Armazenar no cache
        API_CACHE.set(endpoint, {
            timestamp: now,
            data: response.data
        });
        
        console.log('✅ ETAPA 2: Dados recebidos da API:');
        console.log('----------------------------------------');
        console.log('DADOS BRUTOS:');
        console.log(response.data);
        console.log('----------------------------------------');
        
        if (!response.data) {
            console.error('❌ ERRO: Dados não disponíveis no momento');
            alert(`Não há dados disponíveis para ${endpoint} no momento. Tente novamente mais tarde.`);
            return null;
        }
        
        // Verificar se é um array ou objeto
        let dados;
        if (Array.isArray(response.data)) {
            dados = response.data;
        } else if (typeof response.data === 'object') {
            dados = [response.data];
        } else {
            console.error('❌ ERRO: Formato de dados inesperado');
            console.log('Tipo de dados recebido:', typeof response.data);
            alert(`Erro ao carregar dados para ${endpoint}. Formato inesperado.`);
            return null;
        }
        
        if (!dados.length) {
            console.error('❌ ERRO: Array de dados vazio');
            alert(`Não há dados disponíveis para ${endpoint} no momento. Tente novamente mais tarde.`);
            return null;
        }
        
        console.log('ESTRUTURA COMPLETA DO PRIMEIRO ITEM:');
        console.log(JSON.stringify(dados[0], null, 2));
        console.log('----------------------------------------');
        console.log('PRIMEIROS 5 ITENS:');
        console.log(JSON.stringify(dados.slice(0, 5), null, 2));
        console.log('----------------------------------------');
        console.log('ÚLTIMOS 5 ITENS:');
        console.log(JSON.stringify(dados.slice(-5), null, 2));
        console.log('----------------------------------------');
        console.log('INFORMAÇÕES GERAIS:');
        console.log('Total de registros:', dados.length);
        if (dados[0]) {
            console.log('Campos disponíveis:', Object.keys(dados[0]));
            console.log('Valores do primeiro item:', dados[0]);
        }
        
        return dados;
    } catch (error) {
        console.error('❌ ERRO na requisição:', error);
        
        // Se for erro 429 (Too Many Requests), tentar usar cache mesmo expirado
        if (error.response && error.response.status === 429) {
            const cachedData = API_CACHE.get(endpoint);
            if (cachedData) {
                console.log('⚠️ Usando dados do cache expirado devido ao limite de requisições');
                return cachedData.data;
            }
            alert('Limite de requisições atingido. Por favor, visite https://cors-anywhere.herokuapp.com/corsdemo e solicite acesso temporário.');
        } else if (error.response && error.response.status === 404) {
            alert(`Endpoint ${endpoint} não está disponível no momento. Tente novamente mais tarde.`);
        } else {
            alert(`Erro ao carregar dados para ${endpoint}. ${error.message}`);
        }
        
        return null;
    }
}

// Função para formatar número com ponto
function formatNumber(value) {
    return value.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ".");
}

// Função para processar os dados recebidos da API
function processData(data) {
    console.log('----------------------------------------');
    console.log('🔄 ETAPA 3: Processando dados');
    
    if (!data || !Array.isArray(data)) {
        console.error('❌ ERRO: Dados inválidos recebidos');
        return { labels: [], values: [] };
    }
    
    // Vamos analisar a estrutura dos dados
    console.log('Exemplo do primeiro item:', data[0]);
    
    // Determinar campos baseado no primeiro item
    let campoValor = null;
    let campoData = null;
    
    if (data[0]) {
        // Tentar encontrar campos de valor
        ['geracao', 'valor', 'volumeUtil', 'energiaArmazenada', 'carga'].forEach(campo => {
            if (campo in data[0]) campoValor = campo;
        });
        
        // Tentar encontrar campos de data
        ['instante', 'data', 'dataHora'].forEach(campo => {
            if (campo in data[0]) campoData = campo;
        });
    }
    
    if (!campoValor || !campoData) {
        console.error('❌ ERRO: Não foi possível identificar os campos necessários');
        console.log('Campos disponíveis:', Object.keys(data[0]));
        alert('Erro ao processar dados: estrutura não reconhecida');
        return { labels: [], values: [] };
    }
    
    console.log('Campos identificados:', { campoValor, campoData });
    
    // Processar e ordenar dados
    const dadosProcessados = data
        .map(item => {
            if (!item || !item[campoData] || !item[campoValor]) {
                console.log('Item inválido:', item);
                return null;
            }
            
            try {
                const date = new Date(item[campoData]);
                const valor = parseFloat(item[campoValor]);
                
                if (isNaN(valor) || isNaN(date.getTime())) {
                    console.log('Valor ou data inválida:', { valor, date, item });
                    return null;
                }
                
                return {
                    timestamp: date.getTime(),
                    date,
                    valor,
                    horaFormatada: date.toLocaleTimeString('pt-BR', { 
                        hour: '2-digit', 
                        minute: '2-digit'
                    })
                };
            } catch (error) {
                console.error('Erro ao processar item:', error, item);
                return null;
            }
        })
        .filter(item => item !== null)
        .sort((a, b) => a.timestamp - b.timestamp);

    console.log('Primeiro item processado:', dadosProcessados[0]);
    console.log('Quantidade de itens processados:', dadosProcessados.length);
    
    const processed = {
        labels: dadosProcessados.map(item => item.horaFormatada),
        values: dadosProcessados.map(item => item.valor)
    };
    
    console.log('📊 ETAPA 4: Dados processados para o gráfico:');
    console.log('Total de pontos:', processed.values.length);
    console.log('Primeiro horário:', processed.labels[0]);
    console.log('Último horário:', processed.labels[processed.labels.length - 1]);
    console.log('Exemplo de valores:', processed.values.slice(0, 5));
    console.log('Range de valores:', {
        min: Math.min(...processed.values),
        max: Math.max(...processed.values)
    });
    
    return processed;
}

// Função para criar ou atualizar um gráfico
function createOrUpdateChart(endpoint, name, data) {
    console.log('----------------------------------------');
    console.log(`📈 ETAPA 5: Criando/atualizando gráfico para ${name}`);
    
    if (!data.values.length) {
        console.error('Nenhum dado para exibir no gráfico');
        return;
    }
    
    const minValue = Math.min(...data.values);
    const maxValue = Math.max(...data.values);
    console.log('Range de valores para o gráfico:', { minValue, maxValue });
    
    // Formatar a data atual
    const hoje = new Date();
    const dataFormatada = hoje.toLocaleDateString('pt-BR', {
        day: '2-digit',
        month: '2-digit',
        year: 'numeric'
    });
    const tituloCompleto = `${name} - ${dataFormatada}`;
    
    const chartsContainer = document.querySelector('.charts-container');
    let chartWrapper = document.getElementById(`chart-${endpoint}`);
    
    if (!chartWrapper) {
        console.log('Criando novo wrapper e canvas');
        chartWrapper = document.createElement('div');
        chartWrapper.id = `chart-${endpoint}`;
        chartWrapper.className = 'chart-wrapper';
        chartWrapper.style.height = '400px';
        
        const title = document.createElement('h3');
        title.textContent = tituloCompleto;
        chartWrapper.appendChild(title);
        
        const canvas = document.createElement('canvas');
        chartWrapper.appendChild(canvas);
        chartsContainer.appendChild(chartWrapper);
        
        const ctx = canvas.getContext('2d');
        const newChart = new Chart(ctx, {
            type: 'line',
            data: {
                labels: data.labels,
                datasets: [{
                    label: name,
                    data: data.values,
                    borderColor: '#1a73e8',
                    backgroundColor: 'rgba(26, 115, 232, 0.1)',
                    borderWidth: 2,
                    fill: false,
                    tension: 0.1,
                    pointRadius: 0,
                    pointHoverRadius: 5
                }]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                plugins: {
                    legend: {
                        display: true,
                        position: 'top'
                    },
                    tooltip: {
                        mode: 'index',
                        intersect: false,
                        callbacks: {
                            label: function(context) {
                                const value = context.parsed.y;
                                return `${name}: ${formatNumber(value)} MW`;
                            }
                        }
                    }
                },
                scales: {
                    y: {
                        beginAtZero: false,
                        title: {
                            display: true,
                            text: 'Potência (MW)'
                        },
                        ticks: {
                            callback: function(value) {
                                return formatNumber(value);
                            }
                        },
                        suggestedMin: minValue * 0.95,
                        suggestedMax: maxValue * 1.05
                    },
                    x: {
                        title: {
                            display: true,
                            text: 'Hora'
                        },
                        ticks: {
                            maxRotation: 45,
                            minRotation: 45,
                            autoSkip: true,
                            maxTicksLimit: 12
                        }
                    }
                },
                interaction: {
                    intersect: false,
                    mode: 'index'
                }
            }
        });
        
        console.log('✅ Gráfico criado com sucesso');
        charts.set(endpoint, newChart);
    } else {
        console.log('Atualizando gráfico existente');
        const chart = charts.get(endpoint);
        chart.data.labels = data.labels;
        chart.data.datasets[0].data = data.values;
        chart.options.scales.y.suggestedMin = minValue * 0.95;
        chart.options.scales.y.suggestedMax = maxValue * 1.05;
        chart.update();
        console.log('✅ Gráfico atualizado com sucesso');
    }
}

// Função para remover um gráfico
function removeChart(endpoint) {
    const chartWrapper = document.getElementById(`chart-${endpoint}`);
    if (chartWrapper) {
        const chart = charts.get(endpoint);
        if (chart) {
            chart.destroy();
            charts.delete(endpoint);
        }
        chartWrapper.remove();
    }
}

// Função para lidar com a seleção de endpoints
async function handleEndpointSelection(endpoint, name, isSelected) {
    if (isSelected) {
        const data = await fetchONSData(endpoint);
        if (data) {
            const processedData = processData(data);
            createOrUpdateChart(endpoint, name, processedData);
        }
    } else {
        removeChart(endpoint);
    }
}

// Inicialização
document.addEventListener('DOMContentLoaded', () => {
    // Adicionar versão no topo da página
    const header = document.querySelector('header');
    const versionDiv = document.createElement('div');
    versionDiv.className = 'version-info';
    versionDiv.textContent = `Versão ${DASHBOARD_VERSION}`;
    header.appendChild(versionDiv);
    
    createEndpointSelectors();
}); 