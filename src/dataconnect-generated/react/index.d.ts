import { CreateDemoUserData, ListMyTransactionsData, ListMyTransactionsVariables, CreateTransactionData, CreateTransactionVariables, GetAccountDetailsData, GetAccountDetailsVariables } from '../';
import { UseDataConnectQueryResult, useDataConnectQueryOptions, UseDataConnectMutationResult, useDataConnectMutationOptions} from '@tanstack-query-firebase/react/data-connect';
import { UseQueryResult, UseMutationResult} from '@tanstack/react-query';
import { DataConnect } from 'firebase/data-connect';
import { FirebaseError } from 'firebase/app';


export function useCreateDemoUser(options?: useDataConnectMutationOptions<CreateDemoUserData, FirebaseError, void>): UseDataConnectMutationResult<CreateDemoUserData, undefined>;
export function useCreateDemoUser(dc: DataConnect, options?: useDataConnectMutationOptions<CreateDemoUserData, FirebaseError, void>): UseDataConnectMutationResult<CreateDemoUserData, undefined>;

export function useListMyTransactions(vars: ListMyTransactionsVariables, options?: useDataConnectQueryOptions<ListMyTransactionsData>): UseDataConnectQueryResult<ListMyTransactionsData, ListMyTransactionsVariables>;
export function useListMyTransactions(dc: DataConnect, vars: ListMyTransactionsVariables, options?: useDataConnectQueryOptions<ListMyTransactionsData>): UseDataConnectQueryResult<ListMyTransactionsData, ListMyTransactionsVariables>;

export function useCreateTransaction(options?: useDataConnectMutationOptions<CreateTransactionData, FirebaseError, CreateTransactionVariables>): UseDataConnectMutationResult<CreateTransactionData, CreateTransactionVariables>;
export function useCreateTransaction(dc: DataConnect, options?: useDataConnectMutationOptions<CreateTransactionData, FirebaseError, CreateTransactionVariables>): UseDataConnectMutationResult<CreateTransactionData, CreateTransactionVariables>;

export function useGetAccountDetails(vars: GetAccountDetailsVariables, options?: useDataConnectQueryOptions<GetAccountDetailsData>): UseDataConnectQueryResult<GetAccountDetailsData, GetAccountDetailsVariables>;
export function useGetAccountDetails(dc: DataConnect, vars: GetAccountDetailsVariables, options?: useDataConnectQueryOptions<GetAccountDetailsData>): UseDataConnectQueryResult<GetAccountDetailsData, GetAccountDetailsVariables>;
