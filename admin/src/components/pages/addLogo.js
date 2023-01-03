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

const AddLogo=() => {
	const [color,setColor]=useState("#fff");
	const [secondaryColor,setSecondaryColor]=useState("#fff")
	const [profilePic, setProfilePic] = useState("");
	const [name,setName]=useState("http://localhost:3000/image/main_bg.png")
	
	

  const imageUploader = React.useRef(null);
	
	const handleImageUpload = (e) => {
		const [file] = e.target.files;
		
		setName(`http://localhost:3000/image/${ e.target.files[0].name}`)
		
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
	  
	return (
		<div className="wrapper">
			{/* <!-- Sidebar  --> */}
			<Sidebar />

        <div className="addColor__main">
			
			<button
				className="btn   text-light round-btn"
				type="button"
				onClick={async () => {
					await handleUpdateProfile()
					//jsonData.completeCss = style
					//let res=await addColor(jsonData);
					//console.log("color is send",color)
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
export default AddLogo;













