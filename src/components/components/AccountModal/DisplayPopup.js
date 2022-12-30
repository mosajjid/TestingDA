import React from "react";
import { useParams } from "@reach/router";
const DisplayPopupModal = props => {
    // const { imageUrl, type } = useParams()
    const queryParams = new URLSearchParams(window.location.search);
    const imageUrl = queryParams.get('imageUrl');
    const type = queryParams.get('type');
    return (
        <div className="container-fluid">
            <div className="row">
                <div className="col-md-12">
                    <div className="image-modal h-100">
                        <div className="viewnft">
                            <span className="close-icon" onClick={props.handleClose}>x</span>
                            {type === "3D" ?
                                <model-viewer
                                    alt=""
                                    src={imageUrl}
                                    ar ar-modes="webxr scene-viewer quick-look"
                                    shadow-intensity="1"
                                    camera-controls touch-action="pan-y"
                                    enable-pan
                                    style={{ "min-height": "500px" }}
                                >
                                </model-viewer>
                                : type === "Video" ? <video className="img-fluid" controls
                                    muted
                                    autoPlay={"autoplay"}
                                    preload="auto"
                                    loop >
                                    <source src={imageUrl} type="video/mp4" />
                                </video>
                                    : <img
                                        src={imageUrl}
                                        className='img-fluid '
                                        alt=''
                                        onError={(e) => {
                                            e.target.src = "../img/collections/list4.png";
                                        }}

                                    />
                            }
                        </div>
                    </div>

                </div>
            </div>
        </div >
    );
};

export default DisplayPopupModal;