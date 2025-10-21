import axios, { AxiosResponse } from 'axios';
import CryptoJS from 'crypto-js';
import { v4 as uuidv4 } from 'uuid';

const S3P_KEY = '4f7c851c-6868-4199-afda-c762b702e1b9';
const S3P_SECRET = 'dc7fd7fc-1143-48da-8288-e5680618fc2e';
const S3P_URL = 'https://s3p.smobilpay.staging.maviance.info/v2';

type Method = 'GET' | 'POST';
type Data = Record<string, any>;

/**
 * Generate the S3P authorization header required for Maviance API.
 */
export function generateAuthHeader(method: Method, url: string, data: Data = {}): string {
  const timestamp = Math.floor(Date.now() / 1000).toString();
  const nonce = uuidv4();

  const stringifiedData: Record<string, string> = {};
  Object.entries(data).forEach(([k, v]) => {
    stringifiedData[k] = String(v);
  });

  const params: Record<string, string> = {
    s3pAuth_nonce: nonce,
    s3pAuth_timestamp: timestamp,
    s3pAuth_signature_method: 'HMAC-SHA1',
    s3pAuth_token: S3P_KEY,
    ...stringifiedData
  };

  const sortedParams = Object.keys(params).sort().reduce((acc: Record<string, string>, key) => {
    acc[key] = params[key];
    return acc;
  }, {});

  const parameterString = Object.entries(sortedParams)
    .map(([key, value]) => `${key}=${value}`)
    .join('&');

  const baseString = `${method.toUpperCase()}&${encodeURIComponent(url)}&${encodeURIComponent(parameterString)}`;
  const signature = CryptoJS.HmacSHA1(baseString, S3P_SECRET);
  const encodedSignature = CryptoJS.enc.Base64.stringify(signature);

  return `s3pAuth s3pAuth_nonce="${nonce}",s3pAuth_signature="${encodedSignature}",s3pAuth_signature_method="HMAC-SHA1",s3pAuth_timestamp="${timestamp}",s3pAuth_token="${S3P_KEY}"`;
}

/**
 * Step 1: Get list of available services.
 */
export async function getServices(): Promise<any> {
  const endpoint = `${S3P_URL}/services`;
  const authHeader = generateAuthHeader('GET', endpoint);

  try {
    const response: AxiosResponse = await axios.get(endpoint, {
      headers: { Authorization: authHeader }
    });
    return response.data;
  } catch (error: any) {
    console.error('Error fetching services:', error.response?.data || error.message);
    throw error;
  }
}

/**
 * Step 2: Get cashout info for a service (optional).
 */
export async function getCashout(serviceId: string): Promise<any> {
  const endpoint = `${S3P_URL}/cashout`;
  const params = { serviceid: serviceId };
  const authHeader = generateAuthHeader('GET', endpoint, params);

  try {
    const response: AxiosResponse = await axios.get(endpoint, {
      headers: { Authorization: authHeader },
      params
    });
    return response.data;
  } catch (error: any) {
    console.error('Error fetching cashout:', error.response?.data || error.message);
    throw error;
  }
}

/**
 * Step 3: Create a payment quote.
 */
export async function postQuote(payItemId: string, amount: number): Promise<any> {
  const endpoint = `${S3P_URL}/quotestd`;
  const data = { payItemId, amount };
  const authHeader = generateAuthHeader('POST', endpoint, data);

  try {
    const response: AxiosResponse = await axios.post(endpoint, data, {
      headers: {
        Authorization: authHeader,
        'Content-Type': 'application/json'
      }
    });
    return response.data;
  } catch (error: any) {
    console.error('Error posting quote:', error.response?.data || error.message);
    throw error;
  }
}

/**
 * Step 4: Collect payment based on quote and return PTN.
 */
export async function postCollect(
  quoteId: string,
  customerPhoneNumber: string,
  customerEmail: string,
  customerName: string,
  customerAddress: string,
  serviceNumber: string,
  trid: string
): Promise<{ ptn: string; fullResponse: any }> {
  const endpoint = `${S3P_URL}/collectstd`;
  const data = {
    quoteId,
    customerPhonenumber: customerPhoneNumber,
    customerEmailaddress: customerEmail,
    customerName,
    customerAddress,
    serviceNumber,
    trid
  };
  const authHeader = generateAuthHeader('POST', endpoint, data);

  try {
    const response: AxiosResponse = await axios.post(endpoint, data, {
      headers: {
        Authorization: authHeader,
        'Content-Type': 'application/json'
      }
    });

    const ptn = response.data?.ptn;
    if (!ptn) throw new Error('No PTN returned in collect response');

    return { ptn, fullResponse: response.data };
  } catch (error: any) {
    console.error('Error posting collect:', error.response?.data || error.message);
    throw error;
  }
}

/**
 * Step 5: Check payment status using PTN via /verify.
 */
export async function checkPaymentStatus(ptn: string): Promise<any> {
  const endpoint = `${S3P_URL}/verifytx`;
  const params = { ptn };
  const authHeader = generateAuthHeader('GET', endpoint, params);

  console.log('Requesting payment status with authHeader:', authHeader);
  console.log('Requesting to endpoint:', endpoint, 'with params:', params);

  try {
    const response = await axios.get(endpoint, {
      headers: { Authorization: authHeader },
      params,
      timeout: 10000,
    });

    console.log('Response received:', response.data);
    return response.data;
  } catch (error: any) {
    console.error('Error inside checkPaymentStatus (verify) service:', error.response?.data || error.message);
    return null;
  }
}
