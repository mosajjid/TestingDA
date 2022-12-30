import { BigNumber } from "bignumber.js";
// import { ethers } from "ethers";
import { NotificationManager } from "react-notifications";
import contracts from "../config/contracts";
import {
  GENERAL_DATE,
  GENERAL_TIMESTAMP,
  MAX_ALLOWANCE_AMOUNT,
  NOTIFICATION_DELAY,
} from "./constants";
// import degnrABI from "./../config/abis/dgnr8.json";
// import erc20Abi from "./../config/abis/erc20.json";
import erc1155Abi from "./../config/abis/simpleERC1155.json";
import {
  createCollection,
  createOrder,
  getAllCollections,
  importNftFromScript,
  UpdateCollection,
  // TransferNfts,
  // createBidNft,
  // updateBidNft,
  // acceptBid,
} from "../apiServices";
// import { createCollection } from "../apiServices";
import {
  buildSellOrder,
  GetOwnerOfToken,
  // getPaymentTokenInfo,
  // getUsersTokenBalance,
  // // isEmpty,
  // readReceipt,
} from "./getterFunctions";
import {
  exportInstance,
  getOrderDetails,
  UpdateOrderStatus,
  DeleteOrder,
  // InsertHistory,
} from "../apiServices";
import marketPlaceABI from "./../config/abis/marketplace.json";
// import contracts from "./../config/contracts";
import { getSignature } from "./getterFunctions";
// import simplerERC721ABI from "./../config/abis/simpleERC721.json";
// import simplerERC1155ABI from "./../config/abis/simpleERC1155.json";
// import { convertToEth } from "./numberFormatter";
import erc721Abi from "./../config/abis/simpleERC721.json";
import { slowRefresh } from "./NotifyStatus";
import abi from "../config/abis/generalERC721Abi.json";
import { isEmptyObject } from "./utils";

import {
  importCollection,
  importNft,
  getImportedCollections,
  GetCombinedNfts,
} from "../apiServices";
import multicall from "./Multicall";
import { getCollections } from "../apiServices";

export const putOnMarketplace = async (account, orderData) => {
  if (!account) {
    return;
  }

  let _deadline;
  let _price;
  let _auctionEndDate;
  let sellerOrder;

  try {
    sellerOrder = [
      account,
      orderData.collection,
      Number(orderData.tokenID),
      1,
      0,
      contracts.BUSD,
      100000000,
      GENERAL_TIMESTAMP,
      [],
      [],
      123,
    ];

    let usrHaveQuantity = await GetOwnerOfToken(
      sellerOrder[1],
      sellerOrder[2],
      true,
      sellerOrder[0]
    );

    let NFTcontract = await exportInstance(orderData.collection, abi);

    let approval = await NFTcontract.isApprovedForAll(
      account,
      contracts.MARKETPLACE
    );
    let approvalres;
    const options = {
      from: account,
      gasPrice: 10000000000,
      gasLimit: 9000000,
      value: 0,
    };

    if (!approval) {
      approvalres = await NFTcontract.setApprovalForAll(
        contracts.MARKETPLACE,
        true,
        options
      );

      approvalres = await approvalres.wait();
      if (approvalres.status === 0) {
        NotificationManager.error("Transaction Failed", "", NOTIFICATION_DELAY);
        return false;
      }
    }
  } catch (e) {
    if (e.code === 4001 || JSON.stringify(e).includes("user rejected transaction")) {
      NotificationManager.error("User Denied ", "", NOTIFICATION_DELAY);
      return false;
    }
    console.log("error in contract", e);
    NotificationManager.error("Transaction Failed", "", NOTIFICATION_DELAY);
    return false;
  }
  try {
    let signature = [];

    signature = await getSignature(account, ...sellerOrder);
    if (signature === false) {
      return;
    }


    let reqParams = {
      seller: account,
      collectionAddress: orderData.collection,
      tokenAddress: contracts.BUSD,
      price: 100000000,
      quantity: 1,
      deadline: GENERAL_TIMESTAMP,
      saleType: 0,
      validUpto: GENERAL_TIMESTAMP,
      signature: signature,
      tokenID: Number(orderData.tokenID),
      salt: 123,
      nftID: orderData.nftID,
      creatorAddress: "0x52cE5F25394Fd1A5d4042c1E8aB963E5f947893b",
    };

    let data = await createOrder(reqParams, true);

    NotificationManager.success("Order Created Successfully", "", NOTIFICATION_DELAY);
    // slowRefresh();
    // window.location.href = "/profile";
  } catch (err) {
    console.log("error in Api", err);
    return;
  }
};

