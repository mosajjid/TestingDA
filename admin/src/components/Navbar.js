import React, { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import Wallet from "./SVG/Wallet";
import Onboard from "@web3-onboard/core";
import injectedModule from "@web3-onboard/injected-wallets";
import Logo from "./../user.jpg"
import walletConnectModule from "@web3-onboard/walletconnect";
import {
  checkuseraddress,
  getProfile,
  Login,
  Logout,
  isSuperAdmin,
  logoutSuperAdmin,
  CheckIfBlocked,
} from "./../apiServices";
import { NotificationManager } from "react-notifications";
import "react-notifications/lib/notifications.css";
import { useCookies } from "react-cookie";
import { slowRefresh } from "./../helpers/NotifyStatus";
import evt from "../events/events";
import LandingPage from "../LandingPage";
import { NOTIFICATION_DELAY } from "./../helpers/constants";
var CryptoJS = require("crypto-js");

const Web3 = require('web3');
// web3 lib instance
const web3 = new Web3(window.ethereum);


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
      rpcUrl: `https://rpc-mumbai.matic.today/`,
    },
    // {
    //   id: "0x1",
    //   token: "ETH",
    //   label: "Ethereum Mainnet",
    //   rpcUrl: `https://mainnet.infura.io/v3/${process.env.INFURA_ID}`,
    // },
    // {
    //   id: "0x3",
    //   token: "tROP",
    //   label: "Ethereum Ropsten Testnet",
    //   rpcUrl: `https://ropsten.infura.io/v3/${process.env.INFURA_ID}`,
    // },
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





