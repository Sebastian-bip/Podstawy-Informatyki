export interface BinaryDivisionStep {
  stepNum: number;
  kind: 'subtract' | 'drop-zero';
  startCol: number;
  endCol: number;
  currentValueBin: string;
  currentValueDec: number;
  divisorBin: string;
  divisorDec: number;
  quotientBit: '0' | '1';
  quotientCol: number;
  remainderAfterSubBin: string | null;
  droppedBitIndex: number | null;
  droppedBit: string | null;
  nextValueAfterDropBin: string | null;
  borrows: number[]; // column indices (relative to currentValueBin) where borrow occurred
  explanation: string;
}

export interface BinaryDivisionRow {
  rowIndex: number;
  alignEndCol: number;
  currentBin: string;
  subtrahendBin: string | null;
  borrows: number[];
  droppedRange: { fromCol: number; toCol: number } | null;
}

export interface BinaryDivisionResult {
  dividend: string;
  divisor: string;
  quotient: string;
  quotientAligned: (string | null)[];
  remainder: string;
  steps: BinaryDivisionStep[];
  rows: BinaryDivisionRow[];
  decimalCheck: {
    dividendDec: number;
    divisorDec: number;
    quotientDec: number;
    remainderDec: number;
  };
}

export function solveBinaryDivision(dividendRaw: string, divisorRaw: string): BinaryDivisionResult {
  const dividend = dividendRaw.replace(/\s+/g, '').replace(/^0+(?=\d)/, '') || '0';
  const divisor = divisorRaw.replace(/\s+/g, '').replace(/^0+(?=\d)/, '') || '1';
  if (!/^[01]+$/.test(dividend) || !/^[01]+$/.test(divisor) || /^0+$/.test(divisor)) {
    throw new Error('Nieprawidłowe liczby dwójkowe lub dzielenie przez zero.');
  }

  const divisorVal = parseInt(divisor, 2);
  const steps: BinaryDivisionStep[] = [];
  const quotientAligned: (string | null)[] = Array(dividend.length).fill(null);

  // Find shortest prefix >= divisor
  let idx = 0;
  let currentStr = '';
  while (idx < dividend.length) {
    currentStr += dividend[idx];
    if (parseInt(currentStr, 2) >= divisorVal) {
      break;
    }
    idx++;
  }

  if (idx >= dividend.length) {
    // Dividend < divisor
    quotientAligned[dividend.length - 1] = '0';
    return {
      dividend,
      divisor,
      quotient: '0',
      quotientAligned,
      remainder: dividend,
      steps: [
        {
          stepNum: 1,
          kind: 'drop-zero',
          startCol: 0,
          endCol: dividend.length - 1,
          currentValueBin: dividend,
          currentValueDec: parseInt(dividend, 2),
          divisorBin: divisor,
          divisorDec: divisorVal,
          quotientBit: '0',
          quotientCol: dividend.length - 1,
          remainderAfterSubBin: null,
          droppedBitIndex: null,
          droppedBit: null,
          nextValueAfterDropBin: null,
          borrows: [],
          explanation: `Dzielna (${dividend}₂ = ${parseInt(dividend, 2)}) jest mniejsza od dzielnika (${divisor}₂ = ${divisorVal}), więc wynik to 0, a reszta wynosi ${dividend}₂.`,
        },
      ],
      rows: [
        {
          rowIndex: 0,
          alignEndCol: dividend.length - 1,
          currentBin: dividend,
          subtrahendBin: null,
          borrows: [],
          droppedRange: null,
        },
      ],
      decimalCheck: {
        dividendDec: parseInt(dividend, 2),
        divisorDec: divisorVal,
        quotientDec: 0,
        remainderDec: parseInt(dividend, 2),
      },
    };
  }

  const rows: BinaryDivisionRow[] = [];
  let quotient = '';
  let stepNum = 1;
  let currentEndCol = idx;
  let workingBin = currentStr;
  let pendingDropFromCol: number | null = null;

  const computeBorrows = (minuend: string, subtrahend: string): number[] => {
    const len = Math.max(minuend.length, subtrahend.length);
    const a = minuend.padStart(len, '0').split('').map(Number);
    const b = subtrahend.padStart(len, '0').split('').map(Number);
    const borrows: number[] = [];
    for (let i = len - 1; i >= 0; i--) {
      if (a[i] < b[i]) {
        borrows.push(i);
        let j = i - 1;
        while (j >= 0 && a[j] === 0) {
          a[j] = 1;
          j--;
        }
        if (j >= 0) {
          a[j] = 0;
        }
        a[i] += 2;
      }
    }
    return borrows.sort((x, y) => x - y);
  };

  // First subtraction
  while (true) {
    const val = parseInt(workingBin, 2);
    if (val >= divisorVal) {
      const paddedLen = Math.max(workingBin.length, divisor.length);
      const paddedMinuend = workingBin.padStart(paddedLen, '0');
      const paddedDivisor = divisor.padStart(paddedLen, '0');
      const borrows = computeBorrows(paddedMinuend, paddedDivisor);
      const diffVal = val - divisorVal;
      const diffBin = diffVal.toString(2).padStart(paddedLen, '0');

      quotient += '1';
      quotientAligned[currentEndCol] = '1';

      rows.push({
        rowIndex: rows.length,
        alignEndCol: currentEndCol,
        currentBin: paddedMinuend,
        subtrahendBin: paddedDivisor,
        borrows,
        droppedRange: pendingDropFromCol !== null ? { fromCol: pendingDropFromCol, toCol: currentEndCol } : null,
      });

      const nextCol = currentEndCol + 1;
      if (nextCol < dividend.length) {
        const droppedBit = dividend[nextCol];
        const trimmedDiff = diffVal === 0 ? '0' : diffVal.toString(2);
        const nextWorking = diffVal === 0 ? droppedBit : trimmedDiff + droppedBit;

        steps.push({
          stepNum: stepNum++,
          kind: 'subtract',
          startCol: currentEndCol - paddedLen + 1,
          endCol: currentEndCol,
          currentValueBin: paddedMinuend,
          currentValueDec: val,
          divisorBin: divisor,
          divisorDec: divisorVal,
          quotientBit: '1',
          quotientCol: currentEndCol,
          remainderAfterSubBin: diffBin,
          droppedBitIndex: nextCol,
          droppedBit,
          nextValueAfterDropBin: nextWorking,
          borrows,
          explanation: `Liczba ${paddedMinuend}₂ (${val}) ≥ ${divisor}₂ (${divisorVal}): wpisujemy 1 nad kolumną ${currentEndCol + 1}, odejmujemy ${divisor}₂ i otrzymujemy resztę ${diffBin}₂ (${diffVal}). Następnie pionową kreską spuszczamy kolejny bit '${droppedBit}'.`,
        });

        pendingDropFromCol = nextCol;
        currentEndCol = nextCol;
        workingBin = diffBin + droppedBit;
      } else {
        steps.push({
          stepNum: stepNum++,
          kind: 'subtract',
          startCol: currentEndCol - paddedLen + 1,
          endCol: currentEndCol,
          currentValueBin: paddedMinuend,
          currentValueDec: val,
          divisorBin: divisor,
          divisorDec: divisorVal,
          quotientBit: '1',
          quotientCol: currentEndCol,
          remainderAfterSubBin: diffBin,
          droppedBitIndex: null,
          droppedBit: null,
          nextValueAfterDropBin: null,
          borrows,
          explanation: `Liczba ${paddedMinuend}₂ (${val}) ≥ ${divisor}₂ (${divisorVal}): wpisujemy 1 w wyniku, odejmujemy ${divisor}₂ i otrzymujemy końcową resztę ${diffVal.toString(2)}₂ (${diffVal}). Wszystkie bity dzielnej zostały wykorzystane.`,
        });
        rows.push({
          rowIndex: rows.length,
          alignEndCol: currentEndCol,
          currentBin: diffBin,
          subtrahendBin: null,
          borrows: [],
          droppedRange: null,
        });
        workingBin = diffVal.toString(2);
        break;
      }
    } else {
      // val < divisorVal -> write 0 in quotient
      quotient += '0';
      quotientAligned[currentEndCol] = '0';

      const nextCol = currentEndCol + 1;
      if (nextCol < dividend.length) {
        const droppedBit = dividend[nextCol];
        const nextWorking = workingBin + droppedBit;
        steps.push({
          stepNum: stepNum++,
          kind: 'drop-zero',
          startCol: currentEndCol - workingBin.length + 1,
          endCol: currentEndCol,
          currentValueBin: workingBin,
          currentValueDec: val,
          divisorBin: divisor,
          divisorDec: divisorVal,
          quotientBit: '0',
          quotientCol: currentEndCol,
          remainderAfterSubBin: null,
          droppedBitIndex: nextCol,
          droppedBit,
          nextValueAfterDropBin: nextWorking,
          borrows: [],
          explanation: `Po spisaniu bitu mamy ${workingBin}₂ (${val}) < ${divisor}₂ (${divisorVal}): nie mieści się, więc wpisujemy 0 w wyniku na górze i spuszczamy kolejny bit '${droppedBit}'.`,
        });
        currentEndCol = nextCol;
        workingBin = nextWorking;
      } else {
        steps.push({
          stepNum: stepNum++,
          kind: 'drop-zero',
          startCol: currentEndCol - workingBin.length + 1,
          endCol: currentEndCol,
          currentValueBin: workingBin,
          currentValueDec: val,
          divisorBin: divisor,
          divisorDec: divisorVal,
          quotientBit: '0',
          quotientCol: currentEndCol,
          remainderAfterSubBin: null,
          droppedBitIndex: null,
          droppedBit: null,
          nextValueAfterDropBin: null,
          borrows: [],
          explanation: `Liczba ${workingBin}₂ (${val}) < ${divisor}₂ (${divisorVal}) i brak dalszych bitów: wpisujemy 0 w wyniku, a reszta wynosi ${val.toString(2)}₂.`,
        });
        rows.push({
          rowIndex: rows.length,
          alignEndCol: currentEndCol,
          currentBin: workingBin,
          subtrahendBin: null,
          borrows: [],
          droppedRange: pendingDropFromCol !== null ? { fromCol: pendingDropFromCol, toCol: currentEndCol } : null,
        });
        workingBin = val.toString(2);
        break;
      }
    }
  }

  return {
    dividend,
    divisor,
    quotient,
    quotientAligned,
    remainder: parseInt(workingBin, 2).toString(2),
    steps,
    rows,
    decimalCheck: {
      dividendDec: parseInt(dividend, 2),
      divisorDec: divisorVal,
      quotientDec: parseInt(quotient, 2),
      remainderDec: parseInt(workingBin, 2),
    },
  };
}

