---
sessionId: session-261104-161155-zncg
---

# Análise e Soluções

### Problema Identificado

O `useFmcgStore.ts` já usa `persist` do zustand com `localStorage` (linha 93-222). Porém, existem dois problemas críticos:

1. **Imagens base64 são enormes**: Cada análise salva a imagem completa em base64 no campo `image` (linha 59 de `AnalysisResult`). Uma foto de 2-5MB rapidamente excede o limite de ~5-10MB do localStorage, fazendo com que a persistência falhe silenciosamente.

2. **UI não permite navegar no histórico**: A UI atual (após remoção das tabs) mostra apenas o último resultado via `history[history.length - 1]`. Mesmo que os dados persistissem, o usuário não pode revisitar análises anteriores.

### Solução Recomendada: IndexedDB + UI de Histórico

#### Por que IndexedDB?
- Suporta ~500MB+ por domínio (vs ~5-10MB do localStorage)
- Suporta blobs e imagens nativamente
- Ideal para dados estruturados de médio/grande porte
- Biblioteca `idb-keyval` oferece API simples e compatível com zustand

#### O que vai mudar:

**1. `useFmcgStore.ts`**
- Migrar de `localStorage` para IndexedDB usando `createJSONStorage` com `idb-keyval`
- Adicionar `id` único a cada `AnalysisResult` para identificação
- Comprimir imagens: redimensionar para thumbnails (~300px) antes de salvar no histórico
- Manter os dados da API (`data`) intactos para revisão completa

**2. `FmcgVisionAnalyzer.tsx`**
- Restaurar UI de histórico com thumbnails clicáveis (removida anteriormente)
- Adicionar lista horizontal de análises passadas com:
  - Thumbnail da imagem
  - Timestamp formatado
  - Número de produtos detetados
  - Confiança média
- Permitir clicar numa análise para revisitar os resultados completos
- Adicionar botão para eliminar análises individuais

**3. `FmcgGlobalDrawer.tsx`**
- Garantir que a área de histórico seja scrollável dentro do drawer

### Alternativas Consideradas

| Abordagem | Vantagens | Desvantagens |
|-----------|-----------|--------------|
| **IndexedDB** (recomendada) | Capacidade ilimitada prática, blobs nativos | Requer nova dependência |
| **Comprimir no localStorage** | Sem novas dependências | Limite de ~20 análises, perda de qualidade |
| **Lista simples (sem imagens)** | Leve e simples | Perde o contexto visual da análise |

### Estimativa
- ~30-40 linhas alteradas em `useFmcgStore.ts`
- ~80-100 linhas adicionadas em `FmcgVisionAnalyzer.tsx` (UI de histórico)
- 1 nova dependência: `idb-keyval` (~2kb)

# Delivery Steps

### ✓ Step 1: Migrar store para IndexedDB
Substituir localStorage por IndexedDB no useFmcgStore para suportar imagens e histórico persistente sem limites de tamanho.

### ✓ Step 2: Comprimir imagens ao salvar
Redimensionar imagens para thumbnails (~300px) antes de salvar no histórico para otimizar armazenamento.

### ✓ Step 3: Adicionar UI de histórico navegável
Restaurar thumbnails clicáveis em FmcgVisionAnalyzer para navegar entre análises passadas com data, produtos e confiança.

### ✓ Step 4: Testar persistência e navegação
Validar que o histórico persiste após recarregar a página e que o usuário pode navegar entre análises.

### ✓ Step 5: Corrigir navegação do histórico
Fixar `activeResultId` persistido, seleção automática do resultado mais recente, compressão de cache hits e layout das thumbnails.