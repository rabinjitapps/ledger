export interface TrialBalanceRow {
  account:    string
  totalCR:    number
  totalDR:    number
  netBalance: number
}

export interface DashboardStats {
  totalCR:           number
  totalDR:           number
  netBalance:        number
  totalBills:        number
  totalBillAmount:   number
  paidBillAmount:    number
  unpaidBillAmount:  number
  totalCashReceipts: number
  totalCashPayments: number
  accountBalances:   { name: string; balance: number }[]
  recentLedger:      LedgerEntry[]
  overdueBills:      Bill[]
  monthlyFlow:       { month: string; cr: number; dr: number }[]
}

export interface Account {
  name:       string
  balance:    number
  created_at: string
}

export interface Fund {
  id:          number
  name:        string
  account:     string
  description: string | null
  created_at:  string
}

export interface Vendor {
  id:         number
  name:       string
  contact:    string | null
  address:    string | null
  gst:        string | null
  email:      string | null
  pan:        string | null
  created_at: string
}

export interface LedgerEntry {
  id:         number
  date:       string
  account:    string
  type:       'CR' | 'DR'
  amount:     number
  signed:     number
  narration:  string | null
  ref:        string | null
  fund_name:  string | null
  created_at: string
}

export interface BillItem {
  id?:         number
  bill_id?:    number
  description: string
  qty:         number
  rate:        number
  amount:      number
}

export interface BillDeduction {
  id?:        number
  bill_id?:   number
  ded_type:   string
  ded_amount: number
}

export interface BillPayment {
  id?:        number
  bill_id?:   number
  date:       string
  amount:     number
  notes:      string | null
  created_at?: string
}

export interface Bill {
  id:            number
  date:          string
  bill_no:       string
  party:         string
  total:         number
  paid_amount:   number
  due_date:      string | null
  status:        'UNPAID' | 'PARTIAL' | 'PAID'
  notes:         string | null
  account:       string | null
  fund_name:     string | null
  invoice_no:    string | null
  invoice_date:  string | null
  invoice_value: number | null
  vendor_pan:    string | null
  created_at:    string
  items?:        BillItem[]
  deductions?:   BillDeduction[]
  payments?:     BillPayment[]
}

export interface CashbookEntry {
  id:          number
  date:        string
  type:        'RECEIPT' | 'PAYMENT'
  amount:      number
  payer:       string | null
  payee:       string | null
  description: string | null
  ref:         string | null
  fund_name:   string | null
  created_at:  string
}
