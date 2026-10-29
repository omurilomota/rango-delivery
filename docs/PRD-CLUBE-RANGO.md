# PRD — Clube Rango

## 1. Visão do produto
Canal próprio instalável (PWA) para o Rango Restaurante e Petiscaria, com cardápio vivo, pedidos, fidelidade, assinatura e gestão. Objetivo: migrar pedidos de canais com comissão, reduzir atendimento manual e aumentar recorrência.

## 2. Metas do piloto (90 dias)
- 40% dos pedidos digitais no canal próprio.
- 300 clientes identificados e com consentimento no piloto.
- 25 assinaturas ativas.
- Publicação do cardápio até 10h em 95% dos dias.
- Tempo de aceite de pedido inferior a 3 minutos.
- NPS superior a 70.

## 3. Perfis
- Cliente avulso: quer descobrir o prato do dia e pedir em poucos toques.
- Cliente recorrente: quer repetir pedido, ganhar pontos e acompanhar benefícios.
- Assinante: quer agendar refeições e controlar saldo.
- Empresa: quer pedidos agrupados e faturamento mensal.
- Operador: precisa publicar o menu e mover pedidos rapidamente.
- Gestor: precisa de dados de vendas, clientes e campanhas.

## 4. Histórias prioritárias
### Cliente
- Como cliente, quero ver se a loja está aberta e o que está disponível hoje.
- Como cliente, quero filtrar pratos, montar a sacola e escolher entrega ou retirada.
- Como cliente, quero pagar via Pix, cartão ou na entrega.
- Como cliente, quero acompanhar recebido, preparo, entrega e conclusão.
- Como cliente recorrente, quero entrar com WhatsApp e OTP e ver meus pontos.
- Como cliente, quero aplicar um cupom e entender taxa/desconto antes de confirmar.
- Como assinante, quero escolher plano e solicitar agendamento.

### Operação
- Como operador, quero ver pedidos por etapa e avançá-los com um clique.
- Como operador, quero marcar um prato como esgotado sem removê-lo.
- Como operador, quero publicar o cardápio diário e programar aviso.

### Gestão
- Como gestor, quero ver vendas, ticket médio, economia e meta diária.
- Como gestor, quero segmentar clientes fiéis, sumidos e aniversariantes.
- Como gestor, quero criar promoções limitadas e medir resgates.
- Como gestor, quero acompanhar contas corporativas e faturas.

## 5. Critérios de aceite do MVP
- Checkout recalcula preço no servidor; valores do navegador nunca são confiáveis.
- Pedido persiste cliente, itens, totais, método, entrega, status e previsão.
- Pedido gera um ponto por item elegível.
- Cupom FEIJOADA20 aplica 20% somente à feijoada.
- Rastreamento atualiza sem recarregar a página.
- Painel atualiza status e o rastreamento reflete a mudança.
- Item esgotado persiste no banco.
- Layout funciona a partir de 320 px e é navegável por teclado.
- Consentimento de marketing é explícito e opcional.

## 6. Modelo de domínio
Tabelas implementadas: `categories`, `products`, `daily_menus`, `daily_menu_items`, `customers`, `addresses`, `promotions`, `orders`, `order_items`, `loyalty_ledger`, `subscriptions` e `corporate_accounts`.

Regras centrais:
- Valores monetários em centavos inteiros.
- Telefone normalizado e único por cliente.
- Pedidos usam UUID e preservam nome/preço do item no momento da venda.
- Ledger de fidelidade é separado do saldo agregado.
- Status: `received`, `preparing`, `delivering`, `completed`, `cancelled`.

## 7. Contratos HTTP implementados
- `GET /api/catalog`: categorias, produtos e seleção diária.
- `POST /api/orders`: cria pedido e credita fidelidade.
- `GET /api/orders/:id`: detalhes e rastreamento.
- `POST /api/auth/otp`: envio/verificação de OTP demonstrativo.
- `GET /api/account?phone=`: perfil e histórico.
- `GET /api/admin/dashboard`: KPIs, fila e ranking.
- `PATCH /api/admin/orders/:id`: muda status operacional.
- `PATCH /api/admin/products/:id`: disponibilidade/preço.
- `GET /api/health`: saúde do PostgreSQL.

### POST /api/orders — resumo
Entrada: identificação, entrega/retirada, bairro/endereço, método, cupom, consentimento e itens (`productId`, `quantity`).
Saída: UUID, código curto, status, previsão, total e pontos.
Erros 400: identidade inválida, carrinho vazio, endereço ausente. Erro 500: falha transacional.

## 8. Segurança e LGPD
- Segredos somente no servidor e via variáveis de ambiente.
- Preço, cupom e taxa recalculados no backend.
- Consentimento separado da execução do pedido.
- Rotas de conta e administração devem ganhar sessão assinada antes da produção.
- OTP de demonstração `1234` deve ser substituído por WhatsApp Cloud API.
- Política de retenção: pedidos fiscais conforme obrigação; marketing até revogação.
- Exportação, correção e exclusão de dados devem ser incluídas na fase de produção.

## 9. Integrações para produção
- WhatsApp Cloud API: template de OTP, menu diário, status e reativação.
- Mercado Pago ou Efipay: criação de cobrança, webhook e conciliação.
- Push: Firebase Cloud Messaging com opt-in.
- Impressão: agente local/EscPos ou integração do PDV.
- Observabilidade: erros, auditoria de status e métricas de checkout.

## 10. Roadmap
- Fase 1: vitrine, cardápio, pedido estruturado e painel básico.
- Fase 2: pagamento real, webhooks, notificações e impressão.
- Fase 3: assinatura, agendamento, empresas, CRM e NPS.
- Fase 4: multi-tenant, tema por loja, domínio próprio e cobrança SaaS.

## 11. Eventos analíticos
`menu_viewed`, `product_viewed`, `item_added`, `checkout_started`, `coupon_applied`, `order_created`, `payment_confirmed`, `order_completed`, `loyalty_redeemed`, `subscription_started`, `campaign_clicked`.

## 12. Definição de pronto
Código tipado, build de produção aprovado, healthcheck verde, migração aplicada, fluxo mobile testado, dados de demonstração identificados, textos e preços validados pelo estabelecimento e plano de rollback documentado.
