# 3. Planos de Mentoria

| Plano        | Público                | Diferenciais                             | Recorrência    |
| ------------ | ---------------------- | ---------------------------------------- | -------------- |
| Prata        | Iniciantes             | Todos os cursos pagos + videoconferência | Mensal / Anual |
| Ouro         | Profissionais          | Prata + telefone + reunião particular    | Mensal / Anual |
| Diamante     | Clínicas               | Ouro + treinamento particular + visita   | Mensal / Anual |
| Macroempresa | Indústrias / Franquias | Diamante + uso de imagem + palestras     | Anual          |

> ⚠️ **PENDENTE (obrigatório antes da Sprint 3):** Definir preços mensais e anuais de cada plano. Stripe Products/Prices serão criados com base nesses valores.
>
> **Política de pagamento para planos:**
>
> - **Cartão de crédito** (parcelado): via Stripe Subscription Checkout — suportado para todos os planos
> - **PIX**: Stripe Subscriptions **não suporta PIX nativamente**. PIX para planos deve ser tratado como **pagamento manual** (mercadopago_pix_order) + ativação manual pelo admin, **OU** decidir que planos aceitam apenas cartão. Definir com o cliente antes de S3.

---