// ==========================================
// 2. HEX MULTIPLICATION (like image_29e0f29a)
// ==========================================
export interface HexScratchpadEntry {
  expr: string;
  rawProduct: number;
  incomingCarry: number;
  totalDec: number;
  carryOut: number;
  digitRem: number;
  digitHex: string;
}

export interface HexPartialProduct {
  multiplierDigit: string;
  multiplierDec: number;
  shift: number;
  rowHex: string;
  carriesAboveA: number[]; // carry generated into position i
  scratchpad: HexScratchpadEntry[];
}

export interface HexAdditionColumn {
  colFromRight: number;
  digitsHex: string[];
  incomingCarry: number;
  sumDec: number;
  newCarry: number;
  remHex: string;
  explanation: string;
}

export interface HexMultiplicationResult {
  aHex: string;
  bHex: string;
  resultHex: string;
  partialProducts: HexPartialProduct[];
  additionColumns: HexAdditionColumn[];
  decimalCheck: {
    aDec: number;
    bDec: number;
    productDec: number;
    resultDec: number;
  };
}

const HEX_CHARS = '0123456789ABCDEF';

export function solveHexMultiplication(aRaw: string, bRaw: string): HexMultiplicationResult {
  const aHex = aRaw.trim().toUpperCase().replace(/^0+(?=[0-9A-F])/, '') || '0';
  const bHex = bRaw.trim().toUpperCase().replace(/^0+(?=[0-9A-F])/, '') || '0';
  if (!/^[0-9A-F]+$/.test(aHex) || !/^[0-9A-F]+$/.test(bHex)) {
    throw new Error('Nieprawidłowa liczba szesnastkowa.');
  }

  const partialProducts: HexPartialProduct[] = [];
  for (let bi = bHex.length - 1, shift = 0; bi >= 0; bi--, shift++) {
    const mChar = bHex[bi];
    const mVal = parseInt(mChar, 16);
    let carry = 0;
    const digits: string[] = [];
    const scratchpad: HexScratchpadEntry[] = [];
    const carriesAboveA: number[] = Array(aHex.length).fill(0);

    for (let ai = aHex.length - 1; ai >= 0; ai--) {
      const aChar = aHex[ai];
      const aVal = parseInt(aChar, 16);
      carriesAboveA[ai] = carry;
      const rawProduct = mVal * aVal;
      const totalDec = rawProduct + carry;
      const carryOut = Math.floor(totalDec / 16);
      const digitRem = totalDec % 16;
      const digitHex = HEX_CHARS[digitRem];

      scratchpad.push({
        expr: carry > 0 ? `${mChar}(${mVal}) · ${aChar}(${aVal}) + ${carry}` : `${mChar}(${mVal}) · ${aChar}(${aVal})`,
        rawProduct,
        incomingCarry: carry,
        totalDec,
        carryOut,
        digitRem,
        digitHex,
      });

      digits.unshift(digitHex);
      carry = carryOut;
    }

    if (carry > 0) {
      digits.unshift(HEX_CHARS[carry]);
    }

    partialProducts.push({
      multiplierDigit: mChar,
      multiplierDec: mVal,
      shift,
      rowHex: digits.join(''),
      carriesAboveA,
      scratchpad,
    });
  }

  // Column-by-column addition
  const maxWidth = Math.max(
    ...partialProducts.map((p) => p.rowHex.length + p.shift),
    1
  );

  const additionColumns: HexAdditionColumn[] = [];
  let addCarry = 0;
  const resultDigits: string[] = [];

  for (let col = 0; col < maxWidth; col++) {
    const colDigits: string[] = [];
    let colSum = addCarry;
    for (const p of partialProducts) {
      const posInRow = p.rowHex.length - 1 - (col - p.shift);
      if (col >= p.shift && posInRow >= 0) {
        const ch = p.rowHex[posInRow];
        colDigits.push(ch);
        colSum += parseInt(ch, 16);
      }
    }
    const newCarry = Math.floor(colSum / 16);
    const rem = colSum % 16;
    const remHex = HEX_CHARS[rem];
    resultDigits.unshift(remHex);

    const termsStr = [
      ...(addCarry > 0 ? [`${addCarry} (przen.)`] : []),
      ...colDigits.map((d) => `${d}(${parseInt(d, 16)})`),
    ].join(' + ');

    additionColumns.push({
      colFromRight: col,
      digitsHex: colDigits,
      incomingCarry: addCarry,
      sumDec: colSum,
      newCarry,
      remHex,
      explanation:
        colSum >= 16
          ? `Kolumna ${col + 1}: ${termsStr} = ${colSum} = ${newCarry}·16 + ${rem}(${remHex}) → wpisujemy ${remHex}, przenosimy ${newCarry}.`
          : `Kolumna ${col + 1}: ${termsStr} = ${colSum} → wpisujemy ${remHex} (brak przeniesienia).`,
    });

    addCarry = newCarry;
  }

  if (addCarry > 0) {
    const ch = HEX_CHARS[addCarry];
    resultDigits.unshift(ch);
    additionColumns.push({
      colFromRight: maxWidth,
      digitsHex: [],
      incomingCarry: addCarry,
      sumDec: addCarry,
      newCarry: 0,
      remHex: ch,
      explanation: `Ostatnie przeniesienie ${addCarry} dopisujemy z przodu jako ${ch}.`,
    });
  }

  const resultHex = resultDigits.join('').replace(/^0+(?=[0-9A-F])/, '') || '0';
  const aDec = parseInt(aHex, 16);
  const bDec = parseInt(bHex, 16);

  return {
    aHex,
    bHex,
    resultHex,
    partialProducts,
    additionColumns,
    decimalCheck: {
      aDec,
      bDec,
      productDec: aDec * bDec,
      resultDec: parseInt(resultHex, 16),
    },
  };
}

