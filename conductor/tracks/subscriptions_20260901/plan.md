# Plano de Implementação: Implementação do Core FMCG Vision Service e Integração MCP

## Fase 1: Serviços de Backend
- [x] Task: Criar `server/services/subscription.ts`
    - [x] Task: Escrever testes unitários (Red)
    - [x] Task: Implementar criação de subscrição no CL (Green) 30d1674
- [x] Task: Criar server/services/microstore.ts e9b57de
    - [x] Task: Escrever testes unitários (Red)
    - [x] Task: Implementar geração de URL Microstore (Green)
- [x] Task: Criar server/services/email.ts 6db9301
    - [x] Task: Escrever testes unitários (Red)
    - [x] Task: Implementar envio via Resend (Green)
- [x] Task: Conductor - User Manual Verification 'Implementação Serviços' (Protocol in workflow.md) f657519 [checkpoint: f657519]

## Fase 2: Endpoint API
- [ ] Task: Criar `server/routes/subscriptions.ts`
    - [ ] Task: Escrever testes de integração (Red)
    - [ ] Task: Implementar endpoint POST (Green)
- [ ] Task: Conductor - User Manual Verification 'Endpoint API' (Protocol in workflow.md)
