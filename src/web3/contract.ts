import { ethers, Contract } from 'ethers';
import abi from './abi.json';

const CONTRACT_ADDRESS = '0xbc3B8c1eb1715bEb20f953a11D455C1019966D31';

export const getContract = (
  runner: ethers.Signer | ethers.AbstractProvider
) => {
  return new Contract(CONTRACT_ADDRESS, abi, runner);
};
