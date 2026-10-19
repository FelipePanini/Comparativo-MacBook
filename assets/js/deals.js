// Rastreador de ofertas do MacBook Air M5 (16 GB · 512 GB), a configuração de entrada nos dois tamanhos.
// Para atualizar: acrescente uma linha em OFFERS (preço de hoje) e, se for um preço marcante, em HISTORY.
// Datas em AAAA-MM-DD; `when` é o texto mostrado quando a data exata não é conhecida.

export const TRACKER_CHECKED = '2026-10-18';

export const SIZES = {
  13: {
    id: '13', name: 'MacBook Air 13″', short: 'Air 13″', chip: 'M5',
    config: '16 GB · 512 GB · GPU de 8 núcleos', screen: '13,6″', weight: '≈ 1,24 kg',
    finish: 'meia-noite', apple: 1299, applePrev: 1099,
  },
  15: {
    id: '15', name: 'MacBook Air 15″', short: 'Air 15″', chip: 'M5',
    config: '16 GB · 512 GB · GPU de 10 núcleos', screen: '15,3″', weight: '≈ 1,51 kg',
    finish: 'azul-ceu', apple: 1499, applePrev: 1299,
  },
};

// channel: 'online' (só pela internet), 'loja' (só na loja física) ou 'ambos'.
export const TK_STORES = {
  amazon:        { name: 'Amazon', channel: 'online', hint: 'Entrega no hotel ou num Amazon Locker' },
  bestbuy:       { name: 'Best Buy', channel: 'ambos', hint: 'Retira na loja no mesmo dia; tem Open-Box' },
  bh:            { name: 'B&H Photo', channel: 'ambos', hint: 'Loja física só em Manhattan (fecha aos sábados)' },
  apple:         { name: 'Apple Store', channel: 'ambos', hint: 'Preço cheio; testa e sai com ele' },
  'apple-refurb':{ name: 'Apple Recondicionado', channel: 'online', hint: 'Garantia de 1 ano da Apple, caixa nova' },
  costco:        { name: 'Costco', channel: 'ambos', hint: 'Só para sócios; 2 anos de garantia' },
  walmart:       { name: 'Walmart', channel: 'ambos', hint: 'Confira se é vendido pelo próprio Walmart' },
  microcenter:   { name: 'Micro Center', channel: 'loja', hint: 'Preços "In Store Only": só na loja' },
  ebay:          { name: 'eBay Refurbished', channel: 'online', hint: 'Recondicionado com garantia do eBay' },
};

export const CONDITIONS = {
  novo: 'Novo',
  'open-box': 'Open-Box',
  recondicionado: 'Recondicionado',
};

