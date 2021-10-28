import {BigNumber} from 'ethers';
import {cloneDeep} from 'lodash';

export const processResult = _data => {

  const data = cloneDeep(_data);
  if (Array.isArray(data)) {
    data.map((o, i) => {
      data[i] = processResult(o);
    });
    return data;
  }
  if (BigNumber.isBigNumber(data)) {
    return data.toString();
  }
  if (typeof data === 'object') {
    // tslint:disable-next-line:forin
    for (const key in data) {
      Object.assign(data, {
        [key]: processResult(0)
      });
    }
    return data;
  }
  return data;
};
