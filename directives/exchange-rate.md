# Directive: Exchange Rate

## Objetivo
Obter cotação USD→BRL do dia para converter valores monetários na interface.

## Entradas
- Nenhuma (API pública sem chave)
- `NEXT_PUBLIC_FALLBACK_USD_BRL` — valor fallback se a API falhar (padrão: 5.5)

## Ferramentas
- `execution/exchange_rate.py`

## Saídas
- `{rate: float, date: str, source: "frankfurter" | "fallback", error?: True}`

## Edge Cases
- API Frankfurter offline → retorna fallback sem lançar exceção
- Cache: a cotação muda uma vez por dia; o frontend pode cachear por até 1h sem problema
