// Tipos minimos do qrcode-generator 2.0.4 (vendored). Somente o que o app usa.
export interface QRCode {
  addData(data: string, mode?: 'Numeric' | 'Alphanumeric' | 'Byte' | 'Kanji'): void
  make(): void
  getModuleCount(): number
  isDark(row: number, col: number): boolean
}
export const qrcode: (typeNumber: number, errorCorrectionLevel: 'L' | 'M' | 'Q' | 'H') => QRCode
export default qrcode
