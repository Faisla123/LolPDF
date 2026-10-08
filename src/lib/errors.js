export function friendlyError(err) {
  const msg = String(err?.message || err || '');
  if (/did not (open|work)|needs its password/i.test(msg)) return msg;
  if (/encrypted|password/i.test(msg) && !/invalid password/i.test(msg)) {
    return 'This PDF is locked. Open it with the Unlock PDF tool first.';
  }
  if (/invalid password|incorrect password/i.test(msg)) return 'That password did not work.';
  if (/Invalid PDF|No PDF header|Failed to parse|InvalidPDF|bad XRef|Missing PDF/i.test(msg)) {
    return 'This file looks damaged or is not a real PDF. Try the Repair PDF tool.';
  }
  if (/out of memory|allocation|Array buffer allocation/i.test(msg)) {
    return 'This file is too big for your device memory. Try a smaller file or split it first.';
  }
  return msg || 'Something went wrong while processing this file.';
}
