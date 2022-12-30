import React,{useEffect,useState,Suspense} from "react";
import {NotificationManager} from "react-notifications";
import Sidebar from "../components/Sidebar";
import {
	addColor
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
	let jsonData = {}
	let style= " .text-yellow {color: "+color+" !important;} \n .sidebar path { fill: "+color+" !important; }\n .btn-admin {background: linear-gradient(180deg, "+color+", "+color+" )!important} .svg_icon path{ fill: "+color+" !important;}"

	return (
		<div className="wrapper">
			{/* <!-- Sidebar  --> */}
			<Sidebar />

			<ColorPicker color={color} onChange={(color) => {
				setColor(color.hex)
				console.log("color change is called",color.hex)
			}} />

			<button
				className="btn p-1  text-light"
				type="button"
				onClick={async () => {
					jsonData.completeCss = style
					let res=await addColor(jsonData);
					console.log("color is send",color)
					window.location.reload()
				}}
			>
				Edit
			</button>

			{/* <!-- Page Content  --> */}


			{/** Modal for edit admin */}

		</div>

	);
};
export default AddColor;













