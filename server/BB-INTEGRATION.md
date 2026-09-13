# Banco do Brasil

Configuração acessível pelo ícone administrativo existente, selecionando Banco do Brasil.

- Campos: appKey, clientId, clientSecret; importação do TXT exportado pelo BB.
- Basic é derivado; registrationAccessToken não é utilizado nem armazenado.
- Cofres DPAPI separados: APPDATA/MiniPreco/segredos/bb-sandbox.dpapi e bb-production.dpapi.
- Credenciais nunca entram em SQLite, snapshots, logs ou localStorage.
- Visualização explícita por campo, escondida após 15 segundos ou perda de foco.
- Salvar credenciais não exige reiniciar o servidor; instalar código novo do servidor exige reinício.
- O seletor de ambiente não promove uma aplicação no BB. Produção permite apenas cadastro; testes reais e pagamentos estão bloqueados.

## Verificado

Autenticação em Sandbox via discovery oficial, client_credentials e escopos somente leitura cob.read e pix.read. Teste real aceitou as credenciais fornecidas em 02/09/2026. Token descartado e nunca retornado ao cliente.

## Fluxo Sandbox implementado (validação externa pendente)

bb-pix.js implementa PUT /cob/{txid}, consulta GET /cob/{txid}, simulador oficial e conciliação estrita de txid, chave, valor, estado CONCLUIDA e evidência do recebimento com endToEndId. A imagem QR usa o Pix Copia e Cola retornado pela API. Não há confirmação por temporizador ou pelo resultado do simulador sozinho.

Tela de teste disponível nas configurações BB e botão administrativo no PDV que copia o total da compra. Consultas automáticas a cada 8 segundos, pausadas em erro. Testes ficam em SQLite separado em APPDATA/MiniPreco/testes/bb-pix-sandbox.sqlite; não escrevem em vendas, estoque ou financeiro. IDs persistidos antes do envio evitam duplicação por repetição da mesma requisição. Simulação não é reenviada automaticamente quando há incerteza. Produção permanece bloqueada.

Tentativa externa em 02/09/2026: falhou na validação TLS do host oficial api.extranet.hm.bb.com.br com SELF_SIGNED_CERT_IN_CHAIN, inclusive com as autoridades do sistema. Não foram desabilitadas validações TLS. O fluxo completo não foi comprovado contra o BB; resolver a cadeia oficial antes de afirmar sucesso. Testes automatizados com respostas fictícias passaram. Não confundir esses testes internos com homologação bancária.

Documentação oficial obtida do serviço público usado pelo próprio portal: API 28, versão 2, tópico Especificações e testes. Host de testes preliminares sem mTLS: https://api.extranet.hm.bb.com.br/pix/v2. Chave EVP de teste e simulador são valores públicos fornecidos nessa documentação, não credenciais da loja. Não precisa de webhook para polling.

Ainda não implementados: produção/mTLS cliente, webhook público e finalização de venda real a partir de pagamento BB.

## Fontes oficiais

- https://apoio.developers.bb.com.br/guias-e-tutoriais/primeiros-passos/testes-sandbox
- https://apoio.developers.bb.com.br/guias-e-tutoriais/seguranca/visao-geral
- https://oauth.hm.bb.com.br/oauth/.well-known/openid-configuration
- https://github.com/bacen/pix-api/blob/master/openapi.yaml
- https://apoio.developers.bb.com.br/apis/28

## Testes

node --test server/bb-config.test.js
node --test server/bb-pix.test.js
npm run build
npm run lint

Os testes de unidade usam cofre temporário e transporte fictício, sem gravar ou testar credenciais reais. A rota de teste não cria transações. O serviço é local-only com verificação de Origin, Host e cabeçalho próprio, mas ainda não possui autenticação administrativa de backend; não constitui isolamento contra outros programas do mesmo usuário do Windows.
