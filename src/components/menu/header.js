import React, { useEffect, useState, useRef } from "react";
import { setDefaultBreakpoints } from "react-socks";
import { Link, NavLink } from "react-router-dom";
import Onboard from "@web3-onboard/core";
import injectedModule from "@web3-onboard/injected-wallets";
import walletConnectModule from "@web3-onboard/walletconnect";
import Logo from "./../../assets/images/logo.svg";
import {
  checkAuthorization,
  checkuseraddress,
  getProfile,
  Login,
  Logout,
  Register,
} from "../../apiServices";
import "react-notifications/lib/notifications.css";
import { useCookies } from "react-cookie";
import AllNFTs from "../SVG/AllNFTs";
import Firearmsvg from "../SVG/Firearmsvg";
import { slowRefresh } from "./../../helpers/NotifyStatus";
import "./../components-css/App.scss";
import { getCollections, getNFTs } from "../../helpers/getterFunctions";
import { getCategory } from "./../../helpers/getterFunctions";
import defaultProfile from "../../assets/images/favicon.png";
import menuIcon from "../../assets/menu.png";
import evt from "./../../events/events";
import { NotificationManager } from "react-notifications";
import { NOTIFICATION_DELAY } from "../../helpers/constants";
import Loader from "../components/Loader";
import { useCallback } from "react";
import debounce from "lodash.debounce";

var CryptoJS = require("crypto-js");

const Web3 = require('web3');
// web3 lib instance
const web3 = new Web3(window.ethereum);


setDefaultBreakpoints([{ xs: 0 }, { l: 1199 }, { xl: 1200 }]);

const injected = injectedModule();
const walletConnect = walletConnectModule();



export const onboard = Onboard({
  wallets: [
    // walletConnect, 
    injected],
  chains: [
    {
      id: "0x13881",
      token: "MATIC",
      label: "Mumbai matic testnet",
      rpcUrl: `https://rpc-mumbai.maticvigil.com/`,
    },

    {
      id: "0x4",
      token: "rETH",
      label: "Ethereum Rinkeby Testnet",
      rpcUrl: `https://rinkeby.infura.io/v3/59c3f3ded6a045b8a92d1ffb5c26e91f`,
    },
    {
      id: "0x38",
      token: "BNB",
      label: "Binance Smart Chain",
      rpcUrl: "https://bsc-dataseed.binance.org/",
    },
    {
      id: "0x89",
      token: "MATIC",
      label: "Matic Mainnet",
      rpcUrl: "https://matic-mainnet.chainstacklabs.com",
    },
    {
      id: "0x61",
      token: "BNB",
      label: "Binance Testnet",
      rpcUrl: "https://data-seed-prebsc-2-s2.binance.org:8545/",
    },
  ],
  appMetadata: {
    name: "DigitalArms",
    icon: Logo,
    logo: Logo,
    description: "DigitalArms using Onboard",
    // agreement: {
    //   version: "1.0.0",
    //   termsUrl: "https://www.blocknative.com/terms-conditions",
    //   privacyUrl: "https://www.blocknative.com/privacy-policy",
    // },
    recommendedInjectedWallets: [
      { name: "MetaMask", url: "https://metamask.io" },
      { name: "Coinbase", url: "https://wallet.coinbase.com/" },
    ],
  },
  i18n: {
    en: {
      connect: {
        selectingWallet: {
          header: "Available Wallets",
        },
        connectedWallet: {
          header: "Connection Successful",
          sidebar: {
            subheading: "Connection Successful!",
            paragraph: "Your wallet is now connected to {app}"
          },
          mainText: "Connecting..."
        }
      },
    },
    modals: {
      actionRequired: {
        enabled: false,
      }
    }
  },
  accountCenter: {
    desktop: {
      enabled: false,
    },
  },

});