export const handleBuyNft = async (id, isERC721, account, balance, qty = 1) => {
  let order;
  let details;
  let status;
  let marketplace;
  try {
    order = await buildSellOrder(id);
    details = await getOrderDetails({ orderId: id });
    status = 1;
  } catch (e) {
    return;
  }

  let sellerOrder = [];
  let buyerOrder = [];
  let amount = new BigNumber(order[6].toString())
    .multipliedBy(new BigNumber(qty.toString()))
    .toString();
 
  for (let key = 0; key < 11; key++) {
    switch (key) {
      case 0:
        if (isERC721) {
          sellerOrder.push(order[key]);
          buyerOrder.push(account);
          break;
        } else {
          sellerOrder.push(order[key]);
          buyerOrder.push(account);
          break;
        }
      case 1:
        sellerOrder.push(order[key]);
        buyerOrder.push(order[key]);
        break;
      case 3:
        if (isERC721) {
          sellerOrder.push(order[key]);
          buyerOrder.push(order[key]);
        } else {
          sellerOrder.push(order[key]);
          buyerOrder.push(Number(qty));
        }

        break;
      case 5:
        sellerOrder.push(order[key]);
        buyerOrder.push(order[key]);
        break;
      case 6:
        if (isERC721) {
          sellerOrder.push(order[key]);
          buyerOrder.push(order[key]);
        } else {
          buyerOrder.push(amount);
          sellerOrder.push(order[key]);
        }

        break;
      case 8:
        sellerOrder.push([]);
        buyerOrder.push([]);
        break;
      case 9:
        sellerOrder.push([]);
        buyerOrder.push([]);
        break;
      default:
        sellerOrder.push(parseInt(order[key]));
        buyerOrder.push(parseInt(order[key]));
    }
  }


  // check if seller still owns that much quantity of current token id
  // check if seller still have approval for marketplace
  // check if buyer have sufficient matic or not (fixed sale)
  let usrHaveQuantity = await GetOwnerOfToken(
    sellerOrder[1],
    sellerOrder[2],
    isERC721,
    sellerOrder[0]
  );

  let NFTcontract = await exportInstance(sellerOrder[1], abi);
 
  let approval = await NFTcontract.isApprovedForAll(
    sellerOrder[0],
    contracts.MARKETPLACE
  );

  // if (Number(usrHaveQuantity) < Number(qty)) {
  //   NotificationManager.error("Seller don't own that much quantity");
  //   return;
  // }

  if (!approval) {
    NotificationManager.error("Seller didn't Approved Marketplace", "", NOTIFICATION_DELAY);
    return;
  }

  if (
    new BigNumber(balance.toString()).isLessThan(
      new BigNumber(order[6].toString()).multipliedBy(
        new BigNumber(qty.toString())
      )
    )
  ) {
    NotificationManager.error("Buyer don't have Enough Matic", "", NOTIFICATION_DELAY);
    return;
  }

  let signature = details.signature;
  const options = {
    from: account,
    gasLimit: 9000000,
    value: new BigNumber(order[6].toString())
      .multipliedBy(new BigNumber(qty.toString()))
      .toString(),
  };

  try {
    marketplace = await exportInstance(
      contracts.MARKETPLACE,
      marketPlaceABI.abi
    );

    let completeOrder = await marketplace.completeOrder(
      sellerOrder,
      signature,
      buyerOrder,
      signature,
      options
    );
    let res = await completeOrder.wait();
    if (res.status === 0) {
      NotificationManager.error("Transaction Failed", "", NOTIFICATION_DELAY);
      return;
    }
  } catch (e) {
    console.log("error in contract function calling", e);
    if (e.code === 4001 || JSON.stringify(e).includes("user rejected transaction")) {
      NotificationManager.error("User Denied", "", NOTIFICATION_DELAY);
      return false;
    }
    return;
  }

  try {
    if (isERC721) {
      DeleteOrder({ orderId: id });
    } else {

      if (Number(details.quantity_sold) + Number(qty) >= details.oQuantity) {
        DeleteOrder({ orderId: id });
      }
    }
  } catch (e) {
    console.log("error in updating order data", e);
    return;
  }

  NotificationManager.success("NFT Purchased Successfully", "", NOTIFICATION_DELAY);
  slowRefresh();
};

