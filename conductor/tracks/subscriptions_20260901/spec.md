# Especificação: Serviço de Subscrições e E-mail Transacional

## Overview
Implementação de um microsserviço no HonoJS para automação de subscrições recorrentes FMCG. O sistema criará modelos de subscrição na Commerce Layer, gerará links de checkout pré-preenchidos e enviará e-mails transacionais (via Resend) com verificação de stock em tempo real.

## Functional Requirements
1. **Subscription Service (`src/services/subscription.ts`):** Criação/associação de `subscription_models` via Commerce Layer SDK (`weekly` | `monthly`).
2. **Microstore Service (`src/services/microstore.ts`):** Geração de ordens (`order`) com os SKUs da subscrição e obtenção do URL da Microstore para checkout.
3. **Email Service (`src/services/email.ts`):** Integração com **Resend** para envio de e-mail transacional responsivo.
4. **Endpoint (`POST /api/subscriptions/send-microstore`):**
    - Validação de entrada (Zod).
    - Validação de stock em tempo real (via Commerce Layer API).
    - Orquestração do fluxo: Subscrição -> Microstore Link -> E-mail.

## Acceptance Criteria
- O endpoint deve retornar JSON com `subscriptionId` e `microstoreUrl` após envio do e-mail.
- Validação de stock deve falhar explicitamente caso item não esteja `available`.
- E-mail deve conter resumo claro da subscrição e CTA funcional.

## Out of Scope
- Persistência dos links gerados (processo será *transient*).
- Gestão de cancelamento de subscrições pelo cliente.