// ==========================================
// 3. DECIMAL TO BINARY (including periodic!)
// ==========================================
export interface IntDivStep {
  n: number;
  base: number;
  quotient: number;
  remainder: number;
  digit: string;
}

export interface FracMultStep {
  stepNum: number;
  currentFracStr: string;
  multipliedStr: string;
  integerBit: '0' | '1';
  nextFracStr: string;
  repeatsStartStep: number | null;
}

export interface DecimalToBinaryResult {
  input: string;
  integerPart: number;
  intSteps: IntDivStep[];
  integerBinary: string;
  hasFraction: boolean;
  fracSteps: FracMultStep[];
  isRepeating: boolean;
  nonRepeatingBits: string;
  repeatingBits: string;
  formattedBinary: string;
}

function gcd(a: bigint, b: bigint): bigint {
  return b === 0n ? a : gcd(b, a % b);
}

function formatRational(num: bigint, den: bigint, precision = 6): string {
  const intPart = num / den;
  let rem = num % den;
  if (rem === 0n) return intPart.toString();
  let fracStr = '';
  let count = 0;
  while (rem !== 0n && count < precision) {
    rem *= 10n;
    fracStr += (rem / den).toString();
    rem = rem % den;
    count++;
  }
  return `${intPart},${fracStr}`;
}

export function solveDecimalToBinary(inputRaw: string): DecimalToBinaryResult {
  const cleaned = inputRaw.trim().replace(',', '.');
  if (!/^\d+(\.\d+)?$/.test(cleaned)) {
    throw new Error('Podaj nieujemną liczbę dziesiętną (np. 43,2 lub 45,375).');
  }

  const [intStr, fracStr = ''] = cleaned.split('.');
  const integerPart = parseInt(intStr, 10);

  // Integer part
  const intSteps: IntDivStep[] = [];
  if (integerPart === 0) {
    intSteps.push({ n: 0, base: 2, quotient: 0, remainder: 0, digit: '0' });
  } else {
    let curr = integerPart;
    while (curr > 0) {
      const q = Math.floor(curr / 2);
      const r = curr % 2;
      intSteps.push({ n: curr, base: 2, quotient: q, remainder: r, digit: String(r) });
      curr = q;
    }
  }
  const integerBinary = intSteps.map((s) => s.digit).reverse().join('');

  if (!fracStr || /^0+$/.test(fracStr)) {
    return {
      input: inputRaw,
      integerPart,
      intSteps,
      integerBinary,
      hasFraction: false,
      fracSteps: [],
      isRepeating: false,
      nonRepeatingBits: '',
      repeatingBits: '',
      formattedBinary: integerBinary,
    };
  }

  // Exact rational representation of fraction
  const rawDen = 10n ** BigInt(fracStr.length);
  const rawNum = BigInt(fracStr);
  const g = gcd(rawNum, rawDen);
  let num = rawNum / g;
  const den = rawDen / g;

  const seenRemainders = new Map<bigint, number>();
  const fracSteps: FracMultStep[] = [];
  const bits: string[] = [];
  let repeatStart: number | null = null;

  for (let step = 0; step < 32; step++) {
    if (num === 0n) break;
    if (seenRemainders.has(num)) {
      repeatStart = seenRemainders.get(num)!;
      // annotate previous step or add cycle marker
      break;
    }
    seenRemainders.set(num, step);

    const currentFracStr = formatRational(num, den, fracStr.length + 2);
    const doubledNum = num * 2n;
    const bit: '0' | '1' = doubledNum >= den ? '1' : '0';
    const nextNum = doubledNum >= den ? doubledNum - den : doubledNum;
    const multipliedStr = formatRational(doubledNum, den, fracStr.length + 2);
    const nextFracStr = nextNum === 0n ? '0' : formatRational(nextNum, den, fracStr.length + 2);

    const repeatsNow = nextNum !== 0n && seenRemainders.has(nextNum) ? seenRemainders.get(nextNum)! : null;
    if (repeatsNow !== null) {
      repeatStart = repeatsNow;
    }

    bits.push(bit);
    fracSteps.push({
      stepNum: step + 1,
      currentFracStr,
      multipliedStr,
      integerBit: bit,
      nextFracStr,
      repeatsStartStep: repeatsNow !== null ? repeatsNow + 1 : null,
    });

    num = nextNum;
    if (repeatsNow !== null) break;
  }

  let nonRepeatingBits = bits.join('');
  let repeatingBits = '';
  let formattedBinary = `${integerBinary},${nonRepeatingBits}`;

  if (repeatStart !== null) {
    nonRepeatingBits = bits.slice(0, repeatStart).join('');
    repeatingBits = bits.slice(repeatStart).join('');
    formattedBinary = `${integerBinary},${nonRepeatingBits}(${repeatingBits})`;
  }

  return {
    input: inputRaw,
    integerPart,
    intSteps,
    integerBinary,
    hasFraction: true,
    fracSteps,
    isRepeating: repeatStart !== null,
    nonRepeatingBits,
    repeatingBits,
    formattedBinary,
  };
}

