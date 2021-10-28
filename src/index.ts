import { Contract } from './contract';
import {getOnlyMultiCallProvider, getRpcUrl, Provider, setMulticallAddress, setMulticallLocalhost} from './provider';
import { ContractCall } from './types';
import { processResult } from './utils';

export { Contract, Provider, ContractCall, setMulticallAddress };
export default { Contract, Provider, setMulticallAddress, setMulticallLocalhost, processResult, getOnlyMultiCallProvider, getRpcUrl };
