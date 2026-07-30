---
name: "Frontend Vue sem build"
description: "Use ao alterar páginas, componentes Vue, composables, stores Pinia, services, domínio frontend, roteamento, CSS ou import map."
applyTo: "public/**/*.{vue,mjs,ts,css,html}"
---

# Frontend Vue sem build

- Não presuma Vite, npm bundling ou transformação prévia. O navegador carrega dependências pelo import map de `public/index.html` e compila `.vue` com `public/commons/vue-loader.mjs`.
- Use apenas sintaxe, imports e recursos que funcionem como módulos servidos diretamente ao navegador. Preserve extensões explícitas nos imports frontend.
- Reutilize Vue 3, Pinia, Axios, Vue Router e Fomantic UI já carregados; não adicione outra biblioteca para comportamento que essa stack já oferece.
- Siga o estilo do componente próximo. O projeto aceita Options API e `<script setup>`; não converta componentes sem relação com a tarefa.
- Mantenha responsabilidades: pages coordenam fluxos, components encapsulam UI, composables reutilizam comportamento, stores mantêm estado e services isolam chamadas Axios.
- Encapsule novas chamadas HTTP no service do domínio e exponha estado/operações compartilhadas pelo store Pinia correspondente.
- Ao adicionar uma página, atualize `public/commons/router.mjs`; ao adicionar dependência bare-import, atualize o import map antes de usá-la.
- Preserve os padrões visuais e de interação de Fomantic UI e os temas em `public/css/`. Verifique tema claro e escuro quando a mudança afetar cores.
- `npx tsc --noEmit` não cobre integralmente `.mjs` nem templates `.vue`. Rode os testes `npx tsx --test public/domain/*.test.ts` e, para integração/UI, valide no navegador com console e rede sem erros.