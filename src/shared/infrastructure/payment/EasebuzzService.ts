import { createHash } from 'node:crypto';
import { config } from '../../../config/index.js';
import { logger } from '../logger/PinoLogger.js';

const EASEBUZZ_TEST_URL = 'https://testpay.easebuzz.in/payment/initiateLink';
const EASEBUZZ_PROD_URL = 'https://pay.easebuzz.in/payment/initiateLink';

export interface EasebuzzPaymentParams {
  txnid: string;
  amount: number;
  productinfo: string;
  firstname: string;
  email: string;
  phone: string;
  udf1?: string; // studentId
  udf2?: string; // courseName + lateFees (query string)
  udf3?: string; // remainingFees
  udf4?: string; // installmentCount
  udf5?: string; // installmentAmount
  udf6?: string; // netCourseFees
  udf7?: string; // paymentOption
}

export interface EasebuzzInitiateResponse {
  paymentUrl: string;
  accessKey: string;
}

function isProdEnv(): boolean {
  const env = config.EASEBUZZ_ENV?.toLowerCase();
  return env === 'prod' || env === 'production';
}

function getBaseUrl(): string {
  return isProdEnv() ? EASEBUZZ_PROD_URL : EASEBUZZ_TEST_URL;
}

function getPaymentPageUrl(): string {
  return isProdEnv()
    ? 'https://pay.easebuzz.in/pay'
    : 'https://testpay.easebuzz.in/pay';
}

/**
 * Generates SHA-512 hash for Easebuzz payment initiation.
 * Format: key|txnid|amount|productinfo|firstname|email|||||||||||salt
 */
export function generateHash(params: EasebuzzPaymentParams): string {
  const key = config.EASEBUZZ_KEY!;
  const salt = config.EASEBUZZ_SALT!;

  const udf1 = params.udf1 ?? '';
  const udf2 = params.udf2 ?? '';
  const udf3 = params.udf3 ?? '';
  const udf4 = params.udf4 ?? '';
  const udf5 = params.udf5 ?? '';
  const udf6 = params.udf6 ?? '';
  const udf7 = params.udf7 ?? '';

  const hashString = `${key}|${params.txnid}|${String(params.amount)}|${params.productinfo}|${params.firstname}|${params.email}|${udf1}|${udf2}|${udf3}|${udf4}|${udf5}|${udf6}|${udf7}||||${salt}`;

  return createHash('sha512').update(hashString).digest('hex');
}

/**
 * Verifies the response hash from Easebuzz callback.
 * Reverse format: salt|status|||||||||||email|firstname|productinfo|amount|txnid|key
 */
export function verifyPaymentHash(params: {
  txnid: string;
  amount: number;
  productinfo: string;
  firstname: string;
  email: string;
  status: string;
  hash: string;
  udf1?: string;
  udf2?: string;
  udf3?: string;
  udf4?: string;
  udf5?: string;
  udf6?: string;
  udf7?: string;
}): boolean {
  const key = config.EASEBUZZ_KEY;
  const salt = config.EASEBUZZ_SALT;

  if (!key || !salt) {
    logger.error('Easebuzz keys not configured — cannot verify payment hash');
    return false;
  }

  const udf7 = params.udf7 ?? '';
  const udf6 = params.udf6 ?? '';
  const udf5 = params.udf5 ?? '';
  const udf4 = params.udf4 ?? '';
  const udf3 = params.udf3 ?? '';
  const udf2 = params.udf2 ?? '';
  const udf1 = params.udf1 ?? '';

  const hashString = `${salt}|${params.status}||||${udf7}|${udf6}|${udf5}|${udf4}|${udf3}|${udf2}|${udf1}|${params.email}|${params.firstname}|${params.productinfo}|${String(params.amount)}|${params.txnid}|${key}`;

  const calculatedHash = createHash('sha512').update(hashString).digest('hex');

  return calculatedHash === params.hash;
}

const MAX_RETRIES = 2;
const RETRY_DELAYS = [1000, 3000]; // ms backoff between retries

async function fetchWithRetry(
  url: string,
  options: RequestInit,
  txnid: string,
): Promise<Response> {
  for (let attempt = 0; attempt <= MAX_RETRIES; attempt++) {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 15000);

    try {
      const response = await fetch(url, { ...options, signal: controller.signal });
      clearTimeout(timeoutId);

      if (!response.ok && attempt < MAX_RETRIES) {
        logger.warn(
          { txnid, httpStatus: response.status, attempt: attempt + 1 },
          'Easebuzz API returned non-OK status, retrying',
        );
        await new Promise((r) => setTimeout(r, RETRY_DELAYS[attempt]));
        continue;
      }

      if (!response.ok) {
        throw new Error(`Easebuzz API error: HTTP ${response.status}`);
      }

      return response;
    } catch (err) {
      clearTimeout(timeoutId);

      if (attempt < MAX_RETRIES) {
        const isAbort = err instanceof Error && err.name === 'AbortError';
        logger.warn(
          { txnid, attempt: attempt + 1, error: isAbort ? 'timeout' : String(err) },
          'Easebuzz API call failed, retrying',
        );
        await new Promise((r) => setTimeout(r, RETRY_DELAYS[attempt]));
        continue;
      }

      throw err;
    }
  }

  throw new Error('Easebuzz API: all retry attempts exhausted');
}

/**
 * Initiates a payment with Easebuzz gateway.
 * Returns the payment URL and access key for redirecting the user.
 */
export async function initiatePayment(
  params: EasebuzzPaymentParams,
): Promise<EasebuzzInitiateResponse> {
  const key = config.EASEBUZZ_KEY;
  const salt = config.EASEBUZZ_SALT;

  if (!key || !salt) {
    throw new Error('Easebuzz keys (EASEBUZZ_KEY, EASEBUZZ_SALT) are not configured');
  }

  const hash = generateHash(params);
  const baseUrl = getBaseUrl();

  const formData = new URLSearchParams({
    key,
    txnid: params.txnid,
    amount: String(params.amount),
    productinfo: params.productinfo,
    firstname: params.firstname,
    email: params.email,
    phone: params.phone,
    surl: `${config.BACKEND_URL}/api/v1/payment-gateway/success`,
    furl: `${config.BACKEND_URL}/api/v1/payment-gateway/failure`,
    hash,
    udf1: params.udf1 ?? '',
    udf2: params.udf2 ?? '',
    udf3: params.udf3 ?? '',
    udf4: params.udf4 ?? '',
    udf5: params.udf5 ?? '',
    udf6: params.udf6 ?? '',
    udf7: params.udf7 ?? '',
  });

  logger.info(
    { txnid: params.txnid, amount: params.amount, env: config.EASEBUZZ_ENV },
    'Initiating Easebuzz payment',
  );

  const response = await fetchWithRetry(
    baseUrl,
    {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body: formData.toString(),
    },
    params.txnid,
  );

  const data = (await response.json()) as {
    status: number;
    data: string;
    error_desc?: string;
  };

  if (data.status !== 1) {
    logger.error(
      { txnid: params.txnid, error: data.error_desc, status: data.status },
      'Easebuzz payment initiation failed',
    );
    throw new Error(`Easebuzz initiation failed: ${data.error_desc || 'Unknown error'}`);
  }

  const accessKey = data.data;
  const paymentUrl = `${getPaymentPageUrl()}/${accessKey}`;

  logger.info(
    { txnid: params.txnid, accessKey },
    'Easebuzz payment initiated successfully',
  );

  return { paymentUrl, accessKey };
}
