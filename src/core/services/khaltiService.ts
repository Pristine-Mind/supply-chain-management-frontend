export interface KhaltiCustomerInfo {
    name: string;
    email?: string;
    phone: string;
  }
  
  export interface KhaltiSuccessResult {
    success: true;
    transaction_id: string;
    amount: number;
    mobile: string;
    order_id: string;
  }
  
  export interface KhaltiFailureResult {
    success: false;
    error: string;
    error_code?: string;
  }
  
  export type KhaltiResult = KhaltiSuccessResult | KhaltiFailureResult;
  
  const simulateDelay = (ms: number) => new Promise(res => setTimeout(res, ms));
  
  export default class KhaltiService {
    /**
     * Simulate a Khalti payment flow in the browser.
     * @param amount Amount in paisa (e.g., Rs.100 → 10000)
     * @param orderId Merchant’s order ID
     * @param orderName Description shown to user
     * @param customer Customer info (name, phone, optional email)
     */
    static async initiatePayment(params: {
      amount: number;
      orderId: string;
      orderName: string;
      customer: KhaltiCustomerInfo;
    }): Promise<KhaltiResult> {
      const { amount, orderId, orderName, customer } = params;
  
      try {
        // 👉 If you add the real Khalti JS SDK, initialize it here:
        //   KhaltiCheckout.configure({ publicKey: MODELS_KHALTI_PUBLIC_KEY, ... })
  
        // Simulate network/SDK delay
        await simulateDelay(1500);
  
        // Prompt user
        const confirmMsg = `
            Simulating Khalti Payment
            Amount: Rs.${(amount/100).toFixed(2)}
            Order: ${orderName} (${orderId})
            Customer: ${customer.name} (${customer.phone})
            Proceed?`;
        const ok = window.confirm(confirmMsg.trim());
  
        if (ok) {
          // Success
          return {
            success: true,
            transaction_id: `TXN_${Date.now()}`,
            amount,
            mobile: customer.phone,
            order_id: orderId,
          };
        } else {
          // Cancelled
          return {
            success: false,
            error: 'Payment cancelled by user',
          };
        }
      } catch (e: any) {
        return {
          success: false,
          error: e.message || String(e),
        };
      }
    }
  }
  