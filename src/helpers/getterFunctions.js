import {
  exportInstance,
  getOrderDetails,
  GetOrdersByNftId,
  getAllCollections,
  GetAllUserDetails,
  getNFTList,
  viewNFTDetails,
  getBrandById,
  GetIndividualAuthorDetail,
  getCategories,
  getCategoriesWithCollectionData,
  fetchOfferNft,
  fetchOfferMade,
  GetHistory,
  fetchOfferReceived,
  getAllCollectionTabs,
  updateOwner,
  deleteBids,
} from "../apiServices";
import { ethers } from "ethers";
import contracts from "../config/contracts";
import erc20Abi from "./../config/abis/erc20.json";
import erc721Abi from "./../config/abis/simpleERC721.json";
import marketPlaceABI from "./../config/abis/marketplace.json"
import erc1155Abi from "./../config/abis/simpleERC1155.json";
// import NotificationManager from "react-notifications/lib/NotificationManager";
import evt from "../events/events"
import { slowRefresh } from "./../helpers/NotifyStatus";
import { NOTIFICATION_DELAY } from "./constants";
import { isEmptyObject } from "jquery";
import BigNumber from "bignumber.js";
import { NotificationManager } from "react-notifications";


export const buildSellOrder = async (id) => {
  let details;
  try {
    details = await getOrderDetails({ orderID: id });
    const order = [
      details.sellerID?.walletAddress.toLowerCase(),
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

    if (isEmptyObject(details)) {
      return false
    }
    return order;
  } catch (e) {
    console.log("error in api", e);
    return false
  }
};

export const buildBuyerOrder = async (bidData) => {
  let sellerOrder = await buildSellOrder(bidData?.orderID[0]?._id);
  if (sellerOrder === false) {
    evt.emit("txn-error", "Error");
    NotificationManager.info("Owner has been changed or order deleted", "", NOTIFICATION_DELAY);
    await deleteBids({ bidID: bidData._id })
    slowRefresh(1000)
    return false
  }
  let amount = new BigNumber(bidData?.bidPrice?.$numberDecimal.toString())
    .multipliedBy(new BigNumber(bidData.bidQuantity.toString()))
    .toString();
  let buyerOrder = []
  for (let key = 0; key < 11; key++) {
    switch (key) {
      case 0:
        buyerOrder.push(bidData?.bidderID?.walletAddress);
        break;

      case 1:
        buyerOrder.push(sellerOrder[key]);
        break;
      case 3:
        buyerOrder.push(Number(sellerOrder[key]));

        break;
      case 5:
        buyerOrder.push(sellerOrder[key]);
        break;
      case 6:
        buyerOrder.push(amount);

        break;
      case 7:
        buyerOrder.push(bidData?.bidDeadline);

        break;
      case 8:
        buyerOrder.push([]);
        break;
      case 9:
        buyerOrder.push([]);
        break;
      default:
        buyerOrder.push(parseInt(parseInt(sellerOrder[key])));
    }
  }
  return buyerOrder
}

export const GetOwnerOfToken = async (
  collection,
  tokenId,
  isERC721,
  account
) => {
  let collectionInstance = await exportInstance(
    collection,
    isERC721 === 1 ? erc721Abi.abi : erc1155Abi.abi
  );


  let balance = 0;
  if (isERC721) {
    let owner = await collectionInstance.ownerOf(tokenId);
    if (owner.toLowerCase() === account.toLowerCase()) {
      balance = "1";
    }
  } else {
    balance = await collectionInstance.balanceOf(account, tokenId);
  }
  if (balance === 0) {
    evt.emit("txn-error", "Error")
    await updateOwner({ collectionAddress: collection, tokenID: tokenId })

    return false
  }

  return balance.toString();
};

export const getPaymentTokenInfo = async (userWallet, tokenAddress) => {
  let token = await exportInstance(tokenAddress, erc20Abi);
  let symbol = await token.symbol();
  let name = await token.name();
  let allowance = await token.allowance(userWallet, contracts.MARKETPLACE);
  let balance = await token.balanceOf(userWallet);
  return {
    symbol: symbol,
    name: name,
    balance: balance.toString(),
    allowance: allowance.toString(),
  };
};

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
    if (e.code === 4001 || JSON.stringify(e).includes("user rejected transaction")) {
      return false;
    }
    console.log("error in api 3", e);
    return false;
  }
};


export const getUsersTokenBalance = async (account, tokenAddress) => {
  let token;
  token = await exportInstance(tokenAddress, erc20Abi);
  let userBalance = await token.balanceOf(account);
  return userBalance.toString();
};

