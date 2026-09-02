# FMCG Photo Shopping & Predictive Pantry Service

## # Initial Concept
Serviço multimodal inteligente para compras de bens de consumo rápido (FMCG). O utilizador tira uma fotografia da sua despensa ou lê códigos de barras, e o sistema identifica e adiciona os itens corretos ao carrinho, além de monitorizar o stock de forma preditiva.

---

## 1. Visão Geral
O FMCG Service simplifica as compras de supermercado diárias integrando visão computacional de ponta com e-commerce headless. O sistema reduz o atrito de reabastecimento ao gerir de forma autónoma as necessidades domésticas dos utilizadores.

## 2. Objetivos do Produto
- **Redução do Tempo de Compra:** Eliminar a necessidade de procurar manualmente por produtos recorrentes.
- **Previsão Inteligente:** Alertar o utilizador antes de um produto essencial (leite, detergente, etc.) esgotar.
- **Integração Fluida:** Funcionar como um plugin ativado (opt-in) na Storefront principal.

## 3. Principais Funcionalidades
- **FmcgPhotoScanner:** Scanner fotográfico multimodal híbrido (Local Barcode JS + Workers AI Llama + Gemini Flash fallback).
- **PantryDepletionTracker:** Gestão de inventário doméstico preditivo com base em estimativas de consumo.
- **Sincronização MCP:** Conexão nativa implementada com o Commerce Layer Core MCP Server para operações de carrinho e checkout de alta performance, permitindo automação segura e eficiente.

## 4. Público-Alvo
- Famílias atarefadas que procuram automatizar compras de mercearia recorrentes.
- Utilizadores adeptos de tecnologia doméstica inteligente e reabastecimento inteligente.
- Redes de retalho que pretendem oferecer subscrições "Subscribe & Save".
