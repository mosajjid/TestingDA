import { BigNumber } from "bignumber.js";
import { ethers } from "ethers";
import {
  GENERAL_DATE,
  GENERAL_TIMESTAMP,
  MAX_ALLOWANCE_AMOUNT,
  NOTIFICATION_DELAY,
  ZERO_ADDRESS,
} from "./constants";
import erc20Abi from "./../config/abis/erc20.json";
import erc1155Abi from "./../config/abis/simpleERC1155.json";
import {
  buildBuyerOrder,
  GetOwnerOfToken,
  getPaymentTokenInfo,
  getUsersTokenBalance,
} from "./getterFunctions";
import {
  exportInstance,
  getOrderDetails,
  UpdateOrder,
  DeleteOrder,
  createOrder,
  createBidNft,
  createOfferNFT,
  updateBidNft,
  acceptOffer,
  UpdateStatus,
  InsertHistory,
  deleteBids,
} from "../apiServices";
import marketPlaceABI from "./../config/abis/marketplace.json";
import contracts from "./../config/contracts";
import { buildSellOrder, getSignature } from "./getterFunctions";
import erc721Abi from "./../config/abis/simpleERC721.json";
import { isEmptyObject } from "jquery";
import evt from "../events/events";
import { slowRefresh } from "./NotifyStatus";
import moment from "moment";
import { NotificationManager } from "react-notifications";


