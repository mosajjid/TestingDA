import React, { useState, useEffect } from 'react';
import check from "../images/check-mark.png";
import cross from '../images/cross-mark.png';
import mutedImg from "../images/disabled-mark.png";
import mint from '../images/mint.png';
import { nanoid } from 'nanoid';
import collectionLoader from "../images/Collection-loader.png";

const ProgressModal = ({ onRequestClose , datas, disabled, flag}) => {

  const unique_id = nanoid();


  useEffect(() => {
    function onKeyDown(event) {
      if (event.keyCode === 27) {
        onRequestClose();
      }
    }

    // Prevent scolling
    document.body.style.overflow = "hidden";
    document.addEventListener("keydown", onKeyDown);

    // Clear things up when unmounting this component
    return () => {
      document.body.style.overflow = "visible";
      document.removeEventListener("keydown", onKeyDown);
    };
  });




  return (
    <div className="modal__backdrop">
      <div className="modal__container">
        <button type="button" className="custom_close" disabled={disabled} onClick={onRequestClose}>x</button>
        <ul className='minting'>
          {datas?.map((data, key) =>
            <li key={key}>
            {data.event === "initiated" ? 
             <p>

             
             <img src={flag === "nft" ? mint : collectionLoader} alt="" className={data.event === "initiated" ? "mint_rotate" : ""} />

           </p> : data.event === "success" ?
                <p>
                  <img src={check} alt="" />
                </p>
                : data.event === "fail" ?
                <p>
                  <img src={cross} alt="" />
                </p> : 
                <p>
                <img src={mutedImg} alt="" />
              </p>
              }
              {data.desc}
            </li>
          )}
        </ul>
      </div>
    </div>
  )
}

export default ProgressModal;
