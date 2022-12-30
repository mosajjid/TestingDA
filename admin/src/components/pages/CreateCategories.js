import React, { useState, useEffect, useMemo } from "react";
import { NotificationManager } from "react-notifications";
import Sidebar from "../components/Sidebar";
import { Link } from "react-router-dom";
import Deletesvg from "../SVG/deletesvg";
import { addCategory, getCategory } from "../../apiServices";
import { useCookies } from "react-cookie";
import Spinner from "../components/Spinner";
import { WalletConditions } from "./../../helpers/WalletConditions";
import { onboard } from "../Navbar";
import PopupModal from "../components/popupModal";
import evt from "../../events/events";
import Logo from "../../logo1.svg";
import { NOTIFICATION_DELAY } from "./../../helpers/constants";
import LoadingSpinner from "../components/LoadingSpinner";

function CreateCategories() {
  const [catImg, setCatImg] = useState();
  const [CategorieName, setCategorieName] = useState("");
  const [cookies, setCookie, removeCookie] = useCookies([]);
  const [myCategory, setMyCategory] = useState("");
  const [currentUser, setCurrentUser] = useState("");
  const [loading, setLoading] = useState(false);
  const [isModal, setModal] = useState("");
  const [showAlert, setShowAlert] = useState("");
  const [loadingSpinner, setLoadingSpinner] = useState("")

  useEffect(() => {
    if (cookies.da_selected_account) setCurrentUser(cookies.da_selected_account);
    // else NotificationManager.error("Connect Yout Metamask", "", 800);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [currentUser]);

  useMemo(() => {
    // if (currentUser) {
    setLoadingSpinner(true)
    const fetch = async () => {
      let _myBrand = await getCategory();
      setMyCategory(_myBrand);
      // };
      setLoadingSpinner(false)
    }
    fetch();
  }, [currentUser]);
  const uploadedImage = React.useRef(null);
  const imageUploader = React.useRef(null);

  const handleImageUpload = (e) => {
    const [file] = e.target.files;
    if (file) {
      const reader = new FileReader();
      const { current } = uploadedImage;
      current.file = file;
      reader.onload = (e) => {
        current.src = e.target.result;
      };
      reader.readAsDataURL(file);
      if (e.target.files && e.target.files[0]) {
        setCatImg(e.target.files[0]);
      }
    }
  };

  const handleValidationCheck = () => {
    if (catImg === "" || catImg === undefined) {
      NotificationManager.error("Please Upload Category Image", "", NOTIFICATION_DELAY);
      return false;
    }
    if (CategorieName?.trim() === "" || CategorieName === undefined) {
      NotificationManager.error("Please Enter Category Name", "", NOTIFICATION_DELAY);
      setCategorieName("")
      return false;
    }
    return true;
  };

  const handleCreateCategory = async () => {
    const wCheck = WalletConditions();
    if (wCheck !== undefined) {
      setShowAlert(wCheck);
      return;
    }


    if (handleValidationCheck() == false) {
      return;
    } else {
      setModal("")
      setLoading(true);
      var fd = new FormData();
      fd.append("name", CategorieName?.replace(/\s+/g, ' ').trim());

      fd.append("image", catImg);

      try {
        let categories = await addCategory(fd);

        if (categories.message === "Category Created") {
          NotificationManager.success("Category Created Successfully", "", NOTIFICATION_DELAY);
        } else {
          NotificationManager.error(categories.message, "", NOTIFICATION_DELAY);
        }
        setLoading(false);
        setTimeout(() => {
          window.location.href = "/createcategories";
        }, 1000);
      } catch (e) {
        console.log("error", e);
        NotificationManager.error(e.message, "", NOTIFICATION_DELAY);
        setLoading(false);
        setTimeout(() => {
          window.location.href = "/createcategories";
        }, 1000);
      }
      setLoading(false);
    }
  };

  const refreshState = () => {
    setCatImg();
    setCategorieName("");
    imageUploader.current.value = "";
    uploadedImage.current.value = "";
  }

  return (
    <div className="wrapper">
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
      <Sidebar />
      {loading ? <Spinner /> : ""}
      {/* <!-- Page Content  --> */}
      <div id="content">
        {currentUser && (
          <div className="add_btn mb-4 d-flex justify-content-end">
            <button
              className="btn btn-admin text-light"
              type="button"
              // data-bs-toggle="modal"
              // data-bs-target="#NftModal"
              onClick={() => {
                const wCheck = WalletConditions();
                if (wCheck !== undefined) {
                  setShowAlert(wCheck);
                  return;
                }
                refreshState();
                setModal("active")
              }}
            >
              Create Category
            </button>
          </div>
        )}

        <div className="adminbody table-widget text-light box-background">
          <h5 className="admintitle font-600 font-24 text-yellow">All Categories</h5>
          {loadingSpinner ? <LoadingSpinner /> : myCategory?.length <= 0 && (
            <div className="col-md-12">
              <h4 className="no_data_text text-muted">No Category Yet</h4>
            </div>
          )}
          {myCategory?.length > 0 ?
            <table className="table table-hover text-light">
              <thead>
                <tr>
                  <th>Category Image</th>
                  <th>Title</th>
                </tr>
              </thead>
              <br></br>
              {myCategory &&
                myCategory != undefined &&
                myCategory != "" &&
                myCategory.length > 0
                ? myCategory?.map((data, index) => (
                  <tbody key={index}>
                    <tr>
                      <td>
                        <img src={data.image} className="profile_i" alt="" />
                      </td>
                      <td>{data.name ? data.name?.length > 8 ? data.name?.slice(0, 8) + "..." : data.name : "-"}</td>
                    </tr>
                  </tbody>
                ))
                : "No Categories Found"}
            </table> : ""}
        </div>
      </div>

      <div
        className={`modal createCategory ${isModal}`}
        id="NftModal"
        tabIndex="-1"
        aria-labelledby="exampleModalLabel"
        aria-hidden="true"
      >
        <div className="modal-dialog modal-lg">
          <div className="modal-content">
            <div className="modal-header">
              <h5
                className="modal-title text-light font-24 font-600"
                id="exampleModalLabel"
              >
                Create Category
              </h5>
              <button
                type="button"
                className="btn-close"
                // data-bs-dismiss="modal"
                onClick={() => {
                  refreshState();
                  setModal("")
                }}
                aria-label="Close"
              ></button>
            </div>
            <div className="modal-body">
              <form className="row">
                <div className="mb-1 col-md-4 offset-md-4">
                  <label for="recipient-name" className="col-form-label">
                    Upload Category Image *
                  </label>
                  <div
                    style={{
                      display: "flex",
                      flexDirection: "column",
                      alignItems: "center",
                      justifyContent: "center",
                    }}
                  >
                    <input
                      type="file"
                      accept="image/*"
                      onChange={handleImageUpload}
                      ref={imageUploader}
                      style={{
                        display: "none",
                      }}
                    />
                    <div
                      className="update_btn"
                      style={{
                        height: "100%",
                        width: "100%",
                        position: "relative",
                      }}
                      onClick={() => imageUploader.current.click()}
                    >
                      {/* <p className="text-center">Click here</p> */}
                      {catImg ? (
                        <img
                          alt=""
                          ref={uploadedImage}
                          src={URL.createObjectURL(catImg)}
                          className="img-fluid profile_circle_img admin_profile_img"
                        />
                      ) : (
                        <img
                          alt=""
                          ref={uploadedImage}
                          src={"../images/upload.png"}
                          className="img-fluid profile_circle_img admin_profile_img"
                        />
                      )}

                    </div>
                  </div>
                </div>
                <div className="col-md-12 mb-1">
                  <label for="recipient-name" className="col-form-label">
                    Category Name *
                  </label>
                  <input
                    type="text"
                    className="form-control"
                    id="recipient-name"
                    autoComplete="off"
                    value={CategorieName}
                    maxLength={25}
                    onChange={(e) => setCategorieName(e.target.value)}
                  />
                </div>
              </form>
            </div>

            <div className="modal-footer justify-content-center">
              <button
                type="button"
                className="btn btn-admin text-light"
                onClick={handleCreateCategory}
              >
                Create Category
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default CreateCategories;
