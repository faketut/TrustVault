// Minimal vendor copy based on Nayuki's QR Code generator
// Source reference: https://github.com/nayuki/QR-Code-generator (TypeScript/JavaScript)
// Exposes: generateContractQRCodeSVG(content: string)

/* eslint-disable */

namespace qrcodegen {
  type bit = number; type byte = number; type int = number;

  export class QrCode {
    public static readonly MIN_VERSION: int = 1;
    public static readonly MAX_VERSION: int = 40;
    public static readonly PENALTY_N1: int = 3;
    public static readonly PENALTY_N2: int = 3;
    public static readonly PENALTY_N3: int = 40;
    public static readonly PENALTY_N4: int = 10;

    public static encodeText(text: string, ecl: QrCode.Ecc): QrCode {
      const segs: Array<QrSegment> = qrcodegen.QrSegment.makeSegments(text);
      return QrCode.encodeSegments(segs, ecl);
    }

    public static encodeSegments(segs: Readonly<Array<QrSegment>>, ecl: QrCode.Ecc,
      minVersion: int = 1, maxVersion: int = 40,
      mask: int = -1, boostEcl: boolean = true): QrCode {
      if (!(QrCode.MIN_VERSION <= minVersion && minVersion <= maxVersion && maxVersion <= QrCode.MAX_VERSION)
        || mask < -1 || mask > 7) throw new RangeError("Invalid value");

      let version: int; let dataUsedBits: int;
      for (version = minVersion; ; version++) {
        const dataCapacityBits: int = QrCode.getNumDataCodewords(version, ecl) * 8;
        const usedBits: number = QrSegment.getTotalBits(segs, version);
        if (usedBits <= dataCapacityBits) { dataUsedBits = usedBits; break; }
        if (version >= maxVersion) throw new RangeError("Data too long");
      }

      for (const newEcl of [QrCode.Ecc.MEDIUM, QrCode.Ecc.QUARTILE, QrCode.Ecc.HIGH]) {
        if (boostEcl && dataUsedBits <= QrCode.getNumDataCodewords(version, newEcl) * 8) ecl = newEcl;
      }

      let bb: Array<bit> = [];
      for (const seg of segs) {
        appendBits(seg.mode.modeBits, 4, bb);
        appendBits(seg.numChars, seg.mode.numCharCountBits(version), bb);
        for (const b of seg.getData()) bb.push(b);
      }

      const dataCapacityBits: int = QrCode.getNumDataCodewords(version, ecl) * 8;
      appendBits(0, Math.min(4, dataCapacityBits - bb.length), bb);
      appendBits(0, (8 - bb.length % 8) % 8, bb);
      for (let padByte = 0xEC; bb.length < dataCapacityBits; padByte ^= 0xEC ^ 0x11) appendBits(padByte, 8, bb);

      let dataCodewords: Array<byte> = []; while (dataCodewords.length * 8 < bb.length) dataCodewords.push(0);
      bb.forEach((b: bit, i: int) => dataCodewords[i >>> 3] |= b << (7 - (i & 7)));
      return new QrCode(version, ecl, dataCodewords, mask);
    }

    public readonly size: int; public readonly mask: int;
    private readonly modules: Array<Array<boolean>> = [];
    private readonly isFunction: Array<Array<boolean>> = [];

    public constructor(public readonly version: int, public readonly errorCorrectionLevel: QrCode.Ecc, dataCodewords: Readonly<Array<byte>>, msk: int) {
      if (version < QrCode.MIN_VERSION || version > QrCode.MAX_VERSION) throw new RangeError("Version out of range");
      if (msk < -1 || msk > 7) throw new RangeError("Mask out of range");
      this.size = version * 4 + 17;
      let row: Array<boolean> = []; for (let i = 0; i < this.size; i++) row.push(false);
      for (let i = 0; i < this.size; i++) { this.modules.push(row.slice()); this.isFunction.push(row.slice()); }
      this.drawFunctionPatterns();
      const allCodewords: Array<byte> = this.addEccAndInterleave(dataCodewords);
      this.drawCodewords(allCodewords);
      if (msk == -1) { let minPenalty: int = 1e9; for (let i = 0; i < 8; i++) { this.applyMask(i); this.drawFormatBits(i); const p = this.getPenaltyScore(); if (p < minPenalty) { msk = i; minPenalty = p; } this.applyMask(i);} }
      this.mask = msk; this.applyMask(msk); this.drawFormatBits(msk); this.isFunction = [] as any;
    }

