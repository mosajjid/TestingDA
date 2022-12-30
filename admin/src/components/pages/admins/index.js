import React, { useState, useEffect } from "react";
import Sidebar from "../../components/Sidebar";
import { NotificationManager } from "react-notifications";
import Loader from "../../components/loader";
import {
  adminUsers,
  saveAdminUser,
  blockUnBlockAdmin,
} from "../../../apiServices";
import { NOTIFICATION_DELAY } from "../../../helpers/constants";
import LoadingSpinner from "../../components/LoadingSpinner";

function Admins() {
  const [records, setRecords] = useState("none");
  const [loading, setLoading] = useState(false);
  const [toggleModal, setToggleModal] = useState("");
  const [category, setCategory] = useState({});
  const [reload, setReload] = useState(true);
  const [loader, setLoader] = useState(false);
  const [userName, setUserName] = useState("");
  const [userAddress, setUserAddress] = useState("");
  
  const [profileImage, setProfileImage] = useState("");

  useEffect(() => {
    setLoader(true);
    adminUsers(1).then(({ data }) => {
      setRecords( data.count > 0 ? data.results : [] );
    });
    setLoader(false);
  }, [reload]);

  function getStatusLabel(_status) {
    let status = { 1: "Active", 0: "Inactive" };
    return status[_status] || " ";
  }

  function blockUnblockUser(id, status) {
    blockUnBlockAdmin(id, status)
      .then((res) => {
        setReload(!reload);
      })
      .catch((e) => {
        console.log("Error while changing status", e)
      });
  }

  const uploadedImage = React.useRef(null);
  const imageUploader = React.useRef(null);

  const handleImageUpload = (e) => {
    let [file] = e.target.files;
    if (file) {
      let reader = new FileReader();
      let { current } = uploadedImage;
      current.file = file;
      reader.onload = (e) => {
        current.src = e.target.result;
      };
      reader.readAsDataURL(file);
      if (e.target.files && e.target.files[0]) {
        setProfileImage(e.target.files[0]);
      }
    }
  };
  const handleValidationCheck = () => {
    if (profileImage === "" || profileImage === undefined) {
      NotificationManager.error(
        "Please Upload User Image",
        "",
        NOTIFICATION_DELAY
      );
      return false;
    }
    if (userName?.trim() === "" || userName === undefined) {
      NotificationManager.error("Please Enter Name", "", NOTIFICATION_DELAY);
      return false;
    }
    if (
      userAddress?.trim() === "" ||
      userAddress === undefined ||
      userAddress?.length !== 42 ||
      userAddress[0] !== "0" ||
      userAddress[1].toLowerCase() !== "x"
    ) {
      NotificationManager.error(
        "Please Enter Correct Wallet Address",
        "",
        NOTIFICATION_DELAY
      );
      return false;
    }
    return true;
  };
  const handleSaveAdmin = async (e) => {
    setLoading(true);
    if (handleValidationCheck() == false) {
      setLoading(false);
      return;
    } else {
      var fd = new FormData();
      category.adminID = category._id;

      category.adminID = category._id;
      category.fullname = userName;
      category.walletAddress = userAddress;
      category.profileIcon = profileImage;

      
      Object.entries(category).forEach(([name, val]) => {
        fd.append(name, val);
      });

      try {
        let user = await saveAdminUser(fd, category?._id);
        NotificationManager.success(
          "Data Updated Successfully",
          "",
          NOTIFICATION_DELAY
        );
        setLoading(false);
        // setReload(!reload);
        setToggleModal("");
        setCategory({});
        setTimeout(()=> {
          window.location.reload();
        },1000)
        document.querySelector(".modal-backdrop")?.classList.toggle("show");
      } catch (e) {
        let error = await e.getBody();
        if (error.message === "User already exists") {
          NotificationManager.error(
            "Admin Already Added or it's an User Account",
            "",
            NOTIFICATION_DELAY
          );
        } else NotificationManager.error(error.message, "", NOTIFICATION_DELAY);
        setLoading(false);
      }
    }
  };

  return (
    <div className="wrapper">
      {/* <!-- Sidebar  --> */}
      <Sidebar />
      {loading ? <Loader /> : ""}
      {/* <!-- Page Content  --> */}
      <div id="content">
        <div className="add_btn mb-4 d-flex justify-content-end">
          <button
            className="btn btn-admin text-light"
            type="button"
            data-bs-toggle="modal"
            data-bs-target="#adminModal"
            onClick={() => {
              imageUploader.current.value = '';
              setToggleModal("show");
            }}
          >
            + Add Admin
          </button>
        </div>

        <div className="adminbody table-widget text-light box-background">
          <h5 className="admintitle font-600 font-24 text-yellow">
            Admin's List
          </h5>

          <table className="table table-hover text-light">
            <thead>
              <tr>
                <th>Image</th>
                <th>Name</th>
                <th>Wallet Address</th>
                <th>Status</th>
                <th>Action</th>
              </tr>
            </thead>

            {records !== "none" && records && records?.length > 0 ? (
              records?.map((item, index) => {
                return (
                  <tbody key={index}>
                    <tr>
                      <td>
                        {" "}
                        <img
                          src={item?.profileIcon ? item?.profileIcon : ""}
                          className="profile_i m-2"
                          alt=""
                          onError={(e) =>
                            (e.target.src = "./../images/login.jpg")
                          }
                        />
                      </td>
                      <td>{item.fullname}</td>
                      <td>{item.walletAddress}</td>
                      <td>{getStatusLabel(item.status)}</td>

                      <td>
                        <div className="btn_container">
                          <button
                            className="btn btn-admin m-1 p-1 text-light "
                            type="button"
                            onClick={() => {
                              blockUnblockUser(item._id, item.status ? 0 : 1);
                              NotificationManager.success(
                                "Admin Status Updated Successfully"
                              );
                            }}
                          >
                            {item.status === 0 ? "Active" : "Inactive"}
                          </button>

                          <button
                            className="btn btn-admin m-1 p-1 text-light"
                            type="button"
                            data-bs-toggle="modal"
                            data-bs-target="#adminModal"
                            onClick={() => {
                              imageUploader.current.value = '';
                              setToggleModal("show");
                              setCategory(item);
                              setUserName(item.fullname);
                              setUserAddress(item.walletAddress)
                              setProfileImage(item.profileIcon)
                            }}
                          >
                            Edit
                          </button>
                        </div>
                      </td>
                    </tr>
                  </tbody>
                );
              })
            ) : (
              <tfoot>
                <tr>
                  <td colSpan={5} align="center">
                 {loader || records === "none" ?  <LoadingSpinner /> : !loader && records !== "none" ? "No Record Found ":""}
                  </td>
                </tr>
              </tfoot>
            )}
          </table>
        </div>
      </div>

      {/** Modal for edit admin */}
      <div
        className={`modal fade createNft ${toggleModal}`}
        id="adminModal"
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
                {category._id ? "Update" : "Create New"} Admin
              </h5>
              <button 
                type="button" 
                onClick={() => { 
                  setCategory({})
                  setUserName("");
                  setUserAddress("");
                  setProfileImage("");
                }} 
                className="btn-close"  
                data-bs-dismiss="modal" 
                aria-label="Close" > 
                </button>
              
            </div>
            <div className="modal-body">
              <form className="row">
                <div className="mb-1 col-md-4 offset-md-4">
                  <label htmlFor="recipient-name" className="col-form-label">
                    Upload Image *
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
                      <img
                        alt=""
                        ref={uploadedImage}
                        src={profileImage || "../images/upload.png"}
                        style={{
                          width: "110px",
                          height: "110px",
                          margin: "auto",
                        }}
                        className="img-fluid profile_circle_img"
                      />
                    </div>
                  </div>
                </div>
                <div className="col-md-12 mb-1">
                  <label htmlFor="recipient-name" className="col-form-label">
                    Name *
                  </label>
                  <input
                    type="text"
                    className="form-control"
                    id="recipient-name"
                    value={userName}
                    onChange={(e) =>
                      setUserName(e.target.value)
                    }
                  />
                </div>
                <div className="col-md-12 mb-1">
                  <label htmlFor="recipient-name" className="col-form-label">
                    Wallet Address *
                  </label>
                  <input
                    type="text"
                    className="form-control"
                    id="recipient-wallet"
                    value={userAddress}
                    onChange={(e) =>
                      setUserAddress(e.target.value)
                    }
                  />
                </div>
              </form>
            </div>
            <div className="modal-footer justify-content-center">
              <button
                type="button"
                disabled={loading}
                className="btn btn-admin text-light"
                onClick={handleSaveAdmin}
              >
                {loading ? "Submiting..." : "Submit"}
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default Admins;
