import React, { useState, useEffect } from "react";
import { NotificationManager } from "react-notifications";
import Sidebar from "../components/Sidebar";
import { useCookies } from "react-cookie";
import { isEmptyObject, isSuperAdmin } from "../../helpers/utils";
import Spinner from "../components/Spinner";
import { NOTIFICATION_DELAY } from "./../../helpers/constants";
import LoadingSpinner from "../components/LoadingSpinner"
import { deleteWhitelistings, fetchAllWhitelistingData, insertWhitelisting } from "../../apiServices";

function AddWhiteListing() {
    const [collection, setCollection] = useState("none");
    const [userWallet, setUserWallet] = useState("");
    const [currentUser, setCurrentUser] = useState("");
    const [collections, setCollections] = useState("");
    const [cookies] = useCookies([]);
    const [loading, setLoading] = useState(false);
    const [isModal, setModal] = useState("");
    const [reloadContent, setReloadContent] = useState(false)

    useEffect(() => {
        if (cookies.da_selected_account) setCurrentUser(cookies.da_selected_account);
    }, [currentUser]);

    const handleInsert = async () => {

        if (collection === "" || collection?.trim() === "" || collection === undefined) {
            NotificationManager.error("Please Enter Collection Address", "", NOTIFICATION_DELAY);
            return;
        }
        if (!collection?.startsWith("0x") && !collection?.startsWith("0X")) {
            NotificationManager.error("Collection Address must starts with 0x", "", NOTIFICATION_DELAY);
            return false;
        }
        if (collection?.length !== 42) {
            NotificationManager.error("Collection Address length must be 42", "", NOTIFICATION_DELAY);
            return;
        }
        if (userWallet === "" || userWallet?.trim() === "" || userWallet === undefined) {
            NotificationManager.error("Please Enter User Wallet Address", "", NOTIFICATION_DELAY);
            return;
        }
        if (!userWallet?.startsWith("0x") && !userWallet?.startsWith("0X")) {
            NotificationManager.error("Collection Address must starts with 0x", "", NOTIFICATION_DELAY);
            return false;
        }
        if (userWallet?.length !== 42) {
            NotificationManager.error("Collection Address length must be 42", "", NOTIFICATION_DELAY);
            return;
        }
        setLoading(true);
        await insertWhitelisting({ cAddress: collection, uAddress: userWallet })
        NotificationManager.success("Address whitelisted successfully", "", NOTIFICATION_DELAY)
        setReloadContent(!reloadContent)
        setCollection("")
        setUserWallet("")
        setModal("")
        setLoading(false)
    }

    const handleFetchData = async () => {
        setLoading(true)
        let data = await fetchAllWhitelistingData()
        setCollections(data);
        setLoading(false)
    }

    const handleDelete = async (id) => {
        setLoading(true)
        await deleteWhitelistings({ id: id })
        NotificationManager.success("Whitelisting Deleted successfully", "", NOTIFICATION_DELAY)
        setReloadContent(!reloadContent)
        setLoading(false)
    }

    useEffect(() => {
        handleFetchData()
    }, [reloadContent])

    return (
        <div className="wrapper">

            <Sidebar />
            {/* {loading ? <Spinner /> : ""} */}
            <div id="content">
                {(isSuperAdmin()) && (
                    <div className="add_btn mb-4 d-flex justify-content-end">
                        <button
                            className="btn btn-admin text-light"
                            type="button"
                            onClick={() => {
                                setModal("active")
                            }}
                        >
                            Create Whitelisting
                        </button>
                    </div>
                )}
                <div className="adminbody table-widget text-light box-background">
                    <h5 className="admintitle font-600 font-24 text-yellow">Whitelisted Addresses</h5>
                    {loading || collections === "none" ? <LoadingSpinner /> : !loading && collections?.length <= 0 && (
                        <div className="col-md-12">
                            <h4 className="no_data_text text-muted">No Whitelist address added Yet</h4>
                        </div>
                    )}
                    {collections !== "none" && collections?.length > 0 ?
                        <table className="table table-hover text-light">
                            <thead>
                                <tr>
                                    <th>Collection Address</th>
                                    <th>User Wallet Address</th>
                                    <th>Action</th>
                                </tr>
                            </thead>

                            {collections &&
                                collections !== undefined &&
                                collections !== "" &&
                                !isEmptyObject(collections) &&
                                collections.length > 0
                                ? collections?.map((data, index) => (
                                    <tbody key={index}>
                                        <tr>

                                            <td>{data.cAddress}</td>
                                            <td>{data.uAddress}</td>
                                            <td><button className='delete-btn btn-main mt-2 mb-2' onClick={() => { handleDelete(data._id) }}>Delete</button></td>
                                        </tr>
                                    </tbody>
                                ))
                                : "No Address Found"}
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
                                Create New Whitelisting
                            </h5>
                            <button
                                type="button"
                                className="btn-close"
                                onClick={() => {
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
                                        value={collection === "none" ? "" : collection}
                                        autoComplete="off"
                                        onChange={(e) => setCollection(e.target.value)}
                                        minLength={42}
                                    />

                                </div>
                                <div className="col-md-12 mb-1">
                                    <label htmlFor="recipient-name" className="col-form-label">
                                        User Address *
                                    </label>
                                    <input
                                        type="text"
                                        className="form-control"
                                        id="recipient-name"
                                        value={userWallet}
                                        autoComplete="off"
                                        onChange={(e) => setUserWallet(e.target.value)}
                                        minLength={42}
                                    />

                                </div>

                            </form>
                        </div>
                        <div className="modal-footer justify-content-center">
                            <button
                                type="button"
                                className="btn btn-admin text-light"
                                onClick={handleInsert}
                            >
                                Add Whitelisting
                            </button>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}

export default AddWhiteListing;