    public getModule(x: int, y: int): boolean { return 0 <= x && x < this.size && 0 <= y && y < this.size && this.modules[y][x]; }

    private drawFunctionPatterns(): void {
      for (let i = 0; i < this.size; i++) { this.setFunctionModule(6, i, i % 2 == 0); this.setFunctionModule(i, 6, i % 2 == 0); }
      this.drawFinderPattern(3, 3); this.drawFinderPattern(this.size - 4, 3); this.drawFinderPattern(3, this.size - 4);
      const alignPatPos: Array<int> = QrCode.getAlignmentPatternPositions(this.version); const numAlign: int = alignPatPos.length;
      for (let i = 0; i < numAlign; i++) for (let j = 0; j < numAlign; j++) if (!(i == 0 && j == 0 || i == 0 && j == numAlign - 1 || i == numAlign - 1 && j == 0)) this.drawAlignmentPattern(alignPatPos[i], alignPatPos[j]);
      this.drawFormatBits(0); this.drawVersion();
    }
    private drawFormatBits(mask: int): void {
      const data: int = this.errorCorrectionLevel.formatBits << 3 | mask; let rem: int = data; for (let i = 0; i < 10; i++) rem = (rem << 1) ^ ((rem >>> 9) * 0x537); const bits = (data << 10 | rem) ^ 0x5412;
      for (let i = 0; i <= 5; i++) this.setFunctionModule(8, i, getBit(bits, i)); this.setFunctionModule(8, 7, getBit(bits, 6)); this.setFunctionModule(8, 8, getBit(bits, 7)); this.setFunctionModule(7, 8, getBit(bits, 8)); for (let i = 9; i < 15; i++) this.setFunctionModule(14 - i, 8, getBit(bits, i));
      for (let i = 0; i < 8; i++) this.setFunctionModule(this.size - 1 - i, 8, getBit(bits, i)); for (let i = 8; i < 15; i++) this.setFunctionModule(8, this.size - 15 + i, getBit(bits, i)); this.setFunctionModule(8, this.size - 8, true);
    }
    private drawVersion(): void { if (this.version < 7) return; let rem: int = this.version; for (let i = 0; i < 12; i++) rem = (rem << 1) ^ ((rem >>> 11) * 0x1F25); const bits: int = this.version << 12 | rem; for (let i = 0; i < 18; i++) { const color: boolean = getBit(bits, i); const a: int = this.size - 11 + i % 3; const b: int = Math.floor(i / 3); this.setFunctionModule(a, b, color); this.setFunctionModule(b, a, color);} }
    private drawFinderPattern(x: int, y: int): void { for (let dy = -4; dy <= 4; dy++) for (let dx = -4; dx <= 4; dx++) { const dist: int = Math.max(Math.abs(dx), Math.abs(dy)); const xx: int = x + dx; const yy: int = y + dy; if (0 <= xx && xx < this.size && 0 <= yy && yy < this.size) this.setFunctionModule(xx, yy, dist != 2 && dist != 4);} }
    private drawAlignmentPattern(x: int, y: int): void { for (let dy = -2; dy <= 2; dy++) for (let dx = -2; dx <= 2; dx++) this.setFunctionModule(x + dx, y + dy, Math.max(Math.abs(dx), Math.abs(dy)) != 1); }
    private setFunctionModule(x: int, y: int, isDark: boolean): void { this.modules[y][x] = isDark; this.isFunction[y][x] = true; }

