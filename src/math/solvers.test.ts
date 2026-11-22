import test from 'node:test';
import assert from 'node:assert/strict';
import {
  solveBinaryDivision,
  solveHexMultiplication,
  solveDecimalToBinary,
  solveBaseConversions,
  solveAnyBaseToAnyBase,
  solveCRC,
  simulateTuringMachine,
  solveIEEE754Decode,
  solveIEEE754Encode,
  solveU2Addition,
  solveBCDU9Addition,
  solveBoothAlgorithm,
  type TuringRule,
} from './solvers';

const TURING_RULES: TuringRule[] = [
  { state: 's', read: 'a', write: 'b', move: '→', nextState: 's' },
  { state: 's', read: 'b', write: 'a', move: '→', nextState: 's' },
  { state: 's', read: '□', write: 'a', move: '←', nextState: '1' },
  { state: 's', read: '▶', write: '▶', move: '–', nextState: 'k' },
  { state: '1', read: 'a', write: 'a', move: '→', nextState: '1' },
  { state: '1', read: 'b', write: 'b', move: '→', nextState: '1' },
  { state: '1', read: '□', write: 'b', move: '←', nextState: '2' },
  { state: '1', read: '▶', write: '▶', move: '–', nextState: 'k' },
  { state: '2', read: 'a', write: '□', move: '→', nextState: '2' },
  { state: '2', read: 'b', write: 'a', move: '←', nextState: '2' },
  { state: '2', read: '□', write: '□', move: '→', nextState: '1' },
  { state: '2', read: '▶', write: '▶', move: '–', nextState: 'k' },
];

test('Whiteboard photo 1 & 3 verification', () => {
  const divBoard = solveBinaryDivision('11110101011', '1101');
  assert.equal(divBoard.quotient, '10010111');
  assert.equal(divBoard.remainder, '0');

  const hexBoard = solveHexMultiplication('3E9', '2B7');
  assert.equal(hexBoard.resultHex, 'A9D8F');
});

test('Zestaw D - All 12 tasks exact verification', () => {
  // Zadanie 1
  const d1 = solveBinaryDivision('111001000', '1000');
  assert.equal(d1.quotient, '111001'); // C

  // Zadanie 2
  const d2 = solveHexMultiplication('2D6', '1A5');
  assert.equal(d2.resultHex, '4A9EE'); // B

  // Zadanie 3
  const d3 = solveDecimalToBinary('43,2');
  assert.equal(d3.formattedBinary, '101011,(0011)'); // B

  // Zadanie 4
  const d4 = solveBaseConversions(426, [4, 8, 16]);
  assert.deepEqual(
    d4.map((c) => c.result),
    ['12222', '652', '1AA'] // A
  );

  // Zadanie 5
  const d5 = solveCRC('1011 0110 10', '10011', true);
  assert.equal(d5.remainder, '1100'); // B

  // Zadanie 6
  const d6 = simulateTuringMachine('b a b □ a b □ b a ▶'.split(' '), TURING_RULES, 's', 0);
  assert.equal(d6.finalTapeStr, 'a b a a □ □ a b a ▶'); // A

  // Zadanie 7
  const d7 = solveAnyBaseToAnyBase('3A4', 13, 7);
  assert.equal(d7.decimalValue, 641);
  assert.equal(d7.resultStr, '1604'); // C

  // Zadanie 8
  const d8 = solveIEEE754Decode('0100011110000000');
  assert.equal(d8.decimalValue, 7.5); // A (+7,5)

  // Zadanie 9
  const d9 = solveIEEE754Encode('-11,5');
  assert.equal(d9.bits16, '1100100111000000'); // A

  // Zadanie 10
  const d10 = solveU2Addition(-29, 12, 8);
  assert.equal(d10.sumBinary, '11101111'); // C
  assert.equal(d10.overflow, false);

  // Zadanie 11
  const d11 = solveBCDU9Addition(54, -79);
  assert.equal(d11.resultBcd, '0111 0100'); // C

  // Zadanie 12
  const d12 = solveBoothAlgorithm(-3, 2, 4);
  assert.equal(d12.iterations[2].A_afterShift, '1111'); // C (after 3rd iteration)
  assert.equal(d12.finalProductDec, -6);
});