// Ofertas de agora. `stale: true` = preço antigo, que fica de fora da "melhor oferta".
export const OFFERS = [
  // 13″
  { size: '13', store: 'amazon', condition: 'novo', price: 1234, date: '2026-10-16', note: 'Cor meia-noite; as outras saem por US$ 1.254 a 1.256', url: 'https://www.amazon.com/s?k=MacBook+Air+13+M5+16GB+512GB' },
  { size: '13', store: 'bh', condition: 'novo', price: 1234, date: '2026-10-16', note: 'Mesmo preço da Amazon', url: 'https://www.bhphotovideo.com/c/search?q=MacBook%20Air%2013%20M5%2016GB%20512GB' },
  { size: '13', store: 'apple-refurb', condition: 'recondicionado', price: 1099, date: '2026-09-15', note: 'Só quando tem estoque: aparece e some várias vezes por semana', url: 'https://www.apple.com/shop/refurbished/mac/macbook-air' },
  { size: '13', store: 'bestbuy', condition: 'novo', price: 1299, date: '2026-10-16', note: 'Fora de promoção em 16/10; no início de outubro estava a US$ 1.099', url: 'https://www.bestbuy.com/site/searchpage.jsp?st=macbook+air+13+m5' },
  { size: '13', store: 'apple', condition: 'novo', price: 1299, date: '2026-10-18', note: 'Preço cheio desde o aumento de 25/06/2026', url: 'https://www.apple.com/shop/buy-mac/macbook-air' },
  { size: '13', store: 'microcenter', condition: 'novo', price: 1299.99, date: '2026-10-18', note: 'Preço de etiqueta; peça o preço da loja de Marietta ou Duluth', url: 'https://www.microcenter.com/product/708456/apple-macbook-air-13-mdhe4ll-a-(early-2026)-136-laptop-computer-midnight' },
  { size: '13', store: 'bestbuy', condition: 'open-box', price: 989.99, date: '2026-07-20', when: 'jul/2026', stale: true, note: 'Open-Box "Excellent" visto em julho; muda de loja para loja', url: 'https://www.bestbuy.com/site/searchpage.jsp?st=open+box+macbook+air+13+m5' },
  { size: '13', store: 'costco', condition: 'novo', price: 949.99, date: '2026-06-15', when: 'jun/2026', stale: true, note: 'Preço de sócio antes do aumento; confira no app da Costco', url: 'https://www.costco.com/s?keyword=macbook+air+m5' },

  // 15″
  { size: '15', store: 'amazon', condition: 'novo', price: 1399, date: '2026-10-16', note: 'Meia-noite, azul-céu e estelar', url: 'https://www.amazon.com/s?k=MacBook+Air+15+M5+16GB+512GB' },
  { size: '15', store: 'bestbuy', condition: 'novo', price: 1399, date: '2026-10-16', note: 'Retira na loja no mesmo dia', url: 'https://www.bestbuy.com/product/apple-macbook-air-15-inch-laptop-m5-chip-with-10-core-cpu-and-10-core-gpu-16gb-memory-512gb-ssd-midnight/JJGCQLKQL9' },
  { size: '15', store: 'bh', condition: 'novo', price: 1399, date: '2026-10-16', note: 'Prateado sai por US$ 1.444', url: 'https://www.bhphotovideo.com/c/search?q=MacBook%20Air%2015%20M5%2016GB%20512GB' },
  { size: '15', store: 'walmart', condition: 'novo', price: 1444, date: '2026-10-11', url: 'https://www.walmart.com/ip/Apple-15-inch-MacBook-Air-Apple-M5-nbsp-chip-w-10-core-CPU-10-core-GPU-512GB-SSD-16GB-RAM-Silver-MDV94LL-A-2026/19710568181' },
  { size: '15', store: 'costco', condition: 'novo', price: 1459.99, date: '2026-10-11', note: 'Sócios; inclui 2 anos de garantia', url: 'https://www.costco.com/p/-/macbook-air-laptop-15-inch-with-apple-m5-chip-built-for-apple-intelligence/4000444232' },
  { size: '15', store: 'apple', condition: 'novo', price: 1499, date: '2026-10-18', note: 'Preço cheio desde o aumento de 25/06/2026', url: 'https://www.apple.com/shop/buy-mac/macbook-air' },
];

// Melhor preço de novo visto em cada data (não é monitoramento contínuo: são os pontos registrados).
export const HISTORY = {
  13: [
    { date: '2026-03-11', price: 1099, store: 'apple', when: 'mar/2026', note: 'Lançamento' },
    { date: '2026-04-05', price: 949, store: 'amazon', when: 'abr/2026', note: 'Liquidação de abril da Amazon' },
    { date: '2026-05-28', price: 899.99, store: 'amazon', note: 'Menor preço da história; Costco também, para sócios' },
    { date: '2026-07-14', price: 1149, store: 'amazon', when: 'meados de jul/2026', note: 'Relâmpago, já depois do aumento' },
    { date: '2026-07-24', price: 1199, store: 'bestbuy', note: '"Black Friday in July" (até 26/07)' },
    { date: '2026-08-14', price: 1240, store: 'amazon', note: 'Perto do preço cheio' },
    { date: '2026-10-06', price: 1099, store: 'amazon', note: 'Prime Big Deal Days; Best Buy igualou' },
    { date: '2026-10-16', price: 1234, store: 'amazon', note: 'Depois do fim das promoções' },
  ],
  15: [
    { date: '2026-03-11', price: 1299, store: 'apple', when: 'mar/2026', note: 'Lançamento' },
    { date: '2026-05-04', price: 1129, store: 'bh', note: 'Com cupom' },
    { date: '2026-05-21', price: 1099, store: 'amazon', note: 'Menor preço da história' },
    { date: '2026-06-03', price: 1099, store: 'amazon', note: 'Guerra de preços: Amazon e B&H' },
    { date: '2026-09-07', price: 1349, store: 'amazon', when: 'início de set/2026', note: 'Antes do evento da Apple' },
    { date: '2026-09-28', price: 1399, store: 'amazon', note: 'US$ 100 de desconto' },
    { date: '2026-10-06', price: 1299, store: 'amazon', note: 'Prime Big Deal Days; Best Buy igualou' },
    { date: '2026-10-16', price: 1399, store: 'amazon', note: 'Amazon, Best Buy e B&H' },
  ],
};

