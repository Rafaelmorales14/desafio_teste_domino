import { test } from 'node:test';
import assert from 'node:assert/strict';
import { iniciarPartida, jogar, comprar, passar } from '../src/jogo.js';

const conjunto = Array.from({ length: 7 }, (_, a) =>
    Array.from({ length: 7 - a }, (_, i) => [a, a + i]),
).flat();

const sequencia = [
    [6, 6], [1, 6], [1, 2], [2, 3], [3, 4], [4, 5], [0, 5],
    [0, 1], [1, 3], [3, 5], [2, 5], [2, 4], [4, 6],
];
const maoZero = sequencia.filter((_, i) => i % 2 === 0);
const maoUm = [...sequencia.filter((_, i) => i % 2 === 1), [0, 0]];
const monteInicial = conjunto.filter(peca =>
    ![...maoZero, ...maoUm].some(daMao => daMao.join() === peca.join()),
);
const pecasOrdenadas = [...maoZero, ...maoUm, ...monteInicial];
const novaPartida = () => iniciarPartida(structuredClone(pecasOrdenadas));
const estadoIntermediario = (maos, monte = []) => ({
    maos,
    monte,
    mesa: [[1, 2], [2, 3]],
    vez: 0,
    passes: 0,
    status: 'em_andamento',
    vencedor: null,
});

test('D01 distribui sete peças por jogador e deixa 14 no monte', () => {
    assert.deepEqual(novaPartida(), {
        maos: [maoZero, maoUm],
        monte: monteInicial,
        mesa: [],
        vez: 0,
        passes: 0,
        status: 'em_andamento',
        vencedor: null,
    });
});

test('D02 encaixa e inverte peças nas duas pontas', () => {
    const inicial = estadoIntermediario([[[1, 4], [0, 0]], [[3, 5], [6, 6]]]);
    const esquerda = jogar(inicial, 0, [1, 4], 'esquerda');
    assert.deepEqual(esquerda.mesa, [[4, 1], [1, 2], [2, 3]]);
    assert.deepEqual(esquerda.maos[0], [[0, 0]]);
    assert.equal(esquerda.vez, 1);

    const direita = jogar(esquerda, 1, [5, 3], 'direita');
    assert.deepEqual(direita.mesa, [[4, 1], [1, 2], [2, 3], [3, 5]]);
    assert.deepEqual(direita.maos[1], [[6, 6]]);
    assert.equal(direita.vez, 0);
});

test('D03 rejeita peça incompatível, peça de outra mão e jogada fora da vez', () => {
    const inicial = estadoIntermediario([[[1, 4], [0, 0]], [[3, 5]]]);

    assert.throws(() => jogar(inicial, 0, [0, 0], 'direita'), RangeError);
    assert.throws(() => jogar(inicial, 0, [1, 4], 'direita'), RangeError);
    assert.throws(() => jogar(inicial, 0, [3, 5], 'direita'), RangeError);
    assert.throws(() => jogar(inicial, 1, [3, 5], 'direita'), RangeError);
});

test('D04 compra do topo até encontrar encaixe e mantém a vez entre compras', () => {
    const inicial = estadoIntermediario([[[0, 0]], [[6, 6]]], [[4, 4], [1, 5], [2, 6]]);
    const primeira = comprar(inicial, 0);
    assert.deepEqual(primeira.maos[0], [[0, 0], [4, 4]]);
    assert.deepEqual(primeira.monte, [[1, 5], [2, 6]]);
    assert.equal(primeira.vez, 0);
    assert.throws(() => passar(primeira, 0), RangeError);

    const segunda = comprar(primeira, 0);
    assert.deepEqual(segunda.maos[0], [[0, 0], [4, 4], [1, 5]]);
    assert.deepEqual(segunda.monte, [[2, 6]]);
    assert.equal(segunda.vez, 0);
    assert.throws(() => comprar(segunda, 0), RangeError);
    assert.equal(jogar(segunda, 0, [1, 5], 'esquerda').vez, 1);
});

test('D05 permite passe somente com monte vazio e nenhuma jogada', () => {
    assert.throws(() => passar(estadoIntermediario([[[1, 4]], [[4, 4]]]), 0), RangeError);

    const inicial = estadoIntermediario([[[0, 0]], [[4, 4]]]);
    assert.throws(() => comprar(inicial, 0), RangeError);
    const seguinte = passar(inicial, 0);
    assert.equal(seguinte.status, 'em_andamento');
    assert.equal(seguinte.vez, 1);
    assert.equal(seguinte.passes, 1);
});

test('D06 encerra uma partida completa ao jogar a última peça', () => {
    let estado = novaPartida();
    for (const [i, peca] of sequencia.entries()) {
        estado = jogar(estado, i % 2, peca, 'direita');
        if (i < sequencia.length - 1) {
            assert.equal(estado.status, 'em_andamento');
            assert.equal(estado.vez, (i + 1) % 2);
        }
    }
    assert.equal(estado.mesa.length, 13);
    assert.deepEqual(estado.maos, [[], [[0, 0]]]);
    assert.equal(estado.status, 'encerrada');
    assert.equal(estado.vencedor, 0);
    assert.equal(estado.vez, null);
});

test('D07 partida travada é vencida pela menor soma, com empate em somas iguais', () => {
    const cenarios = [
        { maos: [[[4, 4]], [[0, 6]]], vencedor: 1 },
        { maos: [[[0, 0]], [[6, 6]]], vencedor: 0 },
        { maos: [[[0, 6]], [[0, 2], [0, 4]]], vencedor: null },
    ];

    for (const { maos, vencedor } of cenarios) {
        const final = passar(passar(estadoIntermediario(maos), 0), 1);
        assert.equal(final.status, 'encerrada');
        assert.equal(final.vencedor, vencedor);
        assert.equal(final.vez, null);
    }
});

test('D08 uma jogada depois de um passe reinicia a contagem de passes', () => {
    const inicial = estadoIntermediario([[[0, 0]], [[3, 5], [6, 6]]]);
    const seguinte = jogar(passar(inicial, 0), 1, [3, 5], 'direita');
    assert.equal(seguinte.passes, 0);
    assert.equal(seguinte.vez, 0);
    assert.equal(seguinte.status, 'em_andamento');
});
