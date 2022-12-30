import React, { useEffect, useState, Suspense } from "react";
import { NotificationManager } from "react-notifications";
import Sidebar from "../components/Sidebar";
import {
  createNft,
  getAllCollections,
  GetMyCollectionsList,
  GetMyNftList,
  getNFTList,
  isSuperAdmin,
  UpdateStatus,
  UpdateTokenCount,
} from "../../apiServices";
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
import LoadingSpinner from "../components/LoadingSpinner"
import { slowRefresh } from "../../helpers/NotifyStatus";

const useStyles = makeStyles(() => ({
  ul: {
    "& .MuiPaginationItem-root": {
      color: "#fff"
    }
  }
}));


function CreateNFTs() {
  const [nftImg, setNftImg] = useState();
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [collection, setCollection] = useState();
  const [currentUser, setCurrentUser] = useState();
  const uploadedImage = React.useRef(null);
  const uploadedPreviewImage = React.useRef(null);
  const imageUploader = React.useRef(null);
  const previewImageUploader = React.useRef(null);
  const [cookies] = useCookies([]);
  const [collections, setCollections] = useState([]);
  const [nfts, setNfts] = useState([]);
  const [quantity, setQuantity] = useState(1);
  const [loading, setLoading] = useState(false);
  const [isModal, setModal] = useState("");
  const [currAttrKey, setCurrAttrKey] = useState("");
  const [currAttrValue, setCurrAttrValue] = useState("");
  const [attrKeys, setAttrKeys] = useState([]);
  const [attrValues, setAttrValues] = useState([]);
  const [fileType, setFileType] = useState("Image");
  const [img, setImg] = useState();
  const [showAlert, setShowAlert] = useState("");
  const [needPreview, setNeedPreview] = useState(false)
  const [nftPreviewImage, setNftPreviewImage] = useState();
  const [isShowProgress, setIsShowProgress] = useState(false);
  const [approval, setApproval] = useState("");
  const [minting, setMinting] = useState("");
  const [tokenURI, setTokenURI] = useState("");
  const [closeDisabled, setCloseDisabled] = useState(true);
  const [reloadContent, setReloadContent] = useState(true);
  const [currPage, setCurrPage] = useState(1);
  const [totalPages, setTotalPages] = useState(0);
  const [loadingSpinner, setLoadingSpinner] = useState(false);


  const classes = useStyles();

  const handleImageUpload = (e) => {
    const [file] = e.target.files;
    if (file) {
      let url = e.target.files[0].name.split(".").pop()?.trim();
      const reader = new FileReader();
      const { current } = uploadedImage;
      current.file = file;
      reader.onload = (e) => {
        current.src = e.target.result;
      };
      reader.readAsDataURL(file);
      if (e.target.files && e.target.files[0]) {
        if (["mp4", "gif", "jpeg", "jpg", "png", "gltb", "gltf", "glb"].includes(url)) {
         

          if (url === "mp4") {
            setFileType("Video");
            let blobURL = URL.createObjectURL(e.target.files[0]);
            setNeedPreview(true)
            setNftImg(e.target.files[0]);
            setImg(blobURL);
          } else if (
            url === "gif" ||
            url === "jpeg" ||
            url === "jpg" ||
            url === "png"
          ) {
            setFileType("Image");
            setNeedPreview(false)
            let blobURL = URL.createObjectURL(e.target.files[0]);
            setImg(blobURL);
            setNftImg(e.target.files[0]);
          } else if (
            url === "glb" ||
            url === "gltf" ||
            url === "gltb" || url === "glTF"
          ) {
            setFileType("3D");
            setNeedPreview(true)
            let blobURL = URL.createObjectURL(e.target.files[0]);
            setImg(blobURL);
            setNftImg(e.target.files[0]);
          }
         
        }
        else {
          NotificationManager.error("Invalid Format", "", NOTIFICATION_DELAY)
          return
        }
      }
    }
  };

  const handlePreviewImageUpload = (e) => {
    const [file] = e.target.files;

    if (file) {
      let url = e.target.files[0].name.split(".").pop()?.trim();
      const reader = new FileReader();
      const { current } = uploadedPreviewImage;
      current.file = file;
      reader.onload = (e) => {
        current.src = e.target.result;
      };
      reader.readAsDataURL(file);
      if (e.target.files && e.target.files[0]) {
        if (["gif", "jpeg", "jpg", "png"].includes(url)) {

          setNftPreviewImage(e.target.files[0]);

        }
        else {
          NotificationManager.error("Invalid Format", "", NOTIFICATION_DELAY)
          return
        }
      }
    }
  };

  const handleValidationCheck = () => {
    if (nftImg === "" || nftImg === undefined) {
      NotificationManager.error("Please Upload Image", "", NOTIFICATION_DELAY);
      return false;
    }
    if (needPreview === true && (nftPreviewImage === undefined || nftPreviewImage === "")) {
      NotificationManager.error("Please Upload Preview Image", "", NOTIFICATION_DELAY);
      return false;
    }
    if (title?.trim() === "" || title === undefined) {
      NotificationManager.error("Please Enter Title", "", NOTIFICATION_DELAY);
      setTitle("")
      return false;
    }
    if (description?.trim() === "" || description === undefined) {
      NotificationManager.error("Please Enter Description", "", NOTIFICATION_DELAY);
      setDescription("")
      return false;
    }
    if (collection === "" || collection === undefined) {
      NotificationManager.error("Please Choose Collection", "", NOTIFICATION_DELAY);
      return false;
    }

    return true;
  };

  useEffect(() => {
    if (cookies.da_selected_account) setCurrentUser(cookies.da_selected_account);
  }, [cookies.da_selected_account]);

  useEffect(() => {
    const fetch = async () => {
      let reqBody = {
        page: currPage,
        limit: perPageCount,
      };
      let res
      if (currentUser) {
        setLoadingSpinner(true)
        res = await GetMyNftList(reqBody);
        if (res && res.results && res.results.length > 0) {
          setTotalPages(Math.ceil(res.count / perPageCount));
          res = res.results
          setNfts(res);
        }
        setLoadingSpinner(false)
      }
      else if (isSuperAdmin()) {
        setLoadingSpinner(true)
        res = await getNFTList(reqBody)
        if (res && res.results && res.results.length > 0) {
          setTotalPages(Math.ceil(res.count / perPageCount));
          res = res.results
          setNfts(res);
        }
        setLoadingSpinner(false)
      }

    };
    fetch();
  }, [reloadContent, currentUser, isSuperAdmin, currPage]);

  const handleCreateNFT = async () => {

    var formdata = new FormData();
    let createdNft;
    let metaData = [];
    if (attrKeys.length > 0) {


      for (let i = 0; i < attrKeys.length; i++) {
        if (attrKeys[i]?.trim() !== "" && attrValues[i]?.trim() !== "")
          metaData.push({
            trait_type: attrKeys[i],
            value: attrValues[i],
          });
      }

    }
    const wCheck = WalletConditions();
    if (wCheck !== undefined) {
      setShowAlert(wCheck);
      return;
    }

    if (handleValidationCheck()) {

      setIsShowProgress(true)
      // setLoading(true);
      setModal("");


      let collectionDetail;
      let NFTcontract;
      let uri;
      let reqBody = {
        page: 1,
        limit: 12,
        collectionID: JSON.parse(collection)._id,
        userID: "",
        categoryID: "",
        brandID: "",
        ERCType: "",
        searchText: "",
        filterString: "",
        isHotCollection: "",
        isMinted: "",
      };
      try {
        collectionDetail = await getAllCollections(reqBody);
        collectionDetail = collectionDetail?.results[0][0];
        await UpdateTokenCount(collectionDetail.contractAddress);

        formdata.append("attributes", JSON.stringify(metaData));
        formdata.append("levels", JSON.stringify([]));
        formdata.append("creatorAddress", currentUser.toLowerCase());
        formdata.append("name", title?.replace(/\s+/g, ' ').trim());
        formdata.append("quantity", quantity);
        formdata.append("collectionID", JSON.parse(collection)._id);
        formdata.append("collectionAddress", collectionDetail.contractAddress);
        formdata.append("description", description?.replace(/\s+/g, ' ').trim());
        formdata.append("tokenID", collectionDetail.nextID);
        formdata.append("type", collectionDetail.type);
        formdata.append("isMinted", 0);
        formdata.append("imageSize", "0");
        formdata.append("imageType", "0");
        formdata.append("imageDimension", "0");
        formdata.append("fileType", fileType);

        formdata.append("nftFile", nftImg);
        formdata.append("previewImg", nftPreviewImage);

      } catch (e) {
        setApproval("fail");
        setMinting("fail");
        setTokenURI("fail");
        setCloseDisabled(false)
        NotificationManager.error("Something went wrong", "", NOTIFICATION_DELAY);
        return;
      }
      try {
        setApproval("initiated");
        NFTcontract = await exportInstance(
          collectionDetail.contractAddress,
          extendedERC721Abi.abi
        );
        let approval = await NFTcontract.isApprovedForAll(
          currentUser,
          contracts.MARKETPLACE
        );
        let approvalRes;
        let options = {
          from: currentUser,
          gasLimit: 9000000,
          value: 0,
        };
        if (!approval) {
          approvalRes = await NFTcontract.setApprovalForAll(
            contracts.MARKETPLACE,
            true,
            options
          );
          approvalRes = await approvalRes.wait();
          if (approvalRes.status === 0) {
            setApproval("fail");
            setCloseDisabled(false);
            NotificationManager.error("Transaction Failed", "", NOTIFICATION_DELAY);
            return;
          }
          setApproval("success")
          NotificationManager.success("Approved", "", NOTIFICATION_DELAY);
        }
        else {
          setApproval("success")
        }
        let res1 = "";
        try {
          const options = {
            from: currentUser,
            gasLimit: 9000000,
            value: 0,
          };
          setMinting("initiated");
          let mintRes = await NFTcontract.mint(
            currentUser,
            collectionDetail.nextID,
            options
          );
          formdata.append("hash", mintRes.hash)
          formdata.append("hashStatus", 0)
          createdNft = await createNft(formdata);
          if(createdNft === 409){
            setMinting("fail");
            setTokenURI("fail");
            setCloseDisabled(false)
            NotificationManager.error("Name can't be Same for Multiple NFT in a Collection", "", NOTIFICATION_DELAY);
            return;
          }
          res1 = await mintRes.wait();
          if (res1.status === 0) {
            setMinting("fail");
            setCloseDisabled(false)
            NotificationManager.error("Transaction Failed", "", NOTIFICATION_DELAY);
            return;
          }
          setMinting("success");


          try {
            let metaDatahash = createdNft.s3JsonURL

            let tokenId = parseInt(createdNft.tokenID, 10)
            setTokenURI("initiated");
            uri = await NFTcontract.setCustomTokenUri(tokenId, metaDatahash);
            let uriResult = await uri.wait()
            if (uriResult.status === 0) {
              setTokenURI("fail");
              setCloseDisabled(false)
              NotificationManager.error("Transaction Failed", "", NOTIFICATION_DELAY);
              return;
            }
            else {
              setTokenURI("success");
              setCloseDisabled(false)
            }
            // NotificationManager.success("NFT created successfully", "", NOTIFICATION_DELAY);
            // setLoading(false);
            // slowRefresh(1000);
          } catch (e) {
            if (e.code === 4001|| JSON.stringify(e).includes("user rejected transaction")) {
              setTokenURI("fail");
              setCloseDisabled(false);
              NotificationManager.error("User Denied Transaction", "", NOTIFICATION_DELAY);
              slowRefresh(1000)
              return;
            }
            console.log("Error BaseURI catch", e);
            setTokenURI("fail");
            setCloseDisabled(false)
            NotificationManager.error("Something Went Wrong", "", NOTIFICATION_DELAY);
            return;
          }
          let req = {
            "recordID": createdNft._id,
            "DBCollection": "NFT",
            "hashStatus": 1
          }
          try {
            await UpdateStatus(req)
            NotificationManager.success("NFT Created Successfully", "", NOTIFICATION_DELAY)
            slowRefresh(1000)
            return;
          }
          catch (e) {
            console.log("error updateStatus catch", e)
            return
          }
        } catch (e) {
          if (e.code === 4001 || JSON.stringify(e).includes("user rejected transaction")) {
            setMinting("fail");
            setCloseDisabled(false);
            NotificationManager.error("User Denied Transaction", "", NOTIFICATION_DELAY);
            return;
          }

        }
      } catch (e) {
        if (e.code === 4001 || JSON.stringify(e).includes("user rejected transaction")) {
          setApproval("fail");
          setCloseDisabled(false)
          NotificationManager.error("User Denied Approval", "", NOTIFICATION_DELAY);
          return;
        }
        setApproval("fail");
        setMinting("fail");
        setTokenURI("fail");
        setCloseDisabled(false)
        NotificationManager.error("Something Went Wrong", "", NOTIFICATION_DELAY);
        return;
      }


    }
  };

  const handlePageChange = (e, p) => {
    setCurrPage(p);
  };

  const refreshStates = () => {
    setNeedPreview(false)
    setApproval("");
    setMinting("");
    setTokenURI("");
    setNftImg();
    setTitle("");
    setImg()
    setFileType("Image")
    setCollection("");
    setDescription("");
    setAttrKeys([]);
    setAttrValues([]);
    setCurrAttrKey("");
    setCurrAttrValue("");
  }

  useEffect(() => {
    const fetch = async () => {
      let reqBody = {
        page: 1,
        limit: 20,
      };
      let data = await GetMyCollectionsList(reqBody);
      if (data && data.results && data.results[0].length > 0) {
        let res = data?.results[0].filter((d, i) => d.isMinted === 1);
        setCollections(res);
      }
    };
    fetch();
  }, []);

  const handlePropertyAdded = () => {
    if (currAttrKey?.trim() === "" || currAttrValue?.trim() === "") {
      setCurrAttrKey("");
      setCurrAttrValue("");
      NotificationManager.info("Please Enter Both the Fields", "", NOTIFICATION_DELAY);
      return;
    }

    if (attrKeys.includes(currAttrKey)) {
      NotificationManager.error("Cannot Add Same Property Twice", "", NOTIFICATION_DELAY);
      return;
    }

    let tempArr1 = [];
    let tempArr2 = [];
    if (currAttrKey) {
      tempArr1.push(...attrKeys, currAttrKey);
      tempArr2.push(...attrValues, currAttrValue);
    }

    setAttrKeys(tempArr1);
    setAttrValues(tempArr2);
    setCurrAttrKey("");
    setCurrAttrValue("");
  };

  const handlePropertyRemoved = async (index) => {
    let tempArr1 = [...attrKeys];
    tempArr1[index] = "";
    setAttrKeys(tempArr1);
    let tempArr2 = [...attrValues];
    tempArr2[index] = "";
    setAttrValues(tempArr2);


  };

  const datas = [{
    desc: "1. Approval",
    event: approval
  }, {
    desc: "2. Minting",
    event: minting
  }, {
    desc: (<p>3. Setting the Token URI <span className="text-muted desc_muted_text">(In case this transaction is rejected or failed, your NFT will still be created)</span>.</p>),
    event: tokenURI
  }
  ]

  return (
    <div className='wrapper'>
      {showAlert === "chainId" ? <PopupModal content={<div className='popup-content1'>
      <div className='bid_user_details mb-3'>
                    <img src={Logo} alt='' />
                    <div className='bid_user_address'>
                        <div>
                            <div className="mr-3 text-white">Required Network ID:</div>
                            <span className="adr">
                                {process.env.REACT_APP_NETWORK_ID}
                            </span>
                        </div>
                        <div>
                            <div className="mr-3 text-white">Required Network Name:</div>
                            <span className="adr">
                                {process.env.REACT_APP_NETWORK}
                            </span>
                        </div>
                    </div>
                </div>
        <button
          className='btn-main mt-2 mb-2' onClick={async () => {
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
                    {cookies.da_selected_account}
                  </span>
                  <span className='badge badge-success'>Connected</span>
                </div>
                <p className="mb-3">Please switch to connected wallet address or click logout to continue with the current wallet address by disconnecting the already connected account.</p>
              </div>

              <button
                className='btn-main mt-2' onClick={() => {
                  evt.emit("disconnectWallet")
                }}>
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
                    {cookies.da_selected_account}
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
          </div>} handleClose={() => { setShowAlert(!showAlert) }} /> : ""}
      {/* <!-- Sidebar  --> */}
      {loading ? <Spinner /> : ""}
      {isShowProgress && <ProgressModal flag="nft" datas={datas} disabled={closeDisabled} onRequestClose={() => {
        setIsShowProgress(!isShowProgress);
        refreshStates();
      }} />}
      <Sidebar />

      {/* <!-- Page Content  --> */}
      <div id='content'>
        <div className='add_btn mb-4 d-flex justify-content-end'>
          {isSuperAdmin()
            ? null
            : currentUser && (
              <button
                className='btn btn-admin text-light'
                type='button'
                // data-bs-toggle='modal'
                // data-bs-target='#NftModal'
                onClick={() => {
                  const wCheck = WalletConditions();
                  if (wCheck !== undefined) {
                    setShowAlert(wCheck);
                    return;
                  }
                  refreshStates()
                  imageUploader.current.value = '';
                  setModal("active")
                }}>
                Create NFT
              </button>
            )}
        </div>
        <div className='adminbody table-widget text-light box-background'>
          <h5 className='admintitle font-600 font-24 text-yellow'>All NFTs</h5>
          <br />
          {loadingSpinner ? <LoadingSpinner /> : nfts?.length <= 0 &&  (
                            <div className="col-md-12">
                            <h4 className="no_data_text text-muted">No NFTs Yet</h4>
                          </div>
                       )}
          {nfts && nfts?.length > 0 ? (
            <table className='table table-hover text-light'>
              <thead>
                <tr>
                  <th>NFT Image</th>
                  <th>Title</th>
                  <th>Description</th>
                </tr>
              </thead>
              <tbody>
                {nfts && nfts.length > 0
                  ? nfts?.map((n, i) => {
                    return (
                      <tr>
                        <td>
                          <img
                            src={n?.fileType === "3D" || n?.fileType === "Video" ? n?.previewImg : n?.image}
                            className='profile_i'
                            alt=''
                            onError={(e) => {
                              e.target.src = n?.previewImg ? n?.previewImg : "../images/list5.png";
                            }}
                          />

                        </td>
                        <td>
                          {n.name
                            ? n.name?.length > 15
                              ? n.name?.slice(0, 15) + "..."
                              : n.name
                            : "-"}
                        </td>
                        <td>
                          {n.description
                            ? n.description?.length > 25
                              ? n.description?.slice(0, 25) + "..."
                              : n.description
                            : "-"}
                        </td>
                      </tr>
                    );
                  })
                  : ""}
              </tbody>
            </table>
          ) : (
            ""
          )}


          {totalPages > 1 ? (
            <Pagination
              count={totalPages}
              size="large"
              page={currPage}
              variant="outlined"
              color="primary"
              classes={{ ul: classes.ul }}
              shape="rounded"
              onChange={handlePageChange}
            />
          ) : (
            ""
          )}
        </div>
      </div>
      <div
        className={`modal createNft ${isModal} `}
        id='NftModal'
        tabindex='-1'
        aria-labelledby='exampleModalLabel'
        aria-hidden='true'
        data-keyboard='false'
        data-backdrop='static'>
        <div className='modal-dialog modal-lg'>
          <div className='modal-content'>
            <div className='modal-header'>
              <h5
                className='modal-title text-light font-24 font-600'
                id='exampleModalLabel'>
                Create NFT
              </h5>
              <button
                type='button'
                className='btn-close'
                // data-bs-dismiss='modal'
                onClick={() => {
                  refreshStates()
                  setModal("")
                }}
                aria-label='Close'
              ></button>
            </div>
            <div className='modal-body'>
              <form className='row'>
                <div className='mb-1 col-md-4 offset-md-4'>
                  <label for='recipient-name' className='col-form-label'>
                    Upload Image *
                  </label>
                  <div
                    style={{
                      display: "flex",
                      flexDirection: "column",
                      alignItems: "center",
                      justifyContent: "center",
                    }}>
                    <input
                      type='file'
                      accept='.glTF,.gltf,gltb,.glb,.mp4,.gif, .png, .jpeg, .jpg'
                      onChange={handleImageUpload}
                      ref={imageUploader}
                      style={{
                        display: "none",
                      }}
                    />
                    <div
                      className='update_btn'
                      style={{
                        height: "100%",
                        width: "100%",
                        position: "relative",
                      }}
                      onClick={() => imageUploader.current?.click()}>
                      {/* <p className='text-center'>Click here</p> */}
                      {fileType === "Image" ? (
                        <img
                          alt=''
                          ref={uploadedImage}
                          key={img}
                          src={img ? img:""}
                          onError={(e) =>
                           { 
                            e.target.src = "../images/upload.png"}}
                          className='img-fluid profile_circle_img admin_profile_img'
                        />
                      ) : (
                        ""
                      )}

                      {fileType === "Video" ? (
                        <video
                          className='img-fluid profile_circle_img admin_profile_img'
                          controls>
                          <source
                            ref={uploadedImage}
                            key={img}
                            src={img}
                            type='video/mp4'
                          />
                        </video>
                      ) : (
                        ""
                      )}
                      {fileType === "3D" ? (

                        <model-viewer
                          alt=""
                          ref={uploadedImage}
                          src={img}
                          ar ar-modes="webxr scene-viewer quick-look"
                          shadow-intensity="1"
                          camera-controls touch-action="pan-y"
                          enable-pan>
                        </model-viewer>

                      ) : (
                        ""
                      )}

                    </div>
                  </div>

                </div>

                {needPreview &&
                  <div className='mb-1 col-md-4 offset-md-4'>
                    <label for='recipient-name' className='col-form-label'>
                      Upload Preview Image *
                    </label>
                    <div
                      style={{
                        display: "flex",
                        flexDirection: "column",
                        alignItems: "center",
                        justifyContent: "center",
                      }}>
                      <input
                        type='file'
                        accept='.gif, .png, .jpeg, .jpg'
                        onChange={handlePreviewImageUpload}
                        ref={previewImageUploader}
                        style={{
                          display: "none",
                        }}
                      />
                      <div
                        className='update_btn'
                        style={{
                          height: "100%",
                          width: "100%",
                          position: "relative",
                        }}
                        onClick={() => previewImageUploader.current.click()}>
                        {/* <p className='text-center'>Click here</p> */}

                        <img
                          alt=''
                          ref={uploadedPreviewImage}
                          key={img}
                          src={"../images/upload.png"}
                          className='img-fluid profile_circle_img admin_profile_img'
                        />



                      </div>
                    </div>
                  </div>
                }
                <div className='col-md-6 mb-1'>
                  <label for='recipient-name' className='col-form-label'>
                    Title *
                  </label>
                  <input
                    type='text'
                    className='form-control'
                    id='recipient-name'
                    autoComplete="off"
                    value={title}
                    maxLength={25}
                    onChange={(e) => setTitle(e.target.value)}
                  />
                </div>

                <div className='col-md-6 mb-1'>
                  <label for='recipient-name' className='col-form-label'>
                    Choose Collection *
                  </label>
                  <select
                    className='form-select'
                    aria-label='Default select example'
                    value={collection}
                    onChange={(e) => {
                      setCollection(e.target.value);
                      setQuantity(1);
                    }}>
                    <option value=''>Select</option>
                    {collections.length > 0
                      ? collections?.map((c, i) => {
                        return (
                          <option value={JSON.stringify(c)}>{c.name}</option>
                        );
                      })
                      : ""}
                  </select>
                </div>

                {collection && JSON.parse(collection)?.type == 2 ? (
                  <div className='col-md-12 mb-1'>
                    <label for='recipient-name' className='col-form-label'>
                      Quantity *
                    </label>
                    <input
                      type='text'
                      className='form-control'
                      id='recipient-name'
                      autoComplete="off"
                      value={quantity}
                      // disabled={collection.type == 1 ? true : false}
                      onKeyPress={(e) => {
                        if (!/^\d*?\d*$/.test(e.key)) e.preventDefault();
                      }}
                      onChange={(e) => setQuantity(e.target.value)}
                    />
                  </div>
                ) : (
                  ""
                )}

                <div className='col-md-12 mb-1'>
                  <label for='message-text' className='col-form-label'>
                    Description *
                  </label>
                  <textarea
                    className='form-control'
                    id='message-text'
                    value={description}
                    maxLength={300}
                    onChange={(e) => setDescription(e.target.value)}></textarea>
                </div>
                <div className='col-md-12'>
                  {/* {attrKeys[0] === "" ? ( */}
                  <label className="col-form-label">Attributes</label>
                  {/* ) : (
                    ""
                  )} */}
                  {/* {attrKeys.length > 0 && attrValues.length > 0 ? (
                    attrKeys.map((attrKey, key) => {

                      return (
                        attrKey.trim() !== "" &&
                        <ul>
                          <li>
                            <span>
                              {attrKey} : {attrValues[key]}
                            </span>
                          </li>
                        </ul>
                      );
                    })
                  ) : (
                    ""
                  )} */}
                  <form className='row justify-content-center '>
                    {" "}
                    <div className='col-md-5 mb-1'>
                      <input
                        type='text'
                        className='form-control col-md-6'
                        id='attribute-key'
                        placeholder='e.g. Size'
                        autoComplete="off"
                        value={currAttrKey}
                        maxLength={20}
                        onChange={(e) => setCurrAttrKey(e.target.value)}
                      />
                    </div>
                    <div className='col-md-5 mb-1'>
                      <input
                        type='text'
                        className='form-control col-md-6'
                        id='attribute-value'
                        placeholder='e.g. M'
                        value={currAttrValue}
                        autoComplete="off"
                        maxLength={20}
                        onChange={(e) => setCurrAttrValue(e.target.value)}
                      />
                    </div>
                    <div className='col-md-2 mb-1'>
                      <button
                        type='button'
                        className='btn btn-admin text-light add_attr w-100 h-100 p-0'
                        onClick={handlePropertyAdded}>
                        +
                      </button>
                    </div>
                  </form>
                  <div className='row mt-3 attributeAdded_con'>
                    {attrKeys && attrValues
                      ? attrKeys?.map((attrKey, key) => {
                        return attrKey !== "" ? (
                          <div className='col-lg-6 col-md-6 col-sm-6'>
                            <div className='createProperty'>
                              <div className='nft_attr'>
                                <h5>{attrKey}</h5>
                                <h4>{attrValues[key]}</h4>
                              </div>
                              <button
                                className='remove-btn '
                                onClick={() => {
                                  handlePropertyRemoved(key);
                                }}>
                                <i className='fa fa-trash' aria-hidden='true'></i>
                              </button>
                            </div>
                            <button
                              className='remove-btn '
                              onClick={() => {
                                handlePropertyRemoved(key);
                              }}></button>
                          </div>
                        ) : (
                          ""
                        );
                      })
                      : ""}
                  </div>
                </div>

                {/* <div className="col-md-6 mb-1">
                  <label for="recipient-name" className="col-form-label">
                    Brand *
                  </label>
                  <select
                    className="form-select"
                    aria-label="Default select example"
                    value={brand}
                    onChange={(e) => setBrand(e.target.value)}
                  >
                    {brands && brands.length > 0
                      ? brands.map((b, i) => {
                          return (
                            <option selected value="1">
                              {b.name}
                            </option>
                          );
                        })
                      : ""}
                  </select>
                </div> */}
              </form>
            </div>
            <div className='modal-footer justify-content-center'>
              <button
                type='button'
                className='btn btn-admin text-light'
                onClick={handleCreateNFT}>
                Create NFT
              </button>
            </div>
          </div>
        </div>
      </div>

    </div>
  );
}

export default CreateNFTs;
