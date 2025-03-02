// Versão atual do dashboard
const DASHBOARD_VERSION = "1.0.14";

// Cache para armazenar as respostas da API
const API_CACHE = new Map();
const CACHE_DURATION = 5 * 60 * 1000; // 5 minutos em milissegundos

// Configuração dos sistemas disponíveis
const SISTEMAS = {
    "SIN": "Sistema Interligado Nacional",
    "Norte": "Subsistema Norte",
    "Nordeste": "Subsistema Nordeste",
    "SudesteECentroOeste": "Subsistema Sudeste/Centro-Oeste",
    "Sul": "Subsistema Sul"
};

// Configuração dos endpoints disponíveis
const ENDPOINTS_ONS = {
    "Balanço": {
        "Consolidado": "BalancoEnergeticoConsolidado/null"
    },
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
        "SudesteECentroOeste": {
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
        "SIN": "Carga_SIN_json",
        "Norte": "Carga_Norte_json",
        "Nordeste": "Carga_Nordeste_json",
        "SudesteECentroOeste": "Carga_SudesteECentroOeste_json",
        "Sul": "Carga_Sul_json"
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

// Configuração das cores por tipo de geração
const GERACAO_COLORS = {
    'Eólica': '#1a73e8',      // Azul
    'Solar': '#ffd700',       // Amarelo
    'Térmica': '#ff8c00',     // Laranja
    'Nuclear': '#ff0000',     // Vermelho
    'Hidráulica': '#2ecc71',  // Verde
    'Total': '#6c757d',       // Cinza
    'Carga': '#000000'        // Preto
};

// Função para criar o seletor de sistema
function createSystemSelector() {
    const container = document.querySelector('.controls');
    const selectorDiv = document.createElement('div');
    selectorDiv.className = 'system-selector';
    
    const label = document.createElement('label');
    label.htmlFor = 'system-select';
    label.textContent = 'Selecione o Sistema/Subsistema:';
    
    const select = document.createElement('select');
    select.id = 'system-select';
    
    Object.entries(SISTEMAS).forEach(([key, value]) => {
        const option = document.createElement('option');
        option.value = key;
        option.textContent = value;
        select.appendChild(option);
    });
    
    select.addEventListener('change', handleSystemChange);
    
    selectorDiv.appendChild(label);
    selectorDiv.appendChild(select);
    container.insertBefore(selectorDiv, container.firstChild);
}

// Função para lidar com a mudança de sistema
async function handleSystemChange(event) {
    const selectedSystem = event.target.value;
    
    // Limpar todos os gráficos existentes
    const chartsContainer = document.querySelector('.charts-container');
    chartsContainer.innerHTML = '';
    charts.clear();
    
    // Buscar balanço energético
    const balanco = await fetchONSData('BalancoEnergeticoConsolidado/null');
    if (balanco) {
        createBalancoTable(balanco, selectedSystem);
    }
    
    // Atualizar os checkboxes disponíveis
    updateEndpointSelectors(selectedSystem);
}

// Função para criar a tabela de balanço energético
function createBalancoTable(data, sistema) {
    const container = document.querySelector('.charts-container');
    
    const tableWrapper = document.createElement('div');
    tableWrapper.className = 'table-wrapper';
    
    const title = document.createElement('h3');
    title.textContent = `Balanço Energético - ${SISTEMAS[sistema]}`;
    
    const table = document.createElement('table');
    table.className = 'balanco-table';
    
    // Cabeçalho
    const thead = document.createElement('thead');
    const headerRow = document.createElement('tr');
    ['Tipo', 'Valor (MW)'].forEach(text => {
        const th = document.createElement('th');
        th.textContent = text;
        headerRow.appendChild(th);
    });
    thead.appendChild(headerRow);
    table.appendChild(thead);
    
    // Corpo
    const tbody = document.createElement('tbody');
    // Aqui você vai precisar processar os dados do balanço conforme a estrutura retornada pela API
    
    table.appendChild(tbody);
    tableWrapper.appendChild(title);
    tableWrapper.appendChild(table);
    container.insertBefore(tableWrapper, container.firstChild);
}

// Função para atualizar os seletores de endpoint baseado no sistema selecionado
function updateEndpointSelectors(selectedSystem) {
    const container = document.querySelector('.endpoint-groups');
    container.innerHTML = '';
    
    // Recriar os seletores apenas para o sistema selecionado
    Object.entries(ENDPOINTS_ONS).forEach(([category, content]) => {
        if (category === "Geração") {
            const endpoints = content[selectedSystem];
            if (endpoints) {
                createEndpointGroup(category, endpoints, selectedSystem);
            }
        } else if (category === "Carga") {
            const endpoint = content[selectedSystem];
            if (endpoint) {
                createEndpointGroup(category, { [`Carga ${selectedSystem}`]: endpoint }, selectedSystem);
            }
        }
    });
}

// Função para criar um grupo de endpoints
function createEndpointGroup(category, endpoints, system) {
    const container = document.querySelector('.endpoint-groups');
    
    const groupDiv = document.createElement('div');
    groupDiv.className = 'endpoint-group';
    
    const title = document.createElement('h3');
    title.textContent = category;
    groupDiv.appendChild(title);
    
    Object.entries(endpoints).forEach(([name, endpoint]) => {
        const itemDiv = document.createElement('div');
        itemDiv.className = 'endpoint-item';
        
        const checkbox = document.createElement('input');
        checkbox.type = 'checkbox';
        checkbox.id = endpoint;
        checkbox.addEventListener('change', () => handleEndpointSelection(endpoint, `${system} - ${name}`, checkbox.checked));
        
        const label = document.createElement('label');
        label.htmlFor = endpoint;
        label.textContent = name;
        
        itemDiv.appendChild(checkbox);
        itemDiv.appendChild(label);
        groupDiv.appendChild(itemDiv);
    });
    
    container.appendChild(groupDiv);
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
    
    // Extrair o tipo e sistema do nome
    const partes = name.split(' - ');
    const sistema = partes[0];
    const tipo = partes[partes.length - 1];
    
    // Determinar o ID do gráfico baseado no tipo de dado
    let chartId;
    if (endpoint.includes('Geracao') || endpoint.includes('Carga')) {
        chartId = `chart-energia-${sistema.toLowerCase().replace(/\s+/g, '-')}`;
    } else {
        chartId = `chart-${endpoint}`;
    }
    
    const chartsContainer = document.querySelector('.charts-container');
    let chartWrapper = document.getElementById(chartId);
    
    if (!chartWrapper) {
        console.log('Criando novo wrapper e canvas');
        chartWrapper = document.createElement('div');
        chartWrapper.id = chartId;
        chartWrapper.className = 'chart-wrapper';
        chartWrapper.style.height = '400px';
        
        const title = document.createElement('h3');
        title.textContent = `Energia - ${sistema} - ${dataFormatada}`;
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
                    label: tipo,
                    data: data.values,
                    borderColor: GERACAO_COLORS[tipo] || '#1a73e8',
                    backgroundColor: 'transparent',
                    borderWidth: 2,
                    fill: false,
                    tension: 0.1,
                    pointRadius: 0,
                    pointHoverRadius: 5,
                    borderDash: tipo === 'Carga' ? [5, 5] : []
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
                                return `${context.dataset.label}: ${formatNumber(value)} MW`;
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
                        }
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
        charts.set(chartId, newChart);
    } else {
        console.log('Atualizando gráfico existente');
        const chart = charts.get(chartId);
        
        // Verificar se o dataset já existe
        const datasetIndex = chart.data.datasets.findIndex(ds => ds.label === tipo);
        
        if (datasetIndex === -1) {
            // Adicionar novo dataset
            chart.data.datasets.push({
                label: tipo,
                data: data.values,
                borderColor: GERACAO_COLORS[tipo] || '#1a73e8',
                backgroundColor: 'transparent',
                borderWidth: 2,
                fill: false,
                tension: 0.1,
                pointRadius: 0,
                pointHoverRadius: 5,
                borderDash: tipo === 'Carga' ? [5, 5] : []
            });
            
            // Se for um tipo de geração, calcular e atualizar o total
            if (endpoint.includes('Geracao') && tipo !== 'Total') {
                updateGeracaoTotal(chart, sistema);
            }
        } else {
            // Atualizar dataset existente
            chart.data.datasets[datasetIndex].data = data.values;
        }
        
        chart.update();
        console.log('✅ Gráfico atualizado com sucesso');
    }
}

// Função para atualizar a geração total
function updateGeracaoTotal(chart, sistema) {
    const datasets = chart.data.datasets;
    const tiposGeracao = ['Hidráulica', 'Térmica', 'Eólica', 'Solar', 'Nuclear'];
    
    // Encontrar datasets de geração
    const geracaoDatasets = datasets.filter(ds => tiposGeracao.includes(ds.label));
    
    if (geracaoDatasets.length > 0) {
        // Calcular a soma de todas as gerações
        const totalData = geracaoDatasets[0].data.map((_, index) => {
            return geracaoDatasets.reduce((sum, ds) => {
                return sum + (ds.data[index] || 0);
            }, 0);
        });
        
        // Encontrar ou criar o dataset total
        let totalDataset = datasets.find(ds => ds.label === 'Total');
        if (!totalDataset) {
            totalDataset = {
                label: 'Total',
                data: totalData,
                borderColor: GERACAO_COLORS['Total'],
                backgroundColor: 'transparent',
                borderWidth: 3,
                fill: false,
                tension: 0.1,
                pointRadius: 0,
                pointHoverRadius: 5
            };
            datasets.push(totalDataset);
        } else {
            totalDataset.data = totalData;
        }
    }
}

// Função para remover um gráfico
function removeChart(endpoint) {
    const partes = endpoint.split('_');
    const sistema = partes[1];
    const chartId = `chart-energia-${sistema.toLowerCase()}`;
    
    const chartWrapper = document.getElementById(chartId);
    if (chartWrapper) {
        const chart = charts.get(chartId);
        if (chart) {
            // Se for um gráfico de geração ou carga, remover apenas o dataset específico
            if (endpoint.includes('Geracao') || endpoint.includes('Carga')) {
                const tipo = endpoint.includes('Carga') ? 'Carga' : endpoint.split('_')[3].replace('_json', '');
                const datasetIndex = chart.data.datasets.findIndex(ds => ds.label === tipo);
                
                if (datasetIndex !== -1) {
                    chart.data.datasets.splice(datasetIndex, 1);
                    
                    // Se for geração, atualizar o total
                    if (endpoint.includes('Geracao')) {
                        updateGeracaoTotal(chart, sistema);
                    }
                    
                    if (chart.data.datasets.length === 0) {
                        chart.destroy();
                        charts.delete(chartId);
                        chartWrapper.remove();
                    } else {
                        chart.update();
                    }
                }
            } else {
                chart.destroy();
                charts.delete(chartId);
                chartWrapper.remove();
            }
        }
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
    
    // Criar seletor de sistema
    createSystemSelector();
    
    // Inicializar com o SIN selecionado
    updateEndpointSelectors('SIN');
}); 