// Preço da Apple nos EUA (degraus).
export const APPLE_STEPS = {
  13: [['2026-03-11', 1099], ['2026-06-25', 1299]],
  15: [['2026-03-11', 1299], ['2026-06-25', 1499]],
};
export const PRICE_HIKE = { date: '2026-06-25', label: 'Aumento da Apple (25/06)' };

// Menores preços já vistos, por loja.
export const RECORDS = {
  13: [
    { store: 'amazon', condition: 'novo', price: 899.99, when: '28/05/2026' },
    { store: 'costco', condition: 'novo', price: 899.99, when: 'fim de mai/2026', note: 'sócios' },
    { store: 'bestbuy', condition: 'novo', price: 949, when: '1º semestre de 2026', note: 'Tech Fest' },
    { store: 'ebay', condition: 'recondicionado', price: 949, when: 'meados de ago/2026' },
    { store: 'bestbuy', condition: 'open-box', price: 989.99, when: 'jul/2026' },
    { store: 'apple-refurb', condition: 'recondicionado', price: 1099, when: 'ago e set/2026' },
  ],
  15: [
    { store: 'amazon', condition: 'novo', price: 1099, when: '21/05/2026' },
    { store: 'bh', condition: 'novo', price: 1099, when: '03/06/2026', note: 'só meia-noite' },
    { store: 'bestbuy', condition: 'novo', price: 1299, when: 'out/2026', note: 'Techtober' },
  ],
};
export const SINCE_HIKE = {
  13: { price: 1099, when: '06/10/2026', where: 'Amazon e Best Buy' },
  15: { price: 1299, when: '06/10/2026', where: 'Amazon e Best Buy' },
};

// Brasil: lojas oficiais (com nota e garantia Apple Brasil). Preços à vista.
export const BRAZIL = {
  13: {
    apple: 15999, appleCash: 14399.1,
    best: { store: 'Magazine Luiza', price: 13949.1, date: '2026-10-18', note: 'à vista; ou 10× de R$ 1.549,90', url: 'https://www.zoom.com.br/notebook/macbook-apple-air-apple-m5-13-6-16gb-ssd-512-gb-mac-os' },
    low: { store: 'KaBuM!', price: 9499, when: '13/05/2026', note: 'à vista, antes do aumento' },
    steps: [['2026-03-23', 13999], ['2026-06-25', 15999]],
    points: [
      { date: '2026-05-13', price: 9499, store: 'KaBuM!', note: 'Menor preço já visto no Brasil' },
      { date: '2026-10-18', price: 13949.1, store: 'Magazine Luiza', note: 'À vista' },
    ],
  },
  15: {
    apple: 17999, appleCash: 16199.1,
    best: { store: 'Amazon Brasil', price: 15699, date: '2026-10-11', note: 'Magazine Luiza: R$ 16.469 à vista', url: 'https://www.amazon.com.br/Apple-MacBook-polegadas-n%C3%BAcleos-unificada/dp/B0GR1PLR1K' },
    importers: [10799, 11299],
    steps: [['2026-03-23', 15999], ['2026-06-25', 17999]],
    points: [
      { date: '2026-10-11', price: 15699, store: 'Amazon Brasil', note: 'À vista' },
      { date: '2026-10-18', price: 16469.1, store: 'Magazine Luiza', note: 'À vista' },
    ],
  },
};

