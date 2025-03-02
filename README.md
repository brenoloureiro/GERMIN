# Dashboard ONS - Energia Agora (v1.0.14)

Este é um dashboard web que exibe dados em tempo real do Sistema Interligado Nacional (SIN) através da API do ONS (Operador Nacional do Sistema Elétrico).

## Funcionalidades

- Visualização de dados de geração de energia (Hidráulica, Térmica, Eólica, Solar, Nuclear)
- Dados de carga do sistema
- Informações sobre intercâmbio entre regiões
- Estado dos reservatórios
- Gráficos interativos e responsivos
- Seleção dinâmica dos dados a serem exibidos

## Como usar

1. Clone este repositório:
```bash
git clone [URL_DO_SEU_REPOSITÓRIO]
```

2. Configure o GitHub Pages:
   - Vá para as configurações do seu repositório no GitHub
   - Na seção "GitHub Pages", selecione a branch principal (main ou master)
   - Selecione a pasta raiz (/) como fonte
   - Salve as configurações

3. Acesse a página:
   - Após a configuração, o GitHub fornecerá uma URL no formato: `https://[seu-usuario].github.io/[nome-do-repositorio]`
   - Aguarde alguns minutos para que o GitHub Pages processe e publique sua página

## Notas importantes

- A API do ONS pode ter restrições de CORS. Para contornar isso, estamos usando um proxy CORS (cors-anywhere.herokuapp.com)
- Para usar o proxy em produção, você precisará solicitar acesso temporário visitando: https://cors-anywhere.herokuapp.com/corsdemo
- Recomenda-se implementar seu próprio servidor proxy para uso em produção

## Tecnologias utilizadas

- HTML5
- CSS3
- JavaScript (ES6+)
- Chart.js para visualização de dados
- Axios para requisições HTTP

## Contribuindo

Sinta-se à vontade para contribuir com este projeto. Você pode:
1. Fazer um fork do repositório
2. Criar uma branch para sua feature (`git checkout -b feature/nova-feature`)
3. Commit suas mudanças (`git commit -am 'Adiciona nova feature'`)
4. Push para a branch (`git push origin feature/nova-feature`)
5. Criar um Pull Request

## Licença

Este projeto está sob a licença MIT. Veja o arquivo LICENSE para mais detalhes. 