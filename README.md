# Mac na Mala · Qual MacBook comprar nos EUA

Comparativo visual de seis MacBooks de 15″ e 16″ (todos com 16 GB de memória e 512 GB de SSD) para quem vai comprar nos Estados Unidos: preços em lojas oficiais e de recondicionados, custo final em reais e um checklist da viagem.

Modelos: MacBook Air 15″ M2, M3, M4 e M5, MacBook Pro 16″ 2019 (Intel) e 2021 (M1 Pro).
Preços consultados em 11 e 12/10/2026.

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

Depois de editar, recarregue a página. Não há mais nada para mudar.

## Estrutura

```
index.html            estrutura das seções
assets/css/style.css  tokens (claro/escuro), layout, movimento e acessibilidade
assets/js/data.js     fonte única dos dados
assets/js/spring.js   molas no estilo Apple (damping + response), projeção de inércia e elástico
assets/js/app.js      renderização, rolagem, carrossel, painel, gráficos e calculadora
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
