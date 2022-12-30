import contract from "./../config/contracts";
import MultiCallAbi from "./../config/abis/multicall.json";
import { Interface } from "@ethersproject/abi";
import Web3 from "web3";

const multicall = async (abi, calls) => {
  const web3 = new Web3("https://polygon-mumbai.g.alchemy.com/v2/8RAii8kDi0Fwe47iF1_WLjpcSfp3q3R6");
  
  const multi = new web3.eth.Contract(MultiCallAbi, contract.MULTICALL);
  const itf = new Interface(abi);

  const calldata = calls?.map((call) => [
    call.address.toLowerCase(),
    itf.encodeFunctionData(call.name, call.params),
  ]);

  const { returnData } = await multi.methods.aggregate(calldata).call();
 
  const res = returnData?.map((call, i) =>
    itf.decodeFunctionResult(calls[i].name, call)
  );
  return res;
};

export default multicall;
