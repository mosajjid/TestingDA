import {
  exportInstance,
  getNFTList,
  //   GetCollectionsByAddress,
  //   GetCollectionsNftList,
  //   GetMyCollectionsList,
  //   GetMyLikedNft,
  //   GetMyNftList,
  //   GetMyOnSaleNft,
  //   GetNftDetails,
  getOrderDetails,
} from "../apiServices";
import { ethers } from "ethers";
import contracts from "../config/contracts";
// import erc20Abi from "./../config/abis/erc20.json";
import erc721Abi from "./../config/abis/simpleERC721.json";
import erc1155Abi from "./../config/abis/simpleERC1155.json";
// import { fetchBidNft } from "../apiServices";
// import { GENERAL_DATE, GENERAL_TIMESTAMP } from "./constants";
import NotificationManager from "react-notifications/lib/NotificationManager";
import { isEmptyObject } from "./utils";
import abi from "../config/abis/generalERC721Abi.json";
import {
  importCollection,
  importNft,
  getImportedCollections,
  GetCombinedNfts,
} from "../apiServices";
import multicall from "./Multicall";
import { NOTIFICATION_DELAY } from "./constants";
// const ipfsAPI = require("ipfs-api");
// const ipfs = ipfsAPI("ipfs.infura.io", "5001", {
//   protocol: "https",
//   auth: "21w11zfV67PHKlkAEYAZWoj2tsg:f2b73c626c9f1df9f698828420fa8439",
// });

const toTypedOrder = (
  account,
  tokenAddress,
  id,
  quantity,
  listingType,
  paymentTokenAddress,
  valueToPay,
  deadline,
  bundleTokens,
  bundleTokensQuantity,
  salt
) => {
  const domain = {
    chainId: process.env.REACT_APP_CHAIN_ID,
    name: "Decrypt Marketplace",
    verifyingContract: contracts.MARKETPLACE,
    version: "1",
  };

  const types = {
    Order: [
      { name: "user", type: "address" },
      { name: "tokenAddress", type: "address" },
      { name: "tokenId", type: "uint256" },
      { name: "quantity", type: "uint256" },
      { name: "listingType", type: "uint256" },
      { name: "paymentToken", type: "address" },
      { name: "value", type: "uint256" },
      { name: "deadline", type: "uint256" },
      { name: "bundleTokens", type: "uint256[]" },
      { name: "bundleTokensQuantity", type: "uint256[]" },
      { name: "salt", type: "uint256" },
    ],
  };

  const value = {
    user: account,
    tokenAddress: tokenAddress,
    tokenId: id,
    quantity: quantity,
    listingType: listingType,
    paymentToken: paymentTokenAddress,
    value: valueToPay,
    deadline: deadline,
    bundleTokens: bundleTokens,
    bundleTokensQuantity: bundleTokensQuantity,
    salt: salt,
  };

  return { domain, types, value };
};

export const getSignature = async (signer, ...args) => {
  try {

    const order = toTypedOrder(...args);
    let provider = new ethers.providers.Web3Provider(window.ethereum);
    const signer1 = provider.getSigner();
    const signedTypedHash = await signer1._signTypedData(
      order.domain,
      order.types,
      order.value
    );
    const sig = ethers.utils.splitSignature(signedTypedHash);

    return [sig.v, sig.r, sig.s];
  } catch (e) {
    if (e.code === 4001|| JSON.stringify(e).includes("user rejected transaction") ) {
      NotificationManager.error("User Denied","", NOTIFICATION_DELAY);
      return false;
    }
    console.log("error in api", e);
    return false;
  }
};

export const GetOwnerOfToken = async (
  collection,
  tokenId,
  isERC721,
  account
) => {
  let collectionInstance = await exportInstance(collection, abi);
  let balance = 0;
  try {
    if (isERC721) {
      let owner = await collectionInstance.ownerOf(Number(tokenId));
      // balance = await collectionInstance.methods.balanceOf(account).call();
      return owner;
      // if (owner.toLowerCase() === account.toLowerCase()) {
      //   balance = "1";
      // }
    } else
      balance = await collectionInstance.methods
        .balanceOf(account, tokenId)
        .call();
    return balance.toString();
  } catch (e) {
    console.log("error", e);
    return "fail";
  }
};

export const buildSellOrder = async (id) => {
  let details;
  try {
    details = await getOrderDetails({ orderId: id });
    const order = [
      details.sellerID.walletAddress,
      details.collectionAddress,
      details.tokenID,
      details.total_quantity,
      details.salesType,
      details.paymentToken,
      details.price ? details.price.$numberDecimal : "0",
      details.deadline,
      details.bundleTokens,
      details.bundleTokensQuantities,
      details.salt,
    ];


    return order;
  } catch (e) {
    console.log("error in api", e);
  }
};
