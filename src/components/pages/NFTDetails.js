import React, { useState, useEffect, useRef, Suspense } from "react";
import Footer from "../components/footer";
import FirearmsCollection from "../components/FirearmsCollection";
import NFTlisting from "../components/NFTlisting";
import NFToffer from "../components/NFToffer";
import NFTBids from "../components/NFTBids";
import { ethers } from "ethers";
import NFThistory from "../components/NFThistory";
import {
  getNFTs,
  getNFTDetails,
  getUsersTokenBalance,
} from "../../helpers/getterFunctions";
import { useParams } from "react-router-dom";
import { convertToEth } from "../../helpers/numberFormatter";
import { createOffer, putOnMarketplace, handleBuyNft, createBid, handleRemoveFromSale, } from "../../helpers/sendFunctions";
import { useCookies } from "react-cookie";
import contracts from "../../config/contracts";
import { GENERAL_DATE, GENERAL_TIMESTAMP, NOTIFICATION_DELAY } from "../../helpers/constants";
import BGImg from "../../assets/images/background.jpg";
import moment, { now } from "moment";
import { Tokens } from "../../helpers/tokensToSymbol";
import Spinner from "../components/Spinner";
import PopupModal from "../components/AccountModal/popupModal";
import Logo from "../../assets/images/logo.svg";
import { fetchBidNft, fetchOfferNft, getButtonName, InsertHistory, refreshNFTMeta, updateOwner } from "../../apiServices";
import { useGLTF } from "@react-three/drei";
import { Canvas, useFrame, extend, useThree, } from "@react-three/fiber";
import { OrbitControls } from "three/examples/jsm/controls/OrbitControls";
import evt from "./../../events/events";
import { onboard } from "../menu/header";
import { WalletConditions } from "../components/WalletConditions";
import ProgressModal from "../components/AccountModal/ProgressModal";
import { getPriceFeed } from "../../helpers/priceFeed";
import { isEmptyObject } from "jquery";
import { NotificationManager } from "react-notifications";
import DateMomentUtils from "@date-io/moment";
import { DateTimePicker, MuiPickersUtilsProvider } from "@material-ui/pickers";
import BigNumber from "bignumber.js";
import { slowRefresh } from "../../helpers/NotifyStatus";
import Clock from "./../components/Clock"

extend({ OrbitControls });


evt.setMaxListeners(1);

var textColor = {
  textColor: "#EF981D",
};