// ==========================================
// 4. BASE CONVERSIONS (4, 8, 16 & Any->Any)
// ==========================================
const BASE_DIGITS = '0123456789ABCDEFGHIJKLMNOPQRSTUVWXYZ';

export interface BaseConversionSingle {
  targetBase: number;
  steps: IntDivStep[];
  result: string;
}

export function solveBaseConversions(decimalVal: number, bases: number[]): BaseConversionSingle[] {
  return bases.map((base) => {
    const steps: IntDivStep[] = [];
    if (decimalVal === 0) {
      steps.push({ n: 0, base, quotient: 0, remainder: 0, digit: '0' });
    } else {
      let curr = decimalVal;
      while (curr > 0) {
        const q = Math.floor(curr / base);
        const r = curr % base;
        steps.push({
          n: curr,
          base,
          quotient: q,
          remainder: r,
          digit: BASE_DIGITS[r],
        });
        curr = q;
      }
    }
    const result = steps.map((s) => s.digit).reverse().join('');
    return { targetBase: base, steps, result };
  });
}

export interface PositionalTerm {
  digit: string;
  digitValue: number;
  power: number;
  basePowerVal: number;
  termProduct: number;
}

export interface AnyBaseConversionResult {
  sourceStr: string;
  fromBase: number;
  toBase: number;
  positionalTerms: PositionalTerm[];
  decimalValue: number;
  divisionSteps: IntDivStep[];
  resultStr: string;
}

export function solveAnyBaseToAnyBase(
  sourceRaw: string,
  fromBase: number,
  toBase: number
): AnyBaseConversionResult {
  const sourceStr = sourceRaw.trim().toUpperCase();
  const positionalTerms: PositionalTerm[] = [];
  let decimalValue = 0;

  for (let i = 0; i < sourceStr.length; i++) {
    const ch = sourceStr[i];
    const dVal = BASE_DIGITS.indexOf(ch);
    if (dVal < 0 || dVal >= fromBase) {
      throw new Error(`Nieprawidłowa cyfra '${ch}' dla systemu o podstawie ${fromBase}.`);
    }
    const power = sourceStr.length - 1 - i;
    const basePowerVal = Math.pow(fromBase, power);
    const termProduct = dVal * basePowerVal;
    positionalTerms.push({
      digit: ch,
      digitValue: dVal,
      power,
      basePowerVal,
      termProduct,
    });
    decimalValue += termProduct;
  }

  const [conv] = solveBaseConversions(decimalValue, [toBase]);

  return {
    sourceStr,
    fromBase,
    toBase,
    positionalTerms,
    decimalValue,
    divisionSteps: conv.steps,
    resultStr: conv.result,
  };
}

// ==========================================
// 5. CRC MODULO-2 DIVISION (like image_49592ee4)
// ==========================================
export interface CRCStep {
  stepNum: number;
  alignStartCol: number;
  currentWindow: string;
  generator: string;
  xorResultFull: string;
  xorTrimmed: string;
  firstOneColAfterXor: number | null;
  droppedBits: string;
  droppedFromCol: number | null;
  droppedToCol: number | null;
  nextWindow: string;
  explanation: string;
}

export interface CRCResult {
  originalData: string;
  generator: string;
  appendZeros: boolean;
  appendedZerosCount: number;
  dividend: string;
  remainderLength: number;
  steps: CRCStep[];
  remainder: string;
  transmittedFrame: string;
  errorDetected: boolean | null;
}