    private addEccAndInterleave(data: Readonly<Array<byte>>): Array<byte> {
      const ver: int = this.version; const ecl: QrCode.Ecc = this.errorCorrectionLevel;
      if (data.length != QrCode.getNumDataCodewords(ver, ecl)) throw new RangeError("Invalid argument");
      const numBlocks: int = QrCode.NUM_ERROR_CORRECTION_BLOCKS[ecl.ordinal][ver]; const blockEccLen: int = QrCode.ECC_CODEWORDS_PER_BLOCK[ecl.ordinal][ver]; const rawCodewords: int = Math.floor(QrCode.getNumRawDataModules(ver) / 8); const numShortBlocks: int = numBlocks - rawCodewords % numBlocks; const shortBlockLen: int = Math.floor(rawCodewords / numBlocks);
      let blocks: Array<Array<byte>> = []; const rsDiv: Array<byte> = QrCode.reedSolomonComputeDivisor(blockEccLen);
      for (let i = 0, k = 0; i < numBlocks; i++) { let dat: Array<byte> = data.slice(k, k + shortBlockLen - blockEccLen + (i < numShortBlocks ? 0 : 1)); k += dat.length; const ecc: Array<byte> = QrCode.reedSolomonComputeRemainder(dat, rsDiv); if (i < numShortBlocks) dat.push(0); blocks.push(dat.concat(ecc)); }
      let result: Array<byte> = []; for (let i = 0; i < blocks[0].length; i++) blocks.forEach((block, j) => { if (i != shortBlockLen - blockEccLen || j >= numShortBlocks) result.push(block[i]); });
      return result;
    }
    private drawCodewords(data: Readonly<Array<byte>>): void { if (data.length != Math.floor(QrCode.getNumRawDataModules(this.version) / 8)) throw new RangeError("Invalid argument"); let i: int = 0; for (let right = this.size - 1; right >= 1; right -= 2) { if (right == 6) right = 5; for (let vert = 0; vert < this.size; vert++) { for (let j = 0; j < 2; j++) { const x: int = right - j; const upward: boolean = ((right + 1) & 2) == 0; const y: int = upward ? this.size - 1 - vert : vert; if (!this.isFunction[y][x] && i < data.length * 8) { this.modules[y][x] = getBit(data[i >>> 3], 7 - (i & 7)); i++; } } } } }
    private applyMask(mask: int): void { if (mask < 0 || mask > 7) throw new RangeError("Mask out of range"); for (let y = 0; y < this.size; y++) for (let x = 0; x < this.size; x++) { let invert: boolean; switch (mask) { case 0: invert = (x + y) % 2 == 0; break; case 1: invert = y % 2 == 0; break; case 2: invert = x % 3 == 0; break; case 3: invert = (x + y) % 3 == 0; break; case 4: invert = (Math.floor(x / 3) + Math.floor(y / 2)) % 2 == 0; break; case 5: invert = x * y % 2 + x * y % 3 == 0; break; case 6: invert = (x * y % 2 + x * y % 3) % 2 == 0; break; case 7: invert = ((x + y) % 2 + x * y % 3) % 2 == 0; break; default: throw new Error("Unreachable"); } if (!this.isFunction[y][x] && invert) this.modules[y][x] = !this.modules[y][x]; } }
    private getPenaltyScore(): int { let result: int = 0; for (let y = 0; y < this.size; y++) { let runColor = false; let runX = 0; let runHistory = [0,0,0,0,0,0,0]; for (let x = 0; x < this.size; x++) { if (this.modules[y][x] == runColor) { runX++; if (runX == 5) result += QrCode.PENALTY_N1; else if (runX > 5) result++; } else { this.finderPenaltyAddHistory(runX, runHistory); if (!runColor) result += this.finderPenaltyCountPatterns(runHistory) * QrCode.PENALTY_N3; runColor = this.modules[y][x]; runX = 1; } } result += this.finderPenaltyTerminateAndCount(runColor, runX, runHistory) * QrCode.PENALTY_N3; } for (let x = 0; x < this.size; x++) { let runColor = false; let runY = 0; let runHistory = [0,0,0,0,0,0,0]; for (let y = 0; y < this.size; y++) { if (this.modules[y][x] == runColor) { runY++; if (runY == 5) result += QrCode.PENALTY_N1; else if (runY > 5) result++; } else { this.finderPenaltyAddHistory(runY, runHistory); if (!runColor) result += this.finderPenaltyCountPatterns(runHistory) * QrCode.PENALTY_N3; runColor = this.modules[y][x]; runY = 1; } } result += this.finderPenaltyTerminateAndCount(runColor, runY, runHistory) * QrCode.PENALTY_N3; } for (let y = 0; y < this.size - 1; y++) for (let x = 0; x < this.size - 1; x++) { const c = this.modules[y][x]; if (c == this.modules[y][x+1] && c == this.modules[y+1][x] && c == this.modules[y+1][x+1]) result += QrCode.PENALTY_N2; } let dark: int = 0; for (const row of this.modules) dark = row.reduce((s, c) => s + (c ? 1 : 0), dark); const total: int = this.size * this.size; const k: int = Math.ceil(Math.abs(dark * 20 - total * 10) / total) - 1; result += k * QrCode.PENALTY_N4; return result; }