export const handleRemoveFromSale = async (orderId, account) => {
  let marketplace;
  let order;
  let details;
  try {
    marketplace = await exportInstance(
      contracts.MARKETPLACE,
      marketPlaceABI.abi
    );
    const options = {
      from: account,
      gasLimit: 9000000,
      value: "0",
    };
    order = await buildSellOrder(orderId);
    details = await getOrderDetails({ orderId: orderId });
    let res = await marketplace.cancelOrder(order, details.signature, options);
    res = await res.wait();
    if (res.status === 0) {
      NotificationManager.error("Transaction Failed", "", NOTIFICATION_DELAY);
      return;
    }
  } catch (e) {
    console.log("error in contract function call", e);
    if (e.code === 4001 || JSON.stringify(e).includes("user rejected transaction")) {
      NotificationManager.error("User Denied ", "", NOTIFICATION_DELAY);
      return false;
    }
    return false;
  }
  try {
    await DeleteOrder({
      orderId: orderId,
      oNftId: details.oNftId,
    });
    NotificationManager.success("Removed from Sale Successfully", "", NOTIFICATION_DELAY);
  } catch (e) {
    console.log("error while updating database", e);
  }
};

export const handleImportNFT = async (isNew, importedCollectionLink, importedAddress, title, selectedCollectionId, currentUser, collName) => {
  window.sessionStorage.setItem("importLink", importedCollectionLink);
  let res;
  try {
    let reqData = { "request_type": "initialise", "address": importedAddress, "chain_id": process.env.REACT_APP_NETWORK_ID, "name": collName, "total_supply_field": "totalSupply" }
    let res1 = await importNftFromScript(reqData)

    if (isNew) {
      let collection = await getAllCollections({
        contractAddress: importedAddress,
      });
      if (collection.count < 1) {
        var fd = new FormData();

        fd.append("isDeployed", 1);
        fd.append("isImported", 1);
        fd.append("isOnMarketplace", 1);
        fd.append("name", title);
        fd.append("isMinted", 0);
        fd.append("contractAddress", importedAddress);
        fd.append("totalSupplyField", "totalSupply");
        fd.append("contractName", collName);
        fd.append("link", importedCollectionLink);

        res = await createCollection(fd);
      } else {
        NotificationManager.error("Collection Already Imported", "", NOTIFICATION_DELAY);

        return false;
      }
    } else {
      let fd = new FormData();
      fd.append("contractAddress", importedAddress);
      fd.append("link", importedCollectionLink);
      fd.append("isMinted", 0);
      fd.append("id", selectedCollectionId);
      fd.append("isOnMarketplace", 1);
      fd.append("totalSupplyField", "totalSupply");
      fd.append("contractName", collName);
      fd.append("isImported", 1);

      res = await UpdateCollection(fd);
    }
    if (res === false) {
      return false
    }
    else {
      NotificationManager.success("Import Request Sent Successfully", "", NOTIFICATION_DELAY);
      window.location.href = "/importedCollections"
      return true;
    }

  } catch (e) {
    console.log("error", e);
    return false;
  }
};