test('Zestaw B - All 13 tasks exact verification', () => {
  // Zadanie 1
  const b1 = solveBinaryDivision('101101000', '1000');
  assert.equal(b1.quotient, '101101');

  // Zadanie 2
  const b2 = solveHexMultiplication('3B5', '1A3');
  assert.equal(b2.resultHex, '6113F');

  // Zadanie 3
  const b3 = solveDecimalToBinary('45,375');
  assert.equal(b3.formattedBinary, '101101,011');

  // Zadanie 4
  const b4 = solveBaseConversions(293, [4, 8, 16]);
  assert.deepEqual(
    b4.map((c) => c.result),
    ['10211', '445', '125']
  );

  // Zadanie 5
  const b5 = solveCRC('1011 0100 1011', '11001', true);
  assert.equal(b5.remainder, '1011');

  // Zadanie 6
  const b6 = simulateTuringMachine('b a b □ b a □ b a ▶'.split(' '), TURING_RULES, 's', 0);
  assert.equal(b6.finalTapeStr, 'a b a a b □ a b a ▶');

  // Zadanie 7
  const b7 = solveAnyBaseToAnyBase('3B7', 13, 7);
  assert.equal(b7.decimalValue, 657);
  assert.equal(b7.resultStr, '1626');

  // Zadanie 8
  const b8 = solveDecimalToBinary('37,6875');
  assert.equal(b8.formattedBinary, '100101,1011');

  // Zadanie 9
  const b9 = solveIEEE754Decode('0100010101000000');
  assert.equal(b9.decimalValue, 5.25);

  // Zadanie 10
  const b10 = solveIEEE754Encode('-9,75');
  assert.equal(b10.bits16, '1100100011100000');

  // Zadanie 11
  const b11 = solveU2Addition(-38, 17, 8);
  assert.equal(b11.sumBinary, '11101011');
  assert.equal(b11.overflow, false);

  // Zadanie 12
  const b12 = solveBCDU9Addition(47, -83);
  assert.equal(b12.resultBcd, '0110 0011');
  assert.equal(b12.nibbleSteps[0].needsCorrection, true);

  // Zadanie 13
  const b13 = solveCRC('1100 1010 1101 10', '10101', false);
  assert.equal(b13.remainder, '0000');
  assert.equal(b13.errorDetected, false);
});

test('Zestaw E - All 12 tasks exact verification', () => {
  // Zadanie 1
  const e1 = solveBinaryDivision('10010011111', '1101');
  assert.equal(e1.quotient, '1011011');
  assert.equal(e1.remainder, '0');

  // Zadanie 2
  const e2 = solveHexMultiplication('3A7', '2D5');
  assert.equal(e2.resultHex, 'A57F3');

  // Zadanie 3
  const e3 = solveDecimalToBinary('73,35');
  assert.equal(e3.formattedBinary, '1001001,01(0110)');

  // Zadanie 4
  const e4 = solveBaseConversions(689, [4, 8, 16]);
  assert.deepEqual(
    e4.map((c) => c.result),
    ['22301', '1261', '2B1']
  );

  // Zadanie 5
  const e5 = solveCRC('1110 0110 1011 0011 0101', '11001', true);
  assert.equal(e5.remainder, '0011');

  // Zadanie 6
  const e6 = simulateTuringMachine('a b a □ b b □ a b ▶'.split(' '), TURING_RULES, 's', 0);
  assert.equal(e6.halted, true);
  assert.equal(e6.finalTapeStr, 'b a b □ □ □ a a b ▶');

  // Zadanie 7
  const e7 = solveAnyBaseToAnyBase('3A7', 12, 5);
  assert.equal(e7.decimalValue, 559);
  assert.equal(e7.resultStr, '4214');

  // Zadanie 8
  const e8 = solveIEEE754Decode('1100101011010000');
  assert.equal(e8.decimalValue, -13.625);

  // Zadanie 9
  const e9 = solveIEEE754Encode('+0,15625');
  assert.equal(e9.bits16, '0011000100000000');

  // Zadanie 10
  const e10 = solveU2Addition(-74, -69, 8);
  assert.equal(e10.sumBinary, '01110001');
  assert.equal(e10.carryIntoMSB, '0');
  assert.equal(e10.carryOut, '1');
  assert.equal(e10.overflow, true);
  assert.equal(e10.signedResultDecimal, 113);
  assert.equal(e10.sumDecimalCheck, -143);

  // Zadanie 11
  const e11 = solveBCDU9Addition(36, -78);
  assert.equal(e11.resultBcd, '0101 0111');
  assert.equal(e11.resultU9Dec, 57);
  assert.equal(e11.decodedDecimalResult, -42);

  // Zadanie 12
  const e12 = solveBoothAlgorithm(-5, 3, 4);
  assert.equal(e12.iterations[2].A_afterShift, '1110');
  assert.equal(e12.finalProductDec, -15);
});

