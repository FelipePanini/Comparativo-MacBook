# Mac na Mala · Qual MacBook comprar nos EUA

Comparativo visual de seis MacBooks de 15″ e 16″ (todos com 16 GB de memória e 512 GB de SSD) para quem vai comprar nos Estados Unidos: preços em lojas oficiais e de recondicionados, custo final em reais e um checklist da viagem.

Modelos: MacBook Air 15″ M2, M3, M4 e M5, MacBook Pro 16″ 2019 (Intel) e 2021 (M1 Pro).
Preços consultados entre 11 e 18/10/2026.

Duas páginas:

- `index.html`: o comparativo dos seis modelos.
- `ofertas.html`: o **rastreador de ofertas do MacBook Air M5** (13″ e 15″, 16 GB/512 GB).

## O que tem no site

- **Hero com rolagem:** a tampa do MacBook abre e a tela acende conforme você rola.
- **Veredito:** as três escolhas recomendadas, com o custo estimado em reais.
- **Linha do tempo fixa:** a seção trava na tela e cada rolada troca o modelo (2019 → 2026), com o desempenho subindo junto.
- **Carrossel arrastável:** arraste ou "jogue" os cartões; tocar abre um painel com prós e contras, lojas, preços e especificações (arraste o painel para baixo para fechar).
- **Desempenho, especificações lado a lado e gráfico de preços** que acompanham a rolagem.
- **Atualizações:** até quando cada modelo recebe versões novas do macOS e correções de segurança, quantas versões faltam e o custo por ano de uso; mais uma tabela de conserto (vintage/obsoleto na Apple) e troca de bateria.
- **Raio-X do Pro 16″ 2021:** seção fixa em que cada rolada mostra uma parte (tela, portas, chip, bateria, som, suporte).
- **Pro 2021 vale a pena?:** comparação com o Pro 16″ M2 Pro (2023) e o Air M5, versões para procurar (16 GB, 32 GB, M1 Max) e um checklist para marcar na hora da compra (salvo no aparelho).
- **Lojas:** Apple, Apple Certified Refurbished, Amazon, Best Buy, Costco, Walmart, Back Market e eBay Refurbished.
- **Calculadora:** preço + sales tax do estado + IOF + imposto de importação acima da cota de US$ 1.000, comparado ao preço no Brasil.
- **Dicas:** cota da Receita, teclado americano, garantia, o que testar num recondicionado.

## Rastreador de ofertas do Air M5 (`ofertas.html`)

- **Hero com rolagem:** o preço de cada tamanho cai do valor da Apple até a melhor oferta, e aparece o custo final em reais.
- **Melhor oferta agora:** escolha 13″ ou 15″ e onde vai comprar. Mostra o preço, a conta completa (preço, sales tax, IOF, imposto de importação), quanto da cota de US$ 1.000 foi usado, o teto de preço para entrar na cota e quanto você economiza em relação ao Brasil.
- **Todas as ofertas:** lojas físicas e online (Amazon, Best Buy, B&H, Apple, Apple Recondicionado, Costco, Walmart, Micro Center), com filtro por canal e estado (novo, Open-Box, recondicionado) e selos de menor preço já visto.
- **A conta, seção fixa:** cada rolada soma uma taxa numa cascata e termina com o preço no Brasil ao lado.
- **Histórico:** gráfico desde o lançamento (mar/2026), com o aumento da Apple em 25/06, a linha do teto da cota e a Black Friday. Alterna entre dólar e "custo final × Brasil". Tem versão em tabela e os recordes por loja.
- **Brasil × EUA:** barras com a melhor oferta dos EUA (com taxas) contra a melhor loja brasileira e a Apple Brasil.
- **Cidades:** Atlanta por condado (Cobb e Gwinnett 6%, cidade de Atlanta 8,9%…), estados sem sales tax e outras cidades, com as lojas de cada uma. Tocar numa cidade refaz as contas da página inteira.
- **Quando comprar:** calendário de promoções; informe as datas da viagem para ver o que coincide.
- **Como pagar menos imposto:** estratégias e mitos (cota individual, multa por não declarar, notebook usado entra na cota).
- **Meus preços:** registre um preço visto numa loja; ele entra na lista, no gráfico e na conta. Fica salvo só no aparelho (localStorage), junto com tamanho, cidade e câmbio escolhidos.

