# Timesheet - orientações para agentes

## Contexto

- Aplicação local e individual para registrar horas, tarefas, demandas, campanhas e entregas.
- O runtime é Node.js e o entrypoint é [main.ts](main.ts).
- O backend Express serve a API e os arquivos de `public/`. O frontend Vue 3 não possui etapa de build: módulos e componentes são carregados no navegador pelo import map e pelo `vue3-sfc-loader`.
- O SQLite local usa `data/sqlite3.db` por padrão. Importar [core/database.ts](core/database.ts) abre o caminho configurado por `--db-path` e aplica migrations pendentes.

## Comandos

- Instale dependências com `npm ci`.
- Inicie com `npm start` ou `./run.ps1`; a porta padrão é `1025`. Use `--port` e `--db-path` para substituir os defaults.
- Valide TypeScript com `npx tsc --noEmit`.
- Execute os testes com `npx tsx --test public/domain/*.test.ts`.
- Não use `npm test`: o projeto não define esse script.
- Não inicie o servidor como simples validação automatizada, pois isso pode alterar o banco local através das migrations.

## Arquitetura

- Fluxo frontend: page/component em `public/` -> store Pinia -> service Axios -> `/api`.
- Fluxo backend: router em `core/api/` -> store em `core/store/` -> SQLite.
- [core/api.ts](core/api.ts) agrega as rotas; [public/commons/router.mjs](public/commons/router.mjs) define as páginas.
- [core/database.ts](core/database.ts) concentra schema, migrations e o wrapper de `node:sqlite`.
- Preserve os padrões próximos ao arquivo alterado; o frontend mistura Options API e `<script setup>` intencionalmente.

## Regras de trabalho

- Faça mudanças pequenas e compatíveis com uma aplicação de usuário único; não introduza infraestrutura distribuída sem necessidade explícita.
- Ao alterar um recurso, mantenha coerentes seus tipos/domínio, API, store backend, service, store Pinia e UI envolvidos.
- Preserve ESM. No backend, siga os imports sem extensão já usados; no frontend, preserve extensões e URLs que o navegador resolve diretamente.
- Considere que `tsc` não verifica integralmente os arquivos `.mjs` nem a compilação runtime dos `.vue`; alterações de integração frontend exigem verificação no navegador quando possível.
- Não edite `data/sqlite3.db`, arquivos WAL/SHM, certificados ou destinos locais do Litestream como parte de mudanças de código.

Consulte as instruções específicas em [.github/instructions/backend.instructions.md](.github/instructions/backend.instructions.md) e [.github/instructions/frontend.instructions.md](.github/instructions/frontend.instructions.md).