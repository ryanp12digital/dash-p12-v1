# Directive: Meta Ads

## Objetivo
Buscar métricas de campanhas do Meta Ads (Facebook/Instagram) via Meta Marketing API.

## Entradas
- `META_USER_ACCESS_TOKEN` — token de usuário com permissão `ads_read`
- `META_GRAPH_API_VERSION` — versão da Graph API (padrão: v21.0)
- `account_id` — ID da conta de anúncios (ex.: `act_123456`)
- `time_range` — `{since: "YYYY-MM-DD", until: "YYYY-MM-DD"}`

## Ferramentas
- `execution/meta_ads.py` — todas as chamadas HTTP à Graph API

## Saídas
- Lista de contas de anúncios
- KPI rows (spent, impressions, reach, CTR, CPC, CPM, frequency, leads, etc.)
- Insights por gênero e região
- Lista de anúncios em destaque com thumbnail
- Comparação de métricas entre dois períodos para um anúncio

## Edge Cases
- Token expirado → MetaGraphError com código 190; usuário deve renovar o token
- Conta sem dados no período → retorna row null; KPIs ficam zerados
- Limite de paginação: máximo 25 páginas por chamada de breakdown
- Thumbnail bloqueada por permissão → retorna None; frontend usa placeholder SVG
- Rate limit da Graph API → não fazer retry automático sem consultar o usuário
