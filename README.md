## Deno Folha Horas

Aplicação individual para apontamento de horas rodando no framework Deno (alternativa ao Node.js) com SQLite como banco de dados

Rodando em PowerShell:

```
$env:DENO_CERT = "./ca.petrobras.goskope.crt"
deno run -A --unstable main.ts
```

## Backup

Para tornar mais confiável o uso de bases SQLite foi criada a ferramenta `litestream` que faz a replicação de dados automática.

A configuração de origem e destino da replicação fica no arquivo `litestream.yml`.

Comando para disparar a replicação:

```
.\litestream.exe replicate -config litestream.yml
```
