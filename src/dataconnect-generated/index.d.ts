import { ConnectorConfig, DataConnect, QueryRef, QueryPromise, MutationRef, MutationPromise } from 'firebase/data-connect';

export const connectorConfig: ConnectorConfig;

export type TimestampString = string;
export type UUIDString = string;
export type Int64String = string;
export type DateString = string;




export interface Account_Key {
  id: UUIDString;
  __typename?: 'Account_Key';
}

export interface Budget_Key {
  id: UUIDString;
  __typename?: 'Budget_Key';
}

export interface Category_Key {
  id: UUIDString;
  __typename?: 'Category_Key';
}

export interface CreateDemoUserData {
  user_insertMany: User_Key[];
  category_insertMany: Category_Key[];
}

export interface CreateTransactionData {
  transaction_insert: Transaction_Key;
}

export interface CreateTransactionVariables {
  accountId: UUIDString;
  categoryId: UUIDString;
  amount: number;
  description: string;
  payeeSource: string;
  transactionDate: DateString;
  type: string;
}

export interface GetAccountDetailsData {
  account?: {
    id: UUIDString;
    name: string;
    accountType: string;
    description?: string | null;
    initialBalance: number;
    createdAt: TimestampString;
    user: {
      id: UUIDString;
      displayName: string;
      email?: string | null;
    } & User_Key;
  } & Account_Key;
}

export interface GetAccountDetailsVariables {
  accountId: UUIDString;
}

export interface ListMyTransactionsData {
  transactions: ({
    id: UUIDString;
    amount: number;
    description?: string | null;
    transactionDate: DateString;
  } & Transaction_Key)[];
}

export interface ListMyTransactionsVariables {
  userId: UUIDString;
}

export interface Transaction_Key {
  id: UUIDString;
  __typename?: 'Transaction_Key';
}

export interface User_Key {
  id: UUIDString;
  __typename?: 'User_Key';
}

interface CreateDemoUserRef {
  /* Allow users to create refs without passing in DataConnect */
  (): MutationRef<CreateDemoUserData, undefined>;
  /* Allow users to pass in custom DataConnect instances */
  (dc: DataConnect): MutationRef<CreateDemoUserData, undefined>;
  operationName: string;
}
export const createDemoUserRef: CreateDemoUserRef;

export function createDemoUser(): MutationPromise<CreateDemoUserData, undefined>;
export function createDemoUser(dc: DataConnect): MutationPromise<CreateDemoUserData, undefined>;

interface ListMyTransactionsRef {
  /* Allow users to create refs without passing in DataConnect */
  (vars: ListMyTransactionsVariables): QueryRef<ListMyTransactionsData, ListMyTransactionsVariables>;
  /* Allow users to pass in custom DataConnect instances */
  (dc: DataConnect, vars: ListMyTransactionsVariables): QueryRef<ListMyTransactionsData, ListMyTransactionsVariables>;
  operationName: string;
}
export const listMyTransactionsRef: ListMyTransactionsRef;

export function listMyTransactions(vars: ListMyTransactionsVariables): QueryPromise<ListMyTransactionsData, ListMyTransactionsVariables>;
export function listMyTransactions(dc: DataConnect, vars: ListMyTransactionsVariables): QueryPromise<ListMyTransactionsData, ListMyTransactionsVariables>;

interface CreateTransactionRef {
  /* Allow users to create refs without passing in DataConnect */
  (vars: CreateTransactionVariables): MutationRef<CreateTransactionData, CreateTransactionVariables>;
  /* Allow users to pass in custom DataConnect instances */
  (dc: DataConnect, vars: CreateTransactionVariables): MutationRef<CreateTransactionData, CreateTransactionVariables>;
  operationName: string;
}
export const createTransactionRef: CreateTransactionRef;

export function createTransaction(vars: CreateTransactionVariables): MutationPromise<CreateTransactionData, CreateTransactionVariables>;
export function createTransaction(dc: DataConnect, vars: CreateTransactionVariables): MutationPromise<CreateTransactionData, CreateTransactionVariables>;

interface GetAccountDetailsRef {
  /* Allow users to create refs without passing in DataConnect */
  (vars: GetAccountDetailsVariables): QueryRef<GetAccountDetailsData, GetAccountDetailsVariables>;
  /* Allow users to pass in custom DataConnect instances */
  (dc: DataConnect, vars: GetAccountDetailsVariables): QueryRef<GetAccountDetailsData, GetAccountDetailsVariables>;
  operationName: string;
}
export const getAccountDetailsRef: GetAccountDetailsRef;

export function getAccountDetails(vars: GetAccountDetailsVariables): QueryPromise<GetAccountDetailsData, GetAccountDetailsVariables>;
export function getAccountDetails(dc: DataConnect, vars: GetAccountDetailsVariables): QueryPromise<GetAccountDetailsData, GetAccountDetailsVariables>;

