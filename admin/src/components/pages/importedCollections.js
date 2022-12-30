import React, { useState, useEffect } from "react";
import { useCookies } from "react-cookie";
import Sidebar from "../components/Sidebar";
import moment from "moment";
import Spinner from "../components/Spinner";
import { onboard } from "../Navbar";
import PopupModal from "../components/popupModal";
import evt from "../../events/events";
import Logo from "../../logo1.svg";
import {
  checkImportStatus,
  checkStatusFromDB,
  getMyImportedCollections,
  importNftFromScript,
  refreshCollection,
  startSync,
} from "../../apiServices";
import { NotificationManager } from "react-notifications";
import { isEmptyObject } from "jquery";
import { NOTIFICATION_DELAY } from "../../helpers/constants";
import loadingSpinner from "../components/LoadingSpinner";

function ImportedCollection(props) {
  const [loading, setLoading] = useState(false);
  const [cookies] = useCookies([]);

  const [myCollections, setMyCollections] = useState([]);
  const [status, setStatus] = useState("");
  const [showAlert, setShowAlert] = useState("");
  // const [showStatus, setShowStatus] = useState(false);
  const [selectedCollection, setSelectedCollection] = useState("");
  const [currentStatus, setCurrStatus] = useState([])
  const [selectedCollectionID, setSelectedCollectionID] = useState("");
  const [loadingSpinner, setLoadingSpinner] = useState(false)



  const fetchImportedCollections = async () => {
    setLoadingSpinner(true)
    let data = await getMyImportedCollections({ page: 1, limit: 100 });
    if (!isEmptyObject(data) && !isEmptyObject(data?.results[0])) {
      setMyCollections(data?.results);
      let _currStatus = currentStatus;
      for (let i = 0; i < data?.results.length; i++) {
        let _status = await getCurrStatus(data?.results[i]?.contractAddress)
        _currStatus.push(_status)
      }
      setCurrStatus(_currStatus)
    }
    setLoadingSpinner(false)
  };

  const getCurrStatus = async (collectionAddress) => {
    let data = await checkImportStatus(collectionAddress);
    if (data[0]?.status === "error") return "Error in contract, Please check"
    return data[0]?.status
  }

  const fetchStatus = async (collectionAddress, collectionID) => {
    let currStatus = await getCurrStatus(collectionAddress)
    if (currStatus === "available") {
      let res = await checkStatusFromDB({ collectionID: collectionID });
      await fetchImportedCollections();

    }

    return currStatus
  };


  useEffect(() => {
    fetchImportedCollections();
  }, []);



  return (
    <div className="wrapper">
      {/* {showStatus &&
        <div className="modal__backdrop">
          <div className="modal__container">
            <button type="button" className="custom_close" onClick={() => setShowStatus(false)}>x</button>
            <p>Import Status: {status ? status : "Loading.."}</p>
          </div>
        </div>
      } */}

      {showAlert === "chainId" ? (
        <PopupModal
          content={
            <div className="popup-content1">
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
                className="btn-main mt-2 mb-2"
                onClick={async () => {
                  const isSwitched = await onboard.setChain({
                    chainId: process.env.REACT_APP_CHAIN_ID,
                  });
                  if (isSwitched) setShowAlert("");
                }}
              >
                {"Switch Network"}
              </button>
            </div>
          }
          handleClose={() => {
            setShowAlert(!showAlert);
          }}
        />
      ) : showAlert === "account" ? (
        <PopupModal
          content={
            <div className="popup-content1">
              <div className="bid_user_details my-4">
                <img src={Logo} alt="" />
                <div className="bid_user_address align-items-center">
                  <div>
                    <span className="adr text-muted">
                      {cookies.da_selected_account}
                    </span>
                    <span className="badge badge-success">Connected</span>
                  </div>
                  <p className="mb-3">
                    Please switch to connected wallet address or click logout to
                    continue with the current wallet address by disconnecting
                    the already connected account.
                  </p>
                </div>

                <button
                  className="btn-main mt-2"
                  onClick={() => {
                    evt.emit("disconnectWallet");
                  }}
                >
                  {"Logout"}
                </button>
              </div>
            </div>
          }
          handleClose={() => {
            setShowAlert(!showAlert);
          }}
        />
      ) : showAlert === "locked" ? (
        <PopupModal
          content={
            <div className="popup-content1">
              <div className="bid_user_details my-4">
                <img src={Logo} alt="" />
                <div className="bid_user_address align-items-center">
                  <div>
                    <span className="adr text-muted">
                      {cookies.da_selected_account}
                    </span>
                    <span className="badge badge-success">Connected</span>
                  </div>
                </div>
                <h4 className="mb-3">
                  Your wallet is locked. Please unlock your wallet and connect
                  again.
                </h4>
              </div>
              <button
                className="btn-main mt-2"
                onClick={() => {
                  evt.emit("disconnectWallet");
                }}
              >
                Connect Wallet
              </button>
            </div>
          }
          handleClose={() => {
            setShowAlert(!showAlert);
          }}
        />
      ) : (
        ""
      )}

      {/* <!-- Sidebar  --> */}
      <Sidebar />
      {loading ? <Spinner /> : ""}
      {/* <!-- Page Content  --> */}
      <div id="content">
        <div className="adminbody table-widget text-light box-background ">
          <h5 className="admintitle font-600 font-24 text-yellow text-center">
            Imported Collections
          </h5>
          <br />
          {loadingSpinner ? <loadingSpinner /> : myCollections?.length <= 0 && (
            <div className="col-md-12">
              <h4 className="no_data_text text-muted">No Collections Yet</h4>
            </div>
          )}
          {myCollections?.length > 0 ?
            <div className="table-responsive">
              <table className="table table-hover text-light">
                <thead>
                  <tr>
                    <th>Collection</th>
                    <th>Title</th>
                    <th>Symbol</th>
                    <th>Description</th>
                    <th>Total Supply</th>

                    <th>Category</th>
                    <th>Brand</th>
                    <th>Action</th>
                  </tr>
                </thead>

                <tbody>
                  {myCollections &&
                    myCollections !== undefined &&
                    myCollections !== "" &&
                    myCollections.length > 0
                    ? myCollections?.map((item, index) => {
                      return (
                        <>
                          <tr key={index}>
                            <td>
                              {" "}
                              <div className="first-col">
                                <img
                                  src={item.logoImage}
                                  className="profile_i m-2"
                                  alt=""
                                  onError={(e) =>
                                    (e.target.src = "../images/login.jpg")
                                  }
                                />
                                <div className="dates-col">
                                {
                                                                        item.preSaleStartTime ? <span>Start Date:&nbsp;{" "}
                                                                            {item.preSaleStartTime
                                                                                ? moment(item.preSaleStartTime).format(
                                                                                    "MMMM Do YYYY"
                                                                                )
                                                                                : "-"}   </span> : ""
                                                                    }

                                                                    {item.preSaleEndTime ?
                                                                        <span>
                                                                            End Date: &nbsp;{" "}
                                                                            {item.preSaleEndTime
                                                                                ? moment(item.preSaleEndTime).format(
                                                                                    "MMMM Do YYYY"
                                                                                )
                                                                                : "-"}
                                                                        </span> : ""}
                                 
                                </div>
                              </div>
                            </td>
                            <td>
                              {item?.name
                                ? item.name?.length > 8
                                  ? item.name?.slice(0, 8) + "..."
                                  : item?.name
                                : "-"}
                            </td>
                            <td>{item?.symbol ? item?.symbol : "-"}</td>
                            <td>
                              {item?.description
                                ? item?.description?.length > 15
                                  ? item?.description?.slice(0, 15) + "..."
                                  : item?.description
                                : "-"}
                            </td>

                            <td>
                              {item?.totalSupply ? item?.totalSupply : "0"}
                            </td>

                            <td>
                              {item?.categoryID?.name
                                ? item?.categoryID?.name
                                : "-"}
                            </td>
                            <td>
                              {item?.brandID?.name ? item?.brandID?.name : "-"}
                            </td>
                            <td>
                              {item.progressStatus === 1 ? (
                                <button
                                  type="button"
                                  className="btn btn-admin text-light import_btns"
                                  onClick={async () => {
                                    if (item.progressStatus === 1) {
                                      setLoading(true)
                                      let res = await startSync({
                                        collectionID: item._id,
                                      });
                                      await fetchImportedCollections();
                                      setLoading(false)
                                    }
                                  }}
                                >
                                  Sync NFTs
                                </button>
                              ) : ""}


                              {item.progressStatus === 2 ? (
                                <>
                                  <button
                                    type="button"
                                    className="btn btn-admin text-light import_btns"
                                    onClick={async () => {
                                      setLoading(true)
                                      let currStatus = await getCurrStatus(item.contractAddress)
                                      if (currStatus === "UpdatingSupply") {
                                        NotificationManager.info(
                                          "Supply has been Changed, Please Wait While we are Syncing", "", NOTIFICATION_DELAY
                                        );
                                        setLoading(false)
                                        return
                                      }
                                      if (currStatus === "update") {
                                        NotificationManager.info(
                                          "Update Request is in Process", "", NOTIFICATION_DELAY
                                        );
                                        setLoading(false)
                                        return
                                      }
                                      let res = await refreshCollection({
                                        collectionID: item._id,
                                      });

                                      if (
                                        res.message ===
                                        "Collection already updated"
                                      ) {
                                        NotificationManager.info(
                                          "Collection Already Updated", "", NOTIFICATION_DELAY
                                        );
                                      }
                                      else {
                                        NotificationManager.info(
                                          "Request is in Queue", "", NOTIFICATION_DELAY
                                        );
                                      }
                                      setLoading(false)
                                    }}
                                  >
                                    Refresh
                                  </button>
                                  <button
                                    type="button"
                                    className="btn btn-admin text-light import_btns"
                                    onClick={async () => {
                                      setLoading(true)
                                      let currStatus = await getCurrStatus(item.contractAddress)
                                      if (currStatus === "UpdatingSupply") {
                                        NotificationManager.info(
                                          "Updating Supply", "", NOTIFICATION_DELAY
                                        );
                                        setLoading(false)
                                        return
                                      }
                                      if (currStatus === "update") {
                                        NotificationManager.info(
                                          "Update Request is in Process", "", NOTIFICATION_DELAY
                                        );
                                        setLoading(false)
                                        return
                                      }

                                      let reqData = { "request_type": "update", "address": item.contractAddress, "chain_id": process.env.REACT_APP_NETWORK_ID, "name": item.contractName, "total_supply_field": "totalSupply" }
                                      await importNftFromScript(reqData);
                                      NotificationManager.success("Request in Queue", "", NOTIFICATION_DELAY)
                                      await fetchImportedCollections();
                                      setLoading(false)
                                    }}
                                  >
                                    Sync New Base URI
                                  </button>
                                </>
                              ) : (
                                ""
                              )}

                              <button
                                type="button"
                                className="btn btn-admin text-light import_btns"
                                onClick={async () => {
                                  setLoading(true)
                                  let currStatus = await fetchStatus(item.contractAddress, item._id)
                                  setLoading(false)
                                  if (currStatus === "Error in contract, Please check") {
                                    NotificationManager.error(`Current Status: ${currStatus}`, "", NOTIFICATION_DELAY)
                                  }
                                  else {
                                    NotificationManager.info(`Current Status: ${currStatus}`, "", NOTIFICATION_DELAY)
                                  }
                                }}
                              >
                                Check Current Status
                              </button>
                            </td>
                          </tr>
                          <br></br>
                        </>
                      );
                    })
                    : "No Collections Found"}
                </tbody>
              </table>
            </div> : ""}
        </div>
      </div>
    </div >
  );
}

export default React.memo(ImportedCollection);