export const handleBuyNft = async (
  id,
  isERC721,
  account,
  qty = 1,
  historyData
) => {
  let order;
  let details;
  let marketplace;
  try {
    if (!id || id === undefined) {
      evt.emit("txn-error", "Error");
      NotificationManager.info("Owner has been changed or order deleted", "", NOTIFICATION_DELAY)
      slowRefresh(1000)
      return false
    }
    order = await buildSellOrder(id);
    if (order === false) {
      evt.emit("txn-error", "Error");
      NotificationManager.info("Owner has been changed or order deleted", "", NOTIFICATION_DELAY);
      slowRefresh(1000)
      return false
    }
    details = await getOrderDetails({ orderID: id });
  } catch (e) {
    console.log("error in API", e);
    return false;
  }
  if (!order[1]) {
    return false;
  }
  let sellerOrder = [];
  let buyerOrder = [];
  let amount = new BigNumber(order[6]?.toString())
    .multipliedBy(new BigNumber(qty?.toString()))
    ?.toString();

  let NFTcontract = await exportInstance(
    order[1],
    isERC721 ? erc721Abi.abi : erc1155Abi.abi
  );

  for (let key = 0; key < 11; key++) {
    switch (key) {
      case 0:
        if (isERC721) {
          sellerOrder.push(order[key]?.toLowerCase());
          buyerOrder.push(account?.toLowerCase());
          break;
        } else {
          sellerOrder.push(order[key]);
          buyerOrder.push(account?.toLowerCase());
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
  try {
    if (!sellerOrder[0]) {
      evt.emit("txn-error", "Error");
      NotificationManager.info("Owner has been changed or order deleted", "", NOTIFICATION_DELAY)
      slowRefresh(1000)
      return false
    }

    let usrHaveQuantity = await GetOwnerOfToken(
      sellerOrder[1],
      sellerOrder[2],
      1,
      sellerOrder[0]
    );

    if (usrHaveQuantity === 0 || usrHaveQuantity === false) {
      evt.emit("txn-error", "Error");
      NotificationManager.info("Owner has been changed or order deleted", "", NOTIFICATION_DELAY)
      return false
    }
  } catch (e) {
    console.log("error", e);
    NotificationManager.error("Error while buying NFT, Something might have changed", "", NOTIFICATION_DELAY);
    return false;
  }

  evt.emit("txn-status", "token-approval-initiated")
  if (buyerOrder[5] !== ZERO_ADDRESS) {
    try {
      let allowance = await getPaymentTokenInfo(buyerOrder[0], buyerOrder[5]);
      if (
        new BigNumber(amount).isGreaterThan(new BigNumber(allowance.balance))
      ) {
        evt.emit("txn-error", "Error");
        NotificationManager.error("Don't have sufficient funds", "", NOTIFICATION_DELAY);
        return false;
      }
      if (
        new BigNumber(allowance.allowance).isLessThan(
          new BigNumber(buyerOrder[6])
        )
      ) {
        try {
          let approveRes = await handleApproveToken(buyerOrder[0], buyerOrder[5]);
          if (approveRes === false) {
            evt.emit("txn-error", "user-denied-token-approval");
            return false;
          }
        }
        catch (e) {

          if (e.code === 4001 || JSON.stringify(e).includes("user rejected transaction")) {
            evt.emit("txn-error", "user-denied-transaction")
            return false;
          }
          NotificationManager.error("Error while buying NFT, Something might have changed", "", NOTIFICATION_DELAY);
          evt.emit("txn-error", "Error");
          return false
        }


      }
    } catch (err) {
      evt.emit("txn-error", "transaction-failed")
      NotificationManager.error("Error while buying NFT, Something might have changed", "", NOTIFICATION_DELAY);
      console.log("error", err);
      return false;
    }
  }
  evt.emit("txn-status", "token-approval-success");


  evt.emit("txn-status", "approval-initiated");
  let approval = await NFTcontract.isApprovedForAll(
    sellerOrder[0],
    contracts.MARKETPLACE
  );
  if (!approval) {
    evt.emit("txn-error", "Error")
    NotificationManager.error("Seller didn't approved marketplace", "", NOTIFICATION_DELAY);
    return false;
  }
  evt.emit("txn-status", "approval-succeeded");
  let signature = details.signature;
  let options;


  try {
    marketplace = await exportInstance(
      contracts.MARKETPLACE,
      marketPlaceABI.abi
    );
    evt.emit("txn-status", "transaction-initiated")
    options = {
      from: account,
      gasPrice: 10000000000,
      gasLimit: 9000000,
      value: sellerOrder[5] === ZERO_ADDRESS ? amount : 0,
    };

    try {
      let ress = await buildSellOrder(id)
      if (ress !== false) {
        let checkCallStatic = await marketplace.callStatic.completeOrder(
          sellerOrder,
          signature,
          buyerOrder,
          signature,
          options
        )
        let completeOrder
        if (checkCallStatic) {
          try {
            completeOrder = await marketplace.completeOrder(
              sellerOrder,
              signature,
              buyerOrder,
              signature,
              options
            );
          }
          catch (e) {
            console.log("error 261", e)
            if (e.code === 4001 || JSON.stringify(e).includes("user rejected transaction")) {
              evt.emit("txn-error", "user-denied-transaction")
              return false;
            }
            NotificationManager.error("Error while buying NFT, Something might have changed", "", NOTIFICATION_DELAY);
            return false
          }
          let req = {
            "recordID": id,
            "DBCollection": "Order",
            "hashStatus": 0,
            "hash": completeOrder.hash
          }
          try {
            await UpdateStatus(req)
          }
          catch (e) {
            console.log("error 279", e)
            NotificationManager.error("Error while buying NFT, Something might have changed", "", NOTIFICATION_DELAY);
            return false
          }

          try {
            if (isERC721) {
              try {
                let res = await completeOrder.wait();

                if (res.status === 0) {
                  return false;
                }
              }
              catch (e) {
                console.log("err", e)
                evt.emit("txn-error", "transaction-failed")
                NotificationManager.error("Error while buying NFT, Something might have changed", "", NOTIFICATION_DELAY);
                return false
              }

              evt.emit("txn-status", "transaction-succeeded")
              let req = {
                "recordID": id,
                "DBCollection": "Order",
                "hashStatus": 1
              }
              try {
                historyData.hash = completeOrder.hash
                let updateRes = await UpdateStatus(req, historyData)
                if (updateRes === false) {
                  return false
                }
              }
              catch (e) {
                console.log("error 314", e)
                NotificationManager.error("Error while buying NFT, Something might have changed", "", NOTIFICATION_DELAY);
                return false
              }
              try {
                await UpdateOrder({
                  orderID: id,
                  nftID: details.nftID._id,
                  seller: details.sellerID.walletAddress?.toLowerCase(),
                  qtyBought: Number(qty),
                  qty_sold: Number(details.quantity_sold) + Number(qty),
                  buyer: account?.toLowerCase(),
                  LazyMintingStatus:
                    details.nftID.quantity_minted + qty === details.nftID.totalQuantity
                      ? 0
                      : 1,
                  quantity_minted:
                    details.nftID.quantity_minted === details.nftID.totalQuantity
                      ? details.nftID.quantity_minted
                      : details.nftID.quantity_minted + qty,
                  hashStatus: 1,
                  amount: amount
                });
                await DeleteOrder({ orderID: id });
              }
              catch (e) {
                console.log("error in updating order data", e);
                NotificationManager.error("Error while buying NFT, Something might have changed", "", NOTIFICATION_DELAY);
                return false;
              }
            }
            else {
              let res = await completeOrder.wait();

              if (res.status === 0) {
                return false;
              }
              evt.emit("txn-status", "transaction-succeeded")
              let req = {
                "recordID": id,
                "DBCollection": "Order",
                "hashStatus": 1
              }
              try {
                historyData.hash = completeOrder.hash
                let updateRes = await UpdateStatus(req, historyData)
                if (updateRes === false) {
                  return false
                }
              }
              catch (e) {
                console.log("error 364", e)
                NotificationManager.error("Error while buying NFT, Something might have changed", "", NOTIFICATION_DELAY);
                return false
              }
              try {
                await UpdateOrder({
                  orderID: id,
                  nftID: details.nftID._id,
                  seller: details.sellerID.walletAddress,
                  qtyBought: Number(qty),
                  qty_sold: Number(details.quantity_sold) + Number(qty),
                  buyer: account?.toLowerCase(),
                  LazyMintingStatus:
                    details.nftID.quantity_minted + qty === details.nftID.totalQuantity
                      ? 0
                      : 1,
                  quantity_minted:
                    details.nftID.quantity_minted === details.nftID.totalQuantity
                      ? details.nftID.quantity_minted
                      : details.nftID.quantity_minted + qty,

                  hashStatus: 0,
                  amount: amount
                });

                if (
                  Number(details.quantity_sold) + Number(qty) >=
                  details.total_quantity
                ) {
                  try {
                    await DeleteOrder({ orderID: id });
                  } catch (e) {
                    evt.emit("txn-error", "Error")
                    NotificationManager.error("Error while buying NFT, Something might have changed", "", NOTIFICATION_DELAY);
                    console.log("error in updating order data", e);
                    return false;
                  }
                }
              }
              catch (e) {
                console.log("error 403", e)
                evt.emit("txn-error", "Error")
                NotificationManager.error("Error while buying NFT, Something might have changed", "", NOTIFICATION_DELAY);
                console.log("error in updating order data", e);
                return false;
              }
            }
          } catch (e) {
            console.log("error 411", e)
            evt.emit("txn-error", "Error")
            NotificationManager.error("Error while buying NFT, Something might have changed", "", NOTIFICATION_DELAY);
            console.log("error in updating order data", e);
            return false;
          }
        }
        else {

          evt.emit("txn-error", "transaction-failed")
          NotificationManager.error("Error while buying NFT, Something might have changed", "", NOTIFICATION_DELAY);
          return false;
        }
      }
    } catch (e) {
      console.log("error 426", e)
      if (e.code === 4001 || JSON.stringify(e).includes("user rejected transaction")) {
        evt.emit("txn-error", "user-denied-transaction")
        return false;
      }
      if (JSON.stringify(e).includes(`"reason":"Not an owner"`)) {
        alert("Not an owner");
        console.log("error in contract function calling", e);
        return false;
      }
      if (e.toString().includes("Cancelled or complete")) {
        evt.emit("txn-error", "Error");
        NotificationManager.info("Order either completed or cancelled", "", NOTIFICATION_DELAY)
        await DeleteOrder({ orderID: id })
        return false
      }

      evt.emit("txn-error", "transaction-failed")
      NotificationManager.error("Error while buying NFT, Something might have changed", "", NOTIFICATION_DELAY);
      return false;
    }
  } catch (e) {
    console.log("error in contract function calling", e);
    if (e.code === 4001 || JSON.stringify(e).includes("user rejected transaction")) {
      evt.emit("txn-error", "user-denied-transaction")
      return false;
    }
    evt.emit("txn-error", "transaction-failed")
    NotificationManager.error("Error while buying NFT, Something might have changed", "", NOTIFICATION_DELAY);
    return false;
  }

  NotificationManager.success("NFT Purchased Successfully", "", NOTIFICATION_DELAY);
  return true
};

export const handleApproveToken = async (userAddress, tokenAddress) => {
  try {
    let token = await exportInstance(tokenAddress, erc20Abi);
    const options = {
      from: userAddress,
      gasPrice: 10000000000,
      gasLimit: 9000000,
      value: 0,
    };
    let res = await token.approve(
      contracts.MARKETPLACE,
      MAX_ALLOWANCE_AMOUNT,
      options
    );
    res = await res.wait();
    if (res.status === 1) {
      evt.emit("txn-status", "token-approval-success")
      return res;
    }
  } catch (e) {
    console.log("error in contract function calling", e);
    if (e.code === 4001 || JSON.stringify(e).includes("user rejected transaction")) {
      evt.emit("txn-error", "user-denied-token-approval")
      return false;
    }
    evt.emit("txn-error", "transaction-failed")
  }
};

export const putOnMarketplace = async (account, orderData) => {
  if (!account) {
    return false;
  }
  let _deadline = GENERAL_TIMESTAMP + moment().unix();
  let _price;
  let sellerOrder;
  try {
    if (orderData.chosenType === 0) {
      _deadline = GENERAL_TIMESTAMP + moment().unix();
      _price = ethers.utils.parseEther(orderData.price.toString()).toString();
    } else if (orderData.chosenType === 1) {
      let endTime
      if (orderData.endTime === GENERAL_DATE) {
        endTime = new Date(orderData.endTime).valueOf() / 1000 + moment().unix();
      }
      else {
        endTime = new Date(orderData.endTime).valueOf() / 1000;
      }

      _deadline = endTime;

      _price = ethers.utils.parseEther(orderData.price.toString()).toString();
    } else if (orderData.chosenType === 2) {
      _deadline = GENERAL_TIMESTAMP + moment().unix();

      _price = ethers.utils.parseEther(orderData.price.toString()).toString();
    }

    sellerOrder = [
      account,
      orderData.collection,
      Number(orderData.tokenId),
      Number(orderData.quantity),
      orderData.saleType,
      orderData.tokenAddress
        ? orderData.tokenAddress
        : "0x0000000000000000000000000000000000000000",
      _price,
      _deadline,
      [],
      [],
      orderData.salt,
    ];

    if (!sellerOrder[0]) {
      evt.emit("txn-error", "Error");
      NotificationManager.info("Owner has been changed or order deleted", "", NOTIFICATION_DELAY)
      slowRefresh(1000);
      return false;
    }
    let usrHaveQuantity = await GetOwnerOfToken(
      sellerOrder[1],
      sellerOrder[2],
      orderData.erc721,
      sellerOrder[0]
    );

    if (usrHaveQuantity === 0 || usrHaveQuantity === false) {
      evt.emit("txn-error", "Error");
      NotificationManager.info("Owner has been changed or order deleted", "", NOTIFICATION_DELAY)
      return false
    }

    let NFTcontract = await exportInstance(orderData.collection, erc721Abi.abi);

    evt.emit("txn-status", "approval-initiated");
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
    if (approval)
      evt.emit("txn-status", "approval-succeeded");
    if (!approval) {
      evt.emit("txn-status", "approval-initiated");
      approvalres = await NFTcontract.setApprovalForAll(
        contracts.MARKETPLACE,
        true,
        options
      );
      approvalres = await approvalres.wait();
      evt.emit("txn-status", "approval-succeeded");
      if (approvalres.status === 0) {
        evt.emit("txn-error", "transaction-failed");
        return false;
      }
    }
  } catch (e) {
    if (e.code === 4001 || JSON.stringify(e).includes("user rejected transaction")) {
      evt.emit("txn-error", "user-denied-approval")
      return false;
    }
    console.log("error in contract", e);
    evt.emit("txn-error", "transaction-failed");
    NotificationManager.error("Error while placing order, Something might have changed", "", NOTIFICATION_DELAY);
    return false;
  }
  try {
    let signature = [];

    evt.emit("txn-status", "sign-initiated");
    signature = await getSignature(account, ...sellerOrder);

    if (signature === false) {
      evt.emit("txn-error", "user-denied-sign");
      return false;
    }
    evt.emit("txn-status", "sign-succeeded")
    let reqParams = {
      nftID: orderData.nftId,
      seller: account,
      tokenAddress: orderData?.tokenAddress
        ? orderData.tokenAddress?.toLowerCase()
        : "0x0000000000000000000000000000000000000000",
      collectionAddress: orderData.collection,
      price: _price,
      quantity: Number(orderData.quantity),
      saleType: Number(orderData.saleType),
      deadline: Number(_deadline),
      signature: signature,
      tokenID: Number(orderData.tokenId),
      salt: orderData.salt,
    };

    await createOrder(reqParams);
    NotificationManager.success("Order created successfully", "", NOTIFICATION_DELAY);
    return true;
  } catch (err) {
    evt.emit("txn-error", "transaction-failed");
    NotificationManager.error("Error while placing order, Something might have changed", "", NOTIFICATION_DELAY);
    console.log("error in Api", err);
    return false;
  }
};

export const handleRemoveFromSale = async (orderId, signature, historyData) => {
  let order;
  order = await buildSellOrder(orderId);
  if (order === false) {
    evt.emit("txn-error", "Error");
    NotificationManager.info("Owner has been changed or order deleted", "", NOTIFICATION_DELAY);
    slowRefresh(1000)
    return false
  }
  if (!order[0]) {
    evt.emit("txn-error", "Error");
    NotificationManager.info("Owner has been changed or order deleted", "", NOTIFICATION_DELAY)
    slowRefresh(1000)
    return false
  }

  let usrHaveQuantity = await GetOwnerOfToken(
    order[1],
    order[2],
    1,
    order[0]
  );

  if (usrHaveQuantity === 0 || usrHaveQuantity === false) {
    NotificationManager.info("Owner has been changed or order deleted", "", NOTIFICATION_DELAY)
    return false
  }

  let { res, hash } = await handleCancelOrder(order, signature, orderId, true)
  if (res === false) {
    // NotificationManager.error("Error while removing NFT from sale, Something might have changed", "", NOTIFICATION_DELAY);
    return false;
  }

  try {
    const s = await DeleteOrder({
      orderID: orderId,
    });

    console.log("erro1", s)
    NotificationManager.success("Removed from sale successfully", "", NOTIFICATION_DELAY);
  } catch (e) {

    console.log("error while updating database", e);
    NotificationManager.error("Error while removing NFT from sale, Something might have changed", "", NOTIFICATION_DELAY);
    return false;
  }
  try {
    historyData.hash = hash
    await InsertHistory(historyData);
  }
  catch (e) {
    NotificationManager.error("Error while removing NFT from sale, Something might have changed", "", NOTIFICATION_DELAY);

    console.log("error", e);
  }
  return true
};


export const createBid = async (
  nftID,
  orderID,
  ownerAccount,
  buyerAccount,
  erc721,
  qty = 1,
  bidPrice,
  isOffer = false,
  oldBidData = {}
) => {
  let SellerOrder;
  let sellerOrder = [];
  let buyerOrder = [];
  try {
    const deadline = GENERAL_TIMESTAMP + moment().unix()
    SellerOrder = await buildSellOrder(orderID);
    if (SellerOrder === false) {
      evt.emit("txn-error", "Error");
      NotificationManager.info("Owner has been changed or order deleted", "", NOTIFICATION_DELAY);
      slowRefresh(1000)
      return false
    }


    for (let index = 0; index < 11; index++) {
      switch (index) {
        case 0:
          sellerOrder.push(SellerOrder[index]);
          buyerOrder.push(buyerAccount);
          break;
        case 1:
          sellerOrder.push(SellerOrder[index]);
          buyerOrder.push(SellerOrder[index]);
          break;
        case 2:
          sellerOrder.push(Number(SellerOrder[index]));
          buyerOrder.push(Number(SellerOrder[index]));
          break;
        case 3:
          sellerOrder.push(SellerOrder[index]);
          buyerOrder.push(Number(qty));
          break;
        case 5:
          sellerOrder.push(SellerOrder[index]);
          buyerOrder.push(SellerOrder[index]);
          break;
        case 6:
          sellerOrder.push(SellerOrder[index]);
          buyerOrder.push(
            new BigNumber(bidPrice.toString())
              .multipliedBy(new BigNumber(qty.toString()))
              .toString()
          );
          break;
        case 7:
          sellerOrder.push(SellerOrder[index]);
          buyerOrder.push(deadline);
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
          sellerOrder.push(parseInt(SellerOrder[index]));
          buyerOrder.push(parseInt(SellerOrder[index]));
      }
    }

    if (!isEmptyObject(oldBidData)) {

      let oldBuyerOrder = await buildBuyerOrder(oldBidData)

      let { res, hash } = await handleCancelOrder(oldBuyerOrder, oldBidData?.buyerSignature, oldBidData._id, false)
      if (res === false) {
        evt.emit("txn-error", "Error");

        return false
      }
      await deleteBids({ bidID: oldBuyerOrder._id })
    }

    if (!buyerOrder[0] || buyerOrder[0].toLowerCase() === sellerOrder[0].toLowerCase()) {
      evt.emit("txn-error", "Error");
      NotificationManager.info("Owner has been changed or order deleted", "", NOTIFICATION_DELAY)
      slowRefresh(1000)
      return false
    }

    if (!sellerOrder[0]) {
      evt.emit("txn-error", "Error");
      NotificationManager.info("Owner has been changed or order deleted", "", NOTIFICATION_DELAY)
      slowRefresh(1000)
      return false
    }
    let usrHaveQuantity = await GetOwnerOfToken(
      sellerOrder[1],
      sellerOrder[2],
      erc721,
      sellerOrder[0]
    );
    if (usrHaveQuantity === 0 || usrHaveQuantity === false) {
      evt.emit("txn-error", "Error");
      NotificationManager.info("Owner has been changed or order deleted", "", NOTIFICATION_DELAY)
      return false
    }

    try {
      evt.emit("txn-status", "token-approval-initiated")
      let allowance = (
        await getPaymentTokenInfo(buyerAccount, sellerOrder[5])
      ).allowance.toString();

      let userTokenBal = await getUsersTokenBalance(
        buyerOrder[0],
        buyerOrder[5]
      );


      if (
        new BigNumber(bidPrice)
          .multipliedBy(new BigNumber(qty.toString()))
          .isGreaterThan(new BigNumber(userTokenBal))
      ) {
        evt.emit("txn-error", "Error");
        NotificationManager.error("User don't have sufficient token balance", "", NOTIFICATION_DELAY);
        return false;
      }

      if (
        new BigNumber(allowance).isLessThan(
          new BigNumber(bidPrice.toString().toString())
            .multipliedBy(new BigNumber(qty.toString()))
            .toString()
        )
      ) {

        let approvalRes = await handleApproveToken(
          buyerOrder[0],
          buyerOrder[5]
        );

        if (approvalRes === false) return false;
      }
      evt.emit("txn-status", "token-approval-success");
      evt.emit("txn-status", "sign-initiated");
      let ress = await buildSellOrder(orderID)
      if (ress !== false) {
        let signature = await getSignature(buyerAccount, ...buyerOrder);
        if (signature === false) {
          evt.emit("txn-error", "user-denied-sign")
          return false;
        }
        if (signature) {
          evt.emit("txn-status", "sign-succeeded");
          let reqParams = {
            owner: ownerAccount,
            bidStatus: "Bid",
            bidPrice: bidPrice.toString(),
            nftID: nftID,
            orderID: orderID,
            bidQuantity: Number(qty),
            buyerSignature: signature,
            isOffer: isOffer,
            bidDeadline: deadline,
          };

          SellerOrder = await buildSellOrder(orderID);

          if (SellerOrder === false) {
            evt.emit("txn-error", "Error");
            NotificationManager.info("Owner has been changed or order deleted", "", NOTIFICATION_DELAY)
            return false;

          }
          await createBidNft(reqParams);
        }
      }
      else {
        NotificationManager.error("NFT is removed from sale", "", NOTIFICATION_DELAY)
        evt.emit("txn-error", "transaction-failed");
        return false
      }

    } catch (e) {
      evt.emit("txn-error", "transaction-failed");
      console.log("error in api", e);
      return false;
    }
  } catch (e) {
    evt.emit("txn-error", "transaction-failed");
    NotificationManager.error("Error while creating bid, Something might have changed", "", NOTIFICATION_DELAY);

    console.log("error in api", e);
    return false;
  }
  return true
};

export const createOffer = async (
  tokenId,
  collectionAddress,
  ownerAccount,
  buyerAccount,
  erc721,
  qty,
  bidPrice,
  deadline,
  nftID,
  paymentToken,
  oldOffer = {}
) => {
  let buyerOrder = [];
  deadline = deadline + (new Date()).getSeconds();
  try {
    buyerOrder.push(buyerAccount);
    buyerOrder.push(collectionAddress);
    buyerOrder.push(parseInt(tokenId));
    buyerOrder.push(parseInt(qty));
    buyerOrder.push(1);
    buyerOrder.push(paymentToken);
    buyerOrder.push(bidPrice.toString());
    buyerOrder.push(deadline);
    buyerOrder.push([]);
    buyerOrder.push([]);
    buyerOrder.push(Math.round(Math.random() * 10000000));

    if (!isEmptyObject(oldOffer)) {
      let oldBuyerOrder = []
      oldBuyerOrder.push(buyerAccount);
      oldBuyerOrder.push(oldOffer?.nftID[0]?.collectionAddress);
      oldBuyerOrder.push(parseInt(oldOffer?.nftID[0]?.tokenID));
      oldBuyerOrder.push(oldOffer?.bidQuantity);
      oldBuyerOrder.push(1);
      oldBuyerOrder.push(oldOffer?.paymentToken);
      oldBuyerOrder.push(oldOffer?.bidPrice?.$numberDecimal);
      oldBuyerOrder.push(oldOffer?.bidDeadline);
      oldBuyerOrder.push([]);
      oldBuyerOrder.push([]);
      oldBuyerOrder.push(oldOffer?.salt);

      let { res, hash } = await handleCancelOrder(oldBuyerOrder, oldOffer?.buyerSignature, oldOffer._id, false)
      if (res === false) {
        // NotificationManager.error("Error while creating offer, Something might have changed", "", NOTIFICATION_DELAY);

        return false
      }

      await deleteBids({ bidID: oldOffer._id })
    }

    if (!buyerOrder[0] || buyerOrder[0].toLowerCase() === ownerAccount.address.toLowerCase()) {
      NotificationManager.info("Owner has been changed or order deleted", "", NOTIFICATION_DELAY)
      slowRefresh(1000)
      return false
    }

    let usrHaveQuantity = await GetOwnerOfToken(
      buyerOrder[1],
      buyerOrder[2],
      1,
      ownerAccount.address
    );
    if (usrHaveQuantity === 0 || usrHaveQuantity === false) {
      evt.emit("txn-error", "transaction-failed")
      NotificationManager.info("Owner has been changed or order deleted", "", NOTIFICATION_DELAY)
      return false
    }
    let allowance = (
      await getPaymentTokenInfo(buyerAccount, buyerOrder[5])
    ).allowance.toString();

    let userTokenBal = await getUsersTokenBalance(buyerOrder[0], buyerOrder[5]);

    if (
      new BigNumber(bidPrice)
        .multipliedBy(new BigNumber(qty.toString()))
        .isGreaterThan(new BigNumber(userTokenBal))
    ) {
      evt.emit("txn-error", "transaction-failed")
      NotificationManager.error("User don't have sufficient token balance", "", NOTIFICATION_DELAY);
      return false;
    }

    if (
      new BigNumber(allowance).isLessThan(
        new BigNumber(bidPrice.toString().toString())
          .multipliedBy(new BigNumber(qty.toString()))
          .toString()
      )
    ) {
      evt.emit("txn-status", "token-approval-initiated");
      let approvalRes = await handleApproveToken(buyerOrder[0], buyerOrder[5]);
      if (approvalRes === false) return false;
    }

    try {
      evt.emit("txn-status", "token-approval-success");
      evt.emit("txn-status", "sign-initiated");
      let signature = await getSignature(buyerAccount, ...buyerOrder);
      if (signature === false) {
        evt.emit("txn-error", "user-denied-sign");
        return false;
      }
      if (signature) {
        evt.emit("txn-status", "sign-succeeded");
        let reqParams = {
          owner: ownerAccount,
          bidStatus: "MakeOffer",
          bidPrice: bidPrice.toString(),
          nftID: nftID,
          bidDeadline: deadline,
          bidQuantity: Number(qty),
          buyerSignature: signature,
          tokenAddress: collectionAddress,
          salt: buyerOrder[10],
          paymentToken: paymentToken,
        };

        try {
          let offer = await createOfferNFT(reqParams);
          if (!isEmptyObject(offer)) {
            return true;
            // slowRefresh(1000);
          } else {
            evt.emit("txn-error", "Error")
            NotificationManager.error("Error while creating offer, Something might have changed", "", NOTIFICATION_DELAY);

            return false;
          }
        } catch (e) {
          NotificationManager.error("Error while creating offer, Something might have changed", "", NOTIFICATION_DELAY);

          return false;
        }
      }
    } catch (e) {
      if (e.code === 4001 || JSON.stringify(e).includes("user rejected transaction")) {
        evt.emit("txn-error", "user-denied-sign");
        return;
      }
      evt.emit("txn-error", "Error")
      NotificationManager.error("Error while creating offer, Something might have changed", "", NOTIFICATION_DELAY);

      console.log("error in api 1", e);
      return false;
    }
  } catch (e) {
    if (e.code === 4001 || JSON.stringify(e).includes("user rejected transaction")) {
      evt.emit("txn-error", "user-denied-sign");
      return;
    }
    evt.emit("txn-error", "Error");
    NotificationManager.error("Error while creating offer, Something might have changed", "", NOTIFICATION_DELAY);

    console.log("error in api 2", e);
    return false;
  }
};

export const handleAcceptBids = async (
  bidData,
  isERC721,
  historyData
) => {
  let order;
  let details;
  let options;
  try {

    order = await buildSellOrder(bidData.orderID);
    if (order === false) {
      evt.emit("txn-error", "Error");
      NotificationManager.info("Owner has been changed or order deleted", "", NOTIFICATION_DELAY);
      await deleteBids({ bidID: bidData._id })
      slowRefresh(1000)
      return false
    }
    details = await getOrderDetails({ orderID: bidData.orderID });
  } catch (e) {
    console.log("error in API", e);
    return false;
  }
  let buyerOrder = [];
  let sellerOrder = [];

  let amount = new BigNumber(bidData?.bidPrice?.$numberDecimal.toString())
    .multipliedBy(new BigNumber(bidData.bidQuantity.toString()))
    .toString();

  for (let key = 0; key < 11; key++) {
    switch (key) {
      case 0:
        sellerOrder.push(order[key]);
        buyerOrder.push(bidData?.bidderID?.walletAddress);
        break;

      case 1:
        sellerOrder.push(order[key]);
        buyerOrder.push(order[key]);
        break;
      case 3:
        if (isERC721) {
          sellerOrder.push(Number(order[key]));
          buyerOrder.push(Number(order[key]));
        } else {
          sellerOrder.push(Number(order[key]));
          buyerOrder.push(Number(bidData.bidQuantity));
        }
        break;
      case 5:
        sellerOrder.push(order[key]);
        buyerOrder.push(order[key]);
        break;
      case 6:
        buyerOrder.push(amount);
        sellerOrder.push(order[key]);

        break;
      case 7:
        buyerOrder.push(bidData?.bidDeadline);
        sellerOrder.push(order[key]);

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
        sellerOrder.push(parseInt(parseInt(order[key])));
        buyerOrder.push(parseInt(parseInt(order[key])));
    }
  }

  if (!sellerOrder[0]) {
    evt.emit("txn-error", "Error");
    NotificationManager.info("Owner has been changed or order deleted", "", NOTIFICATION_DELAY)
    slowRefresh(1000)
    return false
  }


  let usrHaveQuantity = await GetOwnerOfToken(
    sellerOrder[1],
    sellerOrder[2],
    isERC721,
    sellerOrder[0]
  );

  if (usrHaveQuantity === 0 || usrHaveQuantity === false) {
    evt.emit("txn-error", "Error");
    NotificationManager.info("Owner has been changed", "", NOTIFICATION_DELAY)
    // slowRefresh(1000)
    return false
  }

  let sellerSignature = details.signature;
  let buyerSignature = bidData.buyerSignature;

  evt.emit("txn-status", "approval-initiated");

  let NFTcontract = await exportInstance(
    sellerOrder[1],
    isERC721 ? erc721Abi.abi : erc1155Abi.abi
  );


  let approval = await NFTcontract.isApprovedForAll(
    sellerOrder[0],
    contracts.MARKETPLACE
  );



  if (!approval) {
    evt.emit("txn-error", "Error");
    NotificationManager.error("Seller didn't approved marketplace", "", NOTIFICATION_DELAY);
    return false;
  }
  else {
    evt.emit("txn-status", "approval-succeeded");
  }
  if (buyerOrder[5] === ZERO_ADDRESS) {
  } else {
    let paymentTokenData = await getPaymentTokenInfo(
      buyerOrder[0],
      buyerOrder[5]
    );

    if (
      new BigNumber(paymentTokenData.balance).isLessThan(
        new BigNumber(order[6].toString()).multipliedBy(
          new BigNumber(buyerOrder[3].toString())
        )
      )
    ) {
      evt.emit("txn-error", "Error")
      NotificationManager.error("Buyer don't have enough Tokens", "", NOTIFICATION_DELAY);
      return false;
    }
  }
  try {
    let marketplace = await exportInstance(
      contracts.MARKETPLACE,
      marketPlaceABI.abi
    );
    let completeOrder;
    try {
      evt.emit("txn-status", "transaction-initiated");
      options = {
        from: sellerOrder[0],
        gasPrice: 10000000000,
        gasLimit: 9000000,
        value: 0,
      };
      let checkCallStatic

      try {
        checkCallStatic = await marketplace.callStatic.completeOrder(
          sellerOrder,
          sellerSignature,
          buyerOrder,
          buyerSignature,
          options
        )
      }
      catch (e) {
        console.log("err", e)
        evt.emit("txn-error", "transaction-failed")

        if (e.toString().includes("Cancelled or complete")) {
          evt.emit("txn-error", "Error");
          NotificationManager.info("Order either completed or cancelled", "", NOTIFICATION_DELAY)

          await deleteBids({ bidID: bidData._id })

          return false
        }
        NotificationManager.error("Error while accepting bid, Something might have changed", "", NOTIFICATION_DELAY);
        await deleteBids({ bidID: bidData._id })
        return false
      }

      if (checkCallStatic) {
        completeOrder = await marketplace.completeOrder(
          sellerOrder,
          sellerSignature,
          buyerOrder,
          buyerSignature,
          options
        );
        let req = {
          "recordID": bidData.orderID[0]._id,
          "DBCollection": "Order",
          "hashStatus": 0,
          "hash": completeOrder.hash
        }

        try {
          await UpdateStatus(req)
        }
        catch (e) {
          return false
        }
        let completeOrderRes
        try {
          completeOrderRes = await completeOrder.wait();
        }
        catch (e) {
          console.log("err", e.code)
          NotificationManager.error(`Something went wrong: ${e.code}`, "", NOTIFICATION_DELAY)
          evt.emit("txn-error", "Error");
          return false;
        }
        if (completeOrderRes.status === 0) {
          evt.emit("txn-error", "transaction-failed");
          return false;
        }
        evt.emit("txn-status", "transaction-succeeded")
      }
    } catch (e) {
      if (e.code === 4001 || JSON.stringify(e).includes("user rejected transaction")) {
        evt.emit("txn-error", "user-denied-transaction")

        return false;
      }
      if (e.toString().includes("Cancelled or complete")) {
        evt.emit("txn-error", "transaction-failed")
        NotificationManager.info("Order either completed or cancelled", "", NOTIFICATION_DELAY)

        await deleteBids({ bidID: bidData._id })
        return false
      }
      NotificationManager.error("Error while accepting bid, Something might have changed", "", NOTIFICATION_DELAY);
      // await deleteBids({ bidID: bidData._id })
      return false;
    }
    let req = {
      "recordID": bidData.orderID[0]?._id,
      "DBCollection": "Order",
      "hashStatus": 1,
      "hash": completeOrder.transactionHash
    }
    try {
      historyData.hash = completeOrder.transactionHash
      let updateRes = await UpdateStatus(req, historyData)
      if (updateRes === false) {
        return false
      }
    }
    catch (e) {
      NotificationManager.error("Error while accepting bid, Something might have changed", "", NOTIFICATION_DELAY);
      // await deleteBids({ bidID: bidData._id })
      return false
    }
    try {
      await UpdateOrder({
        orderID: bidData.orderID[0]?._id,
        nftID: details?.nftID?._id,
        seller: details?.sellerID?.walletAddress,
        qtyBought: Number(bidData.bidQuantity),
        qty_sold: Number(details.quantity_sold) + Number(bidData.bidQuantity),
        buyer: buyerOrder[0]?.toLowerCase(),
        amount: amount
      });

      if (
        Number(details.quantity_sold) + Number(bidData.bidQuantity) >=
        details.total_quantity
      ) {
        DeleteOrder({ orderID: bidData.orderID[0]?._id });
      }


    } catch (e) {
      console.log("error in updating order data", e);
      if (e.toString().includes("Cancelled or complete")) {
        NotificationManager.info("Order is Either Completed or Cancelled", "", NOTIFICATION_DELAY)
        await deleteBids({ bidID: bidData._id })
      }
      else
        NotificationManager.error("Error while accepting bid, Something might have changed", "", NOTIFICATION_DELAY);

      return false;
    }

  } catch (e) {
    console.log("error in contract function calling", e);
    if (e.code === 4001 || JSON.stringify(e).includes("user rejected transaction")) {
      evt.emit("txn-error", "user-denied-transaction")
      return false;
    }
    evt.emit("txn-error", "transaction-failed")
    if (e.toString().includes("Cancelled or complete")) {
      NotificationManager.info("Order is Either Completed or Cancelled", "", NOTIFICATION_DELAY)
      await deleteBids({ bidID: bidData._id })
    }
    else
      NotificationManager.error("Error while accepting bid, Something might have changed", "", NOTIFICATION_DELAY);

    return false;
  }
  NotificationManager.success("Bid Accepted Successfully", "", NOTIFICATION_DELAY);
  return true;
};

export const handleAcceptOffers = async (bidData, props, account, historyData) => {
  let buyerOrder = [];
  let sellerOrder = [];
  let amount = new BigNumber(bidData?.bidPrice?.$numberDecimal.toString())
    .multipliedBy(new BigNumber(bidData.bidQuantity.toString()))
    .toString();

  for (let key = 0; key < 11; key++) {
    switch (key) {
      case 0:
        sellerOrder.push(account);
        buyerOrder.push(bidData?.bidderID?.walletAddress);
        break;

      case 1:
        sellerOrder.push(props.NftDetails.collectionAddress);
        buyerOrder.push(props.NftDetails.collectionAddress);
        break;
      case 2:
        sellerOrder.push(Number(props.NftDetails.tokenId));
        buyerOrder.push(Number(props.NftDetails.tokenId));
        break;
      case 3:
        if (props.NftDetails.type === 1) {
          sellerOrder.push(Number(1));
          buyerOrder.push(Number(1));
        } else {
          sellerOrder.push(Number(bidData.bidQuantity));
          buyerOrder.push(Number(bidData.bidQuantity));
        }

        break;
      case 4:
        sellerOrder.push(1);
        buyerOrder.push(1);
        break;
      case 5:
        sellerOrder.push(bidData.paymentToken?.toLowerCase());
        buyerOrder.push(bidData.paymentToken?.toLowerCase());
        break;
      case 6:
        buyerOrder.push(amount);
        sellerOrder.push(bidData.bidPrice.$numberDecimal);
        break;
      case 7:
        buyerOrder.push(bidData.bidDeadline);
        sellerOrder.push(bidData.bidDeadline);

        break;
      case 8:
        sellerOrder.push([]);
        buyerOrder.push([]);
        break;
      case 9:
        sellerOrder.push([]);
        buyerOrder.push([]);
        break;
      case 10:
        sellerOrder.push(Number(bidData.salt));
        buyerOrder.push(Number(bidData.salt));
        break;
      default:
        sellerOrder.push([]);
        buyerOrder.push([]);
    }
  }

  if (!sellerOrder[0]) {
    evt.emit("txn-error", "Error");
    NotificationManager.info("Owner has been changed or order deleted", "", NOTIFICATION_DELAY)
    slowRefresh(1000)
    return false
  }

  let usrHaveQuantity = await GetOwnerOfToken(
    sellerOrder[1],
    sellerOrder[2],
    1,
    sellerOrder[0]
  );
  if (usrHaveQuantity === 0 || usrHaveQuantity === false) {
    evt.emit("txn-error", "Error");
    NotificationManager.info("Owner has been changed or order deleted", "", NOTIFICATION_DELAY)
    return false
  }

  if (buyerOrder[0].toLowerCase() === sellerOrder[0].toLowerCase()) {
    evt.emit("txn-error", "Error");
    NotificationManager.error("You can't accept your offer", "", NOTIFICATION_DELAY);
    await deleteBids({ bidID: bidData._id })
    return false
  }


  let sellerSignature = bidData.buyerSignature;
  let buyerSignature = bidData.buyerSignature;

  evt.emit("txn-status", "approval-initiated");

  let NFTcontract = await exportInstance(
    sellerOrder[1],
    props.NftDetails.type ? erc721Abi.abi : erc1155Abi.abi
  );

  let approval = await NFTcontract.isApprovedForAll(
    sellerOrder[0],
    contracts.MARKETPLACE
  );

  let approvalRes;

  let options = {
    from: account,
    gasPrice: 10000000000,
    gasLimit: 9000000,

    value: 0,
  };
  if (!approval) {
    try {
      approvalRes = await NFTcontract.setApprovalForAll(
        contracts.MARKETPLACE,
        true,
        options
      );

      let a = await approvalRes.wait();
      if (a.status !== 1) {
        evt.emit("txn-error", "Error");
        NotificationManager.error("Marketplace has not approval", "", NOTIFICATION_DELAY);
        return false;
      }
    }
    catch (e) {

      if (e.code === 4001 || JSON.stringify(e).includes("user rejected transaction")) {
        evt.emit("txn-error", "user-denied-approval")
        return false;
      }
      evt.emit("txn-error", "Error");
      NotificationManager.error("Error while accepting offer, Something might have changed", "", NOTIFICATION_DELAY);
      await deleteBids({ bidID: bidData._id })
      return false
    }


    evt.emit("txn-status", "approval-succeeded");
  } else {
    evt.emit("txn-status", "approval-succeeded");
  }

  let paymentTokenData = await getPaymentTokenInfo(
    buyerOrder[0],
    buyerOrder[5]
  );
  if (
    new BigNumber(paymentTokenData.balance).isLessThan(
      new BigNumber(buyerOrder[6].toString()).multipliedBy(
        new BigNumber(buyerOrder[3].toString())
      )
    )
  ) {
    evt.emit("txn-error", "Error")
    NotificationManager.error("Buyer don't have enough Tokens", "", NOTIFICATION_DELAY);
    return false;
  }

  try {
    let marketplace = await exportInstance(
      contracts.MARKETPLACE,
      marketPlaceABI.abi
    );
    let completeOrder;
    try {
      evt.emit("txn-status", "transaction-initiated");
      options = {
        from: sellerOrder[0],
        gasPrice: 10000000000,
        gasLimit: 9000000,
        value: 0,
      };

      let checkCallStatic = await marketplace.callStatic.completeOrder(
        sellerOrder,
        sellerSignature,
        buyerOrder,
        buyerSignature,
        options)
      if (checkCallStatic) {
        completeOrder = await marketplace.completeOrder(
          sellerOrder,
          sellerSignature,
          buyerOrder,
          buyerSignature,
          options
        );
        let req = {
          "recordID": bidData._id,
          "DBCollection": "Bids",
          "hashStatus": 0,
          "hash": completeOrder.hash
        }
        try {
          await UpdateStatus(req)
        }
        catch (e) {
          console.log("error", e)
          evt.emit("txn-error", "Error")
          NotificationManager.error("Error while accepting offer, Something might have changed", "", NOTIFICATION_DELAY);
          await deleteBids({ bidID: bidData._id })
          return false
        }
        try {
          completeOrder = await completeOrder.wait();
        }
        catch (e) {
          console.log("err", e)
          evt.emit("txn-error", "transaction-failed");

          if (e.toString().includes("Cancelled or complete")) {
            NotificationManager.info("Order is Either Completed or Cancelled", "", NOTIFICATION_DELAY)
            await deleteBids({ bidID: bidData._id })
          }
          else
            NotificationManager.error("Error while accepting offer, Something might have changed", "", NOTIFICATION_DELAY);
          return false;
        }
        if (completeOrder.status === 0) {
          evt.emit("txn-error", "transaction-failed");
          NotificationManager.error("Error while accepting offer, Something might have changed", "", NOTIFICATION_DELAY);
          // await deleteBids({ bidID: bidData._id })
          return false;
        }
        evt.emit("txn-status", "transaction-succeeded")
      }
    } catch (e) {
      if (e.code === 4001 || JSON.stringify(e).includes("user rejected transaction")) {
        evt.emit("txn-error", "user-denied-transaction")

        return false;
      }
      console.log("error in contract", e);
      if (e.toString().includes("Cancelled or complete")) {
        evt.emit("txn-error", "Error");
        NotificationManager.info("Order either completed or cancelled", "", NOTIFICATION_DELAY)
        await deleteBids({ bidID: bidData._id })
        return false
      }
      evt.emit("txn-error", "Error")
      NotificationManager.error("Error while accepting offer, Something might have changed", "", NOTIFICATION_DELAY);
      await deleteBids({ bidID: bidData._id })
      return false;
    }

    try {
      let req = {
        "recordID": bidData._id,
        "DBCollection": "Bids",
        "hashStatus": 1,
        "hash": completeOrder.transactionHash
      }
      try {
        historyData.hash = completeOrder.transactionHash
        let updateRes = await UpdateStatus(req, historyData);
        if (updateRes === false) {
        }
      }
      catch (e) {
        evt.emit("txn-error", "Error")
        NotificationManager.error("Error while accepting offer, Something might have changed", "", NOTIFICATION_DELAY);
        // await deleteBids({ bidID: bidData._id })
      }

      let reqParams = {
        bidID: bidData._id,
        nftID: bidData?.nftID[0]?._id, //to make sure we update the quantity left : NFTid
        seller: account, //to make sure we update the quantity left : walletAddress
        qtyBought: 1,
        qty_sold: 1,
        buyer: bidData.bidderID._id,
        erc721: props.NftDetails.type === 1 ? 1 : 2,
        amount: amount
      };

      await acceptOffer(reqParams);
    } catch (e) {
      evt.emit("txn-error", "Error")
      console.log("error in api", e);
      NotificationManager.error("Error while accepting offer, Something might have changed", "", NOTIFICATION_DELAY);
      // await deleteBids({ bidID: bidData._id })
      return false;
    }
    try {
      await handleUpdateBidStatus(bidData._id, "Accepted");
    } catch (e) {
      evt.emit("txn-error", "Error")
      console.log("error in updating order data", e);
      NotificationManager.error("Error while accepting offer, Something might have changed", "", NOTIFICATION_DELAY);
      // await deleteBids({ bidID: bidData._id })
      return false;
    }

  } catch (e) {
    console.log("error in contract function calling", e);
    if (e.code === 4001 || JSON.stringify(e).includes("user rejected transaction")) {
      evt.emit("txn-error", "user-denied-transaction")
      return false;
    }
    evt.emit("txn-error", "transaction-failed")
    NotificationManager.error("Error while accepting offer, Something might have changed", "", NOTIFICATION_DELAY);
    await deleteBids({ bidID: bidData._id })
    return false;
  }
  NotificationManager.success("Offer Accepted Successfully", "", NOTIFICATION_DELAY);
  return true;
};

export const handleUpdateBidStatus = async (
  bidID,
  action,
  bidData = "" //Delete, Cancelled, Rejected
) => {
  try {
    let reqParams = {
      bidID: bidID,
      action: action, //Delete, Cancelled, Rejected
    };
    let tokenAddress
    let tokenID
    let seller
    let buyerOrder = []
    let amount = new BigNumber(bidData?.bidPrice?.$numberDecimal?.toString())
      .multipliedBy(new BigNumber(bidData?.bidQuantity?.toString()))
      ?.toString();
    if (bidData?.bidStatus === "Bid") {
      buyerOrder = await buildBuyerOrder(bidData)
      tokenAddress = bidData?.orderID[0]?.collectionAddress;
      tokenID = bidData?.orderID[0]?.tokenID
      seller = bidData?.owner?.walletAddress
    }
    else {
      tokenAddress = bidData?.tokenAddress
      tokenID = bidData?.nftID[0]?.tokenID
      seller = bidData?.owner?.walletAddress
      for (let key = 0; key < 11; key++) {
        switch (key) {
          case 0:
            buyerOrder.push(bidData?.bidderID?.walletAddress);
            break;

          case 1:
            buyerOrder.push(tokenAddress);
            break;
          case 2:
            buyerOrder.push(Number(tokenID));
            break;
          case 3:
            buyerOrder.push(Number(1));
            break;
          case 4:
            buyerOrder.push(1);
            break;
          case 5:
            buyerOrder.push(bidData.paymentToken?.toLowerCase());
            break;
          case 6:
            buyerOrder.push(amount);
            break;
          case 7:
            buyerOrder.push(bidData.bidDeadline);

            break;
          case 8:
            buyerOrder.push([]);
            break;
          case 9:
            buyerOrder.push([]);
            break;
          case 10:
            buyerOrder.push(Number(bidData.salt));
            break;
          default:
            buyerOrder.push([]);
        }
      }
    }
    if (bidData) {
      if (!bidData?.owner?.walletAddress) {
        evt.emit("txn-error", "Error");
        NotificationManager.info("Owner has been changed or order deleted", "", NOTIFICATION_DELAY)

        await updateBidNft(reqParams);
        slowRefresh(1000)
        return { res: false, hash: "" }
      }

      let usrHaveQuantity = await GetOwnerOfToken(
        tokenAddress,
        tokenID,
        1,
        seller
      );

      if (usrHaveQuantity === 0 || usrHaveQuantity === false) {
        evt.emit("txn-error", "Error");
        NotificationManager.info("Owner has been changed or order deleted", "", NOTIFICATION_DELAY)
        await updateBidNft(reqParams);
        return { res: false, hash: "" }
      }
    }
    let hash_;
    if (action === "Cancelled") {
      try {
        let { res, hash } = await handleCancelOrder(buyerOrder, bidData?.buyerSignature, bidID, false)
        hash_ = hash
        if (res === false)
          return { res: false, hash: "" }
      }
      catch (e) {
        console.log("error in update status", e)
        return { res: false, hash: "" }
      }
    }
    await updateBidNft(reqParams);

    return { res: true, hash: hash_ }
  } catch (e) {
    console.log("error in api", e);
    return { res: false, hash: "" }
  }
};

export const handleCancelOrder = async (order, signature, bidId, isOrder) => {
  evt.emit("txn-status", "cancel-initiated")
  let marketplace = await exportInstance(
    contracts.MARKETPLACE,
    marketPlaceABI.abi
  );

  let cancelOrder;
  try {
    let options = {
      from: order[0],
      value: 0,
    };

    let checkCallStatic = await marketplace.callStatic.cancelOrder(order,
      options)
    if (checkCallStatic) {
      try {
        cancelOrder = await marketplace.cancelOrder(
          order,
          options
        );
      }
      catch (e) {
        if (e.code === 4001 || JSON.stringify(e).includes("user rejected transaction")) {
          evt.emit("txn-error", "user-denied-cancel")
          return { res: false, hash: "" }
        }
        NotificationManager.error("Something might have changed during updation", "", NOTIFICATION_DELAY);

        evt.emit("txn-error", "Error");
        if (isOrder) {
          await DeleteOrder({ orderID: bidId })
        }
        else
          await deleteBids({ bidID: bidId })
        return { res: false, hash: "" }
      }
      try {
        let result = await cancelOrder.wait()
        if (result.status === 0) {
          evt.emit("txn-error", "Error");
          NotificationManager.error("Something might have changed during updation", "", NOTIFICATION_DELAY);
          if (isOrder) {
            await DeleteOrder({ orderID: bidId })
          }
          else
            await deleteBids({ bidID: bidId })
          return { res: false, hash: "" }
        }
        else {
          evt.emit("txn-status", "cancel-succeeded");
          return { res: true, hash: result.transactionHash }
        }

      }
      catch (e) {
        evt.emit("txn-error", "transaction-failed")
        console.log("eee", e)
        NotificationManager.error("Something might have changed during updation", "", NOTIFICATION_DELAY);
        if (e.code === "CALL_EXCEPTION") {
          if (e.toString().includes("Cancelled or complete")) {
            if (isOrder) {
              await DeleteOrder({ orderID: bidId })
            }
            else
              await deleteBids({ bidID: bidId })
            NotificationManager.error("Transaction is Cancelled or Completed");
            return { res: false, hash: "" }
          }
        } else {
          NotificationManager.error("Transaction Failed");
          return { res: false, hash: "" }
        }

        // NotificationManager.error("tx failed due to" + e.code)
        return { res: false, hash: "" }
      }
    }

  }
  catch (e) {
    console.log("error in cancel order", e)
    evt.emit("txn-error", "transaction-failed")
    if (e.toString().includes("Cancelled or complete")) {
      evt.emit("txn-error", "Error");
      NotificationManager.info("Order is Either Completed or Cancelled", "", NOTIFICATION_DELAY)
      if (isOrder) {
        await DeleteOrder({ orderID: bidId })
      }
      else
        await deleteBids({ bidID: bidId })
      return { res: false, hash: "" }
    }
    return { res: false, hash: "" }
  }
}
