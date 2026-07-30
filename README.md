# Timesheet

Aplicação local e individual para apontamento de horas, tarefas e demandas, executada em Node.js com SQLite como banco de dados.

## Execução

Instale as dependências:

```powershell
npm ci
```

Inicie em PowerShell:

```powershell
./run.ps1
```

O script configura `NODE_EXTRA_CA_CERTS` e executa `main.ts` com `tsx`. Sem necessidade do certificado adicional, use `npm start`.

## Backup

Para tornar mais confiável o uso de bases SQLite foi criada a ferramenta `litestream` que faz a replicação de dados automática.

A configuração de origem e destino da replicação fica no arquivo `litestream.yml`.

Comando para disparar a replicação:

```
.\litestream.exe replicate -config litestream.yml
```
