import { create } from 'zustand';
import {
  getServices,
  getCashout,
  postQuote,
  postCollect,
  checkPaymentStatus as checkPaymentStatusService
} from './paymentService';

interface PaymentState {
  loading: boolean;
  services: any[];
  cashoutResponse: any | null;
  quote: any | null;
  collectResponse: any | null;
  paymentStatus: any | null;
  error: string | null;

  fetchServices: () => Promise<void>;
  fetchCashout: (serviceId: string) => Promise<void>;
  createQuote: (payItemId: string, amount: number) => Promise<any | null>;
  submitCollect: (
    quoteId: string,
    customerPhoneNumber: string,
    customerEmail: string,
    customerName: string,
    customerAddress: string,
    serviceNumber: string,
    trid: string
  ) => Promise<string | null>; // returns PTN
  checkPaymentStatus: (ptn: string) => Promise<any | null>;
}

export const usePaymentStore = create<PaymentState>((set) => ({
  loading: false,
  services: [],
  cashoutResponse: null,
  quote: null,
  collectResponse: null,
  paymentStatus: null,
  error: null,

  fetchServices: async () => {
    set({ loading: true, error: null });
    try {
      const data = await getServices();
      set({ services: data, loading: false });
    } catch (error: any) {
      set({ error: error.message || 'Failed to fetch services', loading: false });
    }
  },

  fetchCashout: async (serviceId: string) => {
    set({ loading: true, error: null });
    try {
      const data = await getCashout(serviceId);
      set({ cashoutResponse: data, loading: false });
    } catch (error: any) {
      set({ error: error.message || 'Failed to fetch cashout', loading: false });
    }
  },

  createQuote: async (payItemId: string, amount: number) => {
    set({ loading: true, error: null });
    try {
      const data = await postQuote(payItemId, amount);
      set({ quote: data, loading: false });
      return data;
    } catch (error: any) {
      set({ error: error.message || 'Failed to create quote', loading: false });
      return null;
    }
  },

  submitCollect: async (
    quoteId: string,
    customerPhoneNumber: string,
    customerEmail: string,
    customerName: string,
    customerAddress: string,
    serviceNumber: string,
    trid: string
  ) => {
    set({ loading: true, error: null });
    try {
      const { ptn, fullResponse } = await postCollect(
        quoteId,
        customerPhoneNumber,
        customerEmail,
        customerName,
        customerAddress,
        serviceNumber,
        trid
      );

      set({ collectResponse: fullResponse, loading: false });

      if (!ptn) {
        throw new Error('No PTN returned in collect response.');
      }

      return ptn;
    } catch (error: any) {
      set({ error: error.message || 'Failed to submit collect', loading: false });
      return null;
    }
  },

  checkPaymentStatus: async (ptn: string) => {
    set({ loading: true, error: null });
    try {
      const data = await checkPaymentStatusService(ptn);
      set({ paymentStatus: data, loading: false });
      return data;
    } catch (error: any) {
      const detailedError = error.response?.data || error.message || 'Unknown error';
      set({ error: JSON.stringify(detailedError), loading: false });
      return null;
    }
  }
}));