// Cidades e regiões. Em Atlanta o imposto muda de condado para condado.
export const CITIES = [
  { id: 'atl-cobb', short: 'Atlanta (Cobb)', metro: 'Atlanta', label: 'Cobb · Marietta, Smyrna, Cumberland', rate: 6,
    stores: [['microcenter', 'Micro Center Marietta'], ['apple', 'Apple Cumberland Mall'], ['bestbuy', 'Best Buy'], ['costco', 'Costco']] },
  { id: 'atl-gwinnett', short: 'Atlanta (Gwinnett)', metro: 'Atlanta', label: 'Gwinnett · Duluth, Buford', rate: 6,
    stores: [['microcenter', 'Micro Center Duluth'], ['apple', 'Apple Mall of Georgia'], ['bestbuy', 'Best Buy'], ['costco', 'Costco']] },
  { id: 'atl-alpharetta', short: 'Atlanta (Alpharetta)', metro: 'Atlanta', label: 'Alpharetta · norte de Fulton', rate: 7.75,
    stores: [['apple', 'Apple Avalon'], ['bestbuy', 'Best Buy']] },
  { id: 'atl-dunwoody', short: 'Atlanta (Dunwoody)', metro: 'Atlanta', label: 'Dunwoody · DeKalb', rate: 8,
    stores: [['apple', 'Apple Perimeter'], ['bestbuy', 'Best Buy']] },
  { id: 'atl-city', short: 'Atlanta (cidade)', metro: 'Atlanta', label: 'Cidade de Atlanta · Buckhead, Midtown', rate: 8.9,
    stores: [['apple', 'Apple Lenox Square'], ['bestbuy', 'Best Buy']] },
  { id: 'de', short: 'Delaware', metro: 'Sem sales tax', label: 'Delaware · Wilmington, Newark', rate: 0,
    stores: [['apple', 'Apple Christiana Mall'], ['bestbuy', 'Best Buy'], ['costco', 'Costco']] },
  { id: 'or', short: 'Oregon', metro: 'Sem sales tax', label: 'Oregon · Portland', rate: 0,
    stores: [['apple', 'Apple Pioneer Place'], ['apple', 'Apple Washington Square'], ['bestbuy', 'Best Buy'], ['costco', 'Costco']] },
  { id: 'nh', short: 'New Hampshire', metro: 'Sem sales tax', label: 'New Hampshire · Salem, Nashua', rate: 0,
    stores: [['apple', 'Apple Rockingham Park'], ['bestbuy', 'Best Buy'], ['costco', 'Costco']] },
  { id: 'fl-orlando', short: 'Orlando', metro: 'Outras cidades', label: 'Orlando', rate: 6.5,
    stores: [['apple', 'Apple Florida Mall'], ['apple', 'Apple Millenia'], ['bestbuy', 'Best Buy'], ['costco', 'Costco']] },
  { id: 'fl-miami', short: 'Miami', metro: 'Outras cidades', label: 'Miami', rate: 7,
    stores: [['apple', 'Apple Aventura'], ['apple', 'Apple Dadeland'], ['bestbuy', 'Best Buy'], ['costco', 'Costco']] },
  { id: 'ma-boston', short: 'Boston', metro: 'Outras cidades', label: 'Boston', rate: 6.25,
    stores: [['microcenter', 'Micro Center Cambridge'], ['apple', 'Apple Boylston Street'], ['bestbuy', 'Best Buy']] },
  { id: 'tx', short: 'Houston e Dallas', metro: 'Outras cidades', label: 'Houston e Dallas', rate: 8.25,
    stores: [['microcenter', 'Micro Center Houston e Dallas'], ['apple', 'Apple Galleria e NorthPark'], ['bestbuy', 'Best Buy']] },
  { id: 'nv-lv', short: 'Las Vegas', metro: 'Outras cidades', label: 'Las Vegas', rate: 8.375,
    stores: [['apple', 'Apple Forum Shops'], ['bestbuy', 'Best Buy'], ['costco', 'Costco']] },
  { id: 'ny-nyc', short: 'Nova York', metro: 'Outras cidades', label: 'Nova York', rate: 8.875,
    stores: [['bh', 'B&H Photo (Manhattan)'], ['apple', 'Apple Fifth Avenue'], ['bestbuy', 'Best Buy']] },
  { id: 'ca-la', short: 'Los Angeles', metro: 'Outras cidades', label: 'Los Angeles', rate: 9.75,
    stores: [['microcenter', 'Micro Center Tustin'], ['apple', 'Apple The Grove'], ['bestbuy', 'Best Buy']] },
  { id: 'il-chicago', short: 'Chicago', metro: 'Outras cidades', label: 'Chicago', rate: 10.25,
    stores: [['microcenter', 'Micro Center Chicago'], ['apple', 'Apple Michigan Avenue'], ['bestbuy', 'Best Buy']] },
];
export const DEFAULT_CITY = 'atl-cobb';