export const getAllOffersByNftId = async (nftId) => {
  let dummyData = await fetchOfferNft({
    nNFTId: nftId,
    buyerID: "All",
    bidStatus: "All",
  });

  let data = [];

  dummyData?.data
    ? // eslint-disable-next-line array-callback-return
    dummyData.data?.map((d, i) => {
      data.push({
        bidId: d._id,
        bidQuantity: d.oBidQuantity,
        bidPrice: d.oBidPrice.$numberDecimal,
        seller: d.oOwner.sWalletAddress,
        orderId: d.oOrderId,
        bidder: d.oBidder.sWalletAddress,
        bidderProfile: d.oBidder.sProfilePicUrl,
        buyerSignature: d.oBuyerSignature,
        bidderFullName: d.oBidder.oName
          ? d.oBidder.oName.sFirstname
          : d.oBidder
            ? d.oBidder.sWalletAddress
            : "Unnamed",
        nftId: d.oNFTId,
        owner: d.oSeller,
      });
    })
    : data.push([]);

  return data;
};

export const getCollections = async (req) => {
  let data = [];
  let formattedData = [];
  try {
    let reqBody = {
      page: req.page,
      limit: req.limit,
      collectionID: req.collectionID,
      userID: req.userID,
      categoryID: req.categoryID,
      brandID: req.brandID,
      ERCType: req.ERCType,
      searchText: req.searchText,
      filterString: req.filterString,
      isMinted: req.isMinted,
      isHotCollection: req.isHotCollection,
      isExclusive: req.isExclusive,
      isOnMarketplace: req.isOnMarketplace,
    };

    data = await getAllCollections(reqBody);
  } catch (e) {
    console.log("Error in getCollections API--->", e);
  }
  let arr = [];
  if (data && data.results && data.results.length > 0) arr = data.results[0];
  else return [];
  arr
    ? arr?.map((coll, key) => {
      formattedData[key] = {
        _id: coll._id,
        logoImg: coll.logoImage,
        coverImg: coll.coverImage,
        name: coll.name,
        desc: coll.description,
        saleStartTime: coll.preSaleStartTime,
        saleEndTime: coll.preSaleEndTime,
        price: coll.price.$numberDecimal,
        items: coll.nftCount,
        totalSupply: coll.totalSupply,
        contractAddress: coll.contractAddress,
        brand: coll.brandID,
        createdBy: coll.createdBy,
        link: coll.link,
        volumeTraded: coll.volumeTraded,
        count: data.count,
      };
    })
    : (formattedData[0] = {});
  return formattedData;
};

export const getNFTs = async (req) => {
  let data = [];
  let formattedData = [];
  try {
    let reqBody = {
      page: req.page,
      limit: req.limit,
      nftID: req.nftID,
      collectionID: req.collectionID,
      userID: req.userID,
      categoryID: req.categoryID,
      brandID: req.brandID,
      isLazyMinted: req.isLazyMinted,
      ERCType: req.ERCType,
      searchText: req.searchText,
      isMinted: req.isMinted,
      isOnMarketplace: req.isOnMarketplace,
      salesType: req.salesType,
      priceSort: req.priceSort,
      pageName: req.pageName,
      searchBy: req.searchBy
    };

    data = await getNFTList(reqBody);
  } catch (e) {
    console.log("Error in getNFts API--->", e);
  }
  let count = data?.count;
  let filterCount = data?.filterCount ? data?.filterCount : 0;
  data = data?.results;
  let arr = [];
  if (data && data?.length > 0) arr = data;
  else return [];

  arr
    ? arr?.map((nft, key) => {
      formattedData[key] = {
        id: nft?._id,
        image: nft?.image,
        name: nft?.name,
        desc: nft?.description,
        collectionAddress: nft?.collectionAddress,
        ownedBy: nft?.ownedBy,
        like:
          nft?.user_likes?.length === undefined ? 0 : nft?.user_likes?.length,
        Qty: nft?.totalQuantity,
        collection: nft?.collectionID,
        catergoryInfo: nft?.categoryID,
        tokenId: nft?.tokenID,
        createdBy: nft?.createdBy,
        type: nft?.type,
        attributes: nft?.attributes,
        totalQuantity: nft?.totalQuantity,
        fileType: nft?.fileType,
        collectionData: nft?.CollectionData,
        orderData: nft?.OrderData,
        brandData: nft?.BrandData[0],
        count: filterCount,
        previewImg: nft?.previewImg,
      };
    })
    : (formattedData[0] = {});
  return formattedData;
};

