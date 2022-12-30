import React, { useState } from "react";
import { NotificationManager } from "react-notifications";

function NotificationsArea() {
  const [tokenval, setTokenval] = useState("0.005");
  const [isDisabled, setIsDisabled] = useState("");
  let initialValue = "0.005";

  return (
    <div className='profile_area notification_area pdd_8'>
      <h1 className='profile_h1'>Profile Settings</h1>
      <p className='profile_p mb-5'>
        Select which notifications you would like to receive for
        0xa0cacxc...xadef
      </p>
      <ul className='notification_list'>
        <li className=''>
          <div className=''>
            <img
              src={"../img/profile/mdi_sticker-check-outline.png"}
              alt=''
              className='img-fluid'
            />
          </div>
          <div className=''>
            <h6>Item Sold</h6>
            <p>When someone purchased one of your items</p>
          </div>
        </li>
        <li className=''>
          <div className=''>
            <img
              src={"../img/profile/mdi_sticker-check-outline.png"}
              alt=''
              className='img-fluid'
            />
          </div>
          <div className=''>
            <h6>Bid Activity</h6>
            <p>When someone bids on one of your items</p>
          </div>
        </li>
        <li className=''>
          <div className=''>
            <img
              src={"../img/profile/mdi_sticker-check-outline.png"}
              alt=''
              className='img-fluid'
            />
          </div>
          <div className=''>
            <h6>Price Change</h6>
            <p>When an item you made and offer on changes price</p>
          </div>
        </li>
        <li className=''>
          <div className=''>
            <img
              src={"../img/profile/mdi_sticker-check-outline.png"}
              alt=''
              className='img-fluid'
            />
          </div>
          <div className=''>
            <h6>Auction Expiration</h6>
            <p>When a timed auction you created ends</p>
          </div>
        </li>
        <li className=''>
          <div className=''>
            <img
              src={"../img/profile/mdi_sticker-check-outline.png"}
              alt=''
              className='img-fluid'
            />
          </div>
          <div className=''>
            <h6>Outbid</h6>
            <p>When an offer you placed is exceeded by another user</p>
          </div>
        </li>
        <li className=''>
          <div className=''>
            <img
              src={"../img/profile/mdi_sticker-check-outline.png"}
              alt=''
              className='img-fluid'
            />
          </div>
          <div className=''>
            <h6>Owned Item Updates</h6>
            <p>
              When a significant update occurs for one of the items you have
              purchased on Digital Arms
            </p>
          </div>
        </li>
        <li className=''>
          <div className=''>
            <img
              src={"../img/profile/mdi_sticker-check-outline.png"}
              alt=''
              className='img-fluid'
            />
          </div>
          <div className=''>
            <h6>Successful Purchase</h6>
            <p>When you successfully buy an item</p>
          </div>
        </li>
        <li className=''>
          <div className=''>
            <img
              src={"../img/profile/mdi_sticker-check-outline.png"}
              alt=''
              className='img-fluid'
            />
          </div>
          <div className=''>
            <h6>Digital Arms Newsletter</h6>
            <p>Occasional updates from the Digital Arms team</p>
          </div>
        </li>
      </ul>
      <div className='notification_bottom'>
        <h6>Minimum Bid Threshold</h6>
        <p>
          Receive notifications only when you receive offers with a value
          greater than or equal to this amount of HNTR.
        </p>
      </div>
      <table className='notification_table'>
        <tr>
          <td>
            <h6>HNTR</h6>
            <p>Hunter Token</p>
          </td>
          <td>
            <input
              type='text'
              value={tokenval}
              className="notifi_text"
              onChange={(e) => {
                setTokenval(e.target.value);
                if (initialValue !== e.target.value) {
                  setIsDisabled("");
                } else {
                  setIsDisabled("yellow_dark");
                }
              }}
             
            />
          </td>
        </tr>
      </table>
      <div className='mt-5'>
        <button
          type='submit'
          className={`yellow_btn mr-3 mb-3 ${isDisabled}`}
          disabled={isDisabled ? true : false}
          onClick={() => {
            NotificationManager.success("Minimun Bid Threshold Updated Successfully","",800);               
          }}
          >
          Save
        </button>
      </div>
    </div>
  );
}

export default NotificationsArea;
