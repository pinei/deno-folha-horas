---
name: "Backend e SQLite"
description: "Use ao alterar main.ts, APIs Express, stores backend, consultas SQLite, schema ou migrations do Timesheet."
applyTo: "main.ts,core/**/*.ts"
---

# Backend e SQLite

- Mantenha `main.ts` como composição fina: arquivos estáticos, `/api`, fallback do Vue Router e inicialização do servidor.
- Registre endpoints no router de domínio em `core/api/` e implemente persistência/regra de dados no respectivo `core/store/`.
- Preserve o contrato JSON consumido pelos services em `public/services/`; procure o consumidor antes de alterar nomes ou formatos.
- Use statements preparados e parâmetros para valores externos. Não concatene entrada do cliente em SQL, nomes de tabela/campo ou cláusulas `where`.
- Adicione mudanças de schema somente como uma nova entrada versionada em `SQL_MIGRATE`; nunca reescreva migrations que possam ter sido aplicadas ao banco do usuário.
- Torne migrations compatíveis com os dados existentes e confira o efeito de chaves estrangeiras com `PRAGMA foreign_keys = ON`.
- Lembre que importar `core/database.ts` abre o caminho configurado por `--db-path` (default `./data/sqlite3.db`) e executa `database.migrate()`. Prefira `npx tsc --noEmit` e testes isolados durante validações; não use o banco real como fixture.
- O backend usa `node:sqlite` (`DatabaseSync`), portanto não substitua por um pacote SQLite externo sem uma razão explícita.
- Ao concluir, rode `npx tsc --noEmit` e os testes de domínio relacionados.