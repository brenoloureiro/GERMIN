// Configuração dos endpoints disponíveis
const ENDPOINTS_ONS = {
    "Geração": {
        "Hidráulica": "Geracao_SIN_Hidraulica_json",
        "Térmica": "Geracao_SIN_Termica_json",
        "Eólica": "Geracao_SIN_Eolica_json",
        "Solar": "Geracao_SIN_Solar_json",
        "Nuclear": "Geracao_SIN_Nuclear_json",
        "Total": "Geracao_SIN_Total_json"
    },
    "Carga": {
        "Carga Total": "Carga_SIN_Total_json",
        "Carga por Região": "Carga_Regioes_json"
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
    
    Object.entries(ENDPOINTS_ONS).forEach(([category, endpoints]) => {
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
            checkbox.addEventListener('change', () => handleEndpointSelection(endpoint, name, checkbox.checked));
            
            const label = document.createElement('label');
            label.htmlFor = endpoint;
            label.textContent = name;
            
            itemDiv.appendChild(checkbox);
            itemDiv.appendChild(label);
            groupDiv.appendChild(itemDiv);
        });
        
        container.appendChild(groupDiv);
    });
}

// Função para fazer requisição à API
async function fetchONSData(endpoint) {
    try {
        console.log('----------------------------------------');
        console.log(`🌐 ETAPA 1: Iniciando requisição para ${endpoint}`);
        const fullUrl = `${CORS_PROXY}${API_BASE_URL}/${endpoint}`;
        console.log(`URL: ${fullUrl}`);
        
        const response = await axios.get(fullUrl, {
            headers: {
                'X-Requested-With': 'XMLHttpRequest'
            }
        });
        
        console.log('✅ ETAPA 2: Dados brutos da API:');
        console.log('----------------------------------------');
        console.log('ESTRUTURA COMPLETA DO PRIMEIRO ITEM:');
        console.log(JSON.stringify(response.data[0], null, 2));
        console.log('----------------------------------------');
        console.log('PRIMEIROS 5 ITENS DA RESPOSTA:');
        console.log(JSON.stringify(response.data.slice(0, 5), null, 2));
        console.log('----------------------------------------');
        console.log('ÚLTIMOS 5 ITENS DA RESPOSTA:');
        console.log(JSON.stringify(response.data.slice(-5), null, 2));
        console.log('----------------------------------------');
        console.log('INFORMAÇÕES GERAIS:');
        console.log('Total de registros:', response.data.length);
        console.log('Campos disponíveis:', Object.keys(response.data[0]));
        
        if (!response.data || !Array.isArray(response.data)) {
            console.error('❌ ERRO: Dados não estão no formato esperado');
            alert(`Erro ao carregar dados para ${endpoint}. Formato inválido.`);
            return null;
        }
        
        return response.data;
    } catch (error) {
        console.error('❌ ERRO na requisição:', error);
        alert('Erro ao carregar dados. Verifique o console para mais detalhes.');
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
    const primeiroItem = data[0];
    console.log('Primeiro item (raw):', JSON.stringify(primeiroItem, null, 2));
    
    // Filtrar dados válidos
    const dadosValidos = data.filter(item => {
        const valido = item && typeof item.Data === 'string' && item.Data.includes('/Date(') && !isNaN(parseFloat(item.Valor));
        if (!valido) {
            console.log('Item inválido encontrado:', item);
        }
        return valido;
    });

    console.log('Quantidade de dados válidos:', dadosValidos.length);
    
    // Processar e ordenar dados
    const dadosProcessados = dadosValidos.map(item => {
        const match = item.Data.match(/\/Date\((\d+)\)\//);
        if (!match) {
            console.error('Formato de data inválido:', item.Data);
            return null;
        }
        
        const timestamp = parseInt(match[1]);
        const date = new Date(timestamp);
        const valor = parseFloat(item.Valor);
        
        if (isNaN(valor)) {
            console.error('Valor inválido:', item.Valor);
            return null;
        }
        
        return {
            timestamp,
            date,
            valor,
            horaFormatada: date.toLocaleTimeString('pt-BR', { 
                hour: '2-digit', 
                minute: '2-digit'
            })
        };
    })
    .filter(item => item !== null)
    .sort((a, b) => a.timestamp - b.timestamp);

    console.log('Exemplo de dado processado:', dadosProcessados[0]);
    
    const processed = {
        labels: dadosProcessados.map(item => item.horaFormatada),
        values: dadosProcessados.map(item => item.valor)
    };
    
    console.log('📊 ETAPA 4: Dados processados para o gráfico:');
    console.log('Total de pontos:', processed.labels.length);
    console.log('Intervalo de tempo:', {
        primeiro: processed.labels[0],
        ultimo: processed.labels[processed.labels.length - 1]
    });
    console.log('Intervalo de valores:', {
        min: Math.min(...processed.values),
        max: Math.max(...processed.values),
        media: processed.values.reduce((a, b) => a + b, 0) / processed.values.length
    });
    
    return processed;
}

// Função para criar ou atualizar um gráfico
function createOrUpdateChart(endpoint, name, data) {
    console.log('----------------------------------------');
    console.log(`📈 ETAPA 5: Criando/atualizando gráfico para ${name}`);
    
    const chartsContainer = document.querySelector('.charts-container');
    let chartWrapper = document.getElementById(`chart-${endpoint}`);
    
    if (!chartWrapper) {
        console.log('Criando novo wrapper e canvas');
        chartWrapper = document.createElement('div');
        chartWrapper.id = `chart-${endpoint}`;
        chartWrapper.className = 'chart-wrapper';
        chartWrapper.style.height = '400px';
        
        const title = document.createElement('h3');
        title.textContent = name;
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
                    fill: true,
                    tension: 0.1,
                    pointRadius: 2,
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
                        beginAtZero: true,
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
                            maxTicksLimit: 24
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
    createEndpointSelectors();
}); 