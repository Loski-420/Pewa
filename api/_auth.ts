import crypto from 'crypto';

const sign = (exp: string) =>
  crypto.createHmac('sha256', process.env.ADMIN_SECRET || '').update(exp).digest('hex');

export const makeToken = () => {
  const exp = String(Date.now() + 12 * 60 * 60 * 1000); // 12 hours
  return `${exp}.${sign(exp)}`;
};

export const verifyToken = (token?: string | string[]) => {
  if (!process.env.ADMIN_SECRET || typeof token !== 'string') return false;
  const [exp, sig] = token.split('.');
  if (!exp || !sig || Number(exp) < Date.now()) return false;
  const expected = sign(exp);
  return sig.length === expected.length &&
    crypto.timingSafeEqual(Buffer.from(sig), Buffer.from(expected));
};