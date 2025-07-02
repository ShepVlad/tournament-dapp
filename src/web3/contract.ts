import { ethers, Contract } from 'ethers';
import abi from './abi.json';

const CONTRACT_ADDRESS = '0xCe241ef0334A2C8eD7749A84Fca95335570b57B4';

export const getContract = (
  runner: ethers.Signer | ethers.AbstractProvider
) => {
  return new Contract(CONTRACT_ADDRESS, abi, runner);
};