    private finderPenaltyAddHistory(currentRunLength: int, runHistory: Array<int>): void {
      if (runHistory[0] === 0) currentRunLength += this.size;
      runHistory[4] = runHistory[3]; runHistory[3] = runHistory[2]; runHistory[2] = runHistory[1]; runHistory[1] = runHistory[0]; runHistory[0] = currentRunLength;
    }

    private finderPenaltyCountPatterns(runHistory: Array<int>): int {
      const n = runHistory[1];
      if (n > this.size * 3) throw new Error("Assertion error");
      const core = n > 0 && runHistory[2] === n && runHistory[3] === n * 3 && runHistory[4] === n && runHistory[5] === n;
      return (core && runHistory[0] === n ? 1 : 0) + (core && runHistory[6] === n ? 1 : 0);
    }

    private finderPenaltyTerminateAndCount(currentRunColor: boolean, currentRunLength: int, runHistory: Array<int>): int {
      if (currentRunColor) { this.finderPenaltyAddHistory(currentRunLength, runHistory); currentRunLength = 0; }
      currentRunLength += this.size;
      this.finderPenaltyAddHistory(currentRunLength, runHistory);
      return this.finderPenaltyCountPatterns(runHistory);
    }

    private static getAlignmentPatternPositions(this: void, ver: int): Array<int> {
      if (ver == 1) return []; else { const numAlign: int = Math.floor(ver / 7) + 2; const step: int = Math.floor((ver * 8 + numAlign * 3 + 5) / (numAlign * 4 - 4)) * 2; let result: Array<int> = [6]; for (let pos = ver * 4 + 10; result.length < numAlign; pos -= step) result.splice(1, 0, pos); return result; }
    }
    private static getNumRawDataModules(ver: int): int { if (ver < QrCode.MIN_VERSION || ver > QrCode.MAX_VERSION) throw new RangeError("Version out of range"); let result: int = (16 * ver + 128) * ver + 64; if (ver >= 2) { const numAlign: int = Math.floor(ver / 7) + 2; result -= (25 * numAlign - 10) * numAlign - 55; if (ver >= 7) result -= 36; } return result; }
    private static getNumDataCodewords(ver: int, ecl: QrCode.Ecc): int { return Math.floor(QrCode.getNumRawDataModules(ver) / 8) - QrCode.ECC_CODEWORDS_PER_BLOCK[ecl.ordinal][ver] * QrCode.NUM_ERROR_CORRECTION_BLOCKS[ecl.ordinal][ver]; }
    private static reedSolomonComputeDivisor(degree: int): Array<byte> { if (degree < 1 || degree > 255) throw new RangeError("Degree out of range"); let result: Array<byte> = []; for (let i = 0; i < degree - 1; i++) result.push(0); result.push(1); let root = 1; for (let i = 0; i < degree; i++) { for (let j = 0; j < result.length; j++) { result[j] = QrCode.reedSolomonMultiply(result[j], root); if (j + 1 < result.length) result[j] ^= result[j + 1]; } root = QrCode.reedSolomonMultiply(root, 0x02);} return result; }
    private static reedSolomonComputeRemainder(data: Readonly<Array<byte>>, divisor: Readonly<Array<byte>>): Array<byte> { let result: Array<byte> = divisor.map(_ => 0); for (const b of data) { const factor: byte = b ^ (result.shift() as byte); result.push(0); divisor.forEach((coef, i) => result[i] ^= QrCode.reedSolomonMultiply(coef, factor)); } return result; }
    private static reedSolomonMultiply(x: byte, y: byte): byte { if (x >>> 8 != 0 || y >>> 8 != 0) throw new RangeError("Byte out of range"); let z: int = 0; for (let i = 7; i >= 0; i--) { z = (z << 1) ^ ((z >>> 7) * 0x11D); z ^= ((y >>> i) & 1) * x; } return z as byte; }