// Janelas de promoção. A Apple não dá desconto: na Black Friday ela oferece vale-presente.
export const CALENDAR = [
  { start: '2026-10-06', end: '2026-10-07', name: 'Prime Big Deal Days', past: true, note: 'Air 13″ a US$ 1.099 e 15″ a US$ 1.299, os menores preços desde o aumento.' },
  { start: '2026-11-26', end: '2026-11-30', name: 'Black Friday e Cyber Monday', hot: true, note: 'Costuma trazer os melhores preços do ano em MacBook na Amazon, Best Buy e Costco. A melhor chance de ficar perto de US$ 1.000.' },
  { start: '2026-12-01', end: '2026-12-24', name: 'Ofertas de fim de ano', note: 'Amazon e Best Buy costumam repetir preços da Black Friday em dezembro.' },
  { start: '2027-02-12', end: '2027-02-15', name: 'Presidents’ Day', note: 'Promoções menores; vale olhar Amazon e Best Buy.' },
  { start: '2027-03-01', end: '2027-03-31', name: 'Março: época de Mac novo', note: 'O Air M4 e o Air M5 saíram em março. Quando sai um modelo novo, as lojas baixam o preço do anterior.' },
];

// Onde acompanhar e criar alertas (o site não consulta as lojas sozinho).
export const ALERTS = [
  { name: 'camelcamelcamel', what: 'Histórico e alerta de preço da Amazon por e-mail', url: 'https://camelcamelcamel.com/search?sq=macbook+air+m5' },
  { name: 'MacRumors · ofertas de MacBook', what: 'Lista atualizada com o menor preço de cada configuração', url: 'https://www.macrumors.com/guide/macbook-pro-air-deals/' },
  { name: '9to5Toys · Apple', what: 'Ofertas do dia, inclusive recondicionados da Apple', url: 'https://9to5toys.com/guides/apple/' },
  { name: 'Slickdeals', what: 'Alertas da comunidade, bons para Costco e lojas físicas', url: 'https://slickdeals.net/newsearch.php?q=macbook+air+m5' },
  { name: 'Zoom (Brasil)', what: 'Histórico e alerta do preço no Brasil', url: 'https://www.zoom.com.br/notebook/macbook-apple-air-apple-m5-13-6-16gb-ssd-512-gb-mac-os' },
];

