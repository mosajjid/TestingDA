import React from "react";

const PopupModal = props => {
  return (
    <div className="popup-box custom_pop">
      <div className="box">
        <span className="close-icon" onClick={props.handleClose}>x</span>
        {props.content}
      </div>
    </div>
  );
};

export default PopupModal;