    private static readonly ECC_CODEWORDS_PER_BLOCK: Array<Array<int>> = [
      [-1,7,10,15,20,26,18,20,24,30,18,20,24,26,30,22,24,28,30,28,28,28,28,30,30,26,28,30,30,30,30,30,30,30,30,30,30,30,30,30,30],
      [-1,10,16,26,18,24,16,18,22,22,26,30,22,22,24,24,28,28,26,26,26,26,28,28,28,28,28,28,28,28,28,28,28,28,28,28,28,28,28,28,28],
      [-1,13,22,18,26,18,24,18,22,20,24,28,26,24,20,30,24,28,28,26,30,28,30,30,30,30,28,30,30,30,30,30,30,30,30,30,30,30,30,30,30],
      [-1,17,28,22,16,22,28,26,26,24,28,24,28,22,24,24,30,28,28,26,28,30,24,30,30,30,30,30,30,30,30,30,30,30,30,30,30,30,30,30,30],
    ];
    private static readonly NUM_ERROR_CORRECTION_BLOCKS: Array<Array<int>> = [
      [-1,1,1,1,1,1,2,2,2,2,4,4,4,4,4,6,6,6,6,7,8,8,9,9,10,12,12,12,13,14,15,16,17,18,19,19,20,21,22,24,25],
      [-1,1,1,1,2,2,4,4,4,5,5,5,8,9,9,10,10,11,13,14,16,17,17,18,20,21,23,25,26,28,29,31,33,35,37,38,40,43,45,47,49],
      [-1,1,1,2,2,4,4,6,6,8,8,8,10,12,16,12,17,16,18,21,20,23,23,25,27,29,34,34,35,38,40,43,45,48,51,53,56,59,62,65,68],
      [-1,1,1,2,4,4,4,5,6,8,8,11,11,16,16,18,16,19,21,25,25,25,34,30,32,35,37,40,42,45,48,51,54,57,60,63,66,70,74,77,81],
    ];
  }

  export namespace QrCode {
    export class Ecc { private constructor(public readonly ordinal: int, public readonly formatBits: int){} static readonly LOW=new Ecc(0,1); static readonly MEDIUM=new Ecc(1,0); static readonly QUARTILE=new Ecc(2,3); static readonly HIGH=new Ecc(3,2);} }

  export class QrSegment {
    public static makeSegments(text: string): Array<QrSegment> { if (text == "") return []; else if (QrSegment.isNumeric(text)) return [QrSegment.makeNumeric(text)]; else if (QrSegment.isAlphanumeric(text)) return [QrSegment.makeAlphanumeric(text)]; else return [QrSegment.makeBytes(QrSegment.toUtf8ByteArray(text))]; }
    public static makeBytes(data: Readonly<Array<byte>>): QrSegment { let bb: Array<bit> = []; for (const b of data) appendBits(b, 8, bb); return new QrSegment(QrSegment.Mode.BYTE, data.length, bb); }
    public static makeNumeric(digits: string): QrSegment { if (!QrSegment.isNumeric(digits)) throw new RangeError("Non-numeric"); let bb: Array<bit> = []; for (let i = 0; i < digits.length; ) { const n: int = Math.min(digits.length - i, 3); appendBits(parseInt(digits.substring(i, i + n), 10), n * 3 + 1, bb); i += n; } return new QrSegment(QrSegment.Mode.NUMERIC, digits.length, bb); }
    public static makeAlphanumeric(text: string): QrSegment { if (!QrSegment.isAlphanumeric(text)) throw new RangeError("Bad character"); let bb: Array<bit> = []; let i: int; for (i = 0; i + 2 <= text.length; i += 2) { let t: int = QrSegment.ALPHANUMERIC_CHARSET.indexOf(text.charAt(i)) * 45; t += QrSegment.ALPHANUMERIC_CHARSET.indexOf(text.charAt(i + 1)); appendBits(t, 11, bb);} if (i < text.length) appendBits(QrSegment.ALPHANUMERIC_CHARSET.indexOf(text.charAt(i)), 6, bb); return new QrSegment(QrSegment.Mode.ALPHANUMERIC, text.length, bb); }
    public static getTotalBits(segs: Readonly<Array<QrSegment>>, version: int): number { let result: number = 0; for (const seg of segs) { const ccbits: int = seg.mode.numCharCountBits(version); if (seg.numChars >= (1 << ccbits)) return Infinity; result += 4 + ccbits + seg.bitData.length; } return result; }
    private static toUtf8ByteArray(str: string): Array<byte> { str = encodeURI(str); let result: Array<byte> = []; for (let i = 0; i < str.length; i++) { if (str.charAt(i) != "%") result.push(str.charCodeAt(i)); else { result.push(parseInt(str.substring(i+1, i+3), 16)); i += 2; } } return result; }
    public static isNumeric(text: string): boolean { return QrSegment.NUMERIC_REGEX.test(text); }
    public static isAlphanumeric(text: string): boolean { return QrSegment.ALPHANUMERIC_REGEX.test(text); }
    public constructor(public readonly mode: QrSegment.Mode, public readonly numChars: int, private readonly bitData: Array<bit>) { if (numChars < 0) throw new RangeError("Invalid"); this.bitData = bitData.slice(); }
    public getData(): Array<bit> { return this.bitData.slice(); }
  }

