import { test, expect } from '@jest/globals';
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
    expect(novaPartida()).toEqual({
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
    expect(esquerda.mesa).toEqual([[4, 1], [1, 2], [2, 3]]);
    expect(esquerda.maos[0]).toEqual([[0, 0]]);
    expect(esquerda.vez).toBe(1);

    const direita = jogar(esquerda, 1, [5, 3], 'direita');
    expect(direita.mesa).toEqual([[4, 1], [1, 2], [2, 3], [3, 5]]);
    expect(direita.maos[1]).toEqual([[6, 6]]);
    expect(direita.vez).toBe(0);
});

test('D03 rejeita peça incompatível, peça de outra mão e jogada fora da vez', () => {
    const inicial = estadoIntermediario([[[1, 4], [0, 0]], [[3, 5]]]);

    expect(() => jogar(inicial, 0, [0, 0], 'direita')).toThrow(RangeError);
    expect(() => jogar(inicial, 0, [1, 4], 'direita')).toThrow(RangeError);
    expect(() => jogar(inicial, 0, [3, 5], 'direita')).toThrow(RangeError);
    expect(() => jogar(inicial, 1, [3, 5], 'direita')).toThrow(RangeError);
});

test('D04 compra do topo até encontrar encaixe e mantém a vez entre compras', () => {
    const inicial = estadoIntermediario([[[0, 0]], [[6, 6]]], [[4, 4], [1, 5], [2, 6]]);
    const primeira = comprar(inicial, 0);
    expect(primeira.maos[0]).toEqual([[0, 0], [4, 4]]);
    expect(primeira.monte).toEqual([[1, 5], [2, 6]]);
    expect(primeira.vez).toBe(0);
    expect(() => passar(primeira, 0)).toThrow(RangeError);

    const segunda = comprar(primeira, 0);
    expect(segunda.maos[0]).toEqual([[0, 0], [4, 4], [1, 5]]);
    expect(segunda.monte).toEqual([[2, 6]]);
    expect(segunda.vez).toBe(0);
    expect(() => comprar(segunda, 0)).toThrow(RangeError);
    expect(jogar(segunda, 0, [1, 5], 'esquerda').vez).toBe(1);
});

test('D05 permite passe somente com monte vazio e nenhuma jogada', () => {
    expect(() => passar(estadoIntermediario([[[1, 4]], [[4, 4]]]), 0)).toThrow(RangeError);

    const inicial = estadoIntermediario([[[0, 0]], [[4, 4]]]);
    expect(() => comprar(inicial, 0)).toThrow(RangeError);
    const seguinte = passar(inicial, 0);
    expect(seguinte.status).toBe('em_andamento');
    expect(seguinte.vez).toBe(1);
    expect(seguinte.passes).toBe(1);
});

test('D06 encerra uma partida completa ao jogar a última peça', () => {
    let estado = novaPartida();
    for (const [i, peca] of sequencia.entries()) {
        estado = jogar(estado, i % 2, peca, 'direita');
        if (i < sequencia.length - 1) {
            expect(estado.status).toBe('em_andamento');
            expect(estado.vez).toBe((i + 1) % 2);
        }
    }
    expect(estado.mesa.length).toBe(13);
    expect(estado.maos).toEqual([[], [[0, 0]]]);
    expect(estado.status).toBe('encerrada');
    expect(estado.vencedor).toBe(0);
    expect(estado.vez).toBe(null);
});

test('D07 partida travada é vencida pela menor soma, com empate em somas iguais', () => {
    const cenarios = [
        { maos: [[[4, 4]], [[0, 6]]], vencedor: 1 },
        { maos: [[[0, 0]], [[6, 6]]], vencedor: 0 },
        { maos: [[[0, 6]], [[0, 2], [0, 4]]], vencedor: null },
    ];

    for (const { maos, vencedor } of cenarios) {
        const final = passar(passar(estadoIntermediario(maos), 0), 1);
        expect(final.status).toBe('encerrada');
        expect(final.vencedor).toBe(vencedor);
        expect(final.vez).toBe(null);
    }
});

test('D08 uma jogada depois de um passe reinicia a contagem de passes', () => {
    const inicial = estadoIntermediario([[[0, 0]], [[3, 5], [6, 6]]]);
    const seguinte = jogar(passar(inicial, 0), 1, [3, 5], 'direita');
    expect(seguinte.passes).toBe(0);
    expect(seguinte.vez).toBe(0);
    expect(seguinte.status).toBe('em_andamento');
});

test('D09 na mesa vazia preserva a orientação fornecida nas duas pontas', () => {
    for (const ponta of ['esquerda', 'direita']) {
        const inicial = { ...estadoIntermediario([[[5, 2], [0, 0]], [[6, 6]]]), mesa: [] };
        const seguinte = jogar(inicial, 0, [5, 2], ponta);
        expect(seguinte.mesa).toEqual([[5, 2]]);
        expect(seguinte.maos[0]).toEqual([[0, 0]]);
        expect(seguinte.vez).toBe(1);
    }
});

test('D10 rejeita ponta desconhecida e qualquer ação após o encerramento', () => {
    const inicial = estadoIntermediario([[[1, 4]], [[6, 6]]]);
    expect(() => jogar(inicial, 0, [1, 4], 'centro')).toThrow(RangeError);

    const encerrada = { ...inicial, status: 'encerrada', vez: null, vencedor: 1 };
    expect(() => jogar(encerrada, 0, [1, 4], 'esquerda')).toThrow(RangeError);
    expect(() => comprar({ ...encerrada, monte: [[0, 0]] }, 0)).toThrow(RangeError);
    expect(() => passar(encerrada, 0)).toThrow(RangeError);
});