function NFTDetails() {
  //var bgImgStyle = {
  //  backgroundImage: `url(${BGImg})`,
  //  backgroundRepeat: "no-repeat",
  //  backgroundSize: "cover",
  //  backgroundPositionX: "center",
  //  backgroundPositionY: "center",
  //  backgroundColor: "#000",
  //};

  const { id } = useParams();
  const [NFTDetails, setNFTDetails] = useState([]);
  const [allNFTs, setAllNFTs] = useState([]);
  const [collection, setCollection] = useState([]);
  const [marketplaceSaleType, setmarketplaceSaleType] = useState(0);
  const [itemprice, setItemprice] = useState("");
  const [item_qt, setItem_qt] = useState(1);
  const [item_bid, setItem_bid] = useState("");
  const [selectedToken, setSelectedToken] = useState("BUSD");
  const [selectedTokenFS, setSelectedTokenFS] = useState("BUSD");
  const [currentUser, setCurrentUser] = useState("none");
  const [cookies] = useCookies([]);
  const [orders, setOrders] = useState("none");
  const [loading, setLoading] = useState(false);
  const [isModal, setIsModal] = useState("");
  const [offerPrice, setOfferPrice] = useState("");
  const [offerQuantity, setOfferQuantity] = useState(1);
  const [isBuyNowModal, setIsBuyNowModal] = useState(false);
  const [isPlaceBidModal, setIsPlaceBidModal] = useState(false);
  const [qty, setQty] = useState(1);
  const [price, setPrice] = useState("");
  const [firstOrderNFT, setFirstOrderNFT] = useState([]);
  const [haveBid, setHaveBid] = useState("none");
  const [ownedBy, setOwnedBy] = useState("");
  const [modalImage, setModalImage] = useState("")
  const [showAlert, setShowAlert] = useState("");
  const [reloadContent, setReloadContent] = useState(false);
  const [isMakeOffer, setIsMakeOffer] = useState(false);
  const [buttons, setButtons] = useState([]);
  const [isShowPopup, setIsShowPopup] = useState(false);
  const [closeDisabled, setCloseDisabled] = useState(true);
  const [marketplaceApproval, setMarketplaceApproval] = useState("");
  const [paymentTokenApproval, setPaymentTokenApproval] = useState("");
  const [sign, setSign] = useState("");
  const [transaction, setTransaction] = useState("")
  const [data, setData] = useState([]);
  const [message, setMessage] = useState("");
  const [activeRefresh, setActiveRefresh] = useState(false)
  // const [dollar, setDollar] = useState(0);
  const [bid, setBid] = useState({})
  const [currOffer, setCurrOffer] = useState({});
  const [cancelOrder, setCancelOrder] = useState("");
  const [selectedDate, setSelectedDate] = useState(null);
  const [isDescription, setIsDescription] = useState("")

  const refreshVariables = () => {
    setQty(1);
    setPrice("");
    setOfferPrice("");
    setOfferQuantity(1);
    setItem_bid("");
    setItemprice("");
    setBid({});
    setCurrOffer({});
    setSelectedDate(null);
  }


  const handleDateChange = (e) => {
    if (!moment(e).isValid()) {
      setSelectedDate(null);
      return;
    }
    const dt = moment(e)?.format('YYYY-MM-DDTHH:mm')

    const ct = moment(new Date()).format();
    if (dt) {
      if (dt < ct) {
        NotificationManager.error(`Value must be ${moment(new Date()).add(60, "seconds").format('lll')} or later`, "", NOTIFICATION_DELAY);
        setSelectedDate(null);
        return;
      }
      setSelectedDate(dt);
    }
    else {
      setSelectedDate(null);
    }
  }

  const refreshState = () => {
    setReloadContent(!reloadContent)
  }

  useEffect(() => {
    const fetch = async () => {
      if (currentUser !== "none") {
        let btn = await getButtonName({ "nftID": id, "userID": localStorage.getItem("userId"), "walletAddress": currentUser });
        setButtons(btn);
      }

    }
    fetch()
  }, [currentUser, id, localStorage.getItem("userId"), reloadContent])

  useEffect(() => {
    if (currentUser === "none") {
      async function setUser() {
        if (cookies.selected_account) {
          setCurrentUser(cookies.selected_account);
        }
        else {
          setCurrentUser("null")
        }
      }
      setUser();
    }

  }, [cookies.selected_account]);

  useEffect(() => {
    async function windowScroll() {
      window.scrollTo(0, 0);
    }
    windowScroll();
  }, []);

  useEffect(() => {
    const fetch = async () => {
      try {
        const reqData = {
          nftID: id,
        };
        const res = await getNFTDetails(reqData);

        let owners = res[0]?.ownedBy;
        if (owners?.length === 0 || owners[0]?.address === "") {
          await updateOwner({ collectionAddress: res[0]?.collectionAddress, tokenID: res[0]?.tokenId })
          NotificationManager.info("Owner has been changed", "", NOTIFICATION_DELAY)
          slowRefresh()
        }
        if (res.length === 0) {
          window.location.href = "/marketplace";
          return;
        }
        setNFTDetails(res[0]);
        if (res[0]?.OrderData.length > 0) {
          setFirstOrderNFT(res[0]?.OrderData[0]);
        }

        if (res[0].fileType === "3D") {
          let image = res[0].animation_url;
          setModalImage(image)
        }

        if (res[0]?.OrderData.length > 0) {
          setOrders(res[0]?.OrderData);
          const price = await getPriceFeed(res[0]?.OrderData[0].paymentToken);

          // setDollar(Number(convertToEth(price * res[0]?.OrderData[0].price.$numberDecimal))?.toFixed(6)?.slice(0, -2));
        }
        else
          setOrders([]);
        setOwnedBy(res[0]?.ownedBy[res[0]?.ownedBy?.length - 1]?.address);
        // const c = await getCollections({ collectionID: res[0].collection });
        // setCollection(c[0]);
        setCollection([]);
        if (res[0]?.collectionData?.length > 0) {
          setCollection(res[0]?.collectionData[0]);
        }
        const reqData1 = {
          page: 1,
          limit: 12,
          collectionID: res[0].collection,
        };
        const nfts = await getNFTs(reqData1);
        setAllNFTs(nfts);

      } catch (e) {
        console.log("Error in fetching nft Details", e);
      }
    };
    fetch();
  }, [reloadContent]);

  useEffect(() => {
    const fetch = async () => {
      let searchParams = {
        nftID: id,
        buyerID: localStorage.getItem("userId"),
        bidStatus: "All",
        orderID: "All",
      };

      let _data = await fetchBidNft(searchParams);
      if (_data && _data?.data?.length > 0) {
        const b = _data.data[0];
        setHaveBid(true);
        setBid(b)
        setPrice(convertToEth(b?.bidPrice?.$numberDecimal));

      } else {
        setHaveBid(false);
      }

    };
    fetch();
  }, [id, reloadContent]);

  useEffect(() => {
    const fetch = async () => {
      let searchParams = {
        nftID: id,
        buyerID: localStorage.getItem("userId"),
        bidStatus: "MakeOffer",
        orderID: "All",
      };

      let _data = await fetchOfferNft(searchParams);
      if (_data && _data?.data?.length > 0) {
        const b = _data.data[0];
        setCurrOffer(b)
        setOfferPrice(convertToEth(b?.bidPrice?.$numberDecimal));
        setSelectedDate(moment.utc(b?.bidDeadline * 1000).local().format());
      } else {
      }

    };
    fetch();
  }, [reloadContent]);

  useEffect(() => {
    const fetch = async () => {

      handleSetData();
    }
    fetch()
  }, [message, marketplaceApproval, sign, paymentTokenApproval, transaction, cancelOrder])

  const PutMarketplace = async () => {

    const wCheck = WalletConditions();
    if (wCheck !== undefined) {
      setShowAlert(wCheck);
      setIsModal("");
      return;
    }
    if (marketplaceSaleType === 0) {
      if (itemprice === undefined || itemprice === "" || itemprice <= 0) {
        NotificationManager.error("Please Enter a Price", "", NOTIFICATION_DELAY);
        return;
      }
    } else if (marketplaceSaleType === 1) {
      if (item_bid === undefined || item_bid === "" || item_bid <= 0) {
        NotificationManager.error("Please Enter Minimum Bid", "", NOTIFICATION_DELAY);
        return;
      }
      if (selectedDate === "" || selectedDate === undefined || selectedDate === null) {
        NotificationManager.error("Please Enter Expiration Date", "", NOTIFICATION_DELAY);
        return;
      }
      if (selectedDate < moment(new Date()).format()) {
        NotificationManager.error(`Expiration Date must be ${moment(new Date()).add(60, "seconds").format('lll')} or later`, "", NOTIFICATION_DELAY)
        return;
      }
    } else {
      if (item_bid === undefined || item_bid === "" || item_bid <= 0) {
        NotificationManager.error("Please Enter Minimum Bid", "", NOTIFICATION_DELAY);
        return;
      }
    }

    const price = marketplaceSaleType === 0 ? itemprice : item_bid;
    // if (new BigNumber("1000000").isLessThan(new BigNumber(price.toString()))) {
    //   NotificationManager.error("Insufficient Balance", "", NOTIFICATION_DELAY);
    //   return;
    // }
    // setLoading(true);
    setMessage("putOnMarketplace");
    handleSetData()
    setIsShowPopup(true);
    setIsModal("");

    try {
      let orderData = {
        nftId: NFTDetails.id,
        collection: NFTDetails.collectionAddress,
        price: itemprice,
        quantity: item_qt,
        saleType: marketplaceSaleType === 1 || marketplaceSaleType === 2 ? 1 : 0,
        salt: Math.round(Math.random() * 10000000),
        endTime: selectedDate ? selectedDate : GENERAL_DATE,
        chosenType: marketplaceSaleType,
        minimumBid: item_bid !== "" ? item_bid : 0,
        tokenAddress:
          marketplaceSaleType === 0
            ? contracts[selectedTokenFS]
            : contracts[selectedToken],
        tokenId: NFTDetails.tokenId,
        erc721: NFTDetails.type === 1 ? 1 : 0,
      };
      let res = await putOnMarketplace(currentUser, orderData);
      if (res) {
        let historyReqData = {
          nftID: NFTDetails.id,
          sellerID: localStorage.getItem("userId"),
          action: "PutOnSale",
          type: marketplaceSaleType === 0 ? "Fixed Sale" : marketplaceSaleType === 1 ? "Timed Auction" : "Open for Bids",
          price: ethers.utils.parseEther(itemprice.toString()).toString(),
          paymentToken: marketplaceSaleType === 0
            ? contracts[selectedTokenFS]
            : contracts[selectedToken],
          quantity: item_qt,
          createdBy: localStorage.getItem("userId"),
          hash: ""
        };
        await InsertHistory(historyReqData);
      }

    }
    catch (e) {
      console.log("Error in putOnMarketplace", e);
      setReloadContent(!reloadContent);
      refreshVariables();
      return
    }
    setReloadContent(!reloadContent);
    refreshVariables();
  };

  const PlaceOffer = async () => {
    const wCheck = WalletConditions();
    if (wCheck !== undefined) {
      setShowAlert(wCheck);
      return;
    }
    if (offerPrice === "" || offerPrice === undefined || offerPrice <= 0) {
      NotificationManager.error("Enter Offer Price", "", NOTIFICATION_DELAY);
      return;
    }
    if (
      offerQuantity === "" ||
      (offerQuantity === undefined && NFTDetails.type !== 1)
    ) {
      NotificationManager.error("Enter Offer Quantity", "", NOTIFICATION_DELAY);
      return;
    }
    if (selectedDate === "" || selectedDate === null) {
      NotificationManager.error("Enter Offer EndTime", "", NOTIFICATION_DELAY);
      return;
    }
    if (selectedDate < moment(new Date()).format()) {
      NotificationManager.error(`Expiration date must be ${moment(new Date()).add(60, "seconds").format('lll')} or later`, "", NOTIFICATION_DELAY)
      return;
    }
    const bal = await getUsersTokenBalance(currentUser, contracts.BUSD);
    if (new BigNumber(convertToEth(bal.toString())).isLessThan(new BigNumber(offerPrice.toString()))) {
      NotificationManager.error("Insufficient Balance", "", NOTIFICATION_DELAY);
      setIsMakeOffer(true);
      return;
    }
    // setLoading(true);
    setIsMakeOffer("");
    setMessage("makeOffer");
    handleSetData();
    setIsShowPopup(true)

    try {
      let deadline = moment(selectedDate).unix();
      const res = await createOffer(
        NFTDetails?.tokenId,
        collection?.contractAddress,
        NFTDetails?.ownedBy[0],
        currentUser,
        NFTDetails?.type,
        offerQuantity,
        ethers.utils.parseEther(offerPrice.toString()),
        deadline,
        NFTDetails.id,
        contracts.BUSD,
        currOffer
      );
      if (res) {
        let historyReqData = {
          nftID: NFTDetails.id,
          buyerID: localStorage.getItem("userId"),
          action: "Offer",
          type: "Created",
          price: ethers.utils.parseEther(offerPrice.toString()).toString(),
          paymentToken: contracts[selectedToken],
          quantity: offerQuantity,
          createdBy: localStorage.getItem("userId"),
          hash: ""
        }
        await InsertHistory(historyReqData);
        NotificationManager.success("Offer Placed Successfully", "", NOTIFICATION_DELAY);
      }
      setLoading(false);
    }
    catch (e) {
      console.log("Error", e);
      setLoading(false);
    }

    refreshVariables();
    refreshState()
    setLoading(false);

  };


  // Popup
  const handleMpShow = () => {
    refreshVariables();
    document.getElementById("tab_opt_1").classList.remove("put_hide");
    document.getElementById("tab_opt_1").classList.add("put_show");
    document.getElementById("tab_opt_2").classList.remove("put_hide");
    document.getElementById("tab_opt_2").classList.add("put_show");
    document.getElementById("tab_opt_3").classList.remove("put_show");
    document.getElementById("tab_opt_3").classList.add("put_hide");
    document.getElementById("tab_opt_4").classList.remove("put_hide");
    document.getElementById("tab_opt_4").classList.add("put_show");
    document.getElementById("tab_opt_5").classList.remove("put_show");
    document.getElementById("tab_opt_5").classList.add("put_hide");
    document.getElementById("btn1").classList.add("active");
    document.getElementById("btn2").classList.remove("active");
    document.getElementById("btn3").classList.remove("active");
    setmarketplaceSaleType(0);
  };

  const handleMpShow1 = () => {
    refreshVariables();
    document.getElementById("tab_opt_1").classList.remove("put_show");
    document.getElementById("tab_opt_1").classList.add("put_hide");
    document.getElementById("tab_opt_2").classList.remove("put_hide");
    document.getElementById("tab_opt_2").classList.add("put_show");
    document.getElementById("tab_opt_3").classList.remove("put_hide");
    document.getElementById("tab_opt_3").classList.add("put_show");
    document.getElementById("tab_opt_4").classList.remove("put_hide");
    document.getElementById("tab_opt_4").classList.add("put_show");
    document.getElementById("tab_opt_5").classList.remove("put_hide");
    document.getElementById("tab_opt_5").classList.add("put_show");
    document.getElementById("btn1").classList.remove("active");
    document.getElementById("btn2").classList.add("active");
    document.getElementById("btn3").classList.remove("active");
    setmarketplaceSaleType(1);
  };

  const handleMpShow2 = () => {
    refreshVariables();
    document.getElementById("tab_opt_1").classList.remove("put_show");
    document.getElementById("tab_opt_1").classList.add("put_hide");
    document.getElementById("tab_opt_2").classList.remove("put_hide");
    document.getElementById("tab_opt_2").classList.add("put_show");
    document.getElementById("tab_opt_3").classList.remove("put_hide");
    document.getElementById("tab_opt_3").classList.add("put_show");
    document.getElementById("tab_opt_4").classList.remove("put_hide");
    document.getElementById("tab_opt_4").classList.add("put_show");
    document.getElementById("tab_opt_5").classList.remove("put_show");
    document.getElementById("tab_opt_5").classList.add("put_hide");
    document.getElementById("btn1").classList.remove("active");
    document.getElementById("btn2").classList.remove("active");
    document.getElementById("btn3").classList.add("active");
    setmarketplaceSaleType(2);
  };


  useEffect(() => {
    async function addClassList() {
      var body = document.body;
      if (loading || isPlaceBidModal || isBuyNowModal) {
        body.classList.add("overflow_hidden");
      } else {
        body.classList.remove("overflow_hidden");
      }
    }
    addClassList();
  }, [loading, isPlaceBidModal, isBuyNowModal]);



  // Place Bid Checkout Modal
  const placeBidModal = (
    <PopupModal
      content={
        <div className='popup-content1'>

          <div className='modal_heading p-4'>
            <h4 className="text-light title_20 mb-0">Place a Bid</h4>

          </div>
          <div className="model_data">
            <div className='bid_user_details my-4'>
              <img src={Logo} alt='' />
              <div className='bid_user_address'>
                <div>
                  <span className="adr">
                    {currentUser?.slice(0, 8) +
                      "..." +
                      currentUser?.slice(34, 42)}
                  </span>
                  <span className='badge badge-success'>Connected</span>
                </div>
                <span className='pgn'>Binance</span>
              </div>
            </div>
            <div className="min_bid">
              <span className="mn">Minimum Bid Amount: </span>
              <span className="text-white">
                <img
                  src={Tokens[orders[0]?.paymentToken]?.icon}
                  className='img-fluid min_bid_tkn'
                  alt=''
                />
                <span>{Number(convertToEth(orders[0]?.price?.$numberDecimal))?.toFixed(6)?.slice(0, -2)}{" "}</span>
                <span>{Tokens[orders[0]?.paymentToken]?.symbolName}</span>
              </span>
            </div>
            <label className="required form-label">
              {NFTDetails?.type === 1
                ? "Quantity"
                : "Please Enter the Quantity"}
            </label>
            <input
              className="form-control input_design mb-3"
              type="text"
              min="1"
              step="1"
              autoComplete="off"
              placeholder="Quantity e.g. 1,2,3..."
              disabled={NFTDetails.type === 1 ? true : false}
              value={qty}
              onKeyPress={(e) => { if (!/^\d*$/.test(e.key)) e.preventDefault(); }}
              onChange={(e) => {
                if (Number(e.target.value) > Number(100)) {
                  NotificationManager.error(
                    "Quantity should be less than seller's order", "", NOTIFICATION_DELAY
                  );
                  return;
                }
                setQty(e.target.value);
              }}></input>
            <label className='required form-label'>
              Please Enter the Bid Price
            </label>
            <input
              className='form-control  input_design'
              type='text'
              min='1'
              autoComplete="off"
              placeholder='Price e.g. 0.001,1...'
              value={price}
              onKeyPress={(e) => {
                if (price.length > 19) e.preventDefault();
              }}
              onChange={(e) => {
                const re = /^\d*\.?\d*$/;
                let val = e.target.value;
                if (e.target.value === "" || re.test(e.target.value)) {

                  setPrice(val);
                }
              }}

            ></input>


            <button
              className='btn-main mt-3 btn-placeABid'
              onClick={async () => {
                const wCheck = WalletConditions();
                if (wCheck !== undefined) {
                  setIsPlaceBidModal(false);
                  setShowAlert(wCheck);
                  return;
                }
                const bal = await getUsersTokenBalance(currentUser, contracts.BUSD);
                if (new BigNumber(convertToEth(bal.toString())).isLessThan(new BigNumber(price.toString()))) {
                  NotificationManager.error("Insufficient Balance", "", NOTIFICATION_DELAY);
                  setIsPlaceBidModal(true);
                  return;
                }
                if (
                  Number(price) <
                  Number(convertToEth(orders[0]?.price?.$numberDecimal))
                ) {
                  NotificationManager.error(
                    `Bid Price must be greater than ${Number(convertToEth(orders[0]?.price?.$numberDecimal))} BUSD`, "", NOTIFICATION_DELAY
                  );
                  setIsPlaceBidModal(true);
                  return;
                }
                setIsPlaceBidModal(false);
                // setLoading(true);
                setMessage("placeBid");
                handleSetData();
                setIsShowPopup(true);
                try {
                  let res = await createBid(
                    orders[0]?.nftID,
                    orders[0]?._id,
                    orders[0]?.sellerID,
                    currentUser,
                    NFTDetails?.type,
                    orders[0]?.total_quantity,
                    ethers.utils.parseEther(price.toString()),
                    false,
                    !isEmptyObject(bid) ? bid : {}
                  );
                  if (res) {
                    let historyReqData = {
                      nftID: orders[0]?.nftID,
                      buyerID: localStorage.getItem('userId'),
                      sellerID: orders[0]?.sellerID,
                      action: "Bid",
                      type: "Created",
                      price: ethers.utils.parseEther(price.toString()).toString(),
                      paymentToken: contracts[selectedToken],
                      quantity: orders[0]?.total_quantity,
                      createdBy: localStorage.getItem("userId"),
                      hash: ""
                    };
                    await InsertHistory(historyReqData);
                    NotificationManager.success("Bid Created Successfully", "", NOTIFICATION_DELAY);


                    // slowRefresh(1000);
                  }
                } catch (e) {
                  // NotificationManager.error("Something went wrong", "");
                  console.log("Error in placing bid", e)
                  return;
                }
                setReloadContent(!reloadContent)
                refreshVariables();
              }}
            >
              {haveBid && haveBid !== "none" ? "Update Bid" : "Place a Bid"}
            </button>
          </div>
        </div>
      }
      handleClose={() => {
        setIsPlaceBidModal(!isPlaceBidModal);
        setQty(1);
        if (!haveBid) setPrice("");
      }}
    />
  );

  // Buy Now Checkout Modal
  const buyNowModal = (
    <PopupModal
      content={
        <div className='popup-content1'>
          <div className='modal_heading p-4'>
            <h4 className="text-light title_20 mb-0">Complete Checkout</h4>
          </div>
          <div className="model_data">
            <div className='bid_user_details my-4'>
              <img src={Logo} alt='' />
              <div className='bid_user_address'>
                <div>
                  <span className="adr">
                    {currentUser?.slice(0, 8) +
                      "..." +
                      currentUser?.slice(34, 42)}
                  </span>
                  <span className='badge badge-success'>Connected</span>
                </div>
                <span className='pgn'>Binance</span>
              </div>
            </div>

            <label className='required form-label'>
              {NFTDetails?.type === 1
                ? "Quantity"
                : "Please Enter the Quantity"}
            </label>
            <input
              className="form-control input_design"
              type="text"
              min="1"
              step="1"
              placeholder="Quantity e.g. 1,2,3..."
              disabled={NFTDetails?.type === 1 ? true : false}
              value={qty}
              onKeyPress={(e) => {
                if (!/^\d*$/.test(e.key)) e.preventDefault();
              }}
              onChange={(e) => {
                if (Number(e.target.value) > Number(orders[0]?.total_quantity)) {
                  NotificationManager.error(
                    "Quantity should be less than Seller's Order", "", NOTIFICATION_DELAY

                  );
                  return;
                }

                setQty(e.target.value);
              }}></input>
            <label className='required form-label'>Price</label>
            <input
              className='form-control input_design'
              type='text'
              min='1'
              placeholder='Price e.g. 0.001,1...'
              disabled={true}
              value={Number(
                convertToEth(orders[0]?.price?.$numberDecimal)
              )}></input>


            <button
              className='btn-main mt-2 btn-placeABid'
              onClick={async () => {
                setIsBuyNowModal(false);
                if (currentUser === undefined || currentUser === "") {
                  setShowAlert("notConnected");
                  return;
                }
                const wCheck = WalletConditions();
                if (wCheck !== undefined) {
                  setShowAlert(wCheck);
                  return;
                }
                // setLoading(true);
                setMessage("buyNow");
                handleSetData()
                setIsShowPopup(true);
                let historyData = {
                  nftID: NFTDetails.id,
                  buyerID: localStorage.getItem('userId'),
                  sellerID: orders[0]?.sellerID,
                  action: "Sold",
                  price: orders[0]?.price?.$numberDecimal,
                  paymentToken: contracts[selectedTokenFS],
                  quantity: orders[0]?.total_quantity,
                  createdBy: localStorage.getItem("userId")
                }
                let res = await handleBuyNft(
                  orders[0]?._id,
                  firstOrderNFT.type === 1,
                  currentUser,
                  orders[0]?.total_quantity,
                  historyData
                );
                setLoading(false);
                setReloadContent(!reloadContent)
                // slowRefresh(1000);

              }}>
              {"Buy Now"}
            </button>
          </div>

        </div>
      }
      handleClose={() => {
        setIsBuyNowModal(!isBuyNowModal);
        setQty(1);
        setPrice("");
      }}
    />
  );


  const onClickHandler = async (button) => {
    const wCheck = WalletConditions();
    let res
    if (wCheck !== undefined) {
      setShowAlert(wCheck);
      return;
    }
    if (orders)

      try {
        setLoading(true);

        if (button === "Remove From Sale") {
          let historyData = {
            nftID: NFTDetails.id,
            sellerID: localStorage.getItem("userId"),
            action: "RemoveFromSale",
            price: orders[0]?.price?.$numberDecimal,
            paymentToken: orders[0]?.paymentToken,
            createdBy: localStorage.getItem("userId"),
          };
          res = await handleRemoveFromSale(orders[0]?._id, orders[0].signature, historyData);
          setReloadContent(!reloadContent)
        }
        else if (button === "Put On Marketplace") {
          closePopup();
          handleMpShow();
          setIsModal("active")
        }

        else if (button === "Buy Now") {
          closePopup();
          setIsBuyNowModal(true);

        }

        else if (button === "Place a Bid") {
          closePopup();
          refreshVariables();
          setIsPlaceBidModal(true);
        } else if (button === "Update Bid") {
          closePopup();
          setIsPlaceBidModal(true);
        }

        else if (button === "Make Offer") {
          refreshVariables();
          setIsMakeOffer("active")
        } else if (button === "Update Offer") {
          closePopup();
          setIsMakeOffer("active")
        }

        if (res === false) {
          setLoading(false);
          return;
        }
        setLoading(false);
        setReloadContent(!reloadContent)
      }
      catch (e) {
        console.log("Error", e);
        setLoading(false)
        return
      }
  }


  function handleSetData() {
    let msg = message;
    if (msg?.includes("putOnMarketplace")) {
      setData([{
        desc: "1. Approve Marketplace",
        event: marketplaceApproval
      }, {
        desc: "2. Put on Marketplace",
        event: sign
      }
      ])
    }
    if (msg?.includes("buyNow")) {
      setData([{
        desc: "1. Approve Payment Token",
        event: paymentTokenApproval

      },
      {
        desc: "2. Purchase NFT",
        event: transaction
      }
      ])
    }
    if (msg?.includes("placeBid")) {
      haveBid && haveBid !== "none" ?
        setData([{
          desc: "1. Cancel previous order",
          event: cancelOrder
        }, {
          desc: "2. Approve payment token",
          event: paymentTokenApproval
        }, {
          desc: "3. Place a Bid",
          event: sign
        }
        ]) :
        setData([{
          desc: "1. Approve payment token",
          event: paymentTokenApproval
        }, {
          desc: "2. Place a Bid",
          event: sign
        }
        ])
    }
    if (msg?.includes("makeOffer")) {
      buttons && buttons?.includes("Make Offer") ?
        setData([{
          desc: "1. Approve payment token",
          event: paymentTokenApproval
        }, {
          desc: "2. Make an Offer",
          event: sign
        }
        ]) : setData([{
          desc: "1. Cancel previous order",
          event: cancelOrder
        }, {
          desc: "1. Approve payment token",
          event: paymentTokenApproval
        }, {
          desc: "2. Make an Offer",
          event: sign
        }
        ])
    }
  }

  function txnStatus(msg) {
    if (msg?.includes("approval-initiated")) {
      setMarketplaceApproval("initiated");
    }
    if (msg?.includes("approval-succeeded")) {
      setMarketplaceApproval("success");
    }
    if (msg?.includes("sign-initiated")) {
      setSign("initiated");
    }
    if (msg?.includes("token-approval-initiated")) {
      setPaymentTokenApproval("initiated");
    }
    if (msg?.includes("token-approval-success")) {
      setPaymentTokenApproval("success")
    }
    if (msg?.includes("transaction-initiated")) {
      setTransaction("initiated")
    }
    if (msg?.includes("transaction-succeeded")) {
      setTransaction("success");
      setCloseDisabled(false);
      setTimeout(() => {
        closePopup();
        setIsShowPopup(false);
      }, 5000);
    }
    if (msg?.includes("sign-succeeded")) {
      setSign("success");
      setCloseDisabled(false);
      setTimeout(() => {
        closePopup();
        setIsShowPopup(false);
      }, 5000);
    }
    if (msg?.includes("cancel-initiated")) {
      setCancelOrder("initiated");
    }
    if (msg?.includes("cancel-succeeded")) {
      setCancelOrder("success");
    }

  }

  evt.removeAllListeners("txn-status", txnStatus);
  evt.on("txn-status", txnStatus);

  function txnError(msg) {
    if (msg?.includes("user-denied-cancel")) {
      setCancelOrder("fail");
      setCloseDisabled(false);
      NotificationManager.error("User Denied Transaction", "", NOTIFICATION_DELAY)
      return true;
    } else
      if (msg?.includes("user-denied-sign")) {
        setSign("fail")
        setCloseDisabled(false);
        NotificationManager.error("User Denied Signature", "", NOTIFICATION_DELAY)
        return true;
      } else if (msg?.includes("user-denied-approval")) {
        setMarketplaceApproval("fail")
        setCloseDisabled(false);
        NotificationManager.error("User Denied Approval", "", NOTIFICATION_DELAY)
        return true;
      } else if (msg?.includes("transaction-failed")) {
        setCancelOrder("fail");
        setMarketplaceApproval("fail")
        setSign("fail");
        setTransaction("fail")
        setPaymentTokenApproval("fail");
        setCloseDisabled(false);
        setTimeout(() => {
          closePopup();
          setIsShowPopup(false);
        }, 5000);
        // NotificationManager.error("Something went wrong", "")
        return true;
      } else if (msg?.includes("user-denied-token-approval")) {
        setPaymentTokenApproval("fail")
        setCloseDisabled(false);
        NotificationManager.error("User Denied Token Approval", "", NOTIFICATION_DELAY)
        return true;
      } else if (msg?.includes("user-denied-transaction")) {
        setTransaction("fail")
        setCloseDisabled(false);
        NotificationManager.error("User Denied Transaction", "", NOTIFICATION_DELAY)
        return true;
      }
      else {
        setCancelOrder("fail");
        setMarketplaceApproval("fail")
        setSign("fail");
        setTransaction("fail")
        setPaymentTokenApproval("fail");
        setCloseDisabled(false);
        setTimeout(() => {
          closePopup();
          setIsShowPopup(false);
        }, 5000);
        return true;
      }
  }


  evt.removeAllListeners("txn-error", txnError);
  evt.on("txn-error", txnError);

  const closePopup = () => {
    setCancelOrder("");
    setMarketplaceApproval("");
    setSign("");
    setCloseDisabled(true);
    setTransaction("");
    setPaymentTokenApproval("");
  }



  return (
    <div>


      {isShowPopup ? <ProgressModal datas={data}
        onRequestClose={() => {
          closePopup();
          setIsShowPopup(!isShowPopup)
        }}
        disabled={closeDisabled} /> : ""}
      {showAlert === "chainId" ? <PopupModal content={<div className='popup-content1'>
        <div className="model_data">
          <div className='bid_user_details mb-4'>
            <img src={Logo} alt='' />
            <div className='bid_user_address'>
              <div >
                <div className="mr-3 text-white">Required Network ID:</div>
                <span className="adr">
                  {process.env.REACT_APP_NETWORK_ID}
                </span>
              </div>
              <div >
                <div className="mr-3 text-white">Required Network Name:</div>
                <span className="adr">
                  {process.env.REACT_APP_NETWORK}
                </span>
              </div>
            </div>
          </div>
          <button
            className='btn-main mt-2 mb-1' onClick={async () => {
              const isSwitched = await onboard.setChain({
                chainId: process.env.REACT_APP_CHAIN_ID,
              });
              if (isSwitched)
                setShowAlert("");
            }}>
            {"Switch Network"}
          </button>
        </div>
      </div>} handleClose={() => { setShowAlert(!showAlert) }} /> :
        showAlert === "account" ? <PopupModal content={
          <div className="model_data">
            <div className='popup-content1'>
              <div className='bid_user_details mb-4'>
                <img src={Logo} alt='' />
                <div className='bid_user_address align-items-center'>
                  <div>
                    <span className="adr text-muted">
                      {currentUser}
                    </span>
                    <span className='badge badge-success'>Connected</span>
                  </div>
                  <h4 className="mb-3">Please switch to connected wallet address or click logout to continue with the current wallet address by disconnecting the already connected account.</h4>
                </div>

                <button
                  className='btn-main mt-2 mb-1' onClick={() => { evt.emit("disconnectWallet") }}>
                  {"Logout"}
                </button>
              </div>
            </div>
          </div>} handleClose={() => { setShowAlert(!showAlert) }} /> :
          showAlert === "locked" ? <PopupModal content={<div className='popup-content1'>
            <div className="model_data">
              <div className='bid_user_details mb-4'>
                <img src={Logo} alt='' />
                <div className='bid_user_address align-items-center'>
                  <div>
                    <span className="adr text-muted">
                      {currentUser}
                    </span>
                    <span className='badge badge-success'>Connected</span>
                  </div>
                </div>
                <h4 className="mb-3">Your wallet is locked. Please unlock your wallet and connect again.</h4>
              </div>
              <button
                className='btn-main mt-2 mb-1' onClick={() => {
                  evt.emit("disconnectWallet")
                }}>
                Connect Wallet
              </button>
            </div>
          </div>} handleClose={() => { setShowAlert(!showAlert) }} /> :
            showAlert === "notConnected" ? <PopupModal content={<div className='popup-content1'>
              <div className="model_data">
                <div className='bid_user_details my-4'>
                  <img src={Logo} alt='' />
                  <h4 className="mb-3">Please connect your wallet. </h4>
                </div>
                <button
                  className='btn-main mt-2 mb-1' onClick={() => {
                    setShowAlert("")
                    setIsMakeOffer(false);
                    setIsPlaceBidModal(false);
                    setIsBuyNowModal(false);
                    setIsModal("");
                    evt.emit("connectWallet")
                  }}>
                  Connect Wallet
                </button>
              </div>
            </div>} handleClose={() => { setShowAlert(!showAlert) }} /> : ""}


      {loading ? <Spinner /> : ""}
      {isPlaceBidModal ? placeBidModal : ""}
      {isBuyNowModal ? buyNowModal : ""}
      <section className="pdd_8 bgImgStyle">
        <div className="container">

          <div className="row mb-5">
            <div className="col-lg-6 mb-xl-5 mb-lg-5 mb-5 img_3d" >
              <div className="viewNFTImage">
                <a target="blank" className="viewAssets" href={`${process.env.REACT_APP_FILEVIEWER_URL}?url=${NFTDetails?.fileType === "3D" || NFTDetails?.fileType === "Video" ? NFTDetails?.animation_url : NFTDetails?.originalImage ? NFTDetails?.originalImage : NFTDetails?.image}&type=${NFTDetails?.fileType}`} alt="expanded-image"><i class="fa fa-expand" aria-hidden="true"></i></a>
              </div>
              {NFTDetails && NFTDetails.fileType === "Image" ? (
                <img
                  src={NFTDetails?.image ? NFTDetails?.image : ""}
                  className='img-fluid nftimg'
                  alt=''
                  onError={(e) => {
                    e.target.src = "../img/collections/list4.png";
                  }} />
              ) : (
                ""
              )}
              {NFTDetails && NFTDetails.fileType === "Video" ? (
                <video className="img-fluid nftimg" controls
                  muted
                  autoPlay={"autoplay"}
                  preload="auto"
                  loop
                >
                  <source src={NFTDetails?.animation_url} type="video/mp4" />
                </video>
              ) : (
                ""
              )}
              {NFTDetails && NFTDetails.fileType === "3D" ? (

                <model-viewer
                  alt=""
                  src={`${modalImage}`}
                  ar ar-modes="webxr scene-viewer quick-look"
                  poster={NFTDetails && NFTDetails.previewImg}
                  shadow-intensity="1"
                  camera-controls touch-action="pan-y"
                  enable-pan
                >

                </model-viewer>
              ) : (
                ""
              )}
            </div>

            <div className='col-lg-6 nft_details'>
              <a href={collection._id && collection._id !== undefined ? `/collection/${collection._id}` : ""}>
                <p className='mb-0'>

                  {collection?.name} Collection{" "}
                </p>
              </a>
              <div className="d-flex align-items-center justify-content-between">

                <h1 className='mb-3'>{NFTDetails?.name}</h1>
                <i onClick={async () => {
                  setActiveRefresh(true);
                  let data = await refreshNFTMeta({ nftID: NFTDetails.id })
                  NotificationManager.success("Refresh is in Queue, it may take few minutes", "", NOTIFICATION_DELAY)
                  setTimeout(() => {
                    setActiveRefresh(false);
                  }, 5000)
                }} className={`${activeRefresh ? "active" : ""} fa fa-refresh text-white`} aria-hidden="true"></i>
              </div>
              <div className='owner_by mb-4'>
                <p>
                  Owned by{" "}
                  <span style={textColor}>
                    {ownedBy ? ownedBy?.slice(0, 8) + "..." + ownedBy?.slice(34, 42) : ""}
                  </span>
                </p>

                <span className='add_wishlist'>
                  {/* <svg
                    width='24'
                    height='24'
                    viewBox='0 0 24 24'
                    fill='none'
                    xmlns='http://www.w3.org/2000/svg'>
                    <path
                      d='M21.6328 6.64689C21.3187 5.91947 20.8657 5.2603 20.2992 4.70626C19.7323 4.15058 19.064 3.70898 18.3305 3.40548C17.5699 3.08953 16.7541 2.92781 15.9305 2.9297C14.775 2.9297 13.6477 3.24611 12.668 3.84377C12.4336 3.98673 12.2109 4.14376 12 4.31486C11.7891 4.14376 11.5664 3.98673 11.332 3.84377C10.3523 3.24611 9.225 2.9297 8.06953 2.9297C7.2375 2.9297 6.43125 3.08908 5.66953 3.40548C4.93359 3.71017 4.27031 4.14845 3.70078 4.70626C3.13359 5.25967 2.6805 5.919 2.36719 6.64689C2.04141 7.40392 1.875 8.20782 1.875 9.03516C1.875 9.81563 2.03438 10.6289 2.35078 11.4563C2.61563 12.1477 2.99531 12.8648 3.48047 13.5891C4.24922 14.7352 5.30625 15.9305 6.61875 17.1422C8.79375 19.1508 10.9477 20.5383 11.0391 20.5945L11.5945 20.9508C11.8406 21.1078 12.157 21.1078 12.4031 20.9508L12.9586 20.5945C13.05 20.5359 15.2016 19.1508 17.3789 17.1422C18.6914 15.9305 19.7484 14.7352 20.5172 13.5891C21.0023 12.8648 21.3844 12.1477 21.6469 11.4563C21.9633 10.6289 22.1227 9.81563 22.1227 9.03516C22.125 8.20782 21.9586 7.40392 21.6328 6.64689Z'
                      fill='#9E9E9E'
                    />
                  </svg>{" "} */}
                  {/* {NFTDetails?.like} favourites */}
                </span>
              </div>
              {NFTDetails?.attributes?.length > 0 ? (
                <ul
                  className='nav nav-pills mb-4 w-100'
                  id='pills-tab'
                  role='tablist'>
                  <li className='nav-item w-100' role='presentation'>
                    <button
                      className='nav-link active details-btn '
                      id='pills-home-tab'
                      data-bs-toggle='pill'
                      data-bs-target='#pills-home'
                      type='button'
                      role='tab'
                      aria-controls='pills-home'
                      aria-selected='true'>
                      Details
                    </button>
                  </li>
                </ul>
              ) : (
                ""
              )}
              <div className='tab-content' id='pills-tabContent'>
                <div
                  className='tab-pane fade show active'
                  id='pills-home'
                  role='tabpanel'
                  aria-labelledby='pills-home-tab'>
                  <div className='row'>
                    {NFTDetails
                      ? NFTDetails?.attributes?.map((attr, key) => {
                        const rarity = attr?.rarity_percent ? (attr?.rarity_percent % 1 === 0 ? attr?.rarity_percent : attr?.rarity_percent?.toFixed(2)) : "";
                        return (
                          <div className='col-md-6 mb-4' key={key}>
                            <div className='tab_label'>
                              <div className='d-flex align-items-start flex-column'>
                                <p>{attr.trait_type}</p>
                                <span className='big_text'>{attr.value}</span>
                              </div>
                              {rarity ? (
                                <p>
                                  {rarity}% <span>has this trait</span>
                                </p>
                              ) : (
                                ""
                              )}
                            </div>
                            {rarity ? (
                              <div className='progress mt-2'>
                                <div
                                  className={`progress-bar w-${rarity}`}
                                  role='progressbar'
                                  aria-valuenow={rarity}
                                  aria-valuemin='0'
                                  aria-valuemax='100'
                                  style={{ width: `${rarity}%` }}
                                ></div>
                              </div>
                            ) : (
                              ""
                            )}

                          </div>
                        );
                      })
                      : ""}
                  </div>
                </div>
              </div>
              <div className="price_box">

                {orders?.length > 0 && orders !== "none" ? (
                  <>

                    <h4>{orders[0]?.salesType === 0 ? "Fixed Price" : "Minimum Bid Price"}</h4>
                    <div className='price_div d-flex justify-content-start align-items-baseline'>

                      <img
                        src={Tokens[orders[0]?.paymentToken]?.icon}
                        className='img-fluid hunter_fav'
                        alt=''
                      />
                     
                      {parseFloat(Number(convertToEth(orders[0]?.price?.$numberDecimal))?.toFixed(4)?.slice(0, -2))}{" "}
                      {Tokens[orders[0]?.paymentToken]?.symbolName}&nbsp;

                      {/* <span className="dollar_price text-muted">{"($" + `${dollar})`}</span> */}
                    </div>
                  </>
                ) : (
                  ""
                )}

                {orders !== "none" && buttons ? buttons?.map((b, i) => {

                  if ((b === "Place a Bid" || b === "Update Bid") && orders[0]?.deadline !== GENERAL_TIMESTAMP && moment.utc(orders[0]?.deadline * 1000).local().format() < moment(new Date()).format()) {
                    return (
                      ""
                    )
                  } else {
                    return (
                      <button type="button"
                        key={i}
                        onClick={() => {
                          onClickHandler(b)
                        }}
                        className="title_color buy_now">{b === "Put On Marketplace" ? "Put on Marketplace" : b}</button>
                    )
                  }
                }) : ""}
                <div className="d-none">

                  {orders?.length > 0 && orders !== "none" && orders[0]?.saleType !== 0 && orders[0]?.deadline !== GENERAL_TIMESTAMP && moment.utc(orders[0]?.deadline * 1000).local().format() > moment(new Date()).format() &&
                    <Clock
                      deadline={moment.utc(orders[0]?.deadline * 1000).local().format()}
                      fetch={() => setReloadContent(!reloadContent)}
                    ></Clock>
                  }
                </div>
              </div>
            </div>
          </div>
          <div className='row'>
            <div className='col-lg-6 mb-5 width_45 auto_right text-break'>
              <h3 className='title_36 mb-4'>Description</h3>
              <p className='textdes'>{NFTDetails?.desc} </p>
            </div>
            <div className='col-lg-6 mb-5 text-break'>
              <h3 className='title_36 mb-4 '>
                About {collection?.name} Collection
              </h3>
              <div className='row'>
                <div className='col-md-4 nftDetails_img_con'>
                  <img src={collection?.logoImage} alt='' className='img-fluid' />
                </div>
                <div className='col-md-8'>
                  <p className='textdes'>{collection?.description?.slice(0, 200)} {collection?.description?.length > 200 ? <> ... <button className="show-more" onClick={() => {
                    setIsDescription('active')
                  }}>Show More</button> </> : ""}</p>

                </div>
              </div>
            </div>

            <div className='col-lg-6 mb-5'>
              <h3 className='title_36 mb-4'>Blockchain Details</h3>
              <ul className='nft_detaillist'>
                <li>
                  <span className="asset_title">Contract Address</span>
                  <a href={`${process.env.REACT_APP_CONTRACT_ADD_URL + collection?.contractAddress}`} target="blank" >
                    <span className="asset_detail">
                      {collection?.contractAddress ? collection?.contractAddress?.slice(0, 4) +
                        "..." +
                        collection?.contractAddress?.slice(38, 42) : ""}
                    </span>
                  </a>
                </li>
                <li>
                  <span className='asset_title'>Token ID</span>
                  <span className='asset_detail'>{NFTDetails?.tokenId}</span>
                </li>
                <li>
                  <span className='asset_title'>Blockchain</span>
                  <span className='asset_detail'>Binance Smart Chain</span>
                </li>
              </ul>
            </div>
            {
              NFTDetails?.properties?.length > 0 ? <div className='col-lg-6 mb-5 width_45 auto_right'>
                <h3 className='title_36 mb-4'>Properties</h3>
                <ul className='nft_detaillist'>
                  {
                    NFTDetails?.properties?.map((props, i) => {
                      return <li key={i}>
                        <span className='asset_title'>{props.trait_type}</span>
                        <span className='asset_detail'>{props.value}</span>
                      </li>
                    })
                  }
                </ul>
              </div> : ""
            }

            {/* <div className='col-lg-6 mb-5'>
              <h3 className='title_36 mb-4'>Levels</h3>
              <ul className='nft_detailnumber'>
                <li>
                  <span>1</span>Generation
                </li>
                <li>
                  <span>3</span>PPM
                </li>
              </ul>
            </div> */}
            <div className='col-md-12 pb-5 mb-5 border-bottom-5'>
              <h3 className='title_36 mb-4'>Listings</h3>
              <NFTlisting id={NFTDetails.id} NftDetails={NFTDetails} reloadContent={reloadContent} refreshState={refreshState} />
            </div>

            <div className='col-md-12 pb-5 mb-5 border-bottom-5'>
              <h3 className='title_36 mb-4'>Bids</h3>
              <NFTBids id={NFTDetails.id} NftDetails={NFTDetails} reloadContent={reloadContent} refreshState={refreshState} />
            </div>
            <div className='col-md-12 pb-5 mb-5 border-bottom-5'>
              <h3 className='title_36 mb-4'>Offers</h3>

              <NFToffer
                id={NFTDetails.id}
                NftDetails={NFTDetails}
                collectionAddress={collection?.contractAddress}
                reloadContent={reloadContent}
                refreshState={refreshState}
              />
            </div>
            <div className="col-md-12 pb-5 mb-5">
              <h3 className="title_36 mb-4">History</h3>

              <NFThistory nftID={NFTDetails.id} reloadContent={reloadContent} />

            </div>
            {allNFTs.length > 1 ? (
              <>
                <div className='col-md-12 '>
                  <h3 className='title_36 mb-4'>
                    More from {collection?.name} Collection
                  </h3>
                  <FirearmsCollection
                    nfts={allNFTs}
                    currNFTID={NFTDetails?.id}
                    collectionName={collection?.name}
                  />
                </div>
                {allNFTs.length > 5 ? (
                  <div className="col-md-12 text-center mt-5">
                    <a
                      className='view_all_bdr'
                      href={`/collection/${collection?._id}`}>
                      View All
                    </a>
                  </div>
                ) : (
                  ""
                )}
              </>
            ) : (
              ""
            )}
          </div>
        </div>
      </section >

      {/* <!-- The Modal --> */}
      < div className={`modal marketplace putOnMarketplace ${isModal}`
      } id='detailPop' >
        <div className='modal-dialog modal-lg modal-dialog-centered'>
          <div className='modal-content'>
            {/* <!-- Modal Header --> */}
            <div className='modal-header p-4'>
              <h4 className='text-light title_20 mb-0'>Put on Marketplace</h4>
              <button
                type='button'
                className='btn-close text-light'
                // data-bs-dismiss='modal'
                onClick={() => {
                  refreshVariables();
                  setIsModal("")
                }}
              ></button>
            </div>
            {/* <!-- Modal body --> */}
            <div className='modal-body'>
              <h3 className='text-light text_16'>Select method</h3>
              <ul
                className='d-flex mb-4 justify-content-around g-3'
                id='pills-tab'
                role='tablist'>
                <li className='list-unstyled'>
                  <button
                    id='btn1'
                    className='navbtn active'
                    type='button'
                    onClick={handleMpShow}>
                    <i className='fa fa-tag'></i>
                    <span className='title_20 d-block'>Fixed price</span>
                  </button>
                </li>
                <li className='list-unstyled'>
                  <button
                    id='btn2'
                    className='navbtn'
                    type='button'
                    onClick={handleMpShow1}>
                    <i className='fa fa-hourglass-1'></i>
                    <span className='title_20 d-block'>Timed auction</span>
                  </button>
                </li>
                <li className='list-unstyled'>
                  <button
                    id='btn3'
                    className='navbtn'
                    type='button'
                    onClick={handleMpShow2}>
                    <i className='fa fa-users'></i>
                    <span className='title_20 d-block'>Open for bids</span>
                  </button>
                </li>
              </ul>

              <div className="tab-content">
                <div className="mb-3" id="tab_opt_1">
                  <label htmlFor="item_price" className="form-label">
                    Price
                  </label>
                  <input
                    type='text'
                    name='item_price'
                    id='item_price'
                    min='0'
                    max='18'
                    autoComplete="off"
                    className='form-control input_design'
                    placeholder='Please Enter Price (BUSD)'
                    value={itemprice}
                    onKeyPress={(e) => {
                      if (itemprice.length > 19) e.preventDefault();
                    }}
                    onChange={(e) => {
                      const re = /^\d*\.?\d*$/;
                      let val = e.target.value;
                      if (e.target.value === "" || re.test(e.target.value)) {
                        setItemprice(val);

                      }
                    }}
                  />
                </div>
                <div className='mb-3' id='tab_opt_2'>
                  <label htmlFor='item_qt' className='form-label'>
                    Quantity
                  </label>
                  <input
                    type="text"
                    name="item_qt"
                    id="item_qt"
                    autoComplete="off"
                    min="1"
                    disabled={NFTDetails.type === 1 ? "disabled" : ""}
                    className="form-control input_design"
                    placeholder="Please Enter Quantity"
                    value={item_qt}
                    onChange={(event) => {
                      if (
                        NFTDetails.type !== 1 &&
                        event.target.value > NFTDetails?.totalQuantity
                      ) {
                        NotificationManager.error(
                          "Quantity must be less than or equal to Total Quantity", "", NOTIFICATION_DELAY

                        );
                        return;
                      }
                      setItem_qt(event.target.value);
                    }}
                  />
                </div>
                <div id='tab_opt_3' className='mb-3 put_hide'>
                  <label htmlFor='item_bid' className='form-label'>
                    Minimum bid
                  </label>
                  <input
                    type='text'
                    name='item_bid'
                    id='item_bid'
                    min='0'
                    max='18'
                    autoComplete="off"
                    className='form-control input_design'
                    placeholder='Enter Minimum Bid'
                    value={item_bid}
                    onKeyPress={(e) => {
                      if (item_bid.length > 19) e.preventDefault();
                    }}
                    onChange={(e) => {
                      const re = /^\d*\.?\d*$/;
                      let val = e.target.value;
                      if (e.target.value === "" || re.test(e.target.value)) {

                        setItem_bid(val);
                        setItemprice(val);
                      }
                    }}
                  />
                </div>

                <div id='tab_opt_4' className='mb-3'>
                  <label htmlFor='Payment' className='form-label'>
                    Payment Token
                  </label>
                  {marketplaceSaleType === 0 ? (
                    <>
                      <select
                        className='form-select input_design select_bg'
                        name='BUSD'
                        value={selectedTokenFS}
                        onChange={(event) => {
                          event.preventDefault();
                          event.persist();
                          setSelectedTokenFS(event.target.value);
                        }}>
                        {" "}
                        <option value={"BUSD"} defaultValue>
                          BUSD
                        </option>
                      </select>
                    </>
                  ) : marketplaceSaleType === 1 ? (
                    <>
                      <select
                        className='form-select input_design select_bg'
                        name='BUSD'
                        value={selectedToken}
                        onChange={(event) =>
                          setSelectedToken(event.target.value)
                        }>
                        {" "}
                        <option value={"BUSD"} defaultValue>
                          BUSD
                        </option>
                      </select>
                    </>
                  ) : (
                    <>
                      <select
                        className='form-select input_design select_bg'
                        name='BUSD'
                        value={selectedToken}
                        onChange={(event) =>
                          setSelectedToken(event.target.value)
                        }>
                        <option value={"BUSD"} selected>
                          BUSD
                        </option>
                      </select>
                    </>
                  )}
                </div>

                <div id="tab_opt_5" className="mb-3">
                  <label for="item_ex_date" className="form-label">
                    Expiration date
                  </label>
                  <MuiPickersUtilsProvider utils={DateMomentUtils} className="text-white ">
                    <DateTimePicker autoOk
                      disablePast
                      className='input_design'
                      onChange={handleDateChange}
                      value={selectedDate}
                      defaultValue={(new Date())}
                      placeholder="Select a Date"
                      clearable />
                  </MuiPickersUtilsProvider>

                </div>
                <div className='mt-5 mb-3 text-center'>
                  <button
                    type='button'
                    className='square_yello'
                    data-bs-dismiss="modal"
                    href='/mintcollectionlive'
                    onClick={() => {
                      PutMarketplace()
                    }}>
                    Put on Marketplace
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div >

      {/*Bid/Offer Modal*/}
      < div className={`modal marketplace makeOffer ${isMakeOffer}`} id='makeOfferModal' >
        <div className='modal-dialog modal-lg modal-dialog-centered'>
          <div className='modal-content'>
            {/* <!-- Modal Header --> */}
            <div className='modal-header p-4'>
              <h4 className='text-light title_20 mb-0'>Make an Offer</h4>
              <button
                type='button'
                className='btn-close text-light'
                onClick={() => {
                  refreshVariables();
                  setIsMakeOffer("")
                }}></button>
            </div>

            {/* <!-- Modal body --> */}
            <div className='modal-body'>
              <div className='tab-content'>
                <div className='mb-3'>
                  <label htmlFor='item_price' className='form-label'>
                    Offer Price
                  </label>
                  <input
                    type='text'
                    name='item_price'
                    id='item_price'
                    min='0'
                    max='18'
                    className='form-control input_design'
                    placeholder='Please Enter Price'
                    autoComplete="off"
                    value={offerPrice}
                    onKeyPress={(e) => {
                      if (offerPrice.length > 19) e.preventDefault();
                    }}
                    onChange={(e) => {
                      const re = /^\d*\.?\d*$/;
                      let val = e.target.value;
                      if (e.target.value === "" || re.test(e.target.value)) {

                        setOfferPrice(val);
                      }
                    }}
                  />
                </div>
                <div className='mb-3' >
                  <label htmlFor='item_qt' className='form-label'>
                    Quantity
                  </label>
                  <input
                    type="text"
                    name="item_qt"
                    id="item_qt"
                    min="1"
                    disabled={NFTDetails.type === 1 ? true : false}
                    className="form-control input_design"
                    placeholder="Please Enter Quantity"
                    autoComplete="off"
                    value={offerQuantity}
                    onChange={(event) => {
                      if (NFTDetails.type === 1 && event.target.value > 1) {
                        setOfferQuantity(1);
                        NotificationManager.error(
                          "Quantity must be 1", "", NOTIFICATION_DELAY
                        );
                      }
                      if (
                        NFTDetails.type !== 1 &&
                        event.target.value > NFTDetails?.totalQuantity
                      ) {
                        NotificationManager.error(
                          "Quantity must be less than or equal to Total Quantity", "", NOTIFICATION_DELAY

                        );
                        return;
                      }
                    }}
                  />
                </div>
                <div className='mb-3'>
                  <label htmlFor='Payment' className='form-label'>
                    Payment Token
                  </label>

                  {marketplaceSaleType === 0 ? (
                    <>
                      <select
                        className='form-select input_design select_bg'
                        name='BUSD'
                        value={selectedTokenFS}
                        onChange={(event) => {
                          event.preventDefault();
                          event.persist();
                          setSelectedTokenFS(event.target.value);
                        }}>

                        <option value={"BUSD"}>BUSD</option>
                      </select>
                    </>
                  ) : marketplaceSaleType === 1 ? (
                    <>
                      <select
                        className='form-select input_design select_bg'
                        name='BUSD'
                        value={selectedToken}
                        onChange={(event) =>
                          setSelectedToken(event.target.value)
                        }>
                        {" "}
                        <option value={"BUSD"} defaultValue>
                          BUSD
                        </option>
                      </select>
                    </>
                  ) : (
                    <>
                      <select
                        className='form-select input_design select_bg'
                        name='BUSD'
                        value={selectedToken}
                        onChange={(event) =>
                          setSelectedToken(event.target.value)
                        }>
                        <option value={"BUSD"} selected>
                          BUSD
                        </option>
                      </select>
                    </>
                  )}
                </div>

                <div className='mb-3 '>
                  <label htmlFor='item_ex_date' className='form-label'>
                    Expiration date
                  </label>
                  <MuiPickersUtilsProvider utils={DateMomentUtils} className="text-white ">
                    <DateTimePicker autoOk
                      disablePast
                      className='input_design'
                      onChange={handleDateChange}
                      value={selectedDate}
                      defaultValue={new Date()}
                      placeholder="Select a Date"
                      clearable

                    />
                  </MuiPickersUtilsProvider>

                </div>
                <div className='mt-5 mb-3 text-center'>
                  <button
                    type="button"
                    className="square_yello"
                    onClick={PlaceOffer}
                  >
                    {buttons && buttons?.includes("Make Offer") ? "Make Offer" : "Update Offer"}
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div >
      {/*Bid/Offer Modal Ends*/}

      {/*Description Modal*/}
      < div className={`modal marketplace makeOffer ${isDescription}`} id='makeOfferModal' >
        <div className='modal-dialog modal-lg modal-dialog-centered'>
          <div className='modal-content'>
            {/* <!-- Modal Header --> */}
            <div className='modal-header p-4'>
              <h4 className='text-light title_20 mb-0'>{collection?.name} Collection's Description</h4>
              <button
                type='button'
                className='btn-close text-light'
                onClick={() => {
                  setIsDescription("")
                }}></button>
            </div>

            {/* <!-- Modal body --> */}
            <div className='modal-body'>
              <div className='tab-content'>

                <p className="textdes">{collection?.description}</p>
              </div>
            </div>
          </div>
        </div>
      </div >
      {/*Bid/Offer Modal Ends*/}
      < Footer />
    </div >
  );
}
export default NFTDetails