O site não consulta as lojas sozinho: os preços vêm de `assets/js/deals.js`, e a seção "Meus preços" lista serviços de alerta (camelcamelcamel, Slickdeals etc.).

## Rodar localmente

É um site estático, sem build. Qualquer servidor serve:

```bash
python3 -m http.server 8000
# abra http://localhost:8000
```

(Abrir o `index.html` direto do disco não funciona, porque os scripts são módulos ES.)

## Atualizar preços e textos

Todos os números ficam em `assets/js/data.js`:

- `PRICES`: um item por anúncio (modelo, loja, condição, preço em US$, data, link). Use `stale: true` quando não der para confirmar a data.
- `MODELS`: especificações, prós e contras, resumo e veredito de cada modelo.
- `STORES`, `STATES` (sales tax) e `DEFAULTS` (dólar, IOF, cota).
- `support` e `service` dentro de cada modelo: faixa de anos da última versão grande do macOS e do fim das correções de segurança, e datas de conserto/bateria. A Apple não publica esses prazos; o método está em `SUPPORT_NOTE`.
- `PRO2021`: textos do Raio-X, versões, a comparação com o M2 Pro e o checklist.
- `SOURCES`: a lista de fontes do rodapé.

O rastreador usa `assets/js/deals.js`:

- `OFFERS`: preço de hoje em cada loja (`size` '13' ou '15', `store`, `condition`, `price`, `date` em AAAA-MM-DD). `stale: true` tira o preço da "melhor oferta".
- `HISTORY`: um ponto por preço marcante (vira o gráfico). `RECORDS` e `SINCE_HIKE`: os menores preços.
- `BRAZIL`: preços no Brasil. `CITIES`: sales tax e lojas por região. `CALENDAR`: janelas de promoção.
- Ao atualizar, mude também `TRACKER_CHECKED`.

Depois de editar, recarregue a página. Não há mais nada para mudar.

## Estrutura

```
index.html            estrutura das seções
assets/css/style.css  tokens (claro/escuro), layout, movimento e acessibilidade
ofertas.html          rastreador de ofertas do Air M5
assets/js/data.js     dados do comparativo
assets/js/deals.js    dados do rastreador (ofertas, histórico, Brasil, cidades, calendário)
assets/js/spring.js   molas no estilo Apple (damping + response), projeção de inércia e elástico
assets/js/core.js     peças comuns: utilidades, motor de rolagem, cálculo de custo, navegação, ícones
assets/js/app.js      página do comparativo: carrossel, painel, gráficos e calculadora
assets/js/tracker.js  página do rastreador
assets/img/           favicon
```

## Design e acessibilidade

- Base visual: o clone da página do MacBook Pro 16″ feito no Webflow (fundo branco, títulos grandes com a primeira linha em cinza, sub-navegação fixa com botão azul).
- Movimento: molas criticamente amortecidas por padrão; um pouco de quique só depois de um gesto com inércia. Tudo pode ser interrompido no meio.
- Respeita `prefers-reduced-motion` (sem deslocamentos, só esmaecimentos), `prefers-reduced-transparency`, `prefers-contrast` e o modo escuro do sistema.
- Cores dos gráficos validadas para daltonismo; todo gráfico tem legenda e versão em tabela.

## Publicar no GitHub Pages

Settings → Pages → Deploy from a branch → `main` / `/ (root)`.

---

Projeto pessoal, sem vínculo com a Apple ou com as lojas citadas. Preços mudam todos os dias: confira o anúncio antes de comprar.
