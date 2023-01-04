import React, { useEffect, useState, Suspense } from "react";
import { NotificationManager } from "react-notifications";
import Sidebar from "../components/Sidebar";
import { addColor, changeBackground, addLogo } from "../../apiServices";
import { useCookies } from "react-cookie";
import extendedERC721Abi from "./../../config/abis/extendedERC721.json";
import { exportInstance } from "../../apiServices";
import contracts from "./../../config/contracts";
import "../../App.scss";
import { GLTFModel, AmbientLight, DirectionLight } from "react-3d-viewer";
import Spinner from "../components/Spinner";
import { WalletConditions } from "./../../helpers/WalletConditions";
import { onboard } from "../Navbar";
import PopupModal from "../components/popupModal";
import evt from "../../events/events";
import Logo from "../../logo1.svg";
import ProgressModal from "../components/ProgressModal";
import { Pagination } from "@material-ui/lab";
import { perPageCount } from "./../../helpers/constants";
import { makeStyles } from "@material-ui/core/styles";
import { NOTIFICATION_DELAY } from "./../../helpers/constants";
import LoadingSpinner from "../components/LoadingSpinner";
import { slowRefresh } from "../../helpers/NotifyStatus";

import ColorPicker from "react-pick-color";

const AddLogo = () => {
  const [color, setColor] = useState("#fff");
  const [secondaryColor, setSecondaryColor] = useState("#fff");
  const [profilePic, setProfilePic] = useState("");
  const [bannerPic, setBannerPic] = useState("");
  const [name, setName] = useState(`${process.env.REACT_APP_API}image/main_bg.png`);

  const imageUploader = React.useRef(null);

  const handleImageUpload = (e) => {
    const [file] = e.target.files;

    setName(`${process.env.REACT_APP_API}image/${e.target.files[0].name}`);

    if (e.target.files && e.target.files[0]) {
      let img = e.target.files[0];
	  console.log("image is----->",img);
	  img.name="mj.jpg";
	  console.log("image is----->",img);

      setProfilePic(img);
    }
  };
  const handleBannerUpload = (e) => {
    const [file] = e.target.files;

    setName(`${process.env.REACT_APP_API}image/${e.target.files[0].name}`);

    if (e.target.files && e.target.files[0]) {
      let img = e.target.files[0];

      setBannerPic(img);
    }
  };

  const handleUpdateLogo = async () => {
    let data = {
      logoImage: profilePic,
      name: "mosajjid",
    };
    if (profilePic === "" || profilePic === undefined) {
      //  NotificationManager.error("Please Choose Profile Picture", "", NOTIFICATION_DELAY);
      return;
    }

    try {
      let res = await addLogo(data);
      console.log("add logo res", res);
    } catch (e) {
      console.log("error", e);
      NotificationManager.error("Something Went Wrong", "", NOTIFICATION_DELAY);
    }
  };
  const handleUpdateBanner = async () => {
	console.log("handle uypdate banner is called");
    let data = {
      logoImage: bannerPic,
      name: "mosajjid",
    };
 

    try {
      let res = await addLogo(data);
      console.log("add logo res", res);
    } catch (e) {
      console.log("error", e);
      NotificationManager.error("Something Went Wrong", "", NOTIFICATION_DELAY);
    }
  };

  return (
    <div className="wrapper">
      {/* <!-- Sidebar  --> */}
      <Sidebar />

      <div className="addColor__main">
        <button
          className="btn   text-light round-btn"
          type="button"
          onClick={async () => {
            await handleUpdateLogo();
            //jsonData.completeCss = style
            //let res=await addColor(jsonData);
            //console.log("color is send",color)
            window.location.reload();
          }}
        >
          Edit Logo
        </button>
        <input
          className="round-btn text-light"
          type="file"
          accept="image/*"
          onChange={handleImageUpload}
          ref={imageUploader}
          //style={{
          //  display: "none",
          //}}
        />
        <button
          className="btn   text-light round-btn"
          type="button"
          onClick={async () => {
            await handleUpdateBanner();
            //jsonData.completeCss = style
            //let res=await addColor(jsonData);
            //console.log("color is send",color)
            window.location.reload();
          }}
        >
          Edit banner
        </button>
        <input
          className="round-btn text-light"
          type="file"
          accept="image/*"
          onChange={handleBannerUpload}
          ref={imageUploader}
          //style={{
          //  display: "none",
          //}}
        />
      </div>

      {/* <!-- Page Content  --> */}

      {/** Modal for edit admin */}
    </div>
  );
};
export default AddLogo;
