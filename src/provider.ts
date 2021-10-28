import {ethers, getDefaultProvider} from 'ethers';
import { all, allSend } from './call';
import { getEthBalance } from './calls';
import { ContractCall } from './types';
import {JsonRpcProvider} from '@ethersproject/providers';

export class Provider {
  private _provider: ethers.providers.Provider;
  private _multicallAddress: string;

  constructor(provider: ethers.providers.Provider, chainId?: number) {
    this._provider = provider;
    this._multicallAddress = getAddressForChainId(chainId);
  }

  public async init() {
    // Only required if `chainId` was not provided in constructor
    this._multicallAddress = await getAddress(this._provider);
  }

  public getEthBalance(address: string) {
    if (!this._provider) {
      throw new Error('Provider should be initialized before use.');
    }
    return getEthBalance(address, this._multicallAddress);
  }

  public async all<T extends any[] = any[]>(calls: ContractCall[]) {
    if (!this._provider) {
      throw new Error('Provider should be initialized before use.');
    }
    return all<T>(calls, this._multicallAddress, this._provider);
  }

  public async allSend<T extends any[] = any[]>(calls: ContractCall[]) {
    if (!this._provider) {
      throw new Error('Provider should be initialized before use.');
    }
    return allSend<T>(calls, this._multicallAddress, this._provider);
  }
}

const ChainId = {
  ETH: 1,
  BSC: 56,
  HECO: 128,
  MATIC: 137,
  LOCALHOST: 31337
};

const multicallAddresses = {
  3: '0xF24b01476a55d635118ca848fbc7Dab69d403be3',
  4: '0x42ad527de7d4e9d9d011ac45b31d8551f8fe9821',
  5: '0x77dca2c955b15e9de4dbbcf1246b4b85b651e50e',
  42: '0x2cc8688c5f75e365aaeeb4ea8d6a480405a48d2a',
  100: '0xb5b692a88bdfc81ca69dcb1d924f59f0413a602a',
  1337: '0x77dca2c955b15e9de4dbbcf1246b4b85b651e50e',
  [ChainId.ETH]: '0xeefba1e63905ef1d7acba5a8513c70307c1ce441',
  [ChainId.BSC]: '0x1Ee38d535d541c55C9dae27B12edf090C608E6Fb',
  [ChainId.HECO]: '0xc9a9F768ebD123A00B52e7A0E590df2e9E998707',
  [ChainId.MATIC]: '0x11ce4B23bD875D7F5C6a31084f55fDe1e9A87507'
};

const RPC_URLS = {
  [ChainId.ETH]: 'https://mainnet.infura.io/v3/9aa3d95b3bc440fa88ea12eaa4456161',
  [ChainId.HECO]: 'https://http-mainnet-node.huobichain.com',
  [ChainId.BSC]: 'https://bsc-dataseed.binance.org/',
  [ChainId.MATIC]: 'https://polygon-rpc.com/',
  [ChainId.LOCALHOST]: 'http://localhost:8545'
};

const multicallLocalChain = sessionStorage.getItem('multicall_local_chain');
if (multicallLocalChain && multicallAddresses[multicallLocalChain]) {
  Object.assign(multicallAddresses, {
    [ChainId.LOCALHOST]: multicallAddresses[multicallLocalChain]
  });
}

export function setMulticallAddress(chainId: number, address: string) {
  multicallAddresses[chainId] = address;
}

export function setMulticallLocalhost(chainId: number, rpcUrl: string) {
  ChainId[ChainId.LOCALHOST] = chainId;
  RPC_URLS[chainId] = rpcUrl;
}

export const getRpcUrl = chainId => {

  return RPC_URLS[chainId];
};

const _PROVIDER = {};
export function getOnlyMultiCallProvider(chainId) {
  const rpcUrl = getRpcUrl(chainId);
  return _PROVIDER[chainId] || (_PROVIDER[chainId] = new Provider(
    rpcUrl ? new JsonRpcProvider(rpcUrl, chainId) : getDefaultProvider(chainId), chainId)
  );
}

function getAddressForChainId(chainId: number) {
  return multicallAddresses[chainId];
}

async function getAddress(provider: ethers.providers.Provider) {
  const { chainId } = await provider.getNetwork();
  return getAddressForChainId(chainId);
}
