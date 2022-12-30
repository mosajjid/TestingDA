import React, { useState, useEffect } from "react";
import { NotificationManager } from "react-notifications";
import Sidebar from "../components/Sidebar";
import { useCookies } from "react-cookie";
import {addMintableCollection, deleteMintableCollection, fetchAllMintAddresses} from "../../apiServices";
import { isEmptyObject, isSuperAdmin } from "../../helpers/utils";
import Spinner from "../components/Spinner";
import { NOTIFICATION_DELAY } from "./../../helpers/constants";
import LoadingSpinner from "../components/LoadingSpinner"
import { slowRefresh } from "../../helpers/NotifyStatus";

function AddMintableCollection() {
    const [title, setTitle] = useState("");
    const [currentUser, setCurrentUser] = useState("");
    const [collection, setCollection] = useState("");
    const [cookies] = useCookies([]);
    const [loading, setLoading] = useState(false);
    const [isModal, setModal] = useState("");
    const [loadingSpinner, setLoadingSpinner] = useState(false);

    useEffect(() => {
        if (cookies.da_selected_account) setCurrentUser(cookies.da_selected_account);
    }, [currentUser]);

    useEffect(() => {
        setLoadingSpinner(true)
        const fetch = async () => {
            let _collection = await fetchAllMintAddresses();
            setCollection(_collection);
            // };
            setLoadingSpinner(false)
        }
        fetch();
    }, [currentUser]);


    const handleValidationCheck = () => {

        if (title?.trim() === "" || title === undefined) {
            NotificationManager.error("Please Enter a Collection Address", "", NOTIFICATION_DELAY);
            return false;
        }
        if(!title?.startsWith("0x") && !title?.startsWith("0X")){
            NotificationManager.error("Address must starts with 0x", "", NOTIFICATION_DELAY);
            return false;
        }
        if(title?.length !== 42){
            NotificationManager.error("Address length must be 42", "", NOTIFICATION_DELAY);
            return false;
        }
    };

    const handleCreateCollection = async () => {

        if (handleValidationCheck() === false) {
            return;
        } else {
            setLoading(true);
            setModal("");
            var fd = {
                "address": title,
                "type": "rockstarCall"
            }

            try {
                await addMintableCollection(fd);
                NotificationManager.success("Address Added successfully", "", NOTIFICATION_DELAY);
                setLoading(false);
                setTimeout(() => {
                    window.location.href = "/AddMintableCollections";
                }, 1000);
            } catch (e) {
                console.log("error ",e);
                NotificationManager.error(e.message, "", NOTIFICATION_DELAY);
                setLoading(false);
                setTimeout(() => {
                    window.location.href = "/AddMintableCollections";
                }, 1000);
            }
            setLoading(false);
        }
    };

    const refreshState = () => {
        setTitle("");

    }

    return (
        <div className="wrapper">

            <Sidebar />
            {loading ? <Spinner /> : ""}
            <div id="content">
                {(isSuperAdmin()) && (
                    <div className="add_btn mb-4 d-flex justify-content-end">
                        <button
                            className="btn btn-admin text-light"
                            type="button"
                            onClick={() => {
                                refreshState();
                                setModal("active")
                            }}
                        >
                            Create Mintable Collection
                        </button>
                    </div>
                )}
                <div className="adminbody table-widget text-light box-background">
                    <h5 className="admintitle font-600 font-24 text-yellow">Mintable Collections</h5>
                    {loadingSpinner ? <LoadingSpinner /> : collection?.length <= 0 && (
                        <div className="col-md-12">
                            <h4 className="no_data_text text-muted">No Collection Yet</h4>
                        </div>
                    )}
                    {collection?.length > 0 ?
                        <table className="table table-hover text-light">
                            <thead>
                                <tr>
                                    <th>Collection Address</th>
                                   
                                    <th>Action</th>
                                </tr>
                            </thead>

                            {collection &&
                                collection !== undefined &&
                                collection !== "" &&
                                !isEmptyObject(collection) &&
                                collection.length > 0
                                ? collection?.map((data, index) => (
                                    <tbody key={index}>
                                        <tr>

                                            <td>{data.address}</td>
                                            <td><button className='delete-btn btn-main mt-2 mb-2' onClick={async () => {
                                                await deleteMintableCollection({ address: data.address })
                                                NotificationManager.success("Collection Deleted Successfully", "", NOTIFICATION_DELAY)
                                                slowRefresh()
                                            }}>Delete</button></td>
                                        </tr>
                                    </tbody>
                                ))
                                : "No Collection Found"}
                        </table> : ""}
                </div>
            </div>
            <div
                className={`modal createBrand ${isModal}`}
                id="CollectionModal"
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
                                Create New Mintable Collection
                            </h5>
                            <button
                                type="button"
                                className="btn-close"
                                onClick={() => {
                                    refreshState();
                                    setModal("")
                                }}
                                aria-label="Close"
                            ></button>
                        </div>
                        <div className="modal-body">
                            <form className="row">

                                <div className="col-md-12 mb-1">
                                    <label htmlFor="recipient-name" className="col-form-label">
                                        Collection Address *
                                    </label>
                                    <input
                                        type="text"
                                        className="form-control"
                                        id="recipient-name"
                                        value={title}
                                        autoComplete="off"
                                        onChange={(e) => setTitle(e.target.value)}
                                        minLength={42}
                                    />
                                </div>
                               
                            </form>
                        </div>
                        <div className="modal-footer justify-content-center">
                            <button
                                type="button"
                                className="btn btn-admin text-light"
                                onClick={handleCreateCollection}
                            >
                                Create Mintable Collection
                            </button>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}

export default AddMintableCollection;
