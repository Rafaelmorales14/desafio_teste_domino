# Dominó para dois jogadores

## Especificação

A partida usa o conjunto duplo-seis, com 28 peças únicas. Cada jogador recebe sete peças e as 14 restantes formam o monte. As peças encaixam por valor em qualquer ponta. Quem não tem encaixe compra uma peça de cada vez até encontrar uma jogada ou esgotar o monte. Dois passes seguidos encerram uma partida travada. [Variante de dominó com compra](https://mobilityware.helpshift.com/hc/en/58-dominoes/faq/3806-basic-rules/?contact=1&p=android)

Nesta especificação, o jogador `0` abre a partida. Vence quem esvaziar sua mão. Se a partida travar, ganha a menor soma dos números das peças restantes. Somas iguais dão empate.

## Contrato para a implementação

Em `src/jogo.js`, exporte `iniciarPartida`, `jogar`, `comprar` e `passar` como funções síncronas. Cada peça é um par de inteiros de `0` a `6`. A ordem no par é livre na mão e na entrada de uma jogada. Na mesa, os pares ficam orientados da esquerda para a direita.

- `iniciarPartida(pecas)` recebe as 28 peças na ordem de distribuição. As primeiras sete são do jogador `0`, as sete seguintes são do jogador `1` e as demais vão para o monte. Retorne `{ maos, monte, mesa: [], vez: 0, passes: 0, status: 'em_andamento', vencedor: null }`. Preserve a ordem das peças nas mãos e no monte.
- `jogar(estado, jogador, peca, ponta)` aceita `esquerda` ou `direita`. Na mesa vazia, coloca a peça na orientação fornecida. Nas demais jogadas, orienta a peça para encaixar, retira a peça da mão, zera os passes e passa a vez ao outro jogador se a partida continuar.
- `comprar(estado, jogador)` só é permitido na vez do jogador, quando ele não tem encaixe e o monte contém peças. Mova a primeira peça do monte para o fim da mão e mantenha a vez.
- `passar(estado, jogador)` só é permitido na vez do jogador, com monte vazio e sem encaixe. Incremente `passes`, passe a vez ou encerre no segundo passe consecutivo.
- As três ações devolvem o estado atualizado. Lance `RangeError` para ações proibidas. Ao encerrar, use `status: 'encerrada'`, `vez: null` e `vencedor` igual a `0`, `1` ou `null` em caso de empate.

## Casos de teste

- **D01** confere as duas mãos, o monte, a mesa vazia e o jogador inicial.
- **D02** verifica encaixe e orientação nas duas pontas, retirada da mão e alternância da vez.
- **D03** rejeita peça incompatível com a ponta escolhida, peça ausente da mão e jogada fora da vez.
- **D04** verifica compras sucessivas do topo do monte, sem passar a vez, e rejeita compra quando já há encaixe.
- **D05** rejeita passe com encaixe e compra com monte vazio. Confirma passe sem encaixe e com monte vazio.
- **D06** joga uma partida inteira com uma sequência fixa até o jogador `0` bater.
- **D07** encerra uma partida travada por dois passes e verifica vitórias de ambos os jogadores e empate.
- **D08** confirma que jogar após um passe zera a contagem de passes consecutivos.

## Execução

Com Node.js 24, rode `npm test` na raiz. A entrega registra a etapa **Red** do TDD. Sem `src/jogo.js`, a suíte retorna código 1 com `ERR_MODULE_NOT_FOUND`. Crie esse módulo com o contrato acima e repita `npm test` para executar as asserções.

## Colaborador

Rafael Blasques Morales ([Rafaelmorales14](https://github.com/Rafaelmorales14)).
