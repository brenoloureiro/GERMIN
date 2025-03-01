import requests
import json

def get_ons_data(endpoint):
    """
    Função para fazer requisições à API do ONS
    
    Args:
        endpoint (str): Caminho do endpoint da API
        
    Returns:
        dict: Dados retornados pela API em formato JSON
    """
    base_url = "https://integra.ons.org.br/api/energiaagora/Get"
    url = f"{base_url}/{endpoint}"
    
    headers = {
        'accept': 'application/json'
    }
    
    try:
        response = requests.get(url, headers=headers)
        response.raise_for_status()  # Levanta exceção para status codes de erro
        return response.json()
    except requests.exceptions.RequestException as e:
        print(f"Erro ao fazer requisição: {e}")
        return None

# Lista de endpoints disponíveis na API do ONS
ENDPOINTS_ONS = {
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
}

def listar_endpoints():
    """
    Função para listar todos os endpoints disponíveis
    """
    print("\nEndpoints disponíveis na API do ONS:")
    for categoria, endpoints in ENDPOINTS_ONS.items():
        print(f"\n{categoria}:")
        for nome, endpoint in endpoints.items():
            print(f"  - {nome}: {endpoint}")

def main():
    # Listar endpoints disponíveis
    listar_endpoints()
    
    # Exemplo de uso - obtendo dados de geração hidráulica
    endpoint = ENDPOINTS_ONS["Geração"]["Hidráulica"]
    dados = get_ons_data(endpoint)
    
    if dados:
        print("\nDados obtidos:")
        print(json.dumps(dados, indent=2, ensure_ascii=False))

if __name__ == "__main__":
    main()
