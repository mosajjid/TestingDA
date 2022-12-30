import React, { useEffect, useState } from "react";
import { useCookies } from "react-cookie";
import { checkOfferBid, fetchOfferNft } from "../../apiServices";
import { convertToEth } from "../../helpers/numberFormatter";
import moment from "moment";
import { ethers } from "ethers";
import contracts from "../../config/contracts";
import {
  handleUpdateBidStatus,
  handleAcceptOffers,
  createOffer,
} from "../../helpers/sendFunctions";
import NFTDetails from "../pages/NFTDetails";
import { slowRefresh } from "../../helpers/NotifyStatus";
import Clock from "./Clock";
import Spinner from "../components/Spinner";
import { Tokens } from "../../helpers/tokensToSymbol";
import { InsertHistory } from "../../apiServices";
import Logo from "./../../assets/images/logo.svg";
import evt from "./../../events/events";
import { onboard } from "../menu/header";
import { WalletConditions } from "../components/WalletConditions";
import PopupModal from "../components/AccountModal/popupModal";
import ProgressModal from "./AccountModal/ProgressModal";
import { NOTIFICATION_DELAY } from "../../helpers/constants";
import { isEmptyObject } from "jquery";
import LoadingSpinner from "../components/Loader";
import { NotificationManager } from "react-notifications";
import DateMomentUtils from "@date-io/moment";
import { DateTimePicker, MuiPickersUtilsProvider } from "@material-ui/pickers";