export const getNFTDetails = async (req) => {
  let data = [];
  let formattedData = [];

  try {
    let reqBody = {
      nftID: req.nftID,
    };

    data = await viewNFTDetails(reqBody);
  } catch (e) {
    console.log("Error in getNFts API--->", e);
  }

  let arr = [];

  if (data && data?.length > 0) arr = data;
  else return [];
  arr
    ? arr?.map((nft, key) => {
      formattedData[key] = {
        id: nft._id,
        image: nft.image,
        name: nft.name,
        desc: nft.description,
        collectionAddress: nft.collectionAddress,
        ownedBy: nft.ownedBy,
        like:
          nft.user_likes?.length === undefined ? 0 : nft.user_likes?.length,
        Qty: nft.totalQuantity,
        collection: nft.collectionID,
        catergoryInfo: nft?.categoryID,
        tokenId: nft.tokenID,
        createdBy: nft.createdBy,
        type: nft.type,
        originalImage: nft.originalImage,
        attributes: nft.attributes,
        totalQuantity: nft.totalQuantity,
        fileType: nft.fileType,
        collectionData: nft.CollectionData,
        OrderData: nft.OrderData,
        animation_url: nft.animation_url,
        properties: nft.property,
        brandImage: nft?.BrandData?.length > 0 ? nft?.BrandData[0]?.logoImage : ""
      };
    })
    : (formattedData[0] = {});
  return formattedData;
};

export const getAuthors = async () => {
  let data = [];
  let formattedData = [];
  try {
    let reqBody = {
      page: 1,
      limit: 12,
      searchText: "",
    };
    data = await GetAllUserDetails(reqBody);
  } catch (e) {
    console.log("Error in getAllUserDetails API--->", e);
  }
  let arr = [];
  if (data && data?.results && data?.results?.length > 0) arr = data.results[0];
  else return [];
  arr
    ? arr?.map((author, key) => {
      formattedData[key] = {
        _id: author._id,
        profile: author.profileIcon,
        name: author.username,
      };
    })
    : (formattedData[0] = {});
  return formattedData;
};

export const getOrderByNftID = async (reqBody) => {
  let data = [];

  try {
    data = await GetOrdersByNftId(reqBody);
  } catch (e) {
    console.log("Error in getOrderByNftID API", e);
  }

  return data;
};

export const getBrandDetailsById = async (brandID) => {
  let brand = [];
  try {
    brand = await getBrandById(brandID);
  } catch (e) {
    console.log("Error in getBrandByID API", e);
  }
  return brand;
};

export const getUserById = async (reqBody) => {
  let user = [];
  try {
    user = await GetIndividualAuthorDetail(reqBody);
  } catch (e) {
    console.log("Error in getUserByID API", e);
  }
  return user;
};

export const getCategory = async (data) => {
  let category = [];
  try {
    category = await getCategories(data);
  } catch (e) {
    console.log("Error in getCategory API", e);
  }

  return category;
};

export const getPrice = async (data) => {
  let order = {};
  let min = "000000000000000";
  try {
    if (data) {
      data?.map((i) => {
        if (min < i.price.$numberDecimal) {
          min = i.price.$numberDecimal;
          order = i;
        }
      });
    }
    return order;
  } catch (e) {
    console.log("Error in getting nft order details", e);
  }
};


export const getOfferMade = async (req) => {

  let formattedData = [];
  let data = [];
  try {
    let reqBody = {
      page: req.page,
      limit: req.limit,
      userID: req.userID
    };

    data = await fetchOfferMade(reqBody);
  } catch (e) {
    console.log("Error in getOfferMade API--->", e);
  }

  let arr = [];
  if (data && data.count > 0) arr = data.results;
  else return [];
  arr
    ? arr?.map((order, key) => {
      formattedData[key] = {
        bidderAddress: order?.BidderData[0]?.walletAddress,
        sellerAddress: order?.OwnerData[0]?.walletAddress,
        bidPrice: order?.bidPrice?.$numberDecimal,
        bidDeadline: order?.bidDeadline,
        nftData: order?.nftsData[0]?._id,
        bidStatus: order?.bidStatus,
        paymentToken: order?.paymentToken,
        createdOn: order?.createdOn
      }
    })
    : (formattedData[0] = {});
  return formattedData;
}


export const getOfferReceived = async (req) => {
  let formattedData = [];
  let data = [];
  try {
    let reqBody = {
      page: req.page,
      limit: req.limit,
      userWalletAddress: req.userWalletAddress
    };

    data = await fetchOfferReceived(reqBody);
  } catch (e) {
    console.log("Error in getOfferMade API--->", e);
  }

  let arr = [];
  if (data && data.count > 0) arr = data.results;
  else return [];
  arr
    ? arr?.map((order, key) => {
      formattedData[key] = {
        bidderAddress: order?.BidderData[0]?.walletAddress,
        sellerAddress: order?.OwnerData[0]?.walletAddress,
        bidPrice: order?.bidPrice?.$numberDecimal,
        bidDeadline: order?.bidDeadline,
        nftData: order?.nftsData[0]?._id,
        bidStatus: order?.bidStatus,
        paymentToken: order?.paymentToken,
        createdOn: order?.createdOn
      }
    })
    : (formattedData[0] = {});
  return formattedData;
}