export function solveCRC(dataRaw: string, generatorRaw: string, appendZeros: boolean): CRCResult {
  const originalData = dataRaw.replace(/\s+/g, '');
  const generator = generatorRaw.replace(/\s+/g, '');

  if (!/^[01]+$/.test(originalData) || !/^1[01]+$/.test(generator)) {
    throw new Error('Dane i wielomian generacyjny muszą składać się z bitów 0 i 1 (generator musi zaczynać się od 1).');
  }

  const gLen = generator.length;
  const remainderLength = gLen - 1;
  const dividend = appendZeros ? originalData + '0'.repeat(remainderLength) : originalData;
  const bits = dividend.split('');

  const steps: CRCStep[] = [];
  let cursor = bits.indexOf('1');
  let stepNum = 1;

  // Working buffer representing current aligned bits from cursor
  if (cursor === -1 || cursor + gLen > bits.length) {
    const rem = dividend.slice(-remainderLength).padStart(remainderLength, '0');
    return {
      originalData,
      generator,
      appendZeros,
      appendedZerosCount: appendZeros ? remainderLength : 0,
      dividend,
      remainderLength,
      steps: [],
      remainder: rem,
      transmittedFrame: appendZeros ? originalData + rem : originalData,
      errorDetected: appendZeros ? null : rem !== '0'.repeat(remainderLength),
    };
  }

  let currentWindow = bits.slice(cursor, cursor + gLen).join('');
  let nextInputCol = cursor + gLen;

  while (true) {
    let xorFull = '';
    for (let i = 0; i < gLen; i++) {
      xorFull += currentWindow[i] === generator[i] ? '0' : '1';
    }

    // Find first '1' in xorFull
    const firstOneInXor = xorFull.indexOf('1');
    let nextWindow = '';
    let droppedBits = '';
    let droppedFromCol: number | null = null;
    let droppedToCol: number | null = null;
    let nextAlignCol = cursor;

    if (firstOneInXor === -1) {
      // All zeros! Must find next '1' in remaining bits
      const remainingStart = nextInputCol;
      let skipPos = nextInputCol;
      while (skipPos < bits.length && bits[skipPos] === '0') {
        skipPos++;
      }
      if (skipPos + gLen <= bits.length) {
        droppedFromCol = remainingStart;
        droppedToCol = skipPos + gLen - 1;
        droppedBits = bits.slice(droppedFromCol, droppedToCol + 1).join('');
        nextWindow = droppedBits;
        nextAlignCol = skipPos;
        nextInputCol = skipPos + gLen;
      } else {
        // Done! Remainder is last remainderLength bits of remaining
        const leftover = bits.slice(remainingStart).join('');
        const finalRem = leftover.padStart(remainderLength, '0').slice(-remainderLength);
        steps.push({
          stepNum: stepNum++,
          alignStartCol: cursor,
          currentWindow,
          generator,
          xorResultFull: xorFull,
          xorTrimmed: '0',
          firstOneColAfterXor: null,
          droppedBits: leftover,
          droppedFromCol: remainingStart < bits.length ? remainingStart : null,
          droppedToCol: remainingStart < bits.length ? bits.length - 1 : null,
          nextWindow: finalRem,
          explanation: `${currentWindow} ⊕ ${generator} = ${xorFull} (same zera). Pozostałe bity (${leftover || 'brak'}) dają resztę ${finalRem}.`,
        });
        return {
          originalData,
          generator,
          appendZeros,
          appendedZerosCount: appendZeros ? remainderLength : 0,
          dividend,
          remainderLength,
          steps,
          remainder: finalRem,
          transmittedFrame: appendZeros ? originalData + finalRem : originalData,
          errorDetected: appendZeros ? null : finalRem !== '0'.repeat(remainderLength),
        };
      }
    } else {
      const surviving = xorFull.slice(firstOneInXor);
      const needed = gLen - surviving.length;
      const available = bits.length - nextInputCol;
      nextAlignCol = cursor + firstOneInXor;

      if (available >= needed) {
        droppedFromCol = nextInputCol;
        droppedToCol = nextInputCol + needed - 1;
        droppedBits = bits.slice(droppedFromCol, droppedToCol + 1).join('');
        nextWindow = surviving + droppedBits;
        nextInputCol += needed;
      } else {
        // Cannot form full gLen window anymore -> final remainder!
        const leftover = bits.slice(nextInputCol).join('');
        const finalCandidate = surviving + leftover;
        const finalRem = finalCandidate.padStart(remainderLength, '0').slice(-remainderLength);
        steps.push({
          stepNum: stepNum++,
          alignStartCol: cursor,
          currentWindow,
          generator,
          xorResultFull: xorFull,
          xorTrimmed: surviving,
          firstOneColAfterXor: nextAlignCol,
          droppedBits: leftover,
          droppedFromCol: leftover.length > 0 ? nextInputCol : null,
          droppedToCol: leftover.length > 0 ? bits.length - 1 : null,
          nextWindow: finalCandidate,
          explanation: `${currentWindow} ⊕ ${generator} = ${xorFull}. Po odrzuceniu wiodących zer zostaje ${surviving}${leftover ? ' i dopisaniu ostatnich bitów ' + leftover : ''} otrzymujemy ${finalCandidate.length}-bitową resztę końcową: ${finalRem}.`,
        });
        return {
          originalData,
          generator,
          appendZeros,
          appendedZerosCount: appendZeros ? remainderLength : 0,
          dividend,
          remainderLength,
          steps,
          remainder: finalRem,
          transmittedFrame: appendZeros ? originalData + finalRem : originalData,
          errorDetected: appendZeros ? null : finalRem !== '0'.repeat(remainderLength),
        };
      }
    }

    steps.push({
      stepNum: stepNum++,
      alignStartCol: cursor,
      currentWindow,
      generator,
      xorResultFull: xorFull,
      xorTrimmed: xorFull.slice(xorFull.indexOf('1')),
      firstOneColAfterXor: nextAlignCol,
      droppedBits,
      droppedFromCol,
      droppedToCol,
      nextWindow,
      explanation: `${currentWindow} ⊕ ${generator} = ${xorFull}. Zostawiamy od pierwszej jedynki (${xorFull.slice(xorFull.indexOf('1')) || '0'}) i spuszczamy ${droppedBits.length} bit(y) z góry (${droppedBits}) → mamy ${nextWindow}.`,
    });

    cursor = nextAlignCol;
    currentWindow = nextWindow;
  }
}

// ==========================================
// 6. TURING MACHINE SIMULATOR
// ==========================================
export interface TuringRule {
  state: string;
  read: string;
  write: string;
  move: '→' | '←' | '–';
  nextState: string;
}

export interface TuringStep {
  stepNum: number;
  stateBefore: string;
  headPosBefore: number;
  readSymbol: string;
  writeSymbol: string;
  move: '→' | '←' | '–';
  nextState: string;
  headPosAfter: number;
  tapeBefore: string[];
  tapeAfter: string[];
  matchedRuleIndex: number;
  explanation: string;
}

export interface TuringResult {
  initialTape: string[];
  finalTape: string[];
  finalTapeStr: string;
  steps: TuringStep[];
  halted: boolean;
}

export function simulateTuringMachine(
  initialTape: string[],
  rules: TuringRule[],
  startState = 's',
  startHeadPos = 0,
  maxSteps = 200
): TuringResult {
  const tape = [...initialTape];
  let state = startState;
  let head = startHeadPos;
  const steps: TuringStep[] = [];

  for (let i = 0; i < maxSteps; i++) {
    if (state === 'k') {
      return {
        initialTape: [...initialTape],
        finalTape: [...tape],
        finalTapeStr: tape.join(' '),
        steps,
        halted: true,
      };
    }

    const readSymbol = tape[head];
    const ruleIdx = rules.findIndex((r) => r.state === state && r.read === readSymbol);
    if (ruleIdx === -1) {
      throw new Error(`Brak reguły dla stanu '${state}' i symbolu '${readSymbol}' na pozycji ${head}.`);
    }

    const rule = rules[ruleIdx];
    const tapeBefore = [...tape];
    tape[head] = rule.write;
    const tapeAfter = [...tape];

    let nextHead = head;
    if (rule.move === '→') nextHead = Math.min(tape.length - 1, head + 1);
    else if (rule.move === '←') nextHead = Math.max(0, head - 1);

    const moveWord = rule.move === '→' ? 'w prawo (→)' : rule.move === '←' ? 'w lewo (←)' : 'brak ruchu (–)';
    const changeNote =
      rule.read === rule.write
        ? `zostawia '${rule.write}'`
        : `zamienia '${rule.read}' na '${rule.write}'`;

    steps.push({
      stepNum: i + 1,
      stateBefore: state,
      headPosBefore: head,
      readSymbol,
      writeSymbol: rule.write,
      move: rule.move,
      nextState: rule.nextState,
      headPosAfter: nextHead,
      tapeBefore,
      tapeAfter,
      matchedRuleIndex: ruleIdx,
      explanation: `Stan ${state}, głowica na poz. ${head + 1} czyta '${readSymbol}': ${changeNote}, przesuwa się ${moveWord}, przechodzi do stanu ${rule.nextState}${rule.nextState === 'k' ? ' (STOP)' : ''}.`,
    });

    state = rule.nextState;
    head = nextHead;
  }

  return {
    initialTape: [...initialTape],
    finalTape: [...tape],
    finalTapeStr: tape.join(' '),
    steps,
    halted: state === 'k',
  };
}