export const TRACKER_SOURCES = [
  ['MacRumors · ofertas de MacBook Air M5 (16/10/2026)', 'https://www.macrumors.com/guide/macbook-pro-air-deals/'],
  ['MacRumors · todos os Air M5 com US$ 200 de desconto (09/10/2026)', 'https://www.macrumors.com/2026/10/09/every-m5-macbook-air-200-off/'],
  ['9to5Toys · Air M5 no Prime Day de outono (06/10/2026)', 'https://9to5toys.com/2026/10/06/m5-macbook-air-now-200-off-in-official-fall-prime-day-sale/'],
  ['Appleosophy · Best Buy e Amazon a US$ 1.099 (05/10/2026)', 'https://appleosophy.com/2026/10/05/deal-save-200-off-on-the-latest-macbook-air-with-m5/'],
  ['AppleInsider · Air 15″ M5 a US$ 1.399 (28/09/2026)', 'https://appleinsider.com/articles/26/09/28/apples-m5-15-inch-macbook-air-dips-to-1399-at-amazon'],
  ['9to5Toys · Air 13″ recondicionado a US$ 1.099 (15/09/2026)', 'https://9to5toys.com/2026/09/15/most-affordable-m5-macbook-air-apple-refurb/'],
  ['9to5Toys · recondicionado e mínima depois do aumento (14/08/2026)', 'https://9to5toys.com/2026/08/14/affordable-13-inch-m5-macbook-air-best-deals/'],
  ['Dealnews · "Black Friday in July" da Best Buy', 'https://www.dealnews.com/Best-Buy-Black-Friday-in-July-Mac-Book-Air-M5-Deals-for-From-1-199-free-shipping/21923084.html'],
  ['Slickdeals · Open-Box do Air 13″ M5 a US$ 989,99', 'https://slickdeals.net/f/19784172-open-boxes-apple-macbook-air-13-m5-16gb-ram-512gb-ssd-989-99'],
  ['Slickdeals · Costco a US$ 899,99 (mai/2026)', 'https://slickdeals.net/f/19553265-apple-macbook-air-13-6-laptop-2026-m5-10-core-chip-16gb-ram-512gb-ssd-899-99-at-costco'],
  ['AppleInsider · Air 15″ M5 a US$ 1.099 na guerra de preços (03/06/2026)', 'https://appleinsider.com/articles/26/06/03/apples-15-inch-macbook-air-m5-plunges-to-1099-in-price-war'],
  ['MacRumors · Amazon a partir de US$ 899,99 (28/05/2026)', 'https://www.macrumors.com/2026/05/28/amazon-m5-macbook-air-199-off'],
  ['AppleInsider · Air 15″ M5 a US$ 1.099 (21/05/2026)', 'https://appleinsider.com/articles/26/05/21/apples-m5-15-inch-macbook-air-drops-to-record-low-1099-at-amazon'],
  ['AppleInsider · Air 15″ M5 a US$ 1.129 na B&H (04/05/2026)', 'https://appleinsider.com/articles/26/05/04/apples-m5-15-inch-macbook-air-drops-to-record-low-1129-with-coupon'],
  ['Tom’s Guide · Air M5 a US$ 949 (abr/2026)', 'https://www.tomsguide.com/computing/macbooks/the-macbook-air-m5-just-hit-its-lowest-pricer-ever-save-usd150-on-amazon-now'],
  ['Micro Center · Air 13″ M5 16/512', 'https://www.microcenter.com/product/708456/apple-macbook-air-13-mdhe4ll-a-(early-2026)-136-laptop-computer-midnight'],
  ['Refurb.me · Air M5 novo ou recondicionado', 'https://www.refurb.me/blog/macbook-air-new-vs-refurbished'],
  ['Tecnoblog · Apple aumenta preços no Brasil (25/06/2026)', 'https://tecnoblog.net/noticias/apple-aumenta-precos-de-macbooks-e-ipads-no-brasil/'],
  ['MacMagazine · Air M5 à venda no Brasil (23/03/2026)', 'https://macmagazine.com.br/post/2026/03/23/macbooks-air-m5-de-13-e-15-ja-estao-a-venda-no-brasil/'],
  ['MacMagazine · Air 13″ M5 a R$ 9.499 na KaBuM! (13/05/2026)', 'https://macmagazine.com.br/post/2026/05/13/oferta-macbook-air-de-13-m5-com-29-de-desconto/'],
  ['Zoom · Air 13″ M5 16/512 no Brasil', 'https://www.zoom.com.br/notebook/macbook-apple-air-apple-m5-13-6-16gb-ssd-512-gb-mac-os'],
  ['Zoom · Air 15″ M5 no Brasil', 'https://www.zoom.com.br/busca/macbook+air+m5+15'],
  ['The Mac Index · Air 15″ M5 pelo mundo', 'https://themacindex.com/br/products/macbook-air/15-inch-m5-10-core-16gb-512gb-midnight'],
  ['SalesTaxHandbook · Atlanta 8,9%', 'https://www.salestaxhandbook.com/georgia/rates/atlanta'],
  ['Stripe · sales tax da Geórgia por condado', 'https://stripe.com/resources/more/georgia-sales-tax-rate'],
  ['Receita Federal · perguntas e respostas do viajante', 'https://www.gov.br/receitafederal/pt-br/assuntos/aduana-e-comercio-exterior/viagens-internacionais/guia-do-viajante/perguntas-e-respostas'],
  ['Fenacon · multa de 50% para bens não declarados', 'https://fenacon.org.br/noticias/receita-orienta-contribuintes-sobre-compras-no-exterior/'],
  ['Nomad · notebook entra na cota, mesmo usado', 'https://www.nomadglobal.com/conteudos/o-que-pode-trazer-do-exterior'],
  ['360meridianos · cota individual, sem somar com a família', 'https://www.360meridianos.com/compras-exterior-limites-e-regras-da-receita-federal/'],
  ['MacRumors · MacBook Neo', 'https://www.macrumors.com/roundup/macbook-neo/'],
];
