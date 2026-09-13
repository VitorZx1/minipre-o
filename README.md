# Mini Preço

Sistema administrativo com armazenamento SQLite local.

## Executar

```bash
npm install
npm run dev
```

O comando inicia a interface em `http://localhost:4000` e o serviço local de dados. O serviço aceita conexões somente do próprio computador (`127.0.0.1:4317`).

## Armazenamento

Na primeira execução, o banco é criado em `%APPDATA%\MiniPreco\dados\mini-preco.db`.

O administrador pode alterar essa pasta pelo ícone de banco no cabeçalho. Os módulos possuem tabelas separadas e índices de data no formato ISO (`AAAA-MM-DD`), usados nas consultas por período e na futura geração de relatórios.

Para testar a versão compilada, execute `npm run build` e depois `npm run server`; a aplicação ficará disponível em `http://127.0.0.1:4317`.

O empacotamento desktop e a rotina automática de backup são as próximas etapas antes da distribuição aos computadores da loja.