// ==========================================
// 7. IEEE 754 BINARY16 (DECODE & ENCODE)
// ==========================================
export interface IEEE754DecodeResult {
  bits16: string;
  signBit: '0' | '1';
  signMultiplier: 1 | -1;
  exponentBits: string;
  exponentBiased: number;
  bias: number;
  exponentActual: number;
  mantissaBits: string;
  mantissaBinary: string;
  mantissaFractionTerms: { bitIndex: number; bit: string; powerNeg: number; value: number }[];
  mantissaDecimal: number;
  denormalizedBinary: string;
  decimalValue: number;
  formattedPolish: string;
}

export function solveIEEE754Decode(bitsRaw: string, bias = 15): IEEE754DecodeResult {
  const bits16 = bitsRaw.replace(/\s+/g, '');
  if (!/^[01]{16}$/.test(bits16)) {
    throw new Error('Ciąg musi mieć dokładnie 16 bitów (0 lub 1).');
  }
  const signBit = bits16[0] as '0' | '1';
  const signMultiplier: 1 | -1 = signBit === '0' ? 1 : -1;
  const exponentBits = bits16.slice(1, 6);
  const exponentBiased = parseInt(exponentBits, 2);
  const exponentActual = exponentBiased - bias;
  const mantissaBits = bits16.slice(6);

  const trimmedMantissa = mantissaBits.replace(/0+$/, '');
  const mantissaBinary = trimmedMantissa ? `1,${trimmedMantissa}` : '1,0';

  const mantissaFractionTerms: { bitIndex: number; bit: string; powerNeg: number; value: number }[] = [];
  let fracSum = 0;
  for (let i = 0; i < mantissaBits.length; i++) {
    const bit = mantissaBits[i];
    if (bit === '1') {
      const val = Math.pow(2, -(i + 1));
      fracSum += val;
      mantissaFractionTerms.push({
        bitIndex: i + 1,
        bit,
        powerNeg: -(i + 1),
        value: val,
      });
    }
  }
  const mantissaDecimal = 1 + fracSum;
  const decimalValue = signMultiplier * mantissaDecimal * Math.pow(2, exponentActual);

  // Shifted binary representation
  const significantBits = '1' + (trimmedMantissa || '');
  let denormalizedBinary = '';
  if (exponentActual >= 0) {
    if (exponentActual >= significantBits.length - 1) {
      denormalizedBinary = significantBits.padEnd(exponentActual + 1, '0');
    } else {
      denormalizedBinary =
        significantBits.slice(0, exponentActual + 1) + ',' + significantBits.slice(exponentActual + 1);
    }
  } else {
    denormalizedBinary = '0,' + '0'.repeat(Math.abs(exponentActual) - 1) + significantBits;
  }

  const absFormatted = Number.isInteger(Math.abs(decimalValue))
    ? `${Math.abs(decimalValue)},0`
    : String(Math.abs(decimalValue)).replace('.', ',');
  const formattedPolish = `${signMultiplier === 1 ? '+' : '−'}${absFormatted}`;

  return {
    bits16,
    signBit,
    signMultiplier,
    exponentBits,
    exponentBiased,
    bias,
    exponentActual,
    mantissaBits,
    mantissaBinary,
    mantissaFractionTerms,
    mantissaDecimal,
    denormalizedBinary,
    decimalValue,
    formattedPolish,
  };
}

export interface IEEE754EncodeResult {
  inputStr: string;
  decimalValue: number;
  signBit: '0' | '1';
  absBinary: string;
  normalizedBinary: string;
  exponentActual: number;
  bias: number;
  exponentBiased: number;
  exponentBits: string;
  mantissaBits: string;
  bits16: string;
  bitsGrouped: string;
}

export function solveIEEE754Encode(valRaw: string, bias = 15): IEEE754EncodeResult {
  const cleaned = valRaw.trim().replace('−', '-').replace(',', '.');
  const decimalValue = Number(cleaned);
  if (Number.isNaN(decimalValue) || decimalValue === 0) {
    throw new Error('Podaj niezerową liczbę rzeczywistą (np. -11,5 lub -9,75).');
  }

  const signBit: '0' | '1' = decimalValue < 0 ? '1' : '0';
  const absVal = Math.abs(decimalValue);
  const intPart = Math.floor(absVal);
  const fracPart = absVal - intPart;

  const intBin = intPart.toString(2);
  let fracBin = '';
  let f = fracPart;
  for (let i = 0; i < 20 && f > 0; i++) {
    f *= 2;
    if (f >= 1) {
      fracBin += '1';
      f -= 1;
    } else {
      fracBin += '0';
    }
  }
  const absBinary = fracBin ? `${intBin},${fracBin}` : intBin;

  let exponentActual = 0;
  let mantissaUnpadded = '';
  if (intPart >= 1) {
    exponentActual = intBin.length - 1;
    mantissaUnpadded = intBin.slice(1) + fracBin;
  } else {
    const firstOne = fracBin.indexOf('1');
    exponentActual = -(firstOne + 1);
    mantissaUnpadded = fracBin.slice(firstOne + 1);
  }

  const normalizedBinary = `1,${mantissaUnpadded || '0'} · 2^${exponentActual}`;
  const exponentBiased = exponentActual + bias;
  const exponentBits = exponentBiased.toString(2).padStart(5, '0');
  const mantissaBits = mantissaUnpadded.slice(0, 10).padEnd(10, '0');
  const bits16 = `${signBit}${exponentBits}${mantissaBits}`;

  return {
    inputStr: valRaw,
    decimalValue,
    signBit,
    absBinary,
    normalizedBinary,
    exponentActual,
    bias,
    exponentBiased,
    exponentBits,
    mantissaBits,
    bits16,
    bitsGrouped: `${signBit} | ${exponentBits} | ${mantissaBits}`,
  };
}

// ==========================================
// 8. U2 ADDITION (8-BIT)
// ==========================================
export interface U2OperandTrace {
  decimal: number;
  absDecimal: number;
  absBinary: string;
  invertedU1: string | null;
  u2Binary: string;
}

export interface U2AdditionResult {
  bits: number;
  a: U2OperandTrace;
  b: U2OperandTrace;
  carriesRow: string;
  sumBinary: string;
  carryOut: '0' | '1';
  carryIntoMSB: '0' | '1';
  overflow: boolean;
  signedResultDecimal: number;
  sumDecimalCheck: number;
  verifyNegativeInversion: { inverted: string; plusOne: string; magnitude: number } | null;
}

export function toU2Trace(val: number, bits = 8): U2OperandTrace {
  const absDecimal = Math.abs(val);
  const absBinary = absDecimal.toString(2).padStart(bits, '0');
  if (val >= 0) {
    return {
      decimal: val,
      absDecimal,
      absBinary,
      invertedU1: null,
      u2Binary: absBinary,
    };
  }
  const invertedU1 = absBinary
    .split('')
    .map((b) => (b === '0' ? '1' : '0'))
    .join('');
  const u2Val = (parseInt(invertedU1, 2) + 1) & ((1 << bits) - 1);
  const u2Binary = u2Val.toString(2).padStart(bits, '0');
  return {
    decimal: val,
    absDecimal,
    absBinary,
    invertedU1,
    u2Binary,
  };
}

