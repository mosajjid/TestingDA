import { MAX_ALLOWANCE_AMOUNT } from "../constants";
import erc20Abi from "../../config/abis/erc20.json";
import rrBabyAbi from "../../config/abis/rrbaby.json";
import {
  exportInstance,
  isWhitelisted,
  FetchInstance,
} from "../../apiServices";
import { convertToEth } from "../../helpers/numberFormatter";
import BigNumber from "bignumber.js";
import { sigGenerator } from "../sigGen";
import evt from "../../events/events";
import { MAX_WHITELIST_BUY_PER_USER } from "../../helpers/constants";


export const fetchInfo = async (addr) => {

  let contract = await FetchInstance(addr, rrBabyAbi);

  try {
    let price = await contract.price();
    let token = await contract.token();
    let totalSupply = await contract.totalSupply();
    let maxPerUser = await contract.maxTokensPerUser();
    let isAdminMintingDone = await contract.isAdminMintingDone();
    let mintingStatus = ""
    if (isAdminMintingDone === false) {
      mintingStatus = "Not Started";
    }
    else {
      mintingStatus = "Live"
    }

    return [price, token, totalSupply, maxPerUser, mintingStatus];
  } catch (e) {
    return e;
  }
};

export const fetchUserBal = async (from, addr) => {
  let contract = await exportInstance(addr, rrBabyAbi);
  try {
    let balance = await contract.balanceOf(from);
    return balance;
  } catch (e) {
    return e;
  }
};

export const testMint = async (addr, qty, price, from) => {
  evt.emit("txn-status", "initiate loader");
  price = parseFloat(price) * parseInt(qty);
  let contract = await exportInstance(addr, rrBabyAbi);
  let result = await contract.isActive();
  try {
    let category = await fetchInfo(addr);

    let erc20 = await exportInstance(category[1].toString(), erc20Abi);
    let allowance = await erc20.allowance(from, addr)
    if (parseFloat(convertToEth(allowance.toString())) < parseFloat(qty * price)) {
      let bal = await erc20.balanceOf(from);
      bal = convertToEth(new BigNumber(bal.toString()));
      let isEligible = await isWhitelisted({
        uAddress: from,
        cAddress: addr,
      });

      if (!result && !isEligible.auth) {
        evt.emit("txn-error", "address not Whitelisted");
        return "Address not Whitelisted";
      }

      if (parseFloat(bal) > price) {
        let txn = await erc20.approve(addr, MAX_ALLOWANCE_AMOUNT, {
          from: from
        });
        evt.emit("txn-status", "approval-initiated");
        txn = await txn.wait();
        if (txn.status === 1)
          evt.emit("txn-status", "approval-succeed");
        else {
          evt.emit("txn-error", "Error Occured")
        }
      }
      else {
        evt.emit("txn-error", "not enough balance");
        return ["not enough balance", false];
      }
    }

    if (result) {
      try {
        let result = await contract.estimateGas.mintTokens(qty, {
          from: from,
        });
        if (result) {
          evt.emit("txn-status", "approval-succeed");
          return mintTokens(addr, qty, from);
        }
      } catch (e) {
        evt.emit("txn-error", e.reason);
      }
      // public mint ends here
    } else {
      let bal = await fetchUserBal(from, addr);
      if (parseInt(bal) + qty <= MAX_WHITELIST_BUY_PER_USER) {
        let isEligible = await isWhitelisted({
          uAddress: from,
          cAddress: addr,
        });
        if (isEligible.auth) {
          let sig = await sigGenerator(from, addr, qty);
          try {
            let result = await contract.estimateGas.whitelistedMint(
              qty,
              qty,
              sig.uSignature,
              { from: from, gasPrice: 10000000000, gasLimit: 9000000 }
            );


            if (result) {
              evt.emit("txn-status", "approval-succeed");
              return whitelistMint(addr, qty, sig.uSignature, from);
            }
          } catch (e) {
            evt.emit("txn-error", e.reason);
          }
        } else {
          evt.emit("txn-error", "address not Whitelisted");
          return "Address not Whitelisted";
        }
      } else {
        evt.emit("txn-error", "max nft per wallet has been reached");
        return "Limit has been reached ";
      }
    }
  } catch (error) {
    console.log(error);
    evt.emit("txn-error", "txn failed");
    return "TXN failed ";
  }
};
const mintTokens = async (addr, qty, from) => {
  evt.emit("txn-status", "mint-initiated");
  let contract = await exportInstance(addr, rrBabyAbi);
  try {
    let txn = await contract.mintTokens(qty, {
      from: from
    });
    txn = await txn.wait();
    if (txn.status === 1)
      evt.emit("txn-status", "mint-succeed");
    else {
      evt.emit("txn-error", "Error Occured");
    }
    return txn;
  } catch (e) {
    if (
      JSON.stringify(e).includes(
        `reason":"repriced","code":"TRANSACTION_REPLACED","cancelled`
      )
    ) {
      evt.emit("txn-error", "check wallet for confirmation");
      return e;
    }
    evt.emit("txn-error", "user-denied-mint");
    return e;
  }
};

const whitelistMint = async (addr, qty, sig, from) => {
  evt.emit("txn-status", "mint-initiated");
  let contract = await exportInstance(addr, rrBabyAbi);
  try {
    let txn = await contract.whitelistedMint(qty, qty, sig, {
      from: from
    });
    txn = await txn.wait();
    evt.emit("txn-status", "mint-succeed");
    return txn;
  } catch (e) {
    console.log(e);
    if (
      JSON.stringify(e).includes(
        `"reason":"repriced","code":"TRANSACTION_REPLACED","cancelled"`
      )
    ) {
      evt.emit("txn-error", "check wallet for confirmation");
      return e;
    }
    evt.emit("txn-error", "user-denied-mint");
    return e;
  }
};
