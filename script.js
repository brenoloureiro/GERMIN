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
                'X-Requested-With': 'XMLHttpRequest',
                'Origin': window.location.origin
            }
        });
        
        console.log('✅ ETAPA 2: Dados recebidos da API:');
        console.log('Estrutura completa dos dados:', response.data);
        console.log('Primeiro item dos dados:', response.data[0]);
        console.log('Quantidade de itens:', response.data.length);
        
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
    console.log('Propriedades disponíveis:', Object.keys(data[0]));
    
    // Filtrar dados válidos e ordenar
    const dadosValidos = data
        .filter(item => item && item.Data && item.Valor)
        .map(item => ({
            ...item,
            timestamp: new Date(item.Data).getTime()
        }))
        .sort((a, b) => a.timestamp - b.timestamp);

    console.log('Primeiro item após filtro:', dadosValidos[0]);
    
    const processed = {
        labels: dadosValidos.map(item => {
            // A data vem no formato "/Date(1709337600000)/"
            const timestamp = parseInt(item.Data.match(/\d+/)[0]);
            const date = new Date(timestamp);
            const timeStr = date.toLocaleTimeString('pt-BR', { 
                hour: '2-digit', 
                minute: '2-digit'
            });
            console.log('Data original:', item.Data);
            console.log('Timestamp extraído:', timestamp);
            console.log('Data convertida:', date);
            console.log('Hora formatada:', timeStr);
            return timeStr;
        }),
        values: dadosValidos.map(item => {
            const valor = parseFloat(item.Valor);
            console.log('Valor original:', item.Valor);
            console.log('Valor convertido:', valor);
            return valor;
        })
    };
    
    console.log('📊 ETAPA 4: Dados processados para o gráfico:');
    console.log('Total de pontos:', processed.labels.length);
    console.log('Primeiro horário:', processed.labels[0]);
    console.log('Último horário:', processed.labels[processed.labels.length - 1]);
    console.log('Exemplo de valores:', processed.values.slice(0, 5));
    
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
                    tension: 0.1
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
                                return `${name}: ${value.toLocaleString('pt-BR')} MW`;
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
                                return value.toLocaleString('pt-BR');
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
                            minRotation: 45
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