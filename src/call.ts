import { ethers } from 'ethers';
import { Abi } from './abi';
import { multicallAbi } from './abi/multicall';
import { ContractCall } from './types';

// export async function all<T extends any[] = any[]>(
//   calls: ContractCall[],
//   multicallAddress: string,
//   provider: ethers.providers.Provider,
// ): Promise<T> {
//   const multicall = new ethers.Contract(multicallAddress, multicallAbi, provider);
//   console.log(multicall)
//   const callRequests = calls.map(call => {
//     const callData = Abi.encode(call.name, call.inputs, call.params);
//     return {
//       target: call.contract.address,
//       callData,
//     };
//   });
//   const response = await multicall.callStatic.aggregate(callRequests);
//   const callCount = calls.length;
//   const callResult = [] as T;
//   for (let i = 0; i < callCount; i++) {
//     const outputs = calls[i].outputs;
//     const returnData = response.returnData[i];
//     const params = Abi.decode(outputs, returnData);
//     const result = outputs.length === 1 ? params[0] : params;
//     callResult.push(result);
//   }
//   return callResult;
// }
const MAX_CALLS = 500;
let callId = 0;
const QData = {
  // call_0: {
    // queryCalls: [],
    // resolveList: [],
    // timeDebounce: null,
    // lenArr: []
  // }
};

export function all<T extends any[] = any[]>(
  calls: ContractCall[],
  multicallAddress: string,
  provider: ethers.providers.Provider,
): Promise<T> {
  if (!QData['call_' + callId]) {
    QData['call_' + callId] = {
      queryCalls: [],
      resolveList: [],
      timeDebounce: null,
      lenArr: []
    };
  }
  async function handleData() {
    const {queryCalls, resolveList, timeDebounce, lenArr} = QData['call_' + callId];
    clearTimeout(timeDebounce);
    delete QData['call_' + callId];
    callId = callId + 1;
    QData['call_' + callId] = {
      queryCalls: [],
      resolveList: [],
      timeDebounce: null,
      lenArr: []
    };
    const multicall = new ethers.Contract(multicallAddress, multicallAbi, provider);
    const callRequests = queryCalls.map(call => {
      const callData = Abi.encode(call.name, call.inputs, call.params);
      return {
        target: call.contract.address,
        callData,
      };
    });
    const response: any = await multicall.callStatic.aggregate(callRequests);
    const callResult = [] as T;
    for (let i = 0; i < queryCalls.length; i++) {
      const outputs = queryCalls[i].outputs;
      const returnData = response.returnData[i];
      const params = Abi.decode(outputs, returnData);
      const result = outputs.length === 1 ? params[0] : params;
      callResult.push(result);
    }
    resolveList.map(resolve => {
      const data = callResult.splice(0, lenArr.shift());
      resolve(data);
    });
  }

  function debounce(resolve) {
    QData['call_' + callId].queryCalls.push(...calls);
    QData['call_' + callId].resolveList.push(resolve);
    QData['call_' + callId].lenArr.push(calls.length);
    clearTimeout(QData['call_' + callId].timeDebounce);
    QData['call_' + callId].timeDebounce = setTimeout(async () => {
      await handleData();
    }, 100);
  }

  return new Promise(async (resolve, reject) => {
    if (QData['call_' + callId].queryCalls.length + calls.length > MAX_CALLS) {
      await handleData();
      debounce(resolve);
    } else {
      debounce(resolve);
    }
  });
}

export async function allSend<T extends any[] = any[]>(
    calls: ContractCall[],
    multicallAddress: string,
    provider: ethers.providers.Provider,
): Promise<Boolean> {
  const multicall = new ethers.Contract(multicallAddress, multicallAbi, provider);
  const callRequests = calls.map(call => {
    const callData = Abi.encode(call.name, call.inputs, call.params);
    return {
      target: call.contract.address,
      callData,
    };
  });
  const tx = await multicall.aggregate(callRequests);
  await tx.wait()
  return true;
}
