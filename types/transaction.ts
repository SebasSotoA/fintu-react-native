export type TransactionType = "GASTO" | "INGRESO";

export interface Transaction {
  id: string;
  type: TransactionType;
  amount: number;
  date: Date;
  note?: string;
  categoryId: string;
}

export interface Category {
  id: string;
  name: string;
  icon: string;
  color: string;
  type: TransactionType;
  isExpense: boolean;
}
