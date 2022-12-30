import { useParams } from "react-router-dom";
import { React, useEffect, useState } from "react";
import Footer from "../components/footer";
import MintEventSlider from "../components/MintEventSlider";
import { useCookies } from "react-cookie";
import { convertToEth } from "../../helpers/numberFormatter";
import { BigNumber } from "bignumber.js";
import evt from "../../events/events";
import "../components-css/App.scss";
import Spinner from "../components/Spinner";
import { getMintCollections } from "../../apiServices";
import ProgressModal from "../components/AccountModal/ProgressModal";
import PopupModal from "../components/AccountModal/popupModal";
import Logo from "../../assets/images/logo.svg";
import { onboard } from "../menu/header";
import { NotificationManager } from "react-notifications";
import { NOTIFICATION_DELAY } from "../../helpers/constants";
import coverImg from "../../assets/images/Banner-Barrett-background-gold3.jpg"

async function lazyImport(addr) {
  let data = await getMintCollections({ address: addr });

  if (!data || data === []) {
    window.location.href = "/";
    return;
  }

  let fileName = data.type;
  if (!fileName) {
    throw new Error("file not found");
  }
  const calles = import(`../../helpers/Contract-Calls/${fileName}`);
  return calles;
}

function MultiMintingPage(props) {
  const params = useParams();
  const contractCalls = lazyImport(params.id);
  const [currentUser, setCurrentUser] = useState();
  const [totalSupply, setTotalSupply] = useState();
  const { id } = useParams();
  const [cookies] = useCookies([]);
  const [loading, setLoading] = useState(false);
  const [isShowPopup, setisShowPopup] = useState(false);
  const [closeDisabled, setCloseDisabled] = useState(true);
  const [isApproval, setIsApproval] = useState("");
  const [isMinted, setIsMinted] = useState("");
  const [showAlert, setShowAlert] = useState("")
  const [price, setPrice] = useState(0);
  const [status, setStatus] = useState("");
  const [toggle, setToggle] = useState(false)

  function txnStatus(msg) {
    if (msg.includes("initiate loader")) {
      setisShowPopup(true);
      setIsApproval("initiated")
    }
    if (msg.includes("approval-succeed")) {
      setIsApproval("success");
      setIsMinted("initiated");
      setCloseDisabled(true);
    }
    if (msg.includes("mint-initiated")) {
      setIsMinted("initiated");
    }
    if (msg.includes("mint-succeed")) {
      setIsMinted("success");
      setCloseDisabled(false);
      NotificationManager.success("Mint Succeeded", "", NOTIFICATION_DELAY);
      closePopup();
      setTimeout(() => {
        setisShowPopup(false);
      }, 5000)
    }
  }
  evt.removeAllListeners("txn-status", txnStatus);
  evt.on("txn-status", txnStatus);

  function txnError(msg) {
    if (msg.includes("user-denied-mint")) {
      setIsMinted("fail")
      setCloseDisabled(false);
      NotificationManager.error("User Denied Mint Transaction", "", NOTIFICATION_DELAY);
    } else if (msg.includes("user-denied-approval")) {
      setIsApproval("fail")
      setCloseDisabled(false);
      NotificationManager.error("User Denied Approval", "", NOTIFICATION_DELAY);
    } else if (msg.includes("not enough balance")) {
      setIsApproval("fail")
      setCloseDisabled(false);
      NotificationManager.error("Not Enough Token", "", NOTIFICATION_DELAY);
    } else if (msg.includes("check wallet for confirmation")) {
      setIsMinted("fail")
      setCloseDisabled(false);
      NotificationManager.error(msg, "", NOTIFICATION_DELAY);
    } else if (msg.includes("max nft per wallet has been reached")) {
      setIsApproval("fail");
      setIsMinted("fail");
      setCloseDisabled(false);
      NotificationManager.error(msg, "", NOTIFICATION_DELAY);
    }
    else if (msg.includes("address not Whitelisted")) {
      setIsApproval("fail");
      setIsMinted("fail");
      setCloseDisabled(false);
      NotificationManager.error(msg, "", NOTIFICATION_DELAY);
    } else {
      setIsApproval("fail");
      setIsMinted("fail");
      setCloseDisabled(false);
      NotificationManager.error(msg, "", NOTIFICATION_DELAY);
    }
    setTimeout(() => {
      closePopup();
      setisShowPopup(false);
    }, 5000);
    return true
  }


  evt.removeAllListeners("txn-error", txnError);
  evt.on("txn-error", txnError);

  useEffect(() => {
    window.scrollTo(0, 0);
  }, []);



  useEffect(() => {
    const fetchData = async () => {
      let contract = contractCalls;
      let { fetchInfo, fetchUserBal } = await contract;
      let getcateg = await fetchInfo(id);
      setPrice(convertToEth(new BigNumber(getcateg[0]?.toString())));
      setStatus(getcateg[4])
    }
    if (id)
      fetchData()
  }, [id, contractCalls])

  useEffect(() => {
    if (cookies.selected_account) setCurrentUser(cookies.selected_account);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [currentUser]);

  useEffect(() => {
    const bodyClass = async () => {
      var body = document.body;
      if (isShowPopup) {
        body.classList.add("overflow_hidden");
      } else {
        body.classList.remove("overflow_hidden");
      }
    };
    bodyClass();
  }, [isShowPopup]);


  useEffect(() => {
    setLoading(true);
    const fetchData = async () => {
      if (params && params.id) {
        let { fetchInfo } = await contractCalls;
        let getcateg = await fetchInfo(params.id);
        setTotalSupply(getcateg[2]?.toString());
        setPrice(convertToEth(new BigNumber(getcateg[0]?.toString())));
      }

      setLoading(false);
    };

    setInterval(fetchData, 10000);
    fetchData();
  }, [params]);

  function closePopup() {
    setisShowPopup(false);
    setIsApproval("");
    setIsMinted("")
  }


  const data = [{
    desc: "This transaction is conducted only once per collection",
    event: isApproval
  }, {
    desc: "Send transaction to create your NFT",
    event: isMinted
  }
  ]

  const handleShowAlert = (error) => {
    setShowAlert(error);
  }

  return (
    <div>
      {loading ? <Spinner /> : ""}
      {showAlert === "chainId" ? <PopupModal content={<div className='popup-content1'>
        <div class="model_data">
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
          <div class="model_data">
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
            <div class="model_data">
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
              <div class="model_data">
                <div className='bid_user_details my-4'>
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
      <section className="collection_banner pdd_8" style={{
        backgroundImage: `url(${coverImg})`,
        backgroundSize: "cover",
        backgroundPosition: "center",
      }}></section>
      <section className="collection_info">
        <div className="container">
          <ul className="collection_status mt-5 mb-5">
            <li>
              <h4>{totalSupply ? totalSupply : 0}</h4>
              <p>Items</p>
            </li>
            <li>
              <h4>{status === "Live" ? price : "****"}</h4>
              <p>HNTR</p>
            </li>
            <li>
              <h4>{status === "Live" ? "Open" : "TBA"}</h4>
              <p>Status</p>
            </li>
          </ul>
          <div className="collection_description text-center">
            {!toggle ?
              <><h4 className='hunter-market'>THE POWERHOUSE RIFLE.</h4>
                <h6 className='font_24'>The Model 82 is where the Barrett legacy began.</h6>
                <p>Engineered as the first shoulder fired semi-automatic 50 BMG rifle, the Model 82A1 has been proven in combat in every environment from the snow covered mountains, to the desolate deserts, and everything in between...</p>
              </> :
              <>
                <h4 className='hunter-market'>THE POWERHOUSE RIFLE.</h4>
                <h6 className='font_24'>The Model 82 is where the Barrett legacy began.</h6>
                <p>Engineered as the first shoulder fired semi-automatic 50 BMG rifle, the Model 82A1 has been proven in combat in every environment from the snow covered mountains, to the desolate deserts, and everything in between. Its low felt recoil and reliable repower delivers on target with every pull of the trigger. More than just a rifle, the Model 82 is an American icon.</p>
                <p>This is a blind drop, when minting you will receive a random collectable from this series. </p>
                <ul>
                  <li>GOLD - Legendary - 100 items</li>
                  <li>DIGICAM - Epic - 400 items</li>
                  <li>GREY - Ultra-rare - 600 item</li>
                  <li>OD Green - Rare - 1100 items</li>
                  <li>FDE - Rare - 1100 items</li>
                  <li>Black - Classic - 2000 items </li>
                </ul>
                <ul>
                  <li>BRAND 	Barrett</li>
                  <li>MODEL 	Model 82A1</li>
                  <li>LICENSE	Barrett </li>
                  <li>SERIES	Firearms series #1</li>
                  <li>NAME / alias 	Anti-Material Rifle</li>
                  <li>DESIGNED BY 	Ron Barrett</li>
                  <li>SPECS 	57" (1448 mm)</li>
                  <li>CALIBRE 	50 BMG</li>
                  <li>ACTION 	Recoil Operated, Semi-Automatic</li>
                  <li>WEIGHT	32.7 lbs. (14.8 kg)</li>
                  <li>ORIGIN 	USA</li>
                  <li>MAG CAPACITY	10</li>
                  <li>RATE OF FIRE 	416</li>
                </ul></>
            }

            {
              <span className="top_arrow">
                <img alt="" src={!toggle ? "../img/bottom_arrow.png" : "../img/top_arrow.png"} onClick={() => setToggle(toggle => !toggle)} className="img-showMore less img-fluid" />
              </span>
            }

          </div>

        </div>
      </section>
      <section className="collection_list mb-5 pb-5">
        <div className="container">
          <div className="event_slider">
            <MintEventSlider id={id} price={price} calls={contractCalls} handleShowAlert={handleShowAlert} />
          </div>
        </div>
      </section>
      <Footer />


      {isShowPopup ? <ProgressModal datas={data} onRequestClose={() => {
        closePopup();
        setisShowPopup(!isShowPopup)
      }} disabled={closeDisabled} /> : ""}
    </div>
  );
}

export default MultiMintingPage;
