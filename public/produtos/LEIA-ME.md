# Fotos manuais de produtos

Quando um produto não tem foto válida na planilha, o site tenta usar uma foto salva
aqui, nesta pasta.

## Como usar

1. Salve a imagem do produto aqui com o **nome exatamente igual ao nome do produto**
   no catálogo (não precisa se preocupar com maiúscula/minúscula).
   - Exemplo: para o produto "WHISKY CHIVAS 18 ANOS", salve o arquivo como
     `WHISKY CHIVAS 18 ANOS.jpg` (ou `.jpeg`, `.png`, `.webp`).
2. Rode `npm run sync:catalogo -- --apply` de novo — o script encontra o arquivo
   automaticamente e usa ele no lugar da foto quebrada/vazia da planilha.

## Produtos sem foto agora (13/09/2026)

- APEROL
- GIN GORDON'S 750ML
- VODKA KOVAK
- WHISKY BALL 10ANOS 1L
- WHISKY BUCH ABACAXI 750ML
- WHISKY BUCHANANS 1L
- WHISKY CHIVAS 18 ANOS
- WHISKY JACK BLACKBERRY 1L
- WHISKY QN SABORES 1L
- WHISKY RED LABEL 1L
- WHISKY ROYAL SALUTE
- KIT BISCOITO PIRAQUE

Se preferir, também dá pra simplesmente arrumar o link na coluna `link_imagem` da
planilha — nesse caso não precisa colocar nada aqui.
