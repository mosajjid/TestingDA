import React from "react";
import Web3 from "web3";
import { useState, useEffect, useCallback, useRef } from "react";
import { useCookies } from "react-cookie";
import { updateProfile, getProfile } from "../../apiServices";
import DefaultProfileImg from "../../assets/imagePlaceholder.jpg";
import { NOTIFICATION_DELAY } from "../../helpers/constants";
import { NotificationManager } from "react-notifications";


const twiterImg = {
  backgroundImage: "url(./img/profile/akar-icons_twitter-fill.png)",
  backgroundRepeat: "no-repeat",
  backgroundSize: "18px",
  backgroundPosition: "10px center",
};
const instaImg = {
  backgroundImage: "url(./img/profile/bxl_instagram-alt.png)",
  backgroundRepeat: "no-repeat",
  backgroundSize: "18px",
  backgroundPosition: "10px center",
};
const AddressImg = {
  backgroundImage: "url(./img/profile/ic_round-web.png)",
  backgroundRepeat: "no-repeat",
  backgroundSize: "18px",
  backgroundPosition: "10px center",
};

function Profile() {
  const [fname, setFname] = useState("");

  const [bio, setBio] = useState("");

  const [email, setEmail] = useState("");
  const [walletAddress, setWalletAddress] = useState("");
  const [website, setWebsite] = useState("");
  const [uname, setUname] = useState("");
  const [profilePic, setProfilePic] = useState("");
  const [loading, setLoading] = useState(false);
  const [currentUser, setCurrentUser] = useState("");
  const [cookies] = useCookies(["selected_account"]);
  const [profile, setProfile] = useState();
  const [restrictSpace] = useState([" "]);
  const [twitterHandle, setTwitterHandle] = useState("");
  const [instagramHandle, setInstagramHandle] = useState("");

  const [copySuccess, setCopySuccess] = useState("");
  const textAreaRef = useRef(null);

  useEffect(() => {
    const fetch = async () => {
      let _profile = await getProfile();
      setProfile(_profile.data);
    };
    fetch();
  }, []);

  //use Effect for setting Profile
  useEffect(() => {
    if (profile && Object.keys(profile).length > 0) {
      let username = profile?.username;

      setUname(username?.trim());

      setBio(
        profile.bio && profile.bio !== undefined && profile.bio !== "undefined"
          ? profile.bio
          : ""
      );

      setProfilePic(
        profile.profileIcon &&
          profile.profileIcon !== undefined &&
          profile.profileIcon !== "undefined"
          ? profile.profileIcon
          : ""
      );

      setEmail(
        profile.email &&
          profile.email !== undefined &&
          profile.email !== "undefined"
          ? profile.email
          : ""
      );

      setWalletAddress(
        profile.walletAddress &&
          profile.walletAddress !== undefined &&
          profile.walletAddress !== "undefined"
          ? profile.walletAddress
          : "0x00"
      );
      setTwitterHandle(
        profile.twitterHandle &&
          profile.twitterHandle !== undefined &&
          profile.twitterHandle !== "undefined"
          ? profile.twitterHandle
          : ""
      );
      setInstagramHandle(
        profile.instagramHandle &&
          profile.instagramHandle !== undefined &&
          profile.instagramHandle !== "undefined"
          ? profile.instagramHandle
          : ""
      );
    }
  }, [profile]);

  //Update Profile

  function copyToClipboard(e) {
    textAreaRef.current.select();

    document.execCommand("copy");
    // This is just personal preference.
    // I prefer to not show the whole text area selected.
    e.target.focus();
    setCopySuccess("Copied!");
    NotificationManager.success("Wallet Address Copied!", "", NOTIFICATION_DELAY);
  }

  const handleUpdateProfile = async () => {

    let data = {
      uname: uname,

      bio: bio,
      website: website,

      profilePic: profilePic,
      email: email,
    };
    if (profilePic === "" || profilePic === undefined) {
      NotificationManager.error("Please Choose Profile Picture", "", NOTIFICATION_DELAY);
      return;
    }

    if (uname === "" || uname === undefined || uname.length == 0) {
      NotificationManager.error("Please Enter Valid Username", "", NOTIFICATION_DELAY);
      return;
    }
    if (uname.indexOf(" ") !== -1) {
      NotificationManager.error("Space in Username is Not Allowed", "", NOTIFICATION_DELAY);
      return;
    }

    if (email !== "" || email !== undefined) {
      let res = await isValidEmail(email);
      if (!res) {
        NotificationManager.error("Please Enter a Valid E-mail Address", "", NOTIFICATION_DELAY);
        return;
      }
    }

    try {
      let res = await updateProfile(data);
      if (res === "User Details Updated Successfully") {
        NotificationManager.success(res, "", NOTIFICATION_DELAY);
        setTimeout(() => {
          window.location.href = "/userprofile";
        }, 200);
      }
    } catch (e) {
      console.log("error", e);
      NotificationManager.error("Something Went Wrong", "", NOTIFICATION_DELAY);
    }

  };

  const isValidEmail = async (email) => {
    var atposition = email.indexOf("@");
    var dotposition = email.lastIndexOf(".");
    if (
      atposition < 1 ||
      dotposition < atposition + 2 ||
      dotposition + 2 >= email.length
    ) {

      return false;
    }
    return true;
  };

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
      let image = reader.readAsDataURL(file);
    }
    if (e.target.files && e.target.files[0]) {
      let img = e.target.files[0];

      setProfilePic(img);
    }
  };

  useEffect(() => { }, []);
  return (
    <div className="">
      <h1 className="profile_h1 mb-3">Profile Settings</h1>
      <div className="row">
        <div className="col-lg-6 col-md-8 order-md-0 order-sm-2">
          <form action="/action_page.php">
            <div className="mb-3 mt-3">
              <label HTMLfor="user" className="form-label">
                Username
              </label>
              <input
                type="text"
                className="form-control profile_input"
                id="user"
                placeholder="DigitalArms"
                name="user"
                onChange={(r) => {
                  setUname(r.target.value);
                }}
                autoComplete="off"
                value={uname}
                maxLength={20}
              />
            </div>
            <div className="mb-3 mt-3">
              <label HTMLfor="comment" className="form-label">
                Bio
              </label>
              <textarea
                className="form-control profile_textarea"
                placeholder="Describe yourself here..."
                rows="5"
                id="comment"
                name="comment"
                value={bio}
                onChange={(e) => {
                  setBio(e.target.value);
                }}
                autoComplete="off"
                maxLength={300}
              ></textarea>
            </div>
            <div className="mb-3 mt-3">
              <label for="email">Email Address</label>
              <input
                type="email"
                className="form-control profile_input"
                autoComplete="off"
                id="email"
                placeholder="User_Account@email.com"
                onChange={(r) => {
                  setEmail(r.target.value.toLowerCase());
                }}
                value={email}
                name="email"
              />
            </div>
            <div className="mb-3 mt-3">
              <label for="links">Links</label>
              <div className="add_links_input">
                <input
                  type="url"
                  className="form-control text-white"
                  autoComplete="off"
                  id="Twitter"
                  name="Your Twitter Handle"
                  placeholder="Your Twitter Handle"
                  value={twitterHandle}
                  onChange={(e) => {
                    setTwitterHandle(e.target.value);
                  }}
                  style={twiterImg}
                />
                <input
                  type="url"
                  className="form-control text-white"
                  id="Instagram"
                  autoComplete="off"
                  name="You Instagram handle"
                  placeholder="You Instagram handle"
                  value={instagramHandle}
                  onChange={(e) => {
                    setInstagramHandle(e.target.value);
                  }}
                  style={instaImg}
                />
                <input
                  type="url"
                  className="form-control text-white"
                  id="address"
                  name="Your Site address"
                  placeholder="Your Site address"
                  autoComplete="off"
                  value={website}
                  onChange={(e) => setWebsite(e.target.value)}
                  style={AddressImg}
                />
              </div>
            </div>
            <div className="mb-3 mt-3">
              <label for="Wallet">Wallet Address</label>
              <div className="copy_input">
                <textarea
                  ref={textAreaRef}
                  value={walletAddress}
                  id="myInput"
                  disabled="true"
                  className="form-control profile_input"
                />

                {/*<input type="text" value={walletAddress} id="myInput" className="form-control profile_input" />*/}
                <button type="button" onClick={copyToClipboard}>
                  <svg
                    width="21"
                    height="24"
                    viewBox="0 0 21 24"
                    fill="none"
                    xmlns="http://www.w3.org/2000/svg"
                  >
                    <path
                      d="M15 21V22.875C15 23.4963 14.4963 24 13.875 24H1.125C0.503672 24 0 23.4963 0 22.875V5.625C0 5.00367 0.503672 4.5 1.125 4.5H4.5V18.375C4.5 19.8225 5.67755 21 7.125 21H15ZM15 4.875V0H7.125C6.50367 0 6 0.503672 6 1.125V18.375C6 18.9963 6.50367 19.5 7.125 19.5H19.875C20.4963 19.5 21 18.9963 21 18.375V6H16.125C15.5063 6 15 5.49375 15 4.875ZM20.6705 3.42052L17.5795 0.329484C17.3685 0.11852 17.0824 1.55998e-06 16.784 0L16.5 0V4.5H21V4.21598C21 3.91763 20.8815 3.63149 20.6705 3.42052Z"
                      fill="#485E6E"
                    />
                  </svg>
                </button>
              </div>
            </div>
            <div className="mt-5">
              <button
                type="button"
                className="yellow_btn mr-3"
                onClick={() => {
                  handleUpdateProfile();
                }}
              >
                Save
              </button>
              {/*<button type="submit" className="yellow_btn yellow_dark">Save</button>*/}
            </div>
          </form>
        </div>
        <div className="col-lg-6 col-md-4 order-md-0 order-sm-1">
          <ul className="profile_images">
            <li>
              <h4>Profile Image </h4>
              <div className="profile_image">
                {/*{profilePic ? (
                      <img
                        className="upload-profile "
                        src={URL.createObjectURL(profilePic)}
                        alt="profile-pic"
                      />
                    ) : (
                      ""
                    )}*/}

                <div className="overlat_btn">
                  <div className="upload-btn-wrapper img_edit_btn">
                    <button className="btn">
                      <i className="fa fa-edit fa-lg"></i>
                    </button>
                    <input type="file" name="myfile" />
                  </div>
                </div>
              </div>
              <div className="profile_image">
                {/* <img alt='' src={'../img/profile/profile1.png'} className="img-fluid profile_circle_img" /> */}
                <div
                  style={{
                    display: "flex",
                    flexDirection: "column",
                    alignItems: "center",
                    justifyContent: "center",
                    position: "relative",
                  }}
                  className="profile_div"
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
                    className="profile_me"
                    // style={{
                    //   height: "160px",
                    //   width: "160px",
                    // }}
                    onClick={() => imageUploader.current.click()}
                  >
                    <img
                      ref={uploadedImage}
                      src={
                        profilePic ? profilePic : DefaultProfileImg
                      }
                      style={{
                        width: "100%",
                        height: "100%",
                      }}
                      className="img-fluid profile_circle_img"
                    />
                    <div className="overlat_btn">
                      <button type="" className="img_edit_btn">
                        <i className="fa fa-edit fa-lg"></i>
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            </li>
          </ul>
        </div>
      </div>
    </div>
  );
}

export default Profile;