function NFToffer(props) {
  const [currentUser, setCurrentUser] = useState("");
  const [cookies] = useCookies([]);
  const [offer, setOffer] = useState([]);
  const [selectedToken, setSelectedToken] = useState("BUSD");
  const [loading, setLoading] = useState(false);
  const [offerPrice, setOfferPrice] = useState();
  const [offerQuantity, setOfferQuantity] = useState(1);
  const [modal, setModal] = useState(false);
  const [showAlert, setShowAlert] = useState("");
  const [isShowPopup, setIsShowPopup] = useState(false);
  const [closeDisabled, setCloseDisabled] = useState(true);
  const [marketplaceApproval, setMarketplaceApproval] = useState("");
  const [paymentTokenApproval, setPaymentTokenApproval] = useState("");
  const [sign, setSign] = useState("");
  const [transaction, setTransaction] = useState("")
  const [data, setData] = useState([]);
  const [message, setMessage] = useState("");
  const [currOffer, setCurrOffer] = useState({})
  const [cancelOrder, setCancelOrder] = useState("")
  const [contentLoader, setContentLoader] = useState(false)
  const [selectedDate, setSelectedDate] = useState(null);

  useEffect(() => {
    if (cookies.selected_account) setCurrentUser(cookies.selected_account);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [cookies.selected_account]);



  useEffect(() => {
    setContentLoader(true)
    if (props.id)
      fetch();
  }, [props.id, props.reloadContent]);

  const fetch = async () => {
    if (props.id) {
      let searchParams = {
        nftID: props.id,
        buyerID: "All",
        bidStatus: "MakeOffer"
      };

      let _data = await fetchOfferNft(searchParams);
      if (_data && _data?.data?.length > 0) {
        let a = _data.data;
        setOffer(a);
      }
      else
        setOffer([]);
    }
    setContentLoader(false)
  };

  useEffect(() => {
    const reset = async () => {
      handleSetData();
    }
    reset()
  }, [message, marketplaceApproval, sign, paymentTokenApproval, transaction, cancelOrder])

  const PlaceOffer = async () => {
    closePopup();
    const wCheck = WalletConditions();
    if (wCheck !== undefined) {
      setShowAlert(wCheck);
      return;
    }

    if (offerPrice === "" || offerPrice === undefined) {
      NotificationManager.error("Enter Offer Price", "", NOTIFICATION_DELAY);
      return;
    }

    if (
      offerQuantity === "" ||
      (offerQuantity === undefined && NFTDetails?.type !== 1)
    ) {
      NotificationManager.error("Enter Offer Quantity", "", NOTIFICATION_DELAY);
      return;
    }
    if (selectedDate === "" || selectedDate === null) {
      NotificationManager.error("Enter Offer EndTime", "", NOTIFICATION_DELAY);
      return;
    }
    if (selectedDate < moment(new Date()).format()) {
      NotificationManager.error("Please Select a Future Date and time", "", NOTIFICATION_DELAY);
      return;
    }
    // setLoading(true);
    setModal("")
    setMessage("updateOffer");
    handleSetData();
    setIsShowPopup(true)
    try {
      let deadline = moment(selectedDate).unix();

      const res = await createOffer(
        props.NftDetails?.tokenId,
        props.collectionAddress,
        props.NftDetails?.ownedBy[0],
        currentUser,
        props.NftDetails?.type,
        offerQuantity,
        ethers.utils.parseEther(offerPrice),
        deadline,
        props.NftDetails.id,
        contracts[selectedToken],
        currOffer
      );


      if (res === true) {
        let historyReqData = {
          nftID: props.NftDetails?.id,
          buyerID: localStorage.getItem("userId"),
          action: "Offer",
          type: "Created",
          price: ethers.utils.parseEther(offerPrice.toString()).toString(),
          paymentToken: contracts[selectedToken],
          quantity: offerQuantity,
          createdBy: localStorage.getItem("userId"),
        }
        const d = await InsertHistory(historyReqData);
        NotificationManager.success("Offer Created Successfully", "", NOTIFICATION_DELAY);

      }
      setLoading(false);

    }
    catch (e) {
      console.log("error", e)
    }
    await props.refreshState();
    await fetch();

    // await props.reloadContent();
  };



  const handleDateChange = (e) => {
    if(!moment(e).isValid()){
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


  function handleSetData() {
    let msg = message;

    if (msg.includes("acceptOffer")) {
      setData([{
        desc: "1. Approve Marketplace",
        event: marketplaceApproval
      },
      {
        desc: "2. Accept Offer",
        event: transaction
      }
      ])
    }
    if (msg.includes("updateOffer")) {
      setData([{
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

    if (msg.includes("cancel-initiated")) {
      setCancelOrder("initiated");
    }
    if (msg.includes("cancel-succeeded")) {
      setCancelOrder("success");
    }
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
    setMarketplaceApproval("");
    setSign("");
    setCloseDisabled(true);
    setTransaction("");
    setPaymentTokenApproval("");
    setCancelOrder("");
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
        <div className='bid_user_details my-4'>
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
          className='btn-main mt-2' onClick={async () => {
            const isSwitched = await onboard.setChain({
              chainId: process.env.REACT_APP_CHAIN_ID,
            });
            if (isSwitched)
              setShowAlert("");
          }}>
          {"Switch Network"}
        </button>
      </div>} handleClose={() => { setShowAlert(!showAlert) }} /> :
        showAlert === "account" ? <PopupModal content={
          <div className='popup-content1'>
            <div className='bid_user_details my-4'>
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
                className='btn-main mt-2' onClick={() => { evt.emit("disconnectWallet") }}>
                {"Logout"}
              </button>
            </div>
          </div>} handleClose={() => { setShowAlert(!showAlert) }} /> :
          showAlert === "locked" ? <PopupModal content={<div className='popup-content1'>
            <div className='bid_user_details my-4'>
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
              className='btn-main mt-2' onClick={() => {
                evt.emit("disconnectWallet")
              }}>
              Connect Wallet
            </button>
          </div>} handleClose={() => { setShowAlert(!showAlert) }} /> :
            showAlert === "notConnected" ? <PopupModal content={<div className='popup-content1'>
              <div className='bid_user_details my-4'>
                <img src={Logo} alt='' />
                <h4 className="mb-3">Please connect your wallet. </h4>
              </div>
              <button
                className='btn-main mt-2' onClick={() => {
                  setShowAlert("");
                  setModal("")
                  evt.emit("connectWallet");
                }}>
                Connect Wallet
              </button>
            </div>} handleClose={() => { setShowAlert(!showAlert) }} /> : ""}

      {loading ? <Spinner /> : ""}
      {contentLoader || offer === "none" ? <LoadingSpinner /> : (offer !== "none" && offer && offer?.length <= 0 && !contentLoader && props.id !== undefined) ? <div className="col-md-12">
        <h4 className="no_data_text text-muted">No Offers Available</h4>
      </div> : ""}
      {offer !== "none" && offer && offer?.length > 0 ? <div className="table-responsive">
        <div className="col-md-12">
          <div className="nft_list">
            <table className="table text-light fixed_header">
              <thead>
                <tr>
                  <th scope="col">FROM</th>
                  <th scope="col">PRICE</th>
                  <th scope="col">DATE</th>
                  <th scope="col">ENDS IN</th>
                  <th scope="col">STATUS</th>
                  <th className="text-center">ACTION</th>
                </tr>
              </thead>
              <tbody>
                {offer !== "none" && offer && offer?.length > 0
                  ? offer?.map((b, i) => {
                    const bidOwner = props.NftDetails?.ownedBy?.length > 0 ? props.NftDetails?.ownedBy[0]?.address?.toLowerCase() : ""
                    const bidder = b?.bidderID?.walletAddress?.toLowerCase();
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
                            src={Tokens[b?.paymentToken?.toLowerCase()]?.icon}
                            className="img-fluid hunter_fav"
                          />{" "}
                          {Number(convertToEth(b?.bidPrice?.$numberDecimal))
                            ?.toFixed(4)
                            ?.slice(0, -2)}{" "}
                          {Tokens[b?.paymentToken?.toLowerCase()]?.symbolName}
                        </td>
                        <td>
                          {moment.utc(b.createdOn).local().format("DD/MM/YYYY")}{" "}&nbsp;
                          <span className="nft_time">
                            {moment.utc(b.createdOn).local().format("hh:mm A")}
                          </span>
                        </td>
                        <td>
                          {(Date.parse(moment.utc(b.bidDeadline * 1000).local().format()) - Date.parse(new Date()) <= 0) || b.bidStatus !== "MakeOffer" ? "--:--:--" :
                            <Clock
                              deadline={moment.utc(b?.bidDeadline * 1000).local().format()}
                              fetch={fetch}
                            ></Clock>
                          }
                        </td>
                        <td className={b.bidStatus === "Accepted" ? "blue_text" : moment.utc(b?.bidDeadline * 1000).local().format() < moment(new Date()).format() ? "red_text" :
                          b.bidStatus === "MakeOffer" || b.bidStatus === "Accepted" ? "green_text" : "red_text"}>
                          {" "}
                          {
                            b.bidStatus === "Accepted" ? b.bidStatus : moment.utc(b?.bidDeadline * 1000).local().format() < moment(new Date()).format() ? "Ended" :
                              b.bidStatus === "MakeOffer" ? "Active" : b.bidStatus}
                        </td>
                        <td className="text-center">
                          {bidOwner === currentUser.toLowerCase() &&
                            b.bidStatus === "MakeOffer" ? (
                            moment.utc(b?.bidDeadline * 1000).local().format() < moment(new Date()).format() ? "" :
                              <div className="d-flex justify-content-center align-items-center">
                                <button
                                  to={"/"}
                                  className="small_yellow_btn small_btn mr-3"
                                  onClick={async () => {
                                    if (currentUser === undefined || currentUser === "") {
                                      setShowAlert("notConnected");
                                      return;
                                    }
                                    const wCheck = WalletConditions();
                                    if (wCheck !== undefined) {
                                      setShowAlert(wCheck);
                                      return;
                                    }
                                    let res = await checkOfferBid({ recordID: b._id })
                                    if (!res || isEmptyObject(res)) {
                                      NotificationManager.info("Offer Status has been Changed", "", NOTIFICATION_DELAY);
                                      setLoading(false)
                                      await props.refreshState()
                                      await fetch()
                                      return
                                    }
                                    // setLoading(true);
                                    closePopup();
                                    setMessage("acceptOffer");
                                    handleSetData();
                                    setIsShowPopup(true);
                                    let historyData = {
                                      nftID: b?.nftID[0]._id,
                                      sellerID: localStorage.getItem('userId'),
                                      buyerID: b?.bidderID?._id,
                                      action: "Offer",
                                      type: "Accepted",
                                      price: b?.bidPrice?.$numberDecimal,
                                      paymentToken: b?.paymentToken,
                                      quantity: b?.bidQuantity,
                                      createdBy: localStorage.getItem("userId"),
                                    };
                                    const resp = await handleAcceptOffers(
                                      b,
                                      props,
                                      currentUser.toLowerCase(),
                                      historyData
                                    );
                                    // if(resp)
                                    // slowRefresh(1000);

                                    await props.refreshState()
                                    await fetch();

                                  }}
                                >
                                  Accept
                                </button>
                                <button
                                  to={"/"}
                                  className="small_border_btn small_btn"
                                  onClick={async () => {
                                    if (currentUser === undefined || currentUser === "") {
                                      setShowAlert("notConnected");
                                      return;
                                    }
                                    const wCheck = WalletConditions();
                                    if (wCheck !== undefined) {
                                      setShowAlert(wCheck);
                                      return;
                                    }
                                    setLoading(true);
                                    let result = await checkOfferBid({ recordID: b._id })
                                    if (!result || isEmptyObject(result)) {
                                      NotificationManager.info("Offer Status has been Changed", "", NOTIFICATION_DELAY);
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
                                        nftID: b?.nftID[0]._id,
                                        sellerID: localStorage.getItem('userId'),
                                        buyerID: b?.bidderID?._id,
                                        action: "Offer",
                                        type: "Rejected",
                                        price: b?.bidPrice?.$numberDecimal,
                                        paymentToken: b?.paymentToken,
                                        quantity: b?.bidQuantity,
                                        createdBy: localStorage.getItem("userId"),
                                        hash: hash
                                      };
                                      await InsertHistory(historyReqData);
                                      NotificationManager.success("Offer Rejected Successfully", "", NOTIFICATION_DELAY)
                                    }

                                    await props.refreshState()
                                    await fetch()
                                    setLoading(false)
                                    // slowRefresh(1000);

                                  }}

                                >
                                  Reject
                                </button>
                              </div>

                          ) : bidOwner !== currentUser.toLowerCase() &&
                            bidder === currentUser.toLowerCase() && b.bidStatus === "MakeOffer" ? (

                            <div
                              className={`d-${b.bidStatus === "Accepted" ? "none" : "flex"
                                } justify-content-center align-items-center`}
                            >
                              <button

                                className="small_yellow_btn small_btn mr-3"
                                // data-bs-toggle="modal"
                                // data-bs-target="#brandModal"
                                onClick={() => {
                                  const wCheck = WalletConditions();
                                  if (wCheck !== undefined) {
                                    setShowAlert(wCheck);
                                    return;
                                  }
                                  setModal("active");
                                  setOfferPrice(
                                    convertToEth(b?.bidPrice?.$numberDecimal)
                                  );
                                  setCurrOffer(b)
                                  setSelectedDate(
                                    moment.utc(b?.bidDeadline * 1000).local().format()
                                  );
                                }}
                              >
                                Update Offer
                              </button>
                              <button
                                className="small_border_btn small_btn"
                                onClick={async () => {
                                  if (currentUser === undefined || currentUser === "") {
                                    setShowAlert("notConnected");
                                    return;
                                  }
                                  const wCheck = WalletConditions();
                                  if (wCheck !== undefined) {
                                    setShowAlert(wCheck);
                                    return;
                                  }
                                  setLoading(true)

                                  let result = await checkOfferBid({ recordID: b._id })
                                  if (!result || isEmptyObject(result)) {
                                    NotificationManager.info("Offer Status has been Changed", "", NOTIFICATION_DELAY);
                                    setLoading(false)
                                    await props.refreshState()
                                    await fetch()
                                    return
                                  }
                                  let { res, hash } = await handleUpdateBidStatus(
                                    b._id,
                                    "Cancelled",
                                    b
                                  );
                                  if (res) {
                                    let historyReqData = {
                                      nftID: b?.nftID[0]._id,
                                      buyerID: localStorage.getItem('userId'),
                                      action: "Offer",
                                      type: "Cancelled",
                                      price: b?.bidPrice?.$numberDecimal,
                                      paymentToken: b?.paymentToken,
                                      quantity: b?.bidQuantity,
                                      createdBy: localStorage.getItem("userId"),
                                      hash: hash
                                    };
                                    await InsertHistory(historyReqData);
                                    NotificationManager.success("Offer Cancelled Successfully", "", NOTIFICATION_DELAY)
                                  }
                                  await props.refreshState()
                                  await fetch()
                                  setLoading(false)
                                  // slowRefresh(1000)
                                }}
                              >
                                Cancel
                              </button>
                            </div>
                          ) : ""}
                        </td>
                      </tr>
                    );
                  })
                  : ""}

              </tbody>
            </table>
          </div>
        </div>
      </div> : ""}


      {/*update offer modal*/}
      <div className={`modal marketplace makeOffer ${modal}`} id="brandModal">
        <div className="modal-dialog modal-lg modal-dialog-centered">
          <div className="modal-content">
            {/* <!-- Modal Header --> */}
            <div className="modal-header p-4">
              <h4 className="text-light title_20 mb-0">Offer</h4>
              <button
                type="button"
                className="btn-close text-light"
                // data-bs-dismiss="modal"
                onClick={() => setModal(false)}
              ></button>
            </div>

            {/* <!-- Modal body --> */}
            <div className="modal-body">
              <div className="tab-content">
                <div className="mb-3" >
                  <label htmlFor="item_price" className="form-label">
                    Offer Price
                  </label>
                  <input
                    type="text"
                    name="item_price"
                    id="item_price"
                    min="0"
                    max="18"
                    className="form-control input_design"
                    placeholder="Please Enter Price (MATIC)"
                    value={offerPrice}
                    autoComplete="off"
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
                <div className="mb-3" >
                  <label htmlFor="item_qt" className="form-label">
                    Quantity
                  </label>
                  <input
                    type="text"
                    name="item_qt"
                    id="item_qt"
                    min="1"
                    autoComplete="off"
                    disabled={NFTDetails.type === 1 ? "disabled" : ""}
                    className="form-control input_design"
                    placeholder="Please Enter Quantity"
                    value={offerQuantity}
                    onChange={(event) => {
                      if (NFTDetails.type == 1 && event.target.value > 1) {
                        setOfferQuantity(1);
                        NotificationManager.error(
                          "Quantity must be 1.",
                          "",
                          NOTIFICATION_DELAY
                        );
                      }
                      if (
                        NFTDetails.type !== 1 &&
                        event.target.value > NFTDetails?.totalQuantity
                      ) {
                        NotificationManager.error(
                          "Quantity must be less than or equal to Total Quantity.",
                          "",
                          NOTIFICATION_DELAY
                        );
                        return;
                      }
                    }}
                  />
                </div>
                <div className="mb-3">
                  <label htmlFor="Payment" className="form-label">
                    Payment Token
                  </label>
                  <select
                    className="form-select input_design select_bg"
                    name="BUSD"
                    value={selectedToken}
                    onChange={(event) =>
                      setSelectedToken(event.target.value)
                    }
                  >
                    <option value={"BUSD"} selected>
                      BUSD
                    </option>
                  </select>
                </div>

                <div className="mb-3 ">
                  <label htmlFor="item_ex_date" className="form-label">
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
                  {/* <input type="date" name="item_ex_date" id="item_ex_date" min="0" max="18" className="form-control input_design" placeholder="Enter Minimum Bid" value="" /> */}
                  {/* <input
                    type="selectedDate-local"
                    value={(selectedDate || "").toString().substring(0, 16)}
                    //value={selectedDate}
                    onChange={handleDateChange}
                    className="input_design"
                    min={moment(new Date()).format().substring(0, 16)}
                  /> */}
                </div>
                <div className="mt-5 mb-3 text-center">
                  <button
                    type="button"
                    className="square_yello"
                    href="/mintcollectionlive"
                    onClick={PlaceOffer}
                  >
                    Update Offer
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
      {/*update offer modal ends*/}
    </div >
  );
}

export default NFToffer;
