import { makeToken } from './_auth';

const digits = (s: unknown) => String(s || '').replace(/\D/g, '').slice(-9);

export default function handler(req: any, res: any) {
  if (req.method !== 'POST') return res.status(405).end();
  const { phone, password } = req.body || {};
  if (
    digits(phone) &&
    digits(phone) === digits(process.env.ADMIN_PHONE) &&
    password === process.env.ADMIN_PASSWORD
  ) {
    return res.status(200).json({ token: makeToken() });
  }
  return res.status(401).json({ error: 'Invalid credentials' });
}