import React,{useEffect,useState,Suspense} from "react";
import {NotificationManager} from "react-notifications";
import Sidebar from "../components/Sidebar";
import {
	addColor,changeBackground
} from "../../apiServices";
import {useCookies} from "react-cookie";
import extendedERC721Abi from "./../../config/abis/extendedERC721.json";
import {exportInstance} from "../../apiServices";
import contracts from "./../../config/contracts";
import "../../App.scss";
import {GLTFModel,AmbientLight,DirectionLight} from "react-3d-viewer";
import Spinner from "../components/Spinner";
import {WalletConditions} from "./../../helpers/WalletConditions";
import {onboard} from "../Navbar";
import PopupModal from "../components/popupModal";
import evt from "../../events/events";
import Logo from "../../logo1.svg";
import ProgressModal from "../components/ProgressModal";
import {Pagination} from "@material-ui/lab";
import {perPageCount} from "./../../helpers/constants";
import {makeStyles} from "@material-ui/core/styles";
import {NOTIFICATION_DELAY} from "./../../helpers/constants";
import LoadingSpinner from "../components/LoadingSpinner"
import {slowRefresh} from "../../helpers/NotifyStatus";

import ColorPicker from "react-pick-color";

const AddColor=() => {
	const [color,setColor]=useState("#fff");
	const [secondaryColor,setSecondaryColor]=useState("#fff")
	const [profilePic, setProfilePic] = useState("");
	const [name,setName]=useState(`${process.env.REACT_APP_API}image/main_bg.png`)
	
	

  const imageUploader = React.useRef(null);
	
	const handleImageUpload = (e) => {
		const [file] = e.target.files;
		
		setName(`${process.env.REACT_APP_API}image/${ e.target.files[0].name}`)
		
		if (e.target.files && e.target.files[0]) {
		  let img = e.target.files[0];
	
		  setProfilePic(img);
		}
	  };
	
	  
	  const handleUpdateProfile = async () => {

		let data = {
		
	
		  profilePic: profilePic,
		
		};
		if (profilePic === "" || profilePic === undefined) {
		//  NotificationManager.error("Please Choose Profile Picture", "", NOTIFICATION_DELAY);
		  return;
		}
	
	
	
		try {
		  let res = await changeBackground(data);
		
		} catch (e) {
		  console.log("error", e);
		  NotificationManager.error("Something Went Wrong", "", NOTIFICATION_DELAY);
		}
	
	  };
	  
	let jsonData = {}
	let style= " .text-yellow {color: "+color+" !important;} \n .sidebar path { fill: "+color+" !important; }\n .btn-admin {background: linear-gradient(180deg, "+color+", "+secondaryColor+" )!important;}\n .svg_icon path{ fill: "+color+" !important;}\n .app-main{background-image:url('"+name+"') !important}\n .btn-main{background: linear-gradient(180deg, "+color+", "+secondaryColor+" )!important; border: 2px solid "+color+" !important;}\n .round-btn{background-color: "+color+" !important;}\n .title_color {color: "+color+" !important;}\n .btn-banner {    background: linear-gradient(180deg,"+color+" 56.77%, "+secondaryColor+" 100%) !important;}\n .main_btn{    background: linear-gradient(180deg,"+color+" 56.77%, "+secondaryColor+" 100%) !important;}\n .navbar_form{border: 2px solid "+color+" !important;}\n .wallet_box{ border: 1px solid  "+color+"!important;} "

	return (
		<div className="wrapper">
			{/* <!-- Sidebar  --> */}
			<Sidebar />

        <div className="addColor__main">
			<h4 className="text-light">Primary Color</h4>
		<ColorPicker color={color} onChange={(color) => {
				setColor(color.hex)
				console.log("color change is called",color.hex)
			}} />
				<h4 className="text-light">Secondary Color</h4>
			<ColorPicker color={secondaryColor} onChange={(color) => {
				setSecondaryColor(color.hex)
				console.log("color change is called",color.hex)
			}} />

			<button
				className="btn   text-light round-btn"
				type="button"
				onClick={async () => {
					await handleUpdateProfile()
					jsonData.completeCss = style
					let res=await addColor(jsonData);
					console.log("color is send",color)
					window.location.reload()
					
				}}
			>
				Edit
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
			
		</div>
		

			{/* <!-- Page Content  --> */}


			{/** Modal for edit admin */}

		</div>

	);
};
export default AddColor;













