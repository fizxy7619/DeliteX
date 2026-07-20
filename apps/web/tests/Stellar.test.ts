import { describe, it, expect } from 'vitest'
import { horizonPaymentToEvent } from '../src/lib/stellar/payments'

describe('horizonPaymentToEvent', () => {
  it('should map incoming XLM payment correctly', () => {
    const record = {
      to: 'GOWNER',
      from: 'GSENDER',
      amount: '10.5',
      asset_type: 'native',
      transaction_hash: 'abc',
      created_at: '2023-01-01',
    } as any;

    const result = horizonPaymentToEvent(record, 'GOWNER');
    expect(result.direction).toBe('incoming');
    expect(result.bucket).toBe('income');
    expect(result.amount).toBe(10.5);
    expect(result.currency).toBe('XLM');
    expect(result.counterparty).toBe('GSENDER');
  });

  it('should map outgoing USDC payment correctly', () => {
    const record = {
      to: 'GRECEIVER',
      from: 'GOWNER',
      amount: '50.0',
      asset_type: 'credit_alphanum4',
      asset_code: 'USDC',
      transaction_hash: 'def',
      created_at: '2023-01-02',
    } as any;

    const result = horizonPaymentToEvent(record, 'GOWNER');
    expect(result.direction).toBe('outgoing');
    expect(result.bucket).toBe('bills');
    expect(result.amount).toBe(50.0);
    expect(result.currency).toBe('USDC');
    expect(result.counterparty).toBe('GRECEIVER');
  });
})
