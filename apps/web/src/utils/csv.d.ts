export type CsvTransaction = {
  date: string;
  title: string;
  type: 'INCOME' | 'EXPENSE';
  amountPaise: number;
  category: { name: string };
};

export declare function transactionsToCsv(transactions: CsvTransaction[]): string;
