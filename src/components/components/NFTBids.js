import React, { useEffect, useState } from "react";
import { useCookies } from "react-cookie";
import { checkOfferBid, fetchBidNft } from "../../apiServices";
import { convertToEth } from "../../helpers/numberFormatter";
import moment from "moment";
import {
  createBid,
  handleAcceptBids,
  handleCancelOrder,
  handleUpdateBidStatus,
} from "../../helpers/sendFunctions";
import Clock from "./Clock";
import { Tokens } from "../../helpers/tokensToSymbol";
import PopupModal from "../components/AccountModal/popupModal";
import Logo from "../../assets/images/logo.svg";
import { slowRefresh } from "../../helpers/NotifyStatus";
import { ethers } from "ethers";
import Spinner from "./Spinner";
import { InsertHistory } from "./../../apiServices";
import { GENERAL_TIMESTAMP, NOTIFICATION_DELAY } from "../../helpers/constants";
import evt from "./../../events/events";
import { onboard } from "../menu/header";
import { WalletConditions } from "../components/WalletConditions";
import ProgressModal from "./AccountModal/ProgressModal";
import { isEmptyObject } from "jquery";
import LoadingSpinner from "../components/Loader";
import { NotificationManager } from "react-notifications";


evt.setMaxListeners(1);
function NFTBids(props) {
  const [currentUser, setCurrentUser] = useState("");
  const [cookies] = useCookies([]);
  const [bids, setBids] = useState("none");
  const [qty, setQty] = useState(1);
  const [price, setPrice] = useState(0);
  const [loading, setLoading] = useState(false);
  const [isUpdateBidModal, setIsUpdateBidModal] = useState(false);
  const [currentBid, setCurrentBid] = useState([]);
  const [showAlert, setShowAlert] = useState("");
  const [isShowPopup, setIsShowPopup] = useState(false);
  const [closeDisabled, setCloseDisabled] = useState(true);
  const [marketplaceApproval, setMarketplaceApproval] = useState("");
  const [paymentTokenApproval, setPaymentTokenApproval] = useState("");
  const [sign, setSign] = useState("");
  const [transaction, setTransaction] = useState("")
  const [data, setData] = useState([]);
  const [message, setMessage] = useState("");
  const [cancelOrder, setCancelOrder] = useState("");
  const [contentLoader, setContentLoader] = useState(false);


  useEffect(() => {
    if (cookies.selected_account) setCurrentUser(cookies.selected_account);
  }, [cookies.selected_account]);

  const fetch = async () => {
    let searchParams = {
      nftID: props.id,
      buyerID: "All",
      bidStatus: "Bid",
      orderID: "All",
    };

    let _data = await fetchBidNft(searchParams);
    if (_data && _data.data.length > 0) {
      setBids(_data.data);
    }
    else {
      setBids([])
    }
    setContentLoader(false);
  };

  useEffect(() => {
    setContentLoader(true);
    if (props.id)
      fetch();
  }, [props.id, props.reloadContent]);

  useEffect(() => {
    var body = document.body;
    if (loading || isUpdateBidModal) {
      body.classList.add("overflow_hidden");
    } else {
      body.classList.remove("overflow_hidden");
    }
  }, [loading, isUpdateBidModal]);

  useEffect(() => {
    const fetchData = async () => {
      handleSetData();
    }
    fetchData()
  }, [message, marketplaceApproval, sign, paymentTokenApproval, transaction, cancelOrder])

  useEffect(() => {
    if (isNaN(qty) || isNaN(price)) {
      setIsUpdateBidModal(false)
    }
  }, [qty, price, currentBid])

  // Update Bid Checkout Modal

  const updateBidModal = (
    <PopupModal
      content={
        <div className="popup-content1">

          <div className="modal_heading p-4">
            <h4 className='text-light title_20 mb-0'>Complete Checkout</h4>
          </div>
          <div className="model_data">
            <div className="bid_user_details my-4">
              <img src={Logo} alt="" />

              <div className="bid_user_address">
                <div>
                  <span className="adr">

                    {currentUser?.slice(0, 8) +
                      "..." +
                      currentUser?.slice(34, 42)}
                  </span>
                  <span className="badge badge-success">Connected</span>
                </div>
                <span className="pgn">Binance</span>

              </div>
            </div>
            <div className="min_bid">
              <span className="mn">Minimum Bid Amount: </span>

              {
                currentBid?.orderID?.length > 0 ? <span className="text-white"> <img
                  src={Tokens[currentBid?.orderID[0]?.paymentToken?.toLowerCase()]?.icon}
                  className='img-fluid min_bid_tkn'
                  alt=''
                />
                  <span>{parseFloat(Number(convertToEth(currentBid?.orderID[0]?.price?.$numberDecimal))?.toFixed(4)?.slice(0, -2))}{" "}</span>
                  <span>{Tokens[currentBid?.orderID[0]?.paymentToken]?.symbolName}</span>   </span> : ""
              }
            </div>
            <label className="form-label required">
              Please Enter the Bid Quantity
            </label>
            <input
              className="form-control input_design"
              type="text"
              min="1"
              step="1"
              placeholder="Quantity e.g. 1,2,3..."
              disabled={props ? props.NftDetails.type === 1 : false}
              value={qty}
              onKeyPress={(e) => {
                if (!/^\d*$/.test(e.key)) e.preventDefault();
              }}
              onChange={(e) => {
                if (Number(e.target.value) > Number(currentBid?.total_quantity)) {
                  NotificationManager.error(
                    "Quantity Should be less than Seller's Order", "", NOTIFICATION_DELAY
                  );
                  return;
                }
                setQty(e.target.value);
              }}
            ></input>
            <label className="form-label required">
              Please Enter the Bid Amount
            </label>

            <input
              className="form-control input_design"
              type="text"
              min="1"
              placeholder="Price e.g. 0.001,1..."
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
              className="btn-main mt-2 btn-placeABid"
              onClick={async () => {

                const wCheck = WalletConditions();
                if (wCheck !== undefined) {
                  setShowAlert(wCheck);
                  return;
                }


                if (
                  Number(price) <
                  Number(convertToEth(currentBid?.orderID[0]?.price?.$numberDecimal))
                ) {
                  NotificationManager.error(
                    "Bid Price must be Greater than Minimum Bid", "", NOTIFICATION_DELAY
                  );
                  setLoading(false);
                  return;
                }
                setIsUpdateBidModal(false);
                setMessage("updateBid");
                handleSetData();
                setIsShowPopup(true);
                try {


                  let res = await createBid(
                    currentBid?.nftID[0]?._id,
                    currentBid?.orderID[0]?._id,
                    currentBid?.orderID[0]?.sellerID,
                    currentUser,
                    props?.NftDetails?.type,
                    currentBid.total_quantity,
                    ethers.utils.parseEther(price.toString()),
                    false,
                    currentBid
                  );

                  if (res !== false) {
                    let historyReqData = {
                      nftID: currentBid?.nftID[0]._id,
                      buyerID: localStorage.getItem('userId'),
                      sellerID: currentBid?.owner?._id,
                      action: "Bid",
                      type: "Created",
                      price: ethers.utils.parseEther(price.toString()).toString(),
                      paymentToken: currentBid?.orderID[0]?.paymentToken,
                      quantity: qty,
                      createdBy: localStorage.getItem("userId"),
                    };
                    await InsertHistory(historyReqData);

                    NotificationManager.success(
                      "Bid Updated Successfully", "", NOTIFICATION_DELAY
                    );
                    // slowRefresh(1000);
                  }
                  setLoading(false);
                  await props.refreshState()
                  await fetch()

                } catch (e) {
                  NotificationManager.error("Something Went Wrong", "", NOTIFICATION_DELAY);
                  return
                }
              }}
            >
              {"Update Bid"}
            </button>
          </div>
          {/* )} */}
        </div>
      }
      handleClose={() => {
        setIsUpdateBidModal(!isUpdateBidModal);
        setQty(1);
        setPrice("");
      }}
    />
  );

  function handleSetData() {
    let msg = message;

    if (msg.includes("acceptBid")) {
      setData([{
        desc: "1. Approve Marketplace",
        event: marketplaceApproval
      },
      {
        desc: "2. Accept Bid",
        event: transaction
      }
      ])
    }
    if (msg.includes("updateBid")) {
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
    if (msg.includes("cancel-initiated")) {
      setCancelOrder("initiated");
    }
    if (msg.includes("cancel-succeeded")) {
      setCancelOrder("success");
    }

  }

  // evt.removeAllListeners("txn-status", txnStatus);
  evt.on("txn-status", txnStatus);

  function txnError(msg) {
    if (msg.includes("user-denied-cancel")) {
      setCancelOrder("fail");
      setCloseDisabled(false);
      return true;
    } else
      if (msg.includes("user-denied-sign")) {
        setSign("fail")
        setCloseDisabled(false);
        return true;
      } else if (msg.includes("user-denied-approval")) {
        setMarketplaceApproval("fail")
        setCloseDisabled(false);
        return true;
      } else if (msg.includes("transaction-failed")) {
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
      } else if (msg.includes("user-denied-token-approval")) {
        setPaymentTokenApproval("fail")
        setCloseDisabled(false);
        return true;
      } else if (msg.includes("user-denied-transaction")) {
        setTransaction("fail")
        setCloseDisabled(false);
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


  // evt.removeAllListeners("txn-error", txnError);
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
    <div className="row">
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
          </div>} handleClose={() => { setShowAlert(!showAlert) }} /> : showAlert === "notConnected" ? <PopupModal content={<div className='popup-content1'>
            <div className="model_data">
              <div className='bid_user_details my-4'>
                <img src={Logo} alt='' />
                <h4 className="mb-3">Please connect your wallet. </h4>
              </div>
              <button
                className='btn-main mt-2 mb-1' onClick={() => {
                  setShowAlert("");
                  setIsUpdateBidModal(false);
                  evt.emit("connectWallet")
                }}>
                Connect Wallet
              </button>
            </div>
          </div>} handleClose={() => { setShowAlert(!showAlert) }} /> : ""}

      {loading ? <Spinner /> : ""}
      {isUpdateBidModal ? updateBidModal : ""}
      {
        contentLoader || bids === "none" ? <LoadingSpinner /> : (bids !== "none" && bids && bids?.length <= 0 && !contentLoader && props.id !== undefined) ?
          <div className='col-md-12'>
            <h4 className='no_data_text text-muted'>
              No Bids Available
            </h4>
          </div> : ""
      }
      {bids !== "none" && bids && bids.length > 0 ?
        <div className="table-responsive">
          <div className="col-md-12">
            <div className="nft_list">
              <table className="table text-light">
                <thead>
                  <tr>
                    <th scope="col">FROM</th>
                    <th scope="col">PRICE</th>
                    <th scope="col">DATE</th>
                    <th scope="col">SALE TYPE</th>
                    <th scope="col">ENDS IN</th>
                    <th scope="col">STATUS</th>
                    <th className="text-center">ACTION</th>
                  </tr>
                </thead>
                <tbody>
                  {bids !== "none" && bids && bids.length > 0
                    ? bids?.map((b, i) => {
                      const bidOwner = b?.owner?.walletAddress?.toLowerCase();
                      const bidder =
                        b?.bidderID?.walletAddress?.toLowerCase();
                      return (
                        <tr key={i}>
                          <td className="d-flex justify-content-start align-items-center mb-0">
                            <span className="blue_dot circle_dot"></span>
                            <span>

                              {b?.bidderID?.walletAddress
                                ? b?.bidderID?.walletAddress?.slice(0, 4) +
                                "..." +
                                b?.bidderID?.walletAddress?.slice(38, 42)
                                : ""}
                            </span>
                          </td>
                          <td>
                            <img
                              alt=""
                              src={
                                b?.orderID?.length > 0
                                  ? Tokens[
                                    b?.orderID[0]?.paymentToken?.toLowerCase()
                                  ]?.icon
                                  : "-"
                              }
                              className="img-fluid hunter_fav"
                            />{" "}
                            {Number(
                              convertToEth(b?.bidPrice?.$numberDecimal)
                            ).toFixed(2)}{" "}
                            {Tokens[b?.orderID[0]?.paymentToken]?.symbolName}
                          </td>
                          <td>
                            {moment(b.createdOn).format("DD/MM/YYYY")}{" "}&nbsp;
                            <span className="nft_time">
                              {moment(b.createdOn).format("hh:mm A")}
                            </span>
                          </td>
                          <td>{b?.orderID[0]?.salesType === 1 && b?.orderID[0]?.deadline < GENERAL_TIMESTAMP
                            ? "Auction"
                            : "Open for Bids"}</td>
                          <td>
                            {/* {moment.utc(b.bidDeadline * 1000).local().format() < moment(new Date()).format() ? <Clock
                              deadline={moment.utc(b.bidDeadline * 1000).local().format()} fetch={fetch}></Clock> : "00:00:00"} */}
                            {moment.utc(b?.orderID[0]?.deadline * 1000).local().format() < moment(new Date()).format() || b?.orderID[0]?.deadline >= GENERAL_TIMESTAMP || b.bidStatus !== "Bid" ? (
                              "--:--:--"
                            ) : (
                              <Clock
                                deadline={moment.utc(b?.orderID[0]?.deadline * 1000).local().format()}
                                fetch={fetch}
                              ></Clock>
                            )}
                          </td>
                          <td className={moment.utc(b?.orderID[0]?.deadline * 1000).local().format() < moment(new Date()).format()
                            ? "red_text"
                            : "green_text"}>
                            {moment.utc(b?.orderID[0]?.deadline * 1000).local().format() < moment(new Date()).format()
                              ? "Ended"
                              : "Active"}
                          </td>
                          <td className="text-center">
                            {bidOwner === currentUser?.toLowerCase() && b.bidStatus === "Bid" ? (
                              <div className="d-flex justify-content-center align-items-center">
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
                                    let res = await checkOfferBid({ recordID: b._id })
                                    if (!res || isEmptyObject(res)) {
                                      NotificationManager.info("Bid Status has been Changed", "", NOTIFICATION_DELAY);
                                      setLoading(false);
                                      await props.refreshState()
                                      await fetch()
                                      return
                                    }
                                    setLoading(false);
                                    closePopup();
                                    setMessage("acceptBid");
                                    handleSetData();
                                    setIsShowPopup(true);
                                    let historyData = {
                                      nftID: b?.nftID[0]._id,
                                      sellerID: localStorage.getItem('userId'),
                                      buyerID: b?.bidderID?._id,
                                      action: "Bid",
                                      type: "Accepted",
                                      price: b?.bidPrice?.$numberDecimal,
                                      paymentToken: b?.orderID[0]?.paymentToken,
                                      quantity: b?.bidQuantity,
                                      createdBy: localStorage.getItem("userId"),
                                    };
                                    const resp = await handleAcceptBids(
                                      b,
                                      props.NftDetails.type,
                                      historyData
                                    );

                                    // if (resp) {
                                    //   slowRefresh(1000);
                                    // }
                                    await props.refreshState()
                                    await fetch()
                                    // await props.refreshState()
                                    // setReloadContent(!reloadContent);
                                  }}
                                >
                                  Accept
                                </button>
                                <button
                                  to={"/"}
                                  className="small_border_btn small_btn"
                                  onClick={async () => {
                                    setLoading(true)
                                    const wCheck = WalletConditions();
                                    if (wCheck !== undefined) {
                                      setLoading(false)
                                      setShowAlert(wCheck);
                                      return;
                                    }

                                    let result = await checkOfferBid({ recordID: b._id })
                                    if (!result || isEmptyObject(result)) {
                                      NotificationManager.info("Bid Status has been Changed", "", NOTIFICATION_DELAY);
                                      setLoading(false)
                                      await props.refreshState()
                                      await fetch()
                                      return
                                    }
                                    let { res, hash } = await handleUpdateBidStatus(
                                      b._id,
                                      "Rejected",
                                      b
                                    );
                                    if (res) {
                                      let historyReqData = {
                                        nftID: b?.nftID[0]?._id,
                                        sellerID: localStorage.getItem('userId'),
                                        buyerID: b?.bidderID?._id,
                                        action: "Bid",
                                        type: "Rejected",
                                        price: b?.bidPrice?.$numberDecimal,
                                        paymentToken: b?.orderID[0]?.paymentToken,
                                        quantity: b?.bidQuantity,
                                        createdBy: localStorage.getItem("userId"),
                                        hash: hash
                                      };
                                      await InsertHistory(historyReqData);
                                      NotificationManager.success("Bid Rejected Successfully", "", NOTIFICATION_DELAY)
                                    }


                                    await props.refreshState()
                                    await fetch()
                                    setLoading(false)
                                    // setReloadContent(!reloadContent);
                                    // await props.refreshState();
                                    // slowRefresh(1000);
                                  }}
                                >
                                  Reject
                                </button>
                              </div>
                            ) : bidOwner !== currentUser?.toLowerCase() &&
                              bidder === currentUser?.toLowerCase() && b.bidStatus === "Bid" ?
                              (moment.utc(b?.orderID[0]?.deadline * 1000).local().format() > moment(new Date()).format() ?
                                <div className="d-flex  justify-content-center align-items-center ">
                                  <button
                                    className="small_yellow_btn small_btn mr-3"
                                    onClick={() => {
                                      closePopup();
                                      const wCheck = WalletConditions();
                                      if (wCheck !== undefined) {
                                        setShowAlert(wCheck);
                                        return;
                                      }
                                      setCurrentBid(b);
                                      setPrice(
                                        Number(
                                          convertToEth(
                                            b?.bidPrice?.$numberDecimal
                                          )
                                        )
                                      );
                                      setIsUpdateBidModal(true);

                                    }}
                                  >
                                    Update Bid
                                  </button>

                                  <button

                                    className="small_border_btn small_btn"
                                    onClick={async () => {
                                      const wCheck = WalletConditions();
                                      if (wCheck !== undefined) {
                                        setShowAlert(wCheck);
                                        return;
                                      }
                                      let result = await checkOfferBid({ recordID: b._id })
                                      if (!result || isEmptyObject(result)) {
                                        NotificationManager.info("Bid Status has been Changed", "", NOTIFICATION_DELAY);
                                        setLoading(false)
                                        await props.refreshState()
                                        await fetch()
                                        return
                                      }
                                      setLoading(true)
                                      let { res, hash } = await handleUpdateBidStatus(
                                        b._id,
                                        "Cancelled",
                                        b
                                      );

                                      if (res) {
                                        let historyReqData = {
                                          nftID: b?.nftID[0]?._id,
                                          sellerID: localStorage.getItem('userId'),
                                          buyerID: b?.bidderID?._id,
                                          action: "Bid",
                                          type: "Cancelled",
                                          price: b?.bidPrice?.$numberDecimal,
                                          paymentToken: b?.orderID[0]?.paymentToken,
                                          quantity: b?.bidQuantity,
                                          createdBy: localStorage.getItem("userId"),
                                          hash: hash
                                        };
                                        await InsertHistory(historyReqData);
                                        NotificationManager.success("Bid Cancelled Successfully", "", NOTIFICATION_DELAY)
                                      }

                                      // setReloadContent(!reloadContent);
                                      await props.refreshState()
                                      await fetch()
                                      setLoading(false)
                                      // slowRefresh(1000)
                                    }}

                                  >
                                    Cancel
                                  </button>
                                </div> : ""
                              ) : bidder === currentUser?.toLowerCase() ? (
                                moment.utc(b.bidDeadline * 1000).local().format() < moment(new Date()).format() ? "" :
                                  <button
                                    to={"/"}
                                    className="small_border_btn small_btn"
                                  >
                                    Place Bid
                                  </button>
                              ) : (
                                ""
                              )}
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

export default NFTBids;