export const fetchHistory = async (req) => {
  let formattedData = [];
  let data = [];
  try {
    let reqBody = {
      page: req.page,
      limit: req.limit,
      nftID: req.nftID,
      collectionID: req.collectionID,
      brandID: req.brandID,
      userID: req.userID
    };

    data = await GetHistory(reqBody);
  } catch (e) {
    console.log("Error in fetchHistory API--->", e);
  }
  let arr = [];
  if (data && data.count > 0) arr = data.results;

  else return [];
  arr
    ? arr?.map((h, key) => {
      formattedData[key] = {
        nftID: h?.nftsData[0]?._id,
        nftName: h?.nftsData[0]?.name,
        buyerAddress: h?.BuyerData?.length > 0 ? h?.BuyerData[0]?.walletAddress : "",
        sellerAddress: h?.SellerData?.length > 0 ? h?.SellerData[0]?.walletAddress : "",
        action: h?.action,
        type: h?.type,
        price: h?.price?.$numberDecimal,
        quantity: h?.quantity,
        paymentToken: h?.paymentToken,
        createdOn: h?.createdOn,
        nftImg: h?.nftsData[0]?.image,
        count: data.count
      }
    })
    : (formattedData[0] = {});
  return formattedData;
}

export const getCategoryWithCollectionData = async (data) => {
  let category = [];
  try {
    category = await getCategoriesWithCollectionData(data);
  } catch (e) {
    console.log("Error in getCategoryWithCollectionData API", e);
  }
  return category;
};

export const getCollectionTabs = async (req) => {
  let data = [];
  try {
    let reqBody = {
      page: req.page,
      limit: req.limit,
      collectionID: req.collectionID,
      userID: req.userID,
      categoryID: req.categoryID,
      brandID: req.brandID,
      ERCType: req.ERCType,
      searchText: req.searchText,
      filterString: req.filterString,
      isMinted: req.isMinted,
      isHotCollection: req.isHotCollection,
      isExclusive: req.isExclusive,
      isOnMarketplace: req.isOnMarketplace,
    };
    data = await getAllCollectionTabs(reqBody);
  } catch (e) {
    console.log("Error in getCollections API--->", e);
  }
  return data;
};


export const getNFTsOnDetailPage = async (req) => {
  let data = [];
  let formattedData = [];
  try {
    let reqBody = {
      page: req.page,
      limit: req.limit,
      nftID: req.nftID,
      collectionID: req.collectionID,
      userID: req.userID,
      categoryID: req.categoryID,
      brandID: req.brandID,
      isLazyMinted: req.isLazyMinted,
      ERCType: req.ERCType,
      searchText: req.searchText,
      isMinted: req.isMinted,
      isOnMarketplace: req.isOnMarketplace,
      salesType: req.salesType,
      priceSort: req.priceSort,
      pageName: req.pageName,
      searchBy: req.searchBy
    };

    data = await getNFTList(reqBody);
  } catch (e) {
    console.log("Error in getNFts API--->", e);
  }
  let count = data.count;
  let filterCount = data.filterCount ? data.filterCount : 0
  data = data.results;
  let arr = [];
  if (data && data?.length > 0) arr = data;

  arr
    ? arr?.map((nft, key) => {
      formattedData[key] = {
        id: nft?._id,
        image: nft?.image,
        name: nft?.name,
        desc: nft?.description,
        collectionAddress: nft?.collectionAddress,
        ownedBy: nft?.ownedBy,
        like:
          nft?.user_likes?.length === undefined ? 0 : nft?.user_likes?.length,
        Qty: nft?.totalQuantity,
        collection: nft?.collectionID,
        catergoryInfo: nft?.categoryID,
        tokenId: nft?.tokenID,
        createdBy: nft?.createdBy,
        type: nft?.type,
        attributes: nft?.attributes,
        totalQuantity: nft?.totalQuantity,
        fileType: nft?.fileType,
        collectionData: nft?.CollectionData,
        orderData: nft?.OrderData,
        brandData: nft?.BrandData[0],
        count: count,
        filterCount: filterCount,
        previewImg: nft?.previewImg
      };
    })
    : (formattedData[0] = {});
  return { formattedData, count, filterCount };
};

export const checkIfOrderAlreadyCancelledOrCompleted = async (order) => {
  let contract = await exportInstance(
    contracts.MARKETPLACE,
    marketPlaceABI.abi
  );
  let hash = await contract.buildHash(order)
  let res = await contract.orderIsCancelledOrCompleted(order[0], hash)
  return res;
}
