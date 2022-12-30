import { exportInstance } from "../apiServices";
import contract from "../config/contracts";
import priceFeedABI from "../config/abis/pricefeed.json"
import BigNumber from "bignumber.js";
import { Tokens } from "./tokensToSymbol";



export const getPriceFeed = async (paymentToken) => {
    const contractInstance = await exportInstance(Tokens[paymentToken.toLowerCase()].PFaddress, priceFeedABI);
    if(paymentToken === contract.BUSD)
    return  1;
    const decimal = await contractInstance.decimals();
    const answer = await contractInstance.latestAnswer();
    return  new BigNumber(answer?.toString()).dividedBy(new BigNumber(10).exponentiatedBy(decimal)).toString();
}