  export namespace QrSegment { export class Mode { private constructor(public readonly modeBits: int, private readonly numBitsCharCount: [int,int,int]){} public numCharCountBits(ver: int): int { return this.numBitsCharCount[Math.floor((ver + 7) / 17)]; } static readonly NUMERIC=new Mode(0x1,[10,12,14]); static readonly ALPHANUMERIC=new Mode(0x2,[9,11,13]); static readonly BYTE=new Mode(0x4,[8,16,16]); static readonly KANJI=new Mode(0x8,[8,10,12]); static readonly ECI=new Mode(0x7,[0,0,0]); }
    export const NUMERIC_REGEX: RegExp = /^[0-9]*$/; export const ALPHANUMERIC_REGEX: RegExp = /^[A-Z0-9 $%*+./:-]*$/; export const ALPHANUMERIC_CHARSET: string = "0123456789ABCDEFGHIJKLMNOPQRSTUVWXYZ $%*+-./:"; }

  function appendBits(val: int, len: int, bb: Array<bit>): void { if (len < 0 || len > 31 || val >>> len != 0) throw new RangeError("Value out of range"); for (let i = len - 1; i >= 0; i--) bb.push((val >>> i) & 1); }
  function getBit(x: int, i: int): boolean { return ((x >>> i) & 1) != 0; }
}

export function generateContractQRCodeSVG(content: string): string {
  const qr = qrcodegen.QrCode.encodeText(content, qrcodegen.QrCode.Ecc.MEDIUM);
  const border = 2; const size = qr.size + border * 2;
  let svg: string[] = [];
  svg.push(`<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${size} ${size}" shape-rendering="crispEdges">`);
  svg.push('<rect width="100%" height="100%" fill="#ffffff"/>');
  svg.push('<g fill="#000000">');
  for (let y = 0; y < qr.size; y++) {
    let runStart = -1;
    for (let x = 0; x < qr.size; x++) {
      const isDark = qr.getModule(x, y);
      if (isDark && runStart < 0) runStart = x;
      if ((!isDark || x === qr.size - 1) && runStart >= 0) {
        const runEnd = isDark && x === qr.size - 1 ? x : x - 1;
        const rectX = runStart + border; const rectY = y + border; const rectW = runEnd - runStart + 1;
        svg.push(`<rect x="${rectX}" y="${rectY}" width="${rectW}" height="1"/>`);
        runStart = -1;
      }
    }
  }
  svg.push('</g>'); svg.push('</svg>');
  return svg.join('');
}

export function generateContractQRCodeDataUrl(content: string): string {
  const svg = generateContractQRCodeSVG(content);
  return `data:image/svg+xml;charset=utf-8,${encodeURIComponent(svg)}`;
}


