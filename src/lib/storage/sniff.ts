// Magic-byte sniffer for the file types Avori accepts.
// Returns the canonical MIME for the bytes, or null if not recognized.
// Never trust the client-reported `file.type` — always run this on the server.

export type SniffedMime =
  | 'video/mp4'
  | 'video/webm'
  | 'video/quicktime'
  | 'image/jpeg'
  | 'image/png'
  | 'image/webp'
  | 'image/gif';

const has = (b: Buffer, offset: number, signature: number[]): boolean => {
  if (b.length < offset + signature.length) return false;
  for (let i = 0; i < signature.length; i++) {
    if (b[offset + i] !== signature[i]) return false;
  }
  return true;
};

// MP4 / MOV / various ISO-BMFF: bytes 4-7 = 'ftyp', then a brand at 8-11.
function ftypBrand(b: Buffer): string | null {
  if (b.length < 12) return null;
  if (b[4] !== 0x66 || b[5] !== 0x74 || b[6] !== 0x79 || b[7] !== 0x70) return null;
  return b.slice(8, 12).toString('ascii');
}

export function sniffMime(buf: Buffer): SniffedMime | null {
  // PNG
  if (has(buf, 0, [0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a])) return 'image/png';
  // JPEG
  if (has(buf, 0, [0xff, 0xd8, 0xff])) return 'image/jpeg';
  // GIF87a / GIF89a
  if (has(buf, 0, [0x47, 0x49, 0x46, 0x38])) return 'image/gif';
  // WebP: 'RIFF' .... 'WEBP'
  if (has(buf, 0, [0x52, 0x49, 0x46, 0x46]) && has(buf, 8, [0x57, 0x45, 0x42, 0x50])) {
    return 'image/webp';
  }
  // Matroska / WebM
  if (has(buf, 0, [0x1a, 0x45, 0xdf, 0xa3])) return 'video/webm';
  // ISO-BMFF (mp4 / mov / 3gp): inspect ftyp brand
  const brand = ftypBrand(buf);
  if (brand) {
    const b = brand.trim();
    if (b === 'qt' || b.startsWith('qt')) return 'video/quicktime';
    // accept the common mp4/iso brands
    if (
      b === 'isom' ||
      b === 'iso2' ||
      b === 'mp41' ||
      b === 'mp42' ||
      b === 'M4V ' ||
      b === 'avc1' ||
      b === 'dash' ||
      b.startsWith('iso') ||
      b.startsWith('mp4')
    ) {
      return 'video/mp4';
    }
  }
  return null;
}

const EXT: Record<SniffedMime, string> = {
  'video/mp4': 'mp4',
  'video/webm': 'webm',
  'video/quicktime': 'mov',
  'image/jpeg': 'jpg',
  'image/png': 'png',
  'image/webp': 'webp',
  'image/gif': 'gif',
};

export function extensionFor(mime: SniffedMime): string {
  return EXT[mime];
}
