import React, { useEffect, useState } from "react";
import Slider from "./slick-loader/slider";
import "slick-carousel/slick/slick.css";
import "slick-carousel/slick/slick-theme.css";
import { Link } from "react-router-dom";
import Wallet from "../SVG/wallet";
import { convertToEth } from "../../helpers/numberFormatter";
import "../components-css/App.scss";
import evt from "../../events/events";
import BigNumber from "bignumber.js";
import { useCookies } from "react-cookie";
import DevTeam from "./../../assets/images/devTeam.png";
import { MAX_WHITELIST_BUY_PER_USER } from "../../helpers/constants"
import Spinner from "../components/Spinner"
import { WalletConditions } from "../components/WalletConditions"
import { NumberKeyframeTrack } from "three";

evt.setMaxListeners(1);
function MintEventSlider(props) {
  let contract = props.calls;
  var settings = {
    slidesToShow: 3,
    slidesToScroll: 1,
    centerMode: true,
    arrows: true,
    dots: false,
    speed: 300,
    centerPadding: "0px",
    infinite: false,
    initialSlide: 0,
    responsive: [
      {
        breakpoint: 1024,
        settings: {
          slidesToShow: 3,
          slidesToScroll: 1,
          infinite: false,
        },
      },
      {
        breakpoint: 1023,
        settings: {
          slidesToShow: 1,
          slidesToScroll: 1,
        },
      },
    ],
  };
  const [cookies] = useCookies([]);
  const [currQty, setCurrQty] = useState(0);
  const [price, setPrice] = useState();
  const [maxNFT, setMaxNFT] = useState(0);
  const [currentUser, setCurrentUser] = useState()
  const [reload, setReload] = useState(false)
  const [status, setStatus] = useState("")

  useEffect(() => {
    setCurrentUser(cookies.selected_account)
  }, [cookies.selected_account])

  const fetchData = async () => {
    let { fetchInfo, fetchUserBal } = await contract;
    let getcateg = await fetchInfo(props.id);
    if (currentUser) {
      let bal = await fetchUserBal(currentUser, props.id)

      if (parseInt(getcateg[3]) > parseInt(bal)) {
        if (MAX_WHITELIST_BUY_PER_USER > parseInt(getcateg[3])) {
          setMaxNFT(parseInt(getcateg[3]) - parseInt(bal));
        }
        else {
          setMaxNFT(MAX_WHITELIST_BUY_PER_USER - parseInt(bal));
        }

      }
      else {
        setMaxNFT(0);
      }

    }
    setStatus(getcateg[4])
    setPrice(convertToEth(new BigNumber(getcateg[0]?.toString())));
  };

  useEffect(() => {
    if (props.id)
      fetchData();
    setCurrQty(0)
  }, [props.id, currentUser, reload]);

  const connectWalletEvent = () => {
    evt.emit("connectWallet");
  };

  const mintFunction = async (qty, price, user) => {
    let { testMint } = await contract;
    let result = await testMint(props.id, qty, price, user);
    return result
  };

  return (
    <Slider {...settings}>

      <div className="mintevent text-center">

        <div className="start_btn stamintFunctionbtn">
          Start
          <span>{status ? status : ""}</span>
        </div>
        <h4>Mint Event</h4>
        <div className="da_img mb-3">
          <img src={DevTeam} alt="" />
        </div>
        {!currentUser ? (
          <button
            className="connect_wallet_btn mb-4"
            onClick={() => {
              connectWalletEvent();
            }}
          >
            {" "}
            <Wallet /> Connect Wallet
          </button>
        ) : (
          ""
        )}
        <div className="mintprice">Mint Price {price} HNTR</div>
        <div className="amount">
          <h5>Select Amount</h5>
          <p>Minimum Amount for mint is 1*</p>
          <div className="qt_selector">
            <button
              onClick={() => {
                let mint = currQty - 1;
                if (mint < 1) mint = 0;
                if (mint > maxNFT) mint = maxNFT;
                setCurrQty(Number(mint));
              }}
            >
              -
            </button>

            <input
              type="text"
              name=""
              required=""
              id=""
              onKeyPress={(e) => {
                if (!/^\d+$/.test(e.key)) e.preventDefault();
              }}
              onChange={(e) => {
                if (Number(e.target.value) > maxNFT)
                  e.preventDefault();
                if (Number(e.target.value) > maxNFT) setCurrQty(Number(maxNFT));
                else
                  setCurrQty(Number(e.target.value));
              }}

              value={currQty}
            />

            <button
              onClick={() => {
                let mint = currQty + 1;
                if (mint < 1) mint = 0;
                if (mint > maxNFT) mint = maxNFT;
                setCurrQty(Number(mint));
              }}
            >
              +
            </button>
          </div>
          <div className="mint_btn mt-4">
            <button
              className=""
              type="button"
              onClick={async (e) => {
                const wCheck = WalletConditions();
                if (wCheck !== undefined) {
                  props.handleShowAlert(wCheck);
                  return;
                }
                await mintFunction(currQty, price, currentUser);
                setReload(!reload)
              }}
              disabled={!currentUser || currQty <= 0 || status !== "Live"}
            >
              Mint
            </button>
          </div>
        </div>
      </div>
    </Slider>
  );
}

export default MintEventSlider;