const Navbar = (props) => {
  const [cookies, setCookie, removeCookie] = useCookies([]);
  const [provider, setProvider] = useState();
  const [account, setAccount] = useState();
  const [chainId, setChainId] = useState();
  const [userDetails, setUserDetails] = useState();
  const [label, setLabel] = useState("");
  const [isBlocked, setIsBlocked] = useState(false)



  useEffect(() => {
    init();
  }, []);

  useEffect(() => {
    const fetch = async () => {
      if (cookies.da_selected_account || account) {
        let res = await CheckIfBlocked({ "walletAddress": account ? account : cookies.da_selected_account })
        if (res === false) {
          setCookie("da_role", "admin", { path: "/" })
        }
        setIsBlocked(res)
      }
    }
    fetch()
  }, [account, cookies.da_selected_account])

  const init = async () => {
    if (cookies["da_selected_account"]) {
      setAccount(cookies["da_selected_account"]);
      const s = await onboard.connectWallet({
        autoSelect: { label: cookies["da_label"], disableModals: true },
      });
    }
  };

  const refreshState = () => {
    removeCookie("da_selected_account", { path: "/" });
    // removeCookie("da_chain_id", { path: "/" });  
    removeCookie("balance", { path: "/" });
    removeCookie("da_label", { path: "/" });
    removeCookie("da_role", { path: "/" });
    localStorage.clear();
    setAccount("");
    setChainId("");
    setProvider(null);
  };

  const getUserProfile = async () => {
    const profile = await getProfile();
    setUserDetails(profile.data);
  };

  const connectWallet = async () => {

    if (window.ethereum) {
    } else {
      NotificationManager.error(
        "Non-Ethereum browser detected. You should consider trying MetaMask!", "", NOTIFICATION_DELAY
      );
    }
    const wallets = await onboard.connectWallet();

    if (wallets.length !== 0) {
      const chain = await onboard.setChain({
        chainId: process.env.REACT_APP_CHAIN_ID,
      });

      if (chain) {
        const primaryWallet = wallets[0];
        const address = primaryWallet.accounts[0].address;


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
            }
            else {
              if (err.code === 4001 || JSON.stringify(err).includes("user rejected transaction")) {
                await onboard.disconnectWallet({ label: wallets[0].label });
                refreshState();
              }
            }
            // window.location.reload()
          })
        }
      }
      else {
        NotificationManager.error("Please Switch Network", "", NOTIFICATION_DELAY);
        await onboard.disconnectWallet({ label: wallets[0].label });
        refreshState();
        return;
      }
    }
  };

  const userAuth = async (primaryWallet, address, signature, message) => {
    try {
      const isUserExist = await checkuseraddress(address);
      if (isUserExist?.message !== "User not found") {

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
          } else
            if (res?.message === "Admin Account is Blocked") {
              NotificationManager.error(res?.message, "", NOTIFICATION_DELAY);
              await onboard.disconnectWallet({ label: primaryWallet.label });
              refreshState();
              return;
            }
            else {
              setAccount(primaryWallet.accounts[0].address);
              setLabel(primaryWallet.label);
              // window.sessionStorage.setItem("role", res?.data?.userType);
              setCookie("da_role", res?.data?.userType, { path: "/" })
              setCookie("da_selected_account", address, { path: "/" });
              setCookie("da_label", primaryWallet.label, { path: "/" });
              // setCookie(
              //   "da_chain_id",
              //   primaryWallet.chains[0].id,
              //   {
              //     path: "/",
              //   }
              // );
              setCookie("balance", primaryWallet.accounts[0].balance, {
                path: "/",
              });
              getUserProfile();
              NotificationManager.success(res?.message, "", NOTIFICATION_DELAY);
              slowRefresh(1000);
              return;
            }
        } catch (e) {
          NotificationManager.error("Something Went Wrong", "", NOTIFICATION_DELAY);

          await onboard.disconnectWallet({ label: primaryWallet.label });
          refreshState();
          return;
        }
      }
      else {
        NotificationManager.error("Wallet is not Added as Admin", "", NOTIFICATION_DELAY);

        await onboard.disconnectWallet({ label: primaryWallet.label });
        refreshState();
        return;
      }
    } catch (e) {

      await onboard.disconnectWallet({ label: primaryWallet.label });
      refreshState();
      console.log("error ", e);
    }
  };

  const disconnectWallet = async () => {
    await onboard.disconnectWallet({ label: cookies["da_label"] });
    await Logout(cookies["da_selected_account"]);
    refreshState();
    NotificationManager.success("User Logged out Successfully", "", 800);
    setTimeout(() => {

      window.location.href = "/"
    }, 1000)
    // slowRefresh(1000);
  };

  evt.setMaxListeners(1)
  evt.removeAllListeners("disconnectWallet");
  evt.on("disconnectWallet", () => {
    disconnectWallet()
  });
  evt.removeAllListeners("connectWallet");
  evt.on("connectWallet", () => {
    connectWallet()
  });

  if ((!cookies.da_selected_account && !isSuperAdmin()) || isBlocked) {
    return <LandingPage connectWallet={connectWallet} />
  }

  return (


    <div className="admin-navbar d-flex w-100">

      <div className="profile_box text-light me-auto d-flex align-items-center text-uppercase montserrat font-400">
        <div className="profile_img">
          <img src={Logo} alt="" className="img-fluid" />
        </div>
        {props.model}
        <Link className="logo" to="/">
          Digital Arms
        </Link>
      </div>
      <ul className="p-0 m-0">
        <li>
          {isSuperAdmin() ? (
            <button
              className="round-btn montserrat text-light text-decoration-none"
              onClick={logoutSuperAdmin}
            >
              {"Logout"}
            </button>
          ) : (
            <button
              className="round-btn montserrat text-light text-decoration-none"
              onClick={!account ? connectWallet : disconnectWallet}
            >
              {!account ? (
                "Connect Wallet"
              ) : (
                <>
                  <Wallet />
                  {account?.slice(0, 4) + "..." + account?.slice(38, 42)}
                </>
              )}
            </button>
          )}
        </li>
      </ul>
    </div>
  );
};

export default React.memo(Navbar);
