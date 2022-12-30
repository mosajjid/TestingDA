import React, { useEffect, useState } from "react";
import LoadingSpinner from "../components/Loader";
import Clock from "../components/Clock";
import moment from "moment";
import { convertToEth } from "../../helpers/numberFormatter";
import { NOTIFICATION_DELAY } from "../../helpers/constants";
import { NotificationManager } from "react-notifications";
import { Link } from "react-router-dom";

var mint_bg = {
  backgroundImage: "url(./img/mint/mint_bg.png)",
};



function Minttab(props) {
  const [loader, setLoader] = useState(props.loading);
  useEffect(() => {
    setLoader(props.loading)
  }, [props.loading]);

  return (
    <div className="container">
      <ul className="nav nav-pills mb-5 mint_tab" id="pills-tab" role="tablist">
        <li className="nav-item" role="presentation">
          <button
            className="nav-link active"
            id="pills-upcoming-tab"
            data-bs-toggle="pill"
            data-bs-target="#pills-upcoming"
            type="button"
            role="tab"
            aria-controls="pills-upcoming"
            aria-selected="true"
          >
            Upcoming
          </button>
        </li>
        <li className="nav-item" role="presentation">
          <button
            className="nav-link"
            id="pills-past-tab"
            data-bs-toggle="pill"
            data-bs-target="#pills-past"
            type="button"
            role="tab"
            aria-controls="pills-past"
            aria-selected="true"
          >
            Past
          </button>
        </li>
      </ul>
      <div className="tab-content" id="pills-tabContent">
        <div
          className="tab-pane fade show active"
          id="pills-upcoming"
          role="tabpanel"
          aria-labelledby="pills-upcoming-tab"
        >
          <div className="row justify-content-start">
            {props?.upcoming && props.upcoming?.length > 0
              ? props?.upcoming?.map((card, key) => {
                const st = moment.utc(card.saleStartTime).local().format()
                return (
                  <div className="col-lg-4 col-md-6 mb-4" key={key}>

                    <div className="mint_box" style={mint_bg}>
                      <a href={`${!card.link ? `collection/${card._id}` : `multimintingPage/${card.link}`}`}>
                        <div className="mint_img">
                          <img alt="" src={card.logoImg} className="img-fluid" />
                          {
                            st !== null && st !== "Invalid date" ?

                              <div className="mint_date">
                                <span>
                                  {moment(st).format("DD")}
                                </span>{" "}
                                {moment(st).format("MMM")}
                              </div> : ""}
                        </div>
                      </a>
                      <div className="mint_text p-4">
                        <div className="logoImg_con rotater_border">
                          <Link
                            to={`/collectionwithcollection/${card.brand?._id}`}
                            className="rounded-circle "
                          >
                            <img
                              alt=""
                              src={card.brand?.logoImage}
                              className="mc_img"
                              onError={(e) =>
                              (e.target.src =
                                "../img/collections/list4.png")
                              }
                            />
                          </Link>
                        </div>
                        <a href={`${!card.link ? `collection/${card._id}` : `multimintingPage/${card.link}`}`} >
                          <h4 className="mb-2">{card?.name?.length > 15 ? card?.name?.slice(0, 15) + "..." : card?.name}</h4></a>

                        <ul className="m-0 p-0">
                          <li>
                            <img alt="" src={"../img/mint/hntr.svg"} />{" "}
                            {`${Number(convertToEth(card.price)).toFixed(
                              4
                            )} HNTR`}{" "}
                          </li>
                          <li>
                            <img alt="" src={"../img/mint/items.svg"} />{" "}
                            {`${card.totalSupply ? card.totalSupply : 0} items`}
                          </li>
                        </ul>
                        <span className="mint_time mt-4">
                          {moment.utc(st).local().format() === "Invalid date" ? "Coming Soon" :
                            <> <svg
                              width="24"
                              height="24"
                              viewBox="0 0 24 24"
                              fill="none"
                              xmlns="http://www.w3.org/2000/svg"
                            >
                              <path
                                d="M12.0399 23.6399C17.6069 23.6399 22.1199 19.1091 22.1199 13.52C22.1199 7.93086 17.6069 3.39999 12.0399 3.39999C6.47292 3.39999 1.95996 7.93086 1.95996 13.52C1.95996 19.1091 6.47292 23.6399 12.0399 23.6399Z"
                                fill="#428BC1"
                              />
                              <path
                                d="M12.0399 21.4C16.3698 21.4 19.8799 17.872 19.8799 13.52C19.8799 9.168 16.3698 5.64001 12.0399 5.64001C7.71003 5.64001 4.19995 9.168 4.19995 13.52C4.19995 17.872 7.71003 21.4 12.0399 21.4Z"
                                fill="white"
                              />
                              <path
                                d="M3.59997 18.52L2.71997 24H3.47997C3.95997 24 4.11997 23.44 4.43997 22.76C4.83996 21.88 5.79996 19.6 5.79996 19.6L3.59997 18.52ZM20.4399 18.52L21.3599 24H20.5999C20.1199 24 19.9599 23.44 19.6399 22.76C19.2399 21.88 18.2799 19.6 18.2799 19.6L20.4399 18.52ZM4.51996 3.28006L6.87996 5.64005L5.63996 6.92005L3.27997 4.52006L4.51996 3.28006ZM19.5599 3.28006L17.1999 5.64005L18.4399 6.92005L20.7999 4.52006L19.5599 3.28006Z"
                                fill="#428BC1"
                              />
                              <path
                                d="M1.48 8.63997L8.51997 1.48C7.63997 0.559998 6.39998 0 4.99998 0C2.23999 0 0 2.27999 0 5.03998C0 6.43998 0.559998 7.71997 1.48 8.63997ZM15.4 1.52L22.5199 8.59997C23.4399 7.67998 23.9999 6.43998 23.9999 5.03998C23.9999 2.27999 21.7599 0 18.9599 0C17.5599 0.0399999 16.3199 0.599998 15.4 1.52Z"
                                fill="#B0B8B8"
                              />
                              <path
                                d="M7.43994 17.84L11.5599 13.64L12.0399 14.12L7.91994 18.28L7.43994 17.84Z"
                                fill="#ED4C5C"
                              />
                              <path
                                d="M12.0401 15.0002C12.8574 15.0002 13.52 14.3375 13.52 13.5202C13.52 12.7028 12.8574 12.0402 12.0401 12.0402C11.2227 12.0402 10.5601 12.7028 10.5601 13.5202C10.5601 14.3375 11.2227 15.0002 12.0401 15.0002Z"
                                fill="#428BC1"
                              />
                              <path
                                d="M11.28 7.88022H12.76V13.8802H11.28V7.88022ZM12.76 12.7602H15.76V14.2402H12.76V12.7602Z"
                                fill="#428BC1"
                              />
                            </svg>

                              <Clock
                                deadline={moment.utc(st).local().format()}
                              ></Clock></>}
                        </span>
                      </div>
                    </div>

                  </div>
                );
              })
              : ""}
            {loader && props.upcoming?.length <= 0 ? <LoadingSpinner /> : props.upcoming?.length <= 0 ? <div className='col-md-12'>
              <h4 className='no_data_text text-muted'>
                No Collection Yet
              </h4>
            </div> : ""}

          </div>
        </div>
        <div
          className="tab-pane fade"
          id="pills-past"
          role="tabpanel"
          aria-labelledby="pills-past-tab"
        >
          <div className="row justify-content-start">
            {props?.past
              ? props?.past?.map((card, key) => {
                const st = moment.utc(card?.saleStartTime).local().format()
                return (
                  <div className="col-lg-4 col-md-6 mb-4" key={key}>

                    <div className="mint_box" style={mint_bg}>
                      <Link to="" onClick={() => {
                        NotificationManager.error("Sale Ended", "", NOTIFICATION_DELAY)
                      }}>
                        <div className="mint_img">
                          <img alt="" src={card.logoImg} className="img-fluid" />
                          {st !== null && st !== "Invalid date" ? <div className="mint_date">
                            <span>
                              {moment(st).format("DD")}
                            </span>{" "}
                            {moment(st).format("MMM")}
                          </div> : ""}

                        </div>
                      </Link>
                      <div className="mint_text p-4">
                        <div className="logoImg_con rotater_border">
                          <Link
                            to={`/collectionwithcollection/${card.brand?._id}`}
                            className="rounded-circle "
                          >
                            <img
                              alt=""
                              src={card.brand?.logoImage}
                              className="mc_img"
                              onError={(e) =>
                              (e.target.src =
                                "../img/collections/list4.png")
                              }
                            />
                          </Link>
                        </div>
                        {/* <div className="logoImg_con">
                            <img
                              alt=""
                              src={card.coverImg}
                              className="mc_img"
                            />
                          </div> */}
                        <Link to="" onClick={() => {
                          NotificationManager.error("Sale Ended", "", NOTIFICATION_DELAY)
                        }}>
                          <h4 className="mb-2">{card?.name?.length > 15 ? card?.name?.slice(0, 15) + "..." : card?.name}</h4></Link>
                        <ul className="m-0 p-0">
                          <li>
                            <img alt="" src={"../img/mint/hntr.svg"} />{" "}
                            {`${Number(convertToEth(card.price)).toFixed(
                              4
                            )} HNTR`}{" "}
                          </li>
                          <li>
                            <img alt="" src={"../img/mint/items.svg"} />{" "}
                            {`${card.totalSupply ? card.totalSupply : 0} items`}
                          </li>
                        </ul>
                        <span className="mint_time mt-4">
                          <svg
                            width="24"
                            height="24"
                            viewBox="0 0 24 24"
                            fill="none"
                            xmlns="http://www.w3.org/2000/svg"
                          >
                            <path
                              d="M3.55401 18.6487C5.15135 17.0513 5.31108 16.652 6.30942 17.6503C7.30776 18.6487 6.90842 18.7685 5.31108 20.4058C4.11308 21.6038 2.59561 21.3642 2.59561 21.3642C2.59561 21.3642 2.35601 19.8467 3.55401 18.6487Z"
                              fill="#FF9D27"
                            />
                            <path
                              d="M6.5889 20.286C7.22783 18.6088 7.4275 18.4091 6.50903 17.89C5.59056 17.3709 5.59056 17.7303 4.99156 19.4075C4.51236 20.6454 5.07143 21.7635 5.07143 21.7635C5.07143 21.7635 6.14963 21.5639 6.5889 20.286Z"
                              fill="#FF9D27"
                            />
                            <path
                              d="M5.67052 18.7288C6.02993 17.8104 6.02993 17.6107 6.50913 17.8902C7.02826 18.1698 6.90846 18.2896 6.54906 19.208C6.30946 19.8869 5.71046 20.0466 5.71046 20.0466C5.71046 20.0466 5.43092 19.4476 5.67052 18.7288Z"
                              fill="#FDF516"
                            />
                            <path
                              d="M6.02992 17.4509C5.51078 16.5324 5.31111 16.7321 3.63391 17.371C2.39597 17.8502 2.15637 18.8885 2.15637 18.8885C2.15637 18.8885 3.27451 19.4476 4.51245 18.9684C6.18965 18.3294 6.54905 18.3294 6.02992 17.4509Z"
                              fill="#FF9D27"
                            />
                            <path
                              d="M5.19134 18.2897C6.10981 17.9303 6.30948 17.9303 6.02994 17.4511C5.75041 16.932 5.63061 17.0518 4.71214 17.4112C4.03327 17.6508 3.87354 18.2498 3.87354 18.2498C3.87354 18.2498 4.51247 18.5293 5.19134 18.2897Z"
                              fill="#FDF516"
                            />
                            <path
                              d="M4.75208 18.2098C5.63062 17.3313 5.71049 17.0917 6.26955 17.6508C6.82862 18.2098 6.58902 18.2897 5.71048 19.1682C5.03162 19.8471 4.19301 19.6874 4.19301 19.6874C4.19301 19.6874 4.11315 18.8887 4.75208 18.2098Z"
                              fill="#FDF516"
                            />
                            <path
                              d="M6.58902 14.3761C4.11314 10.223 0 11.9401 0 11.9401C0 11.9401 5.87022 6.0699 9.82363 10.0233L6.58902 14.3761Z"
                              fill="#3BAACF"
                            />
                            <path
                              d="M8.50582 11.3012L9.78369 10.0233C5.87022 6.06991 0 11.9401 0 11.9401C0 11.9401 5.15141 8.26624 8.50582 11.3012Z"
                              fill="#428BC1"
                            />
                            <path
                              d="M9.58398 17.371C13.7371 19.8469 12.0199 23.96 12.0199 23.96C12.0199 23.96 17.8901 18.0898 13.9367 14.1364L9.58398 17.371Z"
                              fill="#3BAACF"
                            />
                            <path
                              d="M12.6588 15.4542L13.9367 14.1764C17.8901 18.1298 12.0199 24 12.0199 24C12.0199 24 15.6938 18.8087 12.6588 15.4542Z"
                              fill="#428BC1"
                            />
                            <path
                              d="M18.6888 11.5409C14.0166 16.1731 8.86519 18.6889 7.06818 16.8919C5.27118 15.0949 7.78698 9.94352 12.4193 5.27131C17.8502 -0.159641 23.8802 0.0799596 23.8802 0.0799596C23.8802 0.0799596 24.0798 6.10991 18.6888 11.5409Z"
                              fill="#C5D0D8"
                            />
                            <path
                              d="M17.4908 10.223C12.8585 14.8552 8.22627 17.8902 7.14807 16.812C6.06986 15.7338 9.10481 11.1015 13.7371 6.46922C19.168 1.03827 23.96 0 23.96 0C23.96 0 22.9218 4.79201 17.4908 10.223Z"
                              fill="#DAE3EA"
                            />
                            <path
                              d="M8.90518 18.1696C8.70552 18.3693 8.38605 18.3693 8.18638 18.1696L5.79038 15.7736C5.59071 15.574 5.59071 15.2146 5.79038 15.0149L6.50918 14.2961L9.62399 17.4109L8.90518 18.1696Z"
                              fill="#C94747"
                            />
                            <path
                              d="M8.22627 17.4509C8.0266 17.6506 7.787 17.7304 7.6672 17.6106L6.30946 16.2529C6.18966 16.1331 6.26953 15.8935 6.4692 15.6938L7.188 14.975L8.94507 16.7321L8.22627 17.4509Z"
                              fill="#F15744"
                            />
                            <path
                              d="M7.54743 18.4492C7.42763 18.569 7.1481 18.569 7.0283 18.4492L5.47089 16.8918C5.35109 16.772 5.39103 16.5324 5.51083 16.4126L5.99003 15.9334L8.02664 17.97L7.54743 18.4492Z"
                              fill="#3E4347"
                            />
                            <path
                              d="M7.22794 18.1299C7.10814 18.2497 6.86854 18.2896 6.78867 18.2097L5.71047 17.1315C5.6306 17.0517 5.67053 16.852 5.83027 16.7322L6.30947 16.253L7.70714 17.6507L7.22794 18.1299Z"
                              fill="#62727A"
                            />
                            <path
                              d="M23.8801 0.0798307C23.8801 0.0798307 21.7237 -3.61502e-05 18.8086 1.1181L22.8419 5.15138C23.96 2.23624 23.8801 0.0798307 23.8801 0.0798307Z"
                              fill="#C94747"
                            />
                            <path
                              d="M23.8802 0.0799408C23.8802 0.0799408 22.1631 0.439342 19.5674 1.91688L22.0433 4.39275C23.5208 1.79708 23.8802 0.0799408 23.8802 0.0799408Z"
                              fill="#F15744"
                            />
                            <path
                              d="M16.5724 9.38437C17.6751 9.38437 18.569 8.49043 18.569 7.38769C18.569 6.28496 17.6751 5.39102 16.5724 5.39102C15.4696 5.39102 14.5757 6.28496 14.5757 7.38769C14.5757 8.49043 15.4696 9.38437 16.5724 9.38437Z"
                              fill="#EDF4F9"
                            />
                            <path
                              d="M16.5723 8.70557C17.3001 8.70557 17.8901 8.11557 17.8901 7.38776C17.8901 6.65996 17.3001 6.06996 16.5723 6.06996C15.8445 6.06996 15.2545 6.65996 15.2545 7.38776C15.2545 8.11557 15.8445 8.70557 16.5723 8.70557Z"
                              fill="#3BAACF"
                            />
                            <path
                              d="M12.5791 13.3777C13.6818 13.3777 14.5757 12.4838 14.5757 11.381C14.5757 10.2783 13.6818 9.38435 12.5791 9.38435C11.4763 9.38435 10.5824 10.2783 10.5824 11.381C10.5824 12.4838 11.4763 13.3777 12.5791 13.3777Z"
                              fill="#EDF4F9"
                            />
                            <path
                              d="M12.579 12.6989C13.3068 12.6989 13.8968 12.1089 13.8968 11.3811C13.8968 10.6533 13.3068 10.0633 12.579 10.0633C11.8512 10.0633 11.2612 10.6533 11.2612 11.3811C11.2612 12.1089 11.8512 12.6989 12.579 12.6989Z"
                              fill="#3BAACF"
                            />
                            <path
                              d="M18.7287 1.95678C18.6089 2.07658 18.3693 2.07658 18.2495 1.95678C18.1297 1.83698 18.1297 1.59738 18.2495 1.47758C18.3693 1.35778 18.6089 1.35778 18.7287 1.47758C18.8485 1.59738 18.8485 1.83698 18.7287 1.95678Z"
                              fill="white"
                            />
                            <path
                              d="M19.4076 2.95522C19.584 2.95522 19.7271 2.81219 19.7271 2.63575C19.7271 2.45931 19.584 2.31628 19.4076 2.31628C19.2312 2.31628 19.0881 2.45931 19.0881 2.63575C19.0881 2.81219 19.2312 2.95522 19.4076 2.95522Z"
                              fill="white"
                            />
                            <path
                              d="M20.3661 3.91359C20.5425 3.91359 20.6856 3.77056 20.6856 3.59413C20.6856 3.41769 20.5425 3.27466 20.3661 3.27466C20.1897 3.27466 20.0466 3.41769 20.0466 3.59413C20.0466 3.77056 20.1897 3.91359 20.3661 3.91359Z"
                              fill="white"
                            />
                            <path
                              d="M21.2846 4.87195C21.461 4.87195 21.604 4.72892 21.604 4.55248C21.604 4.37605 21.461 4.23302 21.2846 4.23302C21.1081 4.23302 20.9651 4.37605 20.9651 4.55248C20.9651 4.72892 21.1081 4.87195 21.2846 4.87195Z"
                              fill="white"
                            />
                            <path
                              d="M22.2429 5.79035C22.4194 5.79035 22.5624 5.64732 22.5624 5.47088C22.5624 5.29444 22.4194 5.15141 22.2429 5.15141C22.0665 5.15141 21.9235 5.29444 21.9235 5.47088C21.9235 5.64732 22.0665 5.79035 22.2429 5.79035Z"
                              fill="white"
                            />
                          </svg>
                          Launched
                        </span>
                      </div>
                    </div>

                  </div>
                );
              })
              : ""}
            {loader && props.past?.length <= 0 ? <LoadingSpinner /> : props.past?.length <= 0 && !loader ? <div className='col-md-12'>
              <h4 className='no_data_text text-muted'>
                No Collection Yet
              </h4>
            </div> : ""}
          </div>
        </div>
      </div>
    </div>
  );
}

export default Minttab;
