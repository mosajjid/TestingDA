import React, { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { getOrderByNftID } from "../../helpers/getterFunctions";
import { useCookies } from "react-cookie";
import { convertToEth } from "../../helpers/numberFormatter";
import moment from "moment";
import {
  createBid,
  handleBuyNft,
  handleRemoveFromSale,
} from "../../helpers/sendFunctions";
import PopupModal from "../components/AccountModal/popupModal";
import Logo from "../../assets/images/logo.svg";
import Clock from "./Clock";
import { GENERAL_TIMESTAMP, NOTIFICATION_DELAY } from "../../helpers/constants";
import { Tokens } from "../../helpers/tokensToSymbol";
import { ethers } from "ethers";
import Spinner from "./Spinner";
import { slowRefresh } from "../../helpers/NotifyStatus";
import { fetchBidNft } from "../../apiServices";
import { InsertHistory } from "./../../apiServices";
import evt from "./../../events/events";
import { onboard } from "../menu/header";
import { WalletConditions } from "../components/WalletConditions";
import { getUsersTokenBalance } from "../../helpers/getterFunctions";
import contracts from "../../config/contracts";
import ProgressModal from "./AccountModal/ProgressModal";
import LoadingSpinner from "../components/Loader";
import { NotificationManager } from "react-notifications";
import BigNumber from "bignumber.js";


evt.setMaxListeners(1);
function NFTlisting(props) {
  const [orders, setOrders] = useState("none");
  const [currentUser, setCurrentUser] = useState("");
  const [cookies] = useCookies([]);
  const [qty, setQty] = useState(1);
  const [price, setPrice] = useState(0);
  const [willPay, setWillPay] = useState(0);
  const [isBuyNowModal, setIsBuyNowModal] = useState(false);
  const [isPlaceBidModal, setIsPlaceBidModal] = useState(false);
  const [currentOrder, setCurrentOrder] = useState([]);
  const [loading, setLoading] = useState(false);
  const [haveBid, setHaveBid] = useState(false);
  const [showAlert, setShowAlert] = useState("");
  const [isShowPopup, setIsShowPopup] = useState(false);
  const [closeDisabled, setCloseDisabled] = useState(true);
  const [marketplaceApproval, setMarketplaceApproval] = useState("");
  const [paymentTokenApproval, setPaymentTokenApproval] = useState("");
  const [sign, setSign] = useState("");
  const [transaction, setTransaction] = useState("")
  const [data, setData] = useState([]);
  const [message, setMessage] = useState("");
  const [contentLoader, setContentLoader] = useState(false);


  useEffect(() => {
    const fetch = async () => {

      handleSetData();
    }
    fetch()
  }, [message, marketplaceApproval, sign, paymentTokenApproval, transaction])

  useEffect(() => {
    if (cookies.selected_account) {
      setCurrentUser(cookies.selected_account);
      // setUserBalance(cookies.balance);
    }
  }, [cookies.selected_account]);

  // useEffect(() => {
  //   if (props.id)
  //     fetch();
  // }, [props.id, props.refreshState]);

  const fetch = async () => {

    if (props.id) {
      const _orders = await getOrderByNftID({ nftID: props.id });
      setOrders(_orders?.results);
      let searchParams = {
        nftID: props.id,
        buyerID: localStorage.getItem("userId"),
        bidStatus: "All",
        orderID: "All",
      };

      let _data = await fetchBidNft(searchParams);

      if (_data && _data.data.length > 0) {
        setHaveBid(true);
      }
    }
    setContentLoader(false);
  };

  useEffect(() => {
    setContentLoader(true);
    fetch()
  }, [props.id, props.reloadContent]);



  useEffect(() => {
    var body = document.body;
    if (loading || isPlaceBidModal || isBuyNowModal) {
      body.classList.add("overflow_hidden");
    } else {
      body.classList.remove("overflow_hidden");
    }
  }, [loading, isPlaceBidModal, isBuyNowModal]);

  // Place Bid Checkout Modal

  const placeBidModal = (
    <PopupModal
      content={
        <div className='popup-content1'>

          <div className="modal_heading p-4">
            <h4 className='text-light title_20 mb-0'>Complete Checkout</h4>
          </div>
          <div className="model_data">
            <div className='bid_user_details mb-4'>
              <img src={Logo} alt='' />
              <div className='bid_user_address'>
                <div>
                  <span className='adr'>
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
                  src={Tokens[currentOrder?.paymentToken]?.icon}
                  className='img-fluid min_bid_tkn'
                  alt=''
                />
                <span>{Number(convertToEth(currentOrder?.price?.$numberDecimal))?.toFixed(4)?.slice(0, -2)}{" "}</span>
                <span>{Tokens[currentOrder?.paymentToken]?.symbolName}</span>
              </span>
            </div>

            <label className='required form-label'>
              Please Enter the Bid Quantity
            </label>
            <input
              className='form-control input_design mb-3'
              type='text'
              min='1'
              step='1'
              placeholder='Quantity e.g. 1,2,3...'
              disabled={props ? props.NftDetails.type === 1 : false}
              value={qty}
              onKeyPress={(e) => {
                if (!/^\d*$/.test(e.key)) e.preventDefault();
              }}
              onChange={(e) => {
                if (Number(e.target.value) > Number(100)) {
                  NotificationManager.error(
                    "Quantity Should be less than Seller's Order", "", NOTIFICATION_DELAY
                  );
                  return;
                }
                setQty(e.target.value);
                setWillPay((e.target.value * price).toFixed(2));
              }}></input>
            <label className='form-label required'>
              Please Enter the Bid Price
            </label>
            <input
              className='form-control input_design'
              type='text'
              min='1'
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
              }}></input>
            <button
              className='btn-main mt-3 btn-placeABid'
              onClick={async () => {

                const wCheck = WalletConditions();
                if (wCheck !== undefined) {
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
                  Number(convertToEth(currentOrder.price?.$numberDecimal))
                ) {
                  NotificationManager.error(
                    `Bid Price must be Greater than ${Number(convertToEth(currentOrder.price?.$numberDecimal))} BUSD`, "", NOTIFICATION_DELAY
                  );
                  setIsPlaceBidModal(true);

                  return;
                }
                // setLoading(true);
                setIsPlaceBidModal(false);
                setMessage("placeBid");
                handleSetData();
                setIsShowPopup(true);
                try {
                  const res = await createBid(
                    currentOrder.nftID,
                    currentOrder._id,
                    currentOrder.sellerID?._id,
                    currentUser,
                    props?.NftDetails?.type,
                    currentOrder.total_quantity,
                    ethers.utils.parseEther(price.toString()),
                    false
                    // new Date(deadline).valueOf() / 1000
                  );
                  if (res !== false && res !== undefined) {
                    let historyReqData = {
                      nftID: currentOrder.nftID,
                      buyerID: localStorage.getItem('userId'),
                      sellerID: currentOrder.sellerID?._id,
                      action: "Bid",
                      type: haveBid && haveBid !== "none" ? "Updated" : "Created",
                      price: ethers.utils.parseEther(price.toString()).toString(),
                      paymentToken: currentOrder?.paymentToken,
                      quantity: qty,
                      createdBy: localStorage.getItem("userId"),
                    };
                    await InsertHistory(historyReqData);
                    NotificationManager.success("Bid Placed Successfully", "", NOTIFICATION_DELAY);
                    setLoading(false);
                    await props.refreshState()
                    await fetch()
                    // slowRefresh(1000);
                  } else {
                    setLoading(false);
                    return;
                  }
                  // await props.refreshState()
                  // await fetch()
                  // await props.refreshState()
                  // await fetch()
                } catch (e) {
                  NotificationManager.error("Something Went Wrong", "", NOTIFICATION_DELAY);
                }
              }}>
              {"Place Bid"}
            </button>
          </div>
        </div>
      }
      handleClose={() => {
        setIsPlaceBidModal(!isPlaceBidModal);
        setQty(1);
        setPrice("");
        setWillPay(0);
        closePopup()
      }}
    />
  );

  // Buy Now Checkout Modal

  const buyNowModal = (
    <PopupModal
      content={
        <div className='popup-content1'>
          <div className="modal_heading p-4">
            <h4 className='text-light title_20 mb-0'>Complete Checkout</h4>
          </div>
          <div className="model_data">
            <div className='bid_user_details mb-4'>
              <img src={Logo} alt='' />
              <div className='bid_user_address'>
                <div>
                  <span className='adr'>
                    {currentUser?.slice(0, 8) +
                      "..." +
                      currentUser?.slice(34, 42)}
                  </span>
                  <span className='badge badge-success'>Connected</span>
                </div>
                <span className='pgn'>Binance</span>
              </div>
            </div>

            <label className='form-label required'>
              Please Enter the Quantity
            </label>
            <input
              className='form-control input_design'
              type='text'
              min='1'
              step='1'
              placeholder='Quantity e.g. 1,2,3...'
              disabled={props ? props.NftDetails.type === 1 : false}
              value={qty}
              onKeyPress={(e) => {
                if (!/^\d*$/.test(e.key)) e.preventDefault();
              }}
              onChange={(e) => {
                if (
                  Number(e.target.value) > Number(currentOrder.total_quantity)
                ) {
                  NotificationManager.error(
                    "Quantity Should be less than Seller's Order", "", NOTIFICATION_DELAY
                  );
                  return;

                }
                setQty(e.target.value);
                setWillPay((e.target.value * price).toFixed(2));
              }}></input>
            <label className='form-label required'>Price</label>
            <input
              className='form-control input_design'
              type='text'
              min='1'
              placeholder='Price e.g. 0.001,1...'
              disabled={true}
              value={price}></input>
            <button
              className='btn-main mt-2 btn-placeABid'
              onClick={async () => {
                setIsBuyNowModal(false);
                const wCheck = WalletConditions();
                if (wCheck !== undefined) {
                  setShowAlert(wCheck);
                  return;
                }
                // setLoading(true);
                setMessage("buyNow");
                handleSetData()
                setIsShowPopup(true);
                try {

                  let historyData = {
                    nftID: currentOrder.nftID,
                    buyerID: localStorage.getItem('userId'),
                    sellerID: currentOrder?.sellerID?._id,
                    action: "Sold",
                    price: ethers.utils.parseEther(price.toString()).toString(),
                    paymentToken: currentOrder?.paymentToken,
                    quantity: currentOrder?.total_quantity,
                    createdBy: localStorage.getItem("userId"),
                  };
                  const hbn = await handleBuyNft(
                    currentOrder._id,
                    props?.NftDetails?.type === 1,
                    currentUser,
                    currentOrder.total_quantity,
                    historyData
                  );
                  setLoading(false)
                  await props.refreshState()
                  await fetch()
                  // if (hbn !== false && hbn !== undefined) {
                  //   // await fetch()
                  //   slowRefresh(1000);
                  //   setLoading(false);

                  // }
                  // else {
                  //   setLoading(false);

                  //   return;
                  // }

                  // await fetch()
                  // await props.refreshState()

                }
                catch (e) {
                  console.log("Error", e)
                }

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
        setWillPay(0);
        closePopup()
      }}
    />
  );


  function handleSetData() {

    let msg = message;
    if (msg.includes("buyNow")) {
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
    if (msg.includes("placeBid")) {
      setData([{
        desc: "Approve payment token",
        event: paymentTokenApproval
      }, {
        desc: "Place a Bid",
        event: sign
      }
      ])
    }

  }

  function txnStatus(msg) {
    if (msg.includes("approval-initiated")) {
      setMarketplaceApproval("initiated");
    }
    if (msg.includes("approval-succeeded")) {
      setMarketplaceApproval("success");
    }
    if (msg.includes("sign-initiated")) {
      setSign("initiated");
    }
    if (msg.includes("token-approval-initiated")) {
      setPaymentTokenApproval("initiated");
    }
    if (msg.includes("token-approval-success")) {
      setPaymentTokenApproval("success")
    }
    if (msg.includes("transaction-initiated")) {
      setTransaction("initiated")
    }
    if (msg.includes("transaction-succeeded")) {
      setTransaction("success");
      setCloseDisabled(false);
      setTimeout(() => {
        closePopup();
        setIsShowPopup(false);
      }, 5000);
    }
    if (msg.includes("sign-succeeded")) {
      setSign("success");
      setCloseDisabled(false);
      setTimeout(() => {
        closePopup();
        setIsShowPopup(false);
      }, 5000);
    }

  }

  // evt.removeAllListeners("txn-status", txnStatus);
  evt.on("txn-status", txnStatus);

  function txnError(msg) {
    if (msg.includes("user-denied-sign")) {
      setSign("fail")
      setCloseDisabled(false);
      return true;
    } else if (msg.includes("user-denied-approval")) {
      setMarketplaceApproval("fail")
      setCloseDisabled(false);
      return true;
    } else if (msg.includes("transaction-failed")) {
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
    } else if (msg.includes("user-denied-token-approval")) {
      setPaymentTokenApproval("fail")
      setCloseDisabled(false);
      return true;
    } else if (msg.includes("user-denied-transaction")) {
      setTransaction("fail")
      setCloseDisabled(false);
      return true;
    } else {
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


  // evt.removeAllListeners("txn-error", txnError);
  evt.on("txn-error", txnError);

  const closePopup = () => {
    setMarketplaceApproval("");
    setSign("");
    setCloseDisabled(true);
    setTransaction("");
    setPaymentTokenApproval("");
  }
  return (
    <div className='row'>
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
          <div className='popup-content1'>
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
          </div>} handleClose={() => { setShowAlert(!showAlert) }} /> : showAlert === "notConnected" ? <PopupModal content={<div className='popup-content1'>
            <div className="model_data">
              <div className='bid_user_details mb-4'>
                <img src={Logo} alt='' />
                <h4 className="mb-3">Please connect your wallet. </h4>
              </div>
              <button
                className='btn-main mt-2 mb-1' onClick={() => {
                  setShowAlert("")
                  evt.emit("connectWallet")
                }}>
                Connect Wallet
              </button>
            </div>
          </div>} handleClose={() => { setShowAlert(!showAlert) }} /> : ""}

      {loading ? <Spinner /> : ""}
      {isPlaceBidModal ? placeBidModal : ""}
      {isBuyNowModal ? buyNowModal : ""}
      {
        contentLoader || orders === "none" ? <LoadingSpinner /> : (orders !== "none" && orders && orders?.length <= 0 && !contentLoader && props.id !== undefined) ?
          <div className='col-md-12'>
            <h4 className='no_data_text text-muted'>
              No Listings Available
            </h4>
          </div> : ""
      }
      {orders !== "none" &&
        orders && orders.length > 0 ?
        <div className='table-responsive'>
          <div className='col-md-12'>
            <div className='nft_list'>
              <table className='table text-light'>
                <thead>
                  <tr>
                    <th scope='col'>FROM</th>
                    <th scope='col'>PRICE</th>
                    <th scope='col'>DATE</th>
                    <th scope='col'>SALE TYPE</th>
                    <th scope='col'>ENDS IN</th>
                    <th scope='col'>STATUS</th>
                    <th className='text-center'>ACTION</th>
                  </tr>
                </thead>
                <tbody>
                  {orders !== "none" && orders && orders.length > 0
                    ? orders?.map((o, i) => {

                      return (
                        <tr key={i}>
                          <td className="d-flex justify-content-start align-items-center mb-0">
                            <span className="yellow_dot circle_dot"></span>
                            <span>
                              {o.sellerID && o.sellerID.walletAddress
                                ? o.sellerID.walletAddress.slice(0, 4) +
                                "..." +
                                o.sellerID.walletAddress.slice(38, 42)
                                : ""}
                            </span>
                          </td>
                          <td>
                            <img
                              alt=""
                              src={Tokens[o.paymentToken.toLowerCase()].icon}
                              className="img-fluid hunter_fav"
                            />{" "}
                            {o.price && o.price.$numberDecimal
                              ? parseFloat(Number(convertToEth(o.price.$numberDecimal))
                                ?.toFixed(4)
                                ?.slice(0, -2))
                              : "0"}{" "}
                            {Tokens[o.paymentToken.toLowerCase()].symbolName}
                          </td>
                          <td>
                            {moment(o.createdOn).format("DD/MM/YYYY")}{" "}&nbsp;
                            <span className="nft_time">
                              {moment(o.createdOn).format("hh:mm A")}
                            </span>
                          </td>
                          <td>
                            {o.salesType === 0
                              ? "Fixed Sale"
                              : o.salesType === 1 && o.deadline !== GENERAL_TIMESTAMP
                                ? "Auction"
                                : "Open for Bids"}
                          </td>
                          <td>

                            {moment.utc(o.deadline * 1000).local().format() < moment(new Date()).format() || o.deadline >= GENERAL_TIMESTAMP ? (
                              "--:--:--"
                            ) : (

                              <Clock
                                deadline={moment.utc(o.deadline * 1000).local().format()}
                                fetch={fetch}
                              ></Clock>
                            )}
                          </td>
                          <td className={moment.utc(o.deadline * 1000).local().format() > moment(new Date()).format()
                            ? "green_text"
                            : "red_text"}>
                            {moment.utc(o.deadline * 1000).local().format() > moment(new Date()).format()
                              ? "Active"
                              : "Ended"}
                          </td>
                          <td>
                            <div className="text-center">
                              {(o.sellerID?.walletAddress?.toLowerCase() ===
                                currentUser?.toLowerCase() ? (
                                <button
                                  to={"/"}
                                  className="small_yellow_btn small_btn mr-3"
                                  onClick={async () => {
                                    setLoading(true);
                                    const wCheck = WalletConditions();
                                    if (wCheck !== undefined) {
                                      setLoading(false);
                                      setShowAlert(wCheck);
                                      return;
                                    }

                                    let historyData = {
                                      nftID: o?.nftID,
                                      sellerID: localStorage.getItem("userId"),
                                      action: "RemoveFromSale",
                                      price: o?.price?.$numberDecimal,
                                      paymentToken: o?.paymentToken,
                                      createdBy: localStorage.getItem("userId"),
                                    };
                                    await handleRemoveFromSale(o._id, o.signature, historyData);



                                    setLoading(false);
                                    await props.refreshState()
                                    await fetch()
                                    // slowRefresh(1000)
                                    // await props.refreshState()
                                  }}
                                >
                                  Remove From Sale
                                </button>
                              ) : (

                                o?.salesType === 0 || (o?.salesType === 1 && !haveBid) ?
                                  moment.utc(o?.deadline * 1000).local().format() > moment(new Date()).format() ?
                                    <button
                                      to={"/"}

                                      className="small_border_btn small_btn"
                                      onClick={async () => {
                                        closePopup();
                                        const wCheck = WalletConditions();
                                        if (wCheck !== undefined) {
                                          setShowAlert(wCheck);
                                          return;
                                        }
                                        if (
                                          moment.utc(o?.deadline * 1000).local().format() < moment(new Date()).format()
                                        ) {
                                          NotificationManager.error(
                                            "Auction Ended", "", NOTIFICATION_DELAY
                                          );
                                          return;
                                        }
                                        if (currentUser) {
                                          o.salesType === 0
                                            ? setPrice(
                                              Number(
                                                convertToEth(o.price.$numberDecimal)
                                              ).toFixed(2)
                                            )
                                            : setPrice("");
                                          props.NftDetails.type === 1 &&
                                            setCurrentOrder(o);
                                          o.salesType === 0
                                            ? setIsBuyNowModal(true)
                                            : setIsPlaceBidModal(true);
                                        } else {
                                          NotificationManager.error(
                                            "Wallet not Connected", "", NOTIFICATION_DELAY
                                          );
                                          return;
                                        }
                                      }}
                                    >
                                      {o.salesType === 0
                                        ? "Buy Now"
                                        : !haveBid
                                          ? "Place a Bid"
                                          : ""}
                                    </button> : "" : ""

                              ))}
                            </div>
                          </td>
                        </tr>
                      );
                    })
                    : ""}
                </tbody>
              </table>
            </div>
          </div>
        </div> : ""
      }

    </div>
  );
}

export default NFTlisting;