evt.setMaxListeners(1);
const Header = function () {
  const [cookies, setCookie, removeCookie] = useCookies([]);
  const [account, setAccount] = useState();
  const [userDetails, setUserDetails] = useState();
  const [scolns, setSColns] = useState("none");
  const [sNfts, setSNfts] = useState("none");
  const [showSearchDiv, setShowSearchDiv] = useState("");
  const [searchedText, setShowSearchedText] = useState("");
  const [catg, setCatg] = useState([]);
  const [searchValue, setSearchValue] = useState("");
  const [isBlocked, setIsBlocked] = useState(false);
  const searchBox = useRef(null);
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    async function setCategory() {
      const cat = await getCategory();
      setCatg(cat);
    }
    setCategory();
  }, []);

  evt.setMaxListeners(1)
  evt.removeAllListeners("disconnectWallet");
  evt.on("disconnectWallet", () => {
    disconnectWallet()
  });
  evt.removeAllListeners("connectWallet");
  evt.on("connectWallet", () => {
    connectWallet()
  });


  useEffect(() => {
    async function setCookies() {
      if (cookies["selected_account"]) {
        setAccount(cookies["selected_account"]);
        try {
          await onboard.connectWallet({
            autoSelect: { label: cookies["label"], disableModals: true },
          });
        } catch (e) {
          NotificationManager.error("Please Refresh", "", NOTIFICATION_DELAY)
        }

      }
    }
    setCookies();
  }, []);

  useEffect(() => {

    // Function for click event
    function handleOutsideClick(event) {
      if (searchBox.current && !searchBox.current.contains(event.target)) {
        setShowSearchDiv("");
        setSearchValue("")
      }
    }
    // Adding click event listener
    document.addEventListener("click", handleOutsideClick);
    return () => document.removeEventListener("click", handleOutsideClick);
  }, [searchBox]);

  const refreshState = () => {
    removeCookie("selected_account", { path: "/" });
    // removeCookie("chain_id", { path: "/" });
    removeCookie("label", { path: "/" });
    localStorage.clear();
    setAccount("");
  };
  evt.removeAllListeners("refreshState");
  evt.on("refreshState", () => {
    refreshState();
    slowRefresh(1000);
  });


  const getUserProfile = async () => {
    const profile = await getProfile();
    localStorage.setItem("userId", profile?.data?._id)
    setUserDetails(profile?.data);
  };

  useEffect(() => {
    async function getUserProfileData() {
      if (account && !userDetails) getUserProfile();
    }
    getUserProfileData();
  }, [account, userDetails]);

  const connectWallet = async () => {
    try {
      const wallets = await onboard.connectWallet();

      if (wallets?.length !== 0) {

        const chain = await onboard.setChain({
          chainId: process.env.REACT_APP_CHAIN_ID,
        });

        if (chain) {
          const primaryWallet = wallets[0];
          const address = primaryWallet.accounts[0].address;

          try {
            if (web3.eth) {
              const siteUrl = process.env.REACT_APP_SITE_URL;
              let nonce = "";
              await web3.eth.getTransactionCount(address).then(async (result) => {
                nonce = CryptoJS.AES.encrypt(JSON.stringify(result), 'DASecretKey').toString();
              })
              const message = `Welcome to Digital Arms!\n\nClick to sign in and accept the Digital Arms Terms of Service: ${siteUrl}/\n\nThis request will not trigger a blockchain transaction or cost any gas fees.\n\nYour authentication status will reset after 24 hours.\n\nWallet address:\n${address}\n\nNonce:\n${nonce}`;
              web3.eth.currentProvider.sendAsync({
                method: 'personal_sign',
                params: [message, address],
                from: address,
              }, async function (err, signature) {
                if (!err) {
                  try {
                    userAuth(primaryWallet, address, signature.result, message);
                  } catch (e) {
                    console.log("Error in user auth", e);
                  }
                } else {
                  if (err.code === 4001 || JSON.stringify(err).includes("user rejected transaction")) {
                    await onboard.disconnectWallet({ label: wallets[0].label });
                    NotificationManager.error("User Denied Signature", "", NOTIFICATION_DELAY)
                    refreshState();
                  }
                }
              })
            }
          }
          catch (e) {
            console.log("error in catch ", e);
          }
        }
        else {
          NotificationManager.error("Please Switch Network", "", NOTIFICATION_DELAY);
          await onboard.disconnectWallet({ label: wallets[0].label });
          refreshState();
          return;
        }
      }
    }
    catch (e) {
      NotificationManager.error("Please Refresh", "", NOTIFICATION_DELAY);
      refreshState();
    }

  };

  const userAuth = async (primaryWallet, address, signature, message) => {
    try {
      const isUserExist = await checkuseraddress(address);
      if (isUserExist === "User not found") {
        try {
          const res = await Register(address);
          if (res?.message === "Wallet Address required") {
            NotificationManager.info(res?.message, "", NOTIFICATION_DELAY);
            await onboard.disconnectWallet({ label: primaryWallet.label });
            refreshState();
            return;
          } else if (res?.message === "User already exists") {
            NotificationManager.error(res?.message, "", NOTIFICATION_DELAY);
            await onboard.disconnectWallet({ label: primaryWallet.label });
            refreshState();
            return;
          } else {

            const authorisation = await checkAuthorization();
            if (authorisation) {
              setAccount(primaryWallet.accounts[0]?.address);
              setCookie("selected_account", address, { path: "/" });
              setCookie("label", primaryWallet.label, { path: "/" });
              getUserProfile();
              NotificationManager.success(res?.message, "", NOTIFICATION_DELAY);
              slowRefresh(1000);
              return;
            } else {
              NotificationManager.error("Unauthorised User", "", NOTIFICATION_DELAY);
              await onboard.disconnectWallet({ label: primaryWallet.label });
              refreshState();
              return;
            }
          }
        } catch (e) {
          NotificationManager.error(e, "", NOTIFICATION_DELAY);
          await onboard.disconnectWallet({ label: primaryWallet.label });
          refreshState();
          return;
        }
      } else {
        try {
          const res = await Login(address, signature, message);
          if (res?.message === "Wallet Address required") {
            NotificationManager.info(res?.message, "", NOTIFICATION_DELAY);
            await onboard.disconnectWallet({ label: primaryWallet.label });
            refreshState();
            return;
          } else if (
            res?.message === "User not found" ||
            res?.message === "Login Invalid"
          ) {
            NotificationManager.error(res?.message, "", NOTIFICATION_DELAY);
            await onboard.disconnectWallet({ label: primaryWallet.label });
            refreshState();
            return;
          } else {
            const authorisation = await checkAuthorization();
            if (authorisation) {
              setAccount(primaryWallet.accounts[0]?.address);
              setCookie("selected_account", address, { path: "/" });
              setCookie("label", primaryWallet.label, { path: "/" });
              getUserProfile();
              NotificationManager.success(res?.message, "", NOTIFICATION_DELAY);
              slowRefresh(1000);
              return;
            } else {
              NotificationManager.error("Unauthorised User", "", NOTIFICATION_DELAY);
              await onboard.disconnectWallet({ label: primaryWallet.label });
              refreshState();
              return;
            }
          }
        }
        catch (e) {
          await onboard.disconnectWallet({ label: primaryWallet.label });
          refreshState();
          return;
        }
      }
    } catch (e) {
      await onboard.disconnectWallet({ label: primaryWallet.label });
      refreshState();
      return
    }
  };

  const disconnectWallet = async () => {
    await onboard.disconnectWallet({ label: cookies["label"] });
    await Logout(cookies["selected_account"]);
    refreshState();
    if (window.location.pathname === '/myNfts' || window.location.pathname === '/userprofile') {
      window.location.href = "/"
    }
    NotificationManager.success("User Logged Out Successfully", "", NOTIFICATION_DELAY);
    slowRefresh(1000);
  };


  useEffect(() => {
    setLoading(true);
    const fetch = async () => {
      const reqData = {
        page: 1,
        limit: 12,
        searchText: searchValue,
      };
      const colns = await getCollections(reqData);
      setSColns(colns);
      const nfts = await getNFTs(reqData);
      setSNfts(nfts);
      if (!colns || !nfts) {
        scolns("none");
        sNfts("none")
        setShowSearchDiv("");
      }
      setLoading(false);
    }
    if (searchValue)
      fetch();
  }, [searchValue])


  const handleSearch = async (e) => {
    const { value } = e.target;
    if (value !== "") {
      setSearchValue(value);
      setShowSearchDiv("active");
      setShowSearchedText(value);
      setSColns("none");
      setSNfts("none")
    } else {
      setSearchValue("")
      setShowSearchDiv("");
    }
  };



  const optimisedSearchHandle = useCallback(debounce(handleSearch, 300), []);


  return (
    <header id="myHeader">
      <nav className="navbar navbar-expand-lg">
        <div className="nav-container container">
          <Link className="navbar-brand" to="/">
            <img src={`${process.env.REACT_APP_API}image/logo.png`} className="img-fluid d-block" alt="" />
          </Link>
          <button
            className="navbar-toggler"
            type="button"
            data-bs-toggle="collapse"
            data-bs-target="#navbarSupportedContent"
            aria-controls="navbarSupportedContent"
            aria-expanded="false"
            aria-label="Toggle navigation"
          >
            {/* <span className='navbar-toggler-icon'></span> */}
            <img src={menuIcon} alt="" />
          </button>
          <div className="collapse navbar-collapse" id="navbarSupportedContent">
            <div className="d-flex navbar_form">
              <input
                className="form-control me-2 "
                type="text"
                placeholder="Search item here..."
                aria-label="Search"
                ref={searchBox}
                onChange={optimisedSearchHandle}
                onKeyPress={(e) => {
                  const { value } = e.target;
                  if (value !== "") {
                    if (e.key === "Enter") {
                      if (sNfts?.length > 0)
                        window.location.href = `/marketplace/${searchedText}`;
                      if (scolns?.length > 0)
                        window.location.href = `/marketplacecollection/${searchedText}`;
                    }
                  }
                }
                }
              />
              <button className='search_btn' type='submit' onClick={() => {
                if (searchedText !== "") {
                  if (sNfts?.length > 0)
                    window.location.href = `/marketplace/${searchedText}`;
                  if (scolns?.length > 0)
                    window.location.href = `/marketplacecollection/${searchedText}`;
                }
              }}>

                <img src={"../img/search.svg"} alt='' />

              </button>
            </div>
            {!loading && searchValue !== "" && ((sNfts !== "none" && sNfts?.length > 0 && searchedText) || (scolns !== "none" && scolns?.length > 0 && searchedText)) ? (
              <div className={`searched_div ${showSearchDiv}`}>
                {scolns?.length > 0 && <p>Collections</p>}
                <ul>
                  {scolns
                    ? scolns?.slice(0, 3)?.map((item) => {
                      return (
                        <a href={`/collection/${item._id}`}>
                          <li> {item.name}</li>
                        </a>
                      );
                    })
                    : ""}
                </ul>
                {scolns?.length > 3 && (
                  <a
                    className="view_all_bdr search_view_all mb-3"
                    href={`/marketplaceCollection/${searchedText}`}
                  >
                    View All
                  </a>
                )}
                {sNfts?.length > 0 && <p>NFTs</p>}
                <ul>
                  {sNfts
                    ? sNfts?.slice(0, 3)?.map((item) => {
                      return (
                        <a href={`/NFTdetails/${item.id}`}>
                          <li>{item.name}</li>
                        </a>
                      );
                    })
                    : ""}
                </ul>
                {sNfts?.length > 3 && (
                  <a
                    className="view_all_bdr search_view_all"
                    href={`/marketplace/${searchedText}`}
                  >
                    View All
                  </a>
                )}
              </div>
            ) : (
              ""
            )}
            {
              !loading && (scolns !== "none" && scolns?.length <= 0 && sNfts !== "none" && sNfts?.length <= 0) && searchValue !== "" ?
                <div className={`searched_div active`}>
                  <span className='d-block no_data_text'>
                    No Result Found
                  </span></div> : ""
            }
            {loading && (sNfts === "none" || scolns == "none") && searchValue !== "" ? <div className={`searched_div active`}><Loader /></div> : ""}
            <ul className="navbar-nav me-auto align-items-center mb-2 mb-lg-0">
              <li className="nav-item">
                <NavLink
                  className="nav-link"
                  aria-current="page"
                  to="/marketplace"
                >
                  Marketplace
                </NavLink>
                <ul className="sub_menu">
                  <li>
                    <NavLink to={"/marketplace"} className="sub-items">
                      <AllNFTs />
                      All NFTs
                    </NavLink>
                  </li>
                  {catg?.length > 0
                    ? catg?.map((c, key) => {
                      return (
                        <li key={key}>
                          <NavLink
                            to={`/marketplacecollection/${c.name}`}
                            className="sub-items"
                          >
                            <Firearmsvg />
                            {c.name}
                          </NavLink>
                        </li>
                      );
                    })
                    : ""}

                </ul>
              </li>
              <li className="nav-item">
                <NavLink className="nav-link" to={"/marketplacecollection"}>
                  Collections
                </NavLink>
              </li>
              <li className='nav-item'>
                <a className='nav-link'>
                  Resources</a>
                <ul className="sub_menu">
                  <li>
                    <a href={`${process.env.REACT_APP_BLOG_URL}help-center`} className="sub-items">
                      Help Center
                    </a>
                  </li>
                  <li>
                    <a href={`${process.env.REACT_APP_BLOG_URL}partners`} className="sub-items">
                      Partners
                    </a>
                  </li>
                  <li>
                    <a href={`${process.env.REACT_APP_BLOG_URL}blog`} className="sub-items">
                      Blog
                    </a>
                  </li>
                  <ul className="subsocial-icons mt-3">
                    <li>
                      <a href="https://www.facebook.com/digitalarmsnft">
                        <i className="fa fa-facebook fa-lg"></i>
                      </a>
                    </li>
                    <li>
                      <a href="https://twitter.com/DigitalArmsNFT">
                        <i className="fa fa-twitter fa-lg"></i>
                      </a>
                    </li>
                    <li>
                      <a href="https://www.linkedin.com/company/digital-arms-hntr-token/">
                        <i className="fa fa-linkedin fa-lg"></i>
                      </a>
                    </li>
                    <li>
                      <a href={"/"}>
                        <i className="fa fa-pinterest fa-lg"></i>
                      </a>
                    </li>
                    <li>
                      <a href={"/"}>
                        <i className="fa fa-rss fa-lg"></i>
                      </a>
                    </li>
                  </ul>
                </ul>
              </li>
              {!userDetails ? (
                <>
                  <li className="nav-item">
                    <button

                      onClick={!account ? connectWallet : disconnectWallet}
                      className='main_btn'
                      tabIndex='-1'>
                      {!account
                        ? "Connect Wallet"
                        : account.slice(0, 4) + "..." + account.slice(38, 42)}
                    </button>
                  </li>
                </>
              ) : (
                <>
                  {/* <li className='nav-item'>
                    <div className='cart_qt'>
                      <svg
                        width='25'
                        height='23'
                        viewBox='0 0 25 23'
                        fill='none'
                        xmlns='http://www.w3.org/2000/svg'>
                        <path
                          d='M5.34659 1.9665L3.74432 0.3335C0 4.09745 0 6.82525 0 10.35H1.13636L2.27273 10.2775C2.27273 6.91035 2.27273 5.0554 5.34659 1.9665ZM21.2545 0.3335L19.6545 1.9665C22.7273 5.0554 22.7273 6.91035 22.7273 10.35L25 10.2775C25 6.82525 25 4.09745 21.2545 0.3335ZM12.5 23C13.2037 23.0009 13.8903 22.7799 14.4642 22.3677C15.0381 21.9555 15.4708 21.3726 15.7023 20.7H9.29773C9.52916 21.3726 9.96191 21.9555 10.5358 22.3677C11.1097 22.7799 11.7963 23.0009 12.5 23ZM20.4545 14.4739V9.2C20.4545 5.50045 17.9716 2.38395 14.608 1.4467C14.275 0.598 13.4614 0 12.5 0C11.5386 0 10.725 0.598 10.392 1.4467C7.02727 2.38395 4.54545 5.50045 4.54545 9.2V14.4739L2.60568 16.4369C2.49995 16.5436 2.4161 16.6703 2.35896 16.8098C2.30182 16.9494 2.27251 17.099 2.27273 17.25V18.4C2.27273 18.705 2.39245 18.9975 2.60556 19.2132C2.81867 19.4288 3.10771 19.55 3.40909 19.55H21.5909C21.8923 19.55 22.1813 19.4288 22.3944 19.2132C22.6075 18.9975 22.7273 18.705 22.7273 18.4V17.25C22.7275 17.099 22.6982 16.9494 22.641 16.8098C22.5839 16.6703 22.5 16.5436 22.3943 16.4369L20.4545 14.4739Z'
                          fill='#EF981D'
                        />
                      </svg>
                      <span className='cartqt'>9</span>
                    </div>
                  </li> */}
                  <li className='nav-item'>
                    <div tabIndex='-1' className='profile_pic'>
                      <img
                        src={
                          userDetails?.profileIcon
                            ? userDetails.profileIcon
                            : defaultProfile
                        }
                        className="img-fluid hunter_fav"
                        alt="favicon"
                      />
                    </div>

                    <ul className="sub_menu">
                      <li className="sub_pdd">
                        <span className="Connected">Connected </span>
                        <div className="sub_div">
                          <div className="profile_pic mr-3">
                            <img
                              src={
                                userDetails?.profileIcon
                                  ? userDetails.profileIcon
                                  : defaultProfile
                              }
                              className="img-fluid hunter_fav"
                              alt="favicon"
                            />
                          </div>
                          <div className="">
                            <h6>
                              {userDetails?.username === ""
                                ? "unnamed"
                                : userDetails?.username}
                            </h6>
                            <p>
                              {account?.slice(0, 4) +
                                "..." +
                                account?.slice(38, 42)}
                            </p>
                          </div>
                        </div>
                      </li>
                      <li>
                        <NavLink to={"/userprofile"} className="sub-items">
                          <svg
                            width="20"
                            height="20"
                            viewBox="0 0 20 20"
                            fill="none"
                            xmlns="http://www.w3.org/2000/svg"
                          >
                            <path
                              d="M10 0C11.3261 0 12.5979 0.526784 13.5355 1.46447C14.4732 2.40215 15 3.67392 15 5C15 6.32608 14.4732 7.59785 13.5355 8.53553C12.5979 9.47322 11.3261 10 10 10C8.67392 10 7.40215 9.47322 6.46447 8.53553C5.52678 7.59785 5 6.32608 5 5C5 3.67392 5.52678 2.40215 6.46447 1.46447C7.40215 0.526784 8.67392 0 10 0ZM10 12.5C15.525 12.5 20 14.7375 20 17.5V20H0V17.5C0 14.7375 4.475 12.5 10 12.5Z"
                              fill="#EF981D"
                            />
                          </svg>{" "}
                          My Account
                        </NavLink>
                      </li>
                      <li>
                        <NavLink
                          to={`/myNfts`}
                          className="sub-items"
                        >
                          <svg
                            width="20"
                            height="20"
                            viewBox="0 0 20 20"
                            fill="none"
                            xmlns="http://www.w3.org/2000/svg"
                          >
                            <path
                              d="M8.57143 5.71429H4.28571V8.57143H8.57143V5.71429ZM0 4.28571C0 3.14907 0.451529 2.05898 1.25526 1.25526C2.05898 0.451529 3.14907 0 4.28571 0H12.8571V20H4.28571C3.14907 20 2.05898 19.5485 1.25526 18.7447C0.451529 17.941 0 16.8509 0 15.7143V4.28571ZM2.85714 5.71429V8.57143C2.85714 8.95031 3.00765 9.31367 3.27556 9.58158C3.54347 9.84949 3.90683 10 4.28571 10H8.57143C8.95031 10 9.31367 9.84949 9.58158 9.58158C9.84949 9.31367 10 8.95031 10 8.57143V5.71429C10 5.33541 9.84949 4.97204 9.58158 4.70413C9.31367 4.43622 8.95031 4.28571 8.57143 4.28571H4.28571C3.90683 4.28571 3.54347 4.43622 3.27556 4.70413C3.00765 4.97204 2.85714 5.33541 2.85714 5.71429ZM3.57143 11.4286C3.38199 11.4286 3.20031 11.5038 3.06635 11.6378C2.9324 11.7717 2.85714 11.9534 2.85714 12.1429C2.85714 12.3323 2.9324 12.514 3.06635 12.6479C3.20031 12.7819 3.38199 12.8571 3.57143 12.8571H9.28571C9.47515 12.8571 9.65684 12.7819 9.79079 12.6479C9.92475 12.514 10 12.3323 10 12.1429C10 11.9534 9.92475 11.7717 9.79079 11.6378C9.65684 11.5038 9.47515 11.4286 9.28571 11.4286H3.57143ZM2.85714 15C2.85714 15.1894 2.9324 15.3711 3.06635 15.5051C3.20031 15.639 3.38199 15.7143 3.57143 15.7143H9.28571C9.47515 15.7143 9.65684 15.639 9.79079 15.5051C9.92475 15.3711 10 15.1894 10 15C10 14.8106 9.92475 14.6289 9.79079 14.4949C9.65684 14.361 9.47515 14.2857 9.28571 14.2857H3.57143C3.38199 14.2857 3.20031 14.361 3.06635 14.4949C2.9324 14.6289 2.85714 14.8106 2.85714 15ZM14.2857 20H15.7143C16.8509 20 17.941 19.5485 18.7447 18.7447C19.5485 17.941 20 16.8509 20 15.7143V14.2857H14.2857V20ZM20 12.8571V7.14286H14.2857V12.8571H20ZM20 5.71429V4.28571C20 3.14907 19.5485 2.05898 18.7447 1.25526C17.941 0.451529 16.8509 0 15.7143 0H14.2857V5.71429H20Z"
                              fill="#EF981D"
                            />
                          </svg>{" "}
                          My NFTs
                        </NavLink>
                      </li>
                      {/* <li>
                        <NavLink to={"/Notifications"} className="sub-items">
                          <svg
                            className='hide'
                            width='24'
                            height='24'
                            viewBox='0 0 24 24'
                            fill='none'
                            xmlns='http://www.w3.org/2000/svg'>
                            <path
                              d="M12 0C5.38267 0 0 5.38267 0 12V12.0013L6.66667 6.668V10.668H16V13.3347H6.66667V17.3347L0 12.0013C0.00133333 18.6187 5.38267 24 12 24C18.6173 24 24 18.6173 24 12C24 5.38267 18.6173 0 12 0Z"
                              fill="#EF981D"
                            />
                          </svg>
                          Preferences
                        </NavLink>
                      </li> */}
                      <li>
                        <NavLink
                          to={""}
                          className="sub-items"
                          onClick={disconnectWallet}
                        >
                          <svg
                            width="24"
                            height="24"
                            viewBox="0 0 24 24"
                            fill="none"
                            xmlns="http://www.w3.org/2000/svg"
                          >
                            <path
                              d="M12 0C5.38267 0 0 5.38267 0 12V12.0013L6.66667 6.668V10.668H16V13.3347H6.66667V17.3347L0 12.0013C0.00133333 18.6187 5.38267 24 12 24C18.6173 24 24 18.6173 24 12C24 5.38267 18.6173 0 12 0Z"
                              fill="#EF981D"
                            />
                          </svg>{" "}
                          Disconnect
                        </NavLink>
                      </li>
                    </ul>
                  </li>
                  <li className="nav-item">
                    <button
                      className='square_yello'
                      tabIndex='-1'
                      onClick={disconnectWallet}>
                      <img src='../img/edit.png' alt='edit' />{" "}
                      {account?.slice(0, 4) + "..." + account?.slice(38, 42)}
                    </button>
                  </li>
                </>
              )}
            </ul>
            {/* <p>expand object select mention floor lumber unaware already narrow industry visit bundle</p> */}
          </div>
        </div>
      </nav>
    </header>
  );
};
export default Header;
