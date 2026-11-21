/**
 * MOCK DATA ONLY for the Fees screen. Fees are out of V1.2 scope on the backend, so this is UI
 * only. Money is integer paise, as everywhere else in the project.
 */

export type FeeIcon = 'transport' | 'library' | 'tuition' | 'lab';

export interface MockFeeItem {
  id: string;
  title: string;
  subtitle: string;
  icon: FeeIcon;
  amountPaise: number;
  status: 'pending' | 'paid';
  dueOn: Date;
}

export interface MockFeePayment {
  id: string;
  title: string;
  paidOn: Date;
  method: string;
  amountPaise: number;
}

function dayFrom(today: Date, offset: number): Date {
  return new Date(today.getFullYear(), today.getMonth(), today.getDate() + offset);
}

export function mockFeeItems(today: Date = new Date()): MockFeeItem[] {
  return [
    {
      id: 'fee-transport',
      title: 'Transport Fees',
      subtitle: 'Zone B Route',
      icon: 'transport',
      amountPaise: 450_000,
      status: 'pending',
      dueOn: dayFrom(today, 25),
    },
    {
      id: 'fee-library',
      title: 'Library Registration',
      subtitle: 'Annual Access',
      icon: 'library',
      amountPaise: 200_000,
      status: 'paid',
      dueOn: dayFrom(today, -80),
    },
    {
      id: 'fee-tuition',
      title: 'Tuition Fees',
      subtitle: 'Term 2',
      icon: 'tuition',
      amountPaise: 1_250_000,
      status: 'paid',
      dueOn: dayFrom(today, -40),
    },
  ];
}

export function mockFeePayments(today: Date = new Date()): MockFeePayment[] {
  return [
    {
      id: 'pay-1',
      title: 'Tuition Fees',
      paidOn: dayFrom(today, -42),
      method: 'UPI',
      amountPaise: 1_250_000,
    },
    {
      id: 'pay-2',
      title: 'Library Registration',
      paidOn: dayFrom(today, -80),
      method: 'Card ending 4242',
      amountPaise: 200_000,
    },
    {
      id: 'pay-3',
      title: 'Lab Equipment Fee',
      paidOn: dayFrom(today, -97),
      method: 'Bank Transfer',
      amountPaise: 150_000,
    },
    {
      id: 'pay-4',
      title: 'Lab Equipment Fee',
      paidOn: dayFrom(today, -128),
      method: 'Bank Transfer',
      amountPaise: 150_000,
    },
    {
      id: 'pay-5',
      title: 'Admission Kit',
      paidOn: dayFrom(today, -160),
      method: 'Cash at school office',
      amountPaise: 350_000,
    },
  ];
}
