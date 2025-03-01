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
        console.log(`Fazendo requisição para endpoint: ${endpoint}`);
        const fullUrl = `${CORS_PROXY}${API_BASE_URL}/${endpoint}`;
        console.log(`URL completa: ${fullUrl}`);
        
        const response = await axios.get(fullUrl, {
            headers: {
                'X-Requested-With': 'XMLHttpRequest',
                'Origin': window.location.origin
            }
        });
        
        console.log(`Resposta recebida para ${endpoint}:`, response.data);
        
        if (!response.data || !Array.isArray(response.data)) {
            console.error(`Dados inválidos recebidos para ${endpoint}:`, response.data);
            alert(`Erro ao carregar dados para ${endpoint}. Formato inválido.`);
            return null;
        }
        
        return response.data;
    } catch (error) {
        console.error(`Erro ao fazer requisição para ${endpoint}:`, error);
        console.error('Detalhes do erro:', {
            message: error.message,
            response: error.response,
            request: error.request
        });
        
        let errorMessage = 'Erro ao carregar dados. ';
        if (error.response) {
            errorMessage += `Status: ${error.response.status}. `;
            if (error.response.status === 403) {
                errorMessage += 'Por favor, visite https://cors-anywhere.herokuapp.com/corsdemo e solicite acesso temporário.';
            }
        } else if (error.request) {
            errorMessage += 'Sem resposta do servidor.';
        } else {
            errorMessage += error.message;
        }
        
        alert(errorMessage);
        return null;
    }
}

// Função para processar os dados recebidos da API
function processData(data) {
    if (!data || !Array.isArray(data)) {
        console.error('Dados inválidos recebidos:', data);
        return { labels: [], values: [] };
    }
    
    console.log('Processando dados:', data);
    
    const processed = {
        labels: data.map(item => new Date(item.Data).toLocaleString()),
        values: data.map(item => item.Valor)
    };
    
    console.log('Dados processados:', processed);
    return processed;
}

// Função para criar ou atualizar um gráfico
function createOrUpdateChart(endpoint, name, data) {
    console.log(`Criando/atualizando gráfico para ${endpoint}:`, data);
    
    const chartsContainer = document.querySelector('.charts-container');
    let chartWrapper = document.getElementById(`chart-${endpoint}`);
    
    if (!chartWrapper) {
        console.log(`Criando novo wrapper para ${endpoint}`);
        chartWrapper = document.createElement('div');
        chartWrapper.id = `chart-${endpoint}`;
        chartWrapper.className = 'chart-wrapper';
        chartWrapper.style.height = '400px'; // Altura fixa para o wrapper
        
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
                    fill: true
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
                        intersect: false
                    }
                },
                scales: {
                    y: {
                        beginAtZero: true,
                        title: {
                            display: true,
                            text: 'Valor'
                        }
                    },
                    x: {
                        title: {
                            display: true,
                            text: 'Data/Hora'
                        }
                    }
                }
            }
        });
        
        console.log(`Novo gráfico criado para ${endpoint}`);
        charts.set(endpoint, newChart);
    } else {
        console.log(`Atualizando gráfico existente para ${endpoint}`);
        const chart = charts.get(endpoint);
        chart.data.labels = data.labels;
        chart.data.datasets[0].data = data.values;
        chart.update();
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