export function solveU2Addition(aDec: number, bDec: number, bits = 8): U2AdditionResult {
  const a = toU2Trace(aDec, bits);
  const b = toU2Trace(bDec, bits);

  let carry = 0;
  const carries: string[] = Array(bits).fill('0');
  const sumBits: string[] = Array(bits).fill('0');

  for (let i = bits - 1; i >= 0; i--) {
    carries[i] = String(carry);
    const s = Number(a.u2Binary[i]) + Number(b.u2Binary[i]) + carry;
    sumBits[i] = String(s % 2);
    carry = s >= 2 ? 1 : 0;
  }

  const sumBinary = sumBits.join('');
  const carryOut: '0' | '1' = carry ? '1' : '0';
  const carryIntoMSB: '0' | '1' = carries[0] === '1' ? '1' : '0';
  const overflow = carryIntoMSB !== carryOut;

  const rawUnsigned = parseInt(sumBinary, 2);
  const signedResultDecimal = sumBinary[0] === '1' ? rawUnsigned - (1 << bits) : rawUnsigned;
  const sumDecimalCheck = aDec + bDec;

  let verifyNegativeInversion: { inverted: string; plusOne: string; magnitude: number } | null = null;
  if (sumBinary[0] === '1') {
    const inverted = sumBinary
      .split('')
      .map((ch) => (ch === '0' ? '1' : '0'))
      .join('');
    const mag = parseInt(inverted, 2) + 1;
    verifyNegativeInversion = {
      inverted,
      plusOne: mag.toString(2).padStart(bits, '0'),
      magnitude: mag,
    };
  }

  return {
    bits,
    a,
    b,
    carriesRow: carries.join(''),
    sumBinary,
    carryOut,
    carryIntoMSB,
    overflow,
    signedResultDecimal,
    sumDecimalCheck,
    verifyNegativeInversion,
  };
}

// ==========================================
// 9. BCD (8421) + U9 (2-DIGIT)
// ==========================================
export interface BCDDigitTrace {
  decimalDigit: number;
  bcd: string;
}

export interface BCDNibbleAddition {
  positionLabel: string;
  digitA: number;
  bcdA: string;
  digitB: number;
  bcdB: string;
  incomingCarry: number;
  rawSumDec: number;
  rawSumBin: string;
  needsCorrection: boolean;
  correctedSumBin: string | null;
  finalDigit: number;
  finalBcd: string;
  carryOut: number;
  explanation: string;
}

export interface BCDU9Result {
  aDec: number;
  bDec: number;
  aU9Dec: number;
  bU9Dec: number;
  aBcd: string;
  bBcd: string;
  nibbleSteps: BCDNibbleAddition[];
  carryFromTens: number;
  resultU9Dec: number;
  resultBcd: string;
  isResultNegativeInU9: boolean;
  decodedDecimalResult: number;
}

function toBcd2(val: number): { tens: BCDDigitTrace; ones: BCDDigitTrace; full: string } {
  const tensD = Math.floor(val / 10);
  const onesD = val % 10;
  const tensBcd = tensD.toString(2).padStart(4, '0');
  const onesBcd = onesD.toString(2).padStart(4, '0');
  return {
    tens: { decimalDigit: tensD, bcd: tensBcd },
    ones: { decimalDigit: onesD, bcd: onesBcd },
    full: `${tensBcd} ${onesBcd}`,
  };
}

export function solveBCDU9Addition(aDec: number, bDec: number): BCDU9Result {
  const aU9Dec = aDec < 0 ? 99 - Math.abs(aDec) : aDec;
  const bU9Dec = bDec < 0 ? 99 - Math.abs(bDec) : bDec;
  const aBcdObj = toBcd2(aU9Dec);
  const bBcdObj = toBcd2(bU9Dec);

  const nibbleSteps: BCDNibbleAddition[] = [];

  // Ones column
  const rawOnes = aBcdObj.ones.decimalDigit + bBcdObj.ones.decimalDigit;
  const onesNeedsCorr = rawOnes > 9;
  const finalOnes = onesNeedsCorr ? (rawOnes + 6) % 16 : rawOnes;
  const carryToTens = rawOnes > 9 ? 1 : 0;

  nibbleSteps.push({
    positionLabel: 'Pozycja jedności (prawy blok 4-bitowy)',
    digitA: aBcdObj.ones.decimalDigit,
    bcdA: aBcdObj.ones.bcd,
    digitB: bBcdObj.ones.decimalDigit,
    bcdB: bBcdObj.ones.bcd,
    incomingCarry: 0,
    rawSumDec: rawOnes,
    rawSumBin: rawOnes.toString(2).padStart(4, '0'),
    needsCorrection: onesNeedsCorr,
    correctedSumBin: onesNeedsCorr ? (rawOnes + 6).toString(2).padStart(5, '0') : null,
    finalDigit: finalOnes,
    finalBcd: finalOnes.toString(2).padStart(4, '0'),
    carryOut: carryToTens,
    explanation: onesNeedsCorr
      ? `${aBcdObj.ones.bcd} (${aBcdObj.ones.decimalDigit}) + ${bBcdObj.ones.bcd} (${bBcdObj.ones.decimalDigit}) = ${rawOnes.toString(2).padStart(4, '0')} (${rawOnes} > 9). Ponieważ wynik przekracza 9 (niedozwolony w BCD), dodajemy korekcję +6 (0110) → otrzymujemy ${finalOnes.toString(2).padStart(4, '0')} (${finalOnes}) i przeniesienie 1 do pozycji dziesiątek.`
      : `${aBcdObj.ones.bcd} (${aBcdObj.ones.decimalDigit}) + ${bBcdObj.ones.bcd} (${bBcdObj.ones.decimalDigit}) = ${rawOnes.toString(2).padStart(4, '0')} (${rawOnes} ≤ 9). Poprawna cyfra BCD, brak korekcji +6 i brak przeniesienia.`,
  });

  // Tens column
  const rawTens = aBcdObj.tens.decimalDigit + bBcdObj.tens.decimalDigit + carryToTens;
  const tensNeedsCorr = rawTens > 9;
  const finalTens = tensNeedsCorr ? (rawTens + 6) % 16 : rawTens;
  const carryFromTens = rawTens > 9 ? 1 : 0;

  nibbleSteps.push({
    positionLabel: 'Pozycja dziesiątek (lewy blok 4-bitowy)',
    digitA: aBcdObj.tens.decimalDigit,
    bcdA: aBcdObj.tens.bcd,
    digitB: bBcdObj.tens.decimalDigit,
    bcdB: bBcdObj.tens.bcd,
    incomingCarry: carryToTens,
    rawSumDec: rawTens,
    rawSumBin: rawTens.toString(2).padStart(4, '0'),
    needsCorrection: tensNeedsCorr,
    correctedSumBin: tensNeedsCorr ? (rawTens + 6).toString(2).padStart(5, '0') : null,
    finalDigit: finalTens,
    finalBcd: finalTens.toString(2).padStart(4, '0'),
    carryOut: carryFromTens,
    explanation: tensNeedsCorr
      ? `${carryToTens ? '1 (przen.) + ' : ''}${aBcdObj.tens.bcd} (${aBcdObj.tens.decimalDigit}) + ${bBcdObj.tens.bcd} (${bBcdObj.tens.decimalDigit}) = ${rawTens} > 9 → dodajemy +6 (0110) → ${finalTens.toString(2).padStart(4, '0')} (${finalTens}) i przeniesienie końcowe 1.`
      : `${carryToTens ? '1 (przen.) + ' : ''}${aBcdObj.tens.bcd} (${aBcdObj.tens.decimalDigit}) + ${bBcdObj.tens.bcd} (${bBcdObj.tens.decimalDigit}) = ${rawTens.toString(2).padStart(4, '0')} (${rawTens} ≤ 9). Brak korekcji +6 i brak przeniesienia końcowego.`,
  });

  // End-around carry handling if carryFromTens === 1
  let resultU9Dec = finalTens * 10 + finalOnes;
  if (carryFromTens === 1) {
    resultU9Dec += 1;
  }
  const finalBcdObj = toBcd2(resultU9Dec);
  const isResultNegativeInU9 = carryFromTens === 0 && aDec + bDec < 0;
  const decodedDecimalResult = isResultNegativeInU9 ? -(99 - resultU9Dec) : resultU9Dec;

  return {
    aDec,
    bDec,
    aU9Dec,
    bU9Dec,
    aBcd: aBcdObj.full,
    bBcd: bBcdObj.full,
    nibbleSteps,
    carryFromTens,
    resultU9Dec,
    resultBcd: finalBcdObj.full,
    isResultNegativeInU9,
    decodedDecimalResult,
  };
}

// ==========================================
// 10. BOOTH'S ALGORITHM (4-BIT U2)
// ==========================================
export interface BoothIteration {
  iter: number;
  q0: '0' | '1';
  qm1: '0' | '1';
  pair: string;
  opType: 'sub' | 'add' | 'nop';
  actionLabel: string;
  A_before: string;
  Q_before: string;
  Qm1_before: '0' | '1';
  A_afterOp: string;
  A_afterShift: string;
  Q_afterShift: string;
  Qm1_afterShift: '0' | '1';
  explanation: string;
}

export interface BoothResult {
  mDec: number;
  qDec: number;
  bits: number;
  M_bin: string;
  negM_bin: string;
  initA: string;
  initQ: string;
  initQm1: '0';
  iterations: BoothIteration[];
  finalProductBin: string;
  finalProductDec: number;
}

export function solveBoothAlgorithm(mDec: number, qDec: number, bits = 4): BoothResult {
  const mask = (1 << bits) - 1;
  const toSignedBin = (n: number) => ((n < 0 ? (1 << bits) + n : n) & mask).toString(2).padStart(bits, '0');

  const M_bin = toSignedBin(mDec);
  const negM_bin = toSignedBin(-mDec);

  let A = '0'.repeat(bits);
  let Q = toSignedBin(qDec);
  let Qm1: '0' | '1' = '0';

  const initA = A;
  const initQ = Q;
  const iterations: BoothIteration[] = [];

  for (let iter = 1; iter <= bits; iter++) {
    const q0 = Q[bits - 1] as '0' | '1';
    const pair = `${q0}${Qm1}`;
    const A_before = A;
    const Q_before = Q;
    const Qm1_before = Qm1;

    let opType: 'sub' | 'add' | 'nop' = 'nop';
    let actionLabel = 'Brak operacji (00 / 11) → tylko przesunięcie';
    let A_afterOp = A;

    if (pair === '10') {
      opType = 'sub';
      actionLabel = `A ← A − M (czyli A + (−M) = ${A} + ${negM_bin})`;
      const sum = (parseInt(A, 2) + parseInt(negM_bin, 2)) & mask;
      A_afterOp = sum.toString(2).padStart(bits, '0');
    } else if (pair === '01') {
      opType = 'add';
      actionLabel = `A ← A + M (${A} + ${M_bin})`;
      const sum = (parseInt(A, 2) + parseInt(M_bin, 2)) & mask;
      A_afterOp = sum.toString(2).padStart(bits, '0');
    }

    // Arithmetic right shift [A, Q, Q-1]
    const msb = A_afterOp[0];
    const combined = A_afterOp + Q + Qm1;
    const shifted = msb + combined.slice(0, combined.length - 1);
    const A_afterShift = shifted.slice(0, bits);
    const Q_afterShift = shifted.slice(bits, bits * 2);
    const Qm1_afterShift = shifted[bits * 2] as '0' | '1';

    let explanation = '';
    if (pair === '10') {
      explanation = `Para (Q₀, Q₋₁) = (1, 0) → odejmujemy M (dodajemy −M = ${negM_bin}): ${A_before} + ${negM_bin} = ${A_afterOp}. Następnie arytmetyczne przesunięcie w prawo (zachowujemy bit znaku ${msb}): A=${A_afterShift}, Q=${Q_afterShift}, Q₋₁=${Qm1_afterShift}.`;
    } else if (pair === '01') {
      explanation = `Para (Q₀, Q₋₁) = (0, 1) → dodajemy M (${M_bin}): ${A_before} + ${M_bin} = ${A_afterOp}. Następnie arytmetyczne przesunięcie w prawo (zachowujemy bit znaku ${msb}): A=${A_afterShift}, Q=${Q_afterShift}, Q₋₁=${Qm1_afterShift}.`;
    } else {
      explanation = `Para (Q₀, Q₋₁) = (${q0}, ${Qm1}) → nie dodajemy ani nie odejmujemy (A pozostaje ${A_afterOp}). Wykonujemy arytmetyczne przesunięcie w prawo (bit znaku ${msb}): A=${A_afterShift}, Q=${Q_afterShift}, Q₋₁=${Qm1_afterShift}.`;
    }

    iterations.push({
      iter,
      q0,
      qm1: Qm1,
      pair,
      opType,
      actionLabel,
      A_before,
      Q_before,
      Qm1_before,
      A_afterOp,
      A_afterShift,
      Q_afterShift,
      Qm1_afterShift,
      explanation,
    });

    A = A_afterShift;
    Q = Q_afterShift;
    Qm1 = Qm1_afterShift;
  }

  const finalProductBin = `${A}${Q}`;
  const rawProd = parseInt(finalProductBin, 2);
  const finalProductDec = finalProductBin[0] === '1' ? rawProd - (1 << (bits * 2)) : rawProd;

  return {
    mDec,
    qDec,
    bits,
    M_bin,
    negM_bin,
    initA,
    initQ,
    initQm1: '0',
    iterations,
    finalProductBin,
    finalProductDec,
  };
}
