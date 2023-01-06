import React, { useState, useEffect, useCallback, useRef } from "react";
import Footer from "../components/footer";
import Threegrid from "../SVG/Threegrid";
import Twogrid from "../SVG/Twogrid";
import {
  getCategory,
  getNFTs,
  getPrice,
} from "../../helpers/getterFunctions";
import { Link, useParams, useNavigate } from "react-router-dom";
import { convertToEth } from "../../helpers/numberFormatter";
import bgImg from "./../../assets/marketplace-bg.jpg";
import { NotificationManager } from "react-notifications";
import { getAllBrands, refreshNFTMeta } from "../../apiServices";
import BGImg from "./../../assets/images/background.jpg";
import { OrbitControls } from "@react-three/drei";
import {
  extend,

} from "@react-three/fiber";
import { Tokens } from "../../helpers/tokensToSymbol";
import AdvancedFilter from "../components/AdvancedFilter";
import LoadingSpinner from "../components/Loader";
import { NOTIFICATION_DELAY } from "../../helpers/constants";
import debounce from 'lodash.debounce';


var bgImgarrow = {
  backgroundImage: "url(./img/ep_arrow-right-bold.png)",
  backgroundRepeat: "no-repeat",
};
extend({ OrbitControls });


function Marketplace() {
 



  useEffect(() => {
    async function windowScroll() {
      window.scrollTo(0, 0);
    }
    windowScroll();
  }, []);

  const gridtwo = () => {
    setgrid("col-xl-6 col-lg-6 col-md-6 col-sm-12 mb-4");
    document.getElementById("gridtwo").classList.add("active");
    document.getElementById("gridthree").classList.remove("active");
  };
  const gridthree = () => {
    setgrid("col-xl-4 col-lg-4 col-md-6 col-sm-12 mb-4");
    document.getElementById("gridthree").classList.add("active");
    document.getElementById("gridtwo").classList.remove("active");
  };

  //var register_bg = {
  //  backgroundImage: `url(${bgImg})`,
  //  backgroundRepeat: "no-repeat",
  //  backgroundSize: "cover",
  //  backgroundPositionX: "center",
  //  backgroundPositionY: "center",
  //};

  const [grid, setgrid] = useState("col-xl-3 col-lg-4 col-md-6 col-sm-12 mb-4");

  const [allNFTs, setAllNFTs] = useState([]);
  const [currPage, setCurrPage] = useState(1);
  let { searchedText } = useParams();
  const [loadMore, setLoadMore] = useState(false);
  const [togglemode, setTogglemode] = useState("filterhide");
  const [loadMoreDisabled, setLoadMoreDisabled] = useState("");
  const [category, setCategory] = useState([]);
  const [sText, setSText] = useState("");
  const [brands, setBrands] = useState([]);
  const [ERCType, setERCType] = useState(0);
  const [salesType, setSalesType] = useState("");
  const [loader, setLoader] = useState(false);
  const [cardCount, setCardCount] = useState(0);
  const [priceSort, setPriceSort] = useState("ASC");
  const [searchedCol, setSearchedCol] = useState();
  const [searchedBrand, setSearchedBrand] = useState("");
  const [searchedCat, setSearchedCat] = useState("");
  const [toggle, setToggle] = useState(false);
  const [activeRefresh, setActiveRefresh] = useState(false);
  const [activeKey, setActiveKey] = useState();
  const [searchBy, setSearchBy] = useState('name');
  const [searchOnEnter, setSearchOnEnter] = useState('false')
  const navigate = useNavigate();

  if (searchedText || searchedText !== undefined)
    searchedText = window.location.hash !== undefined ? searchedText + window.location.hash : searchedText


  const filterToggle = () => {
    if (togglemode === "filterhide") {
      setTogglemode("filtershow");
      document.getElementsByClassName("filter_btn")[0].classList.add("active");
    } else {
      setTogglemode("filterhide");
      document
        .getElementsByClassName("filter_btn")[0]
        .classList.remove("active");
    }
  };

  useEffect(() => {
    const fetch = async () => {
      try {
        const b = await getAllBrands();
        setBrands(b);
      } catch (e) {
        console.log("Error", e);
      }
      try {
        const c = await getCategory();
        setCategory(c);
      } catch (e) {
        console.log("Error", e);
      }
    };
    fetch();
  }, []);

  const fetch = async () => {
    setLoader(true);
    let temp = allNFTs;
    try {
      const reqData = {
        page: currPage,
        limit: 12,
        searchText: sText ? sText : searchedText ? searchedText : "",
        isOnMarketplace: 1,
        ERCType: ERCType,
        salesType: salesType >= 0 ? salesType : "",
        priceSort: priceSort,
        categoryID: searchedCat,
        brandID: searchedBrand,
        collectionID: searchedCol,
        searchBy: searchBy
      };
      const res = await getNFTs(reqData);

      setCardCount(cardCount + res.length);
      if (res.length > 0) {
        setLoadMoreDisabled("");
        for (let i = 0; i < res.length; i++) {
          const orderDet = await getPrice(res[i].orderData);
          res[i] = {
            ...res[i],
            salesType: orderDet?.salesType,
            price:
              orderDet?.price?.$numberDecimal === undefined
                ? "--"
                : parseFloat(Number(convertToEth(orderDet?.price?.$numberDecimal))
                  .toFixed(4)
                  .slice(0, -2)),
            paymentToken: orderDet?.paymentToken,
            brand: res[i].brandData,
          };
        }
        temp = [...temp, ...res];
        setAllNFTs(temp);
        setLoader(false);
      }

      if ((allNFTs && res.length <= 0) || (cardCount + res.length === temp[0]?.count)) {
        setLoader(false);
        setLoadMoreDisabled("disabled");
      }

    } catch (e) {
      console.log("Error in fetching all NFTs list", e);
    }
  };


  useEffect(() => {

    fetch();
  }, [
    loadMore,
    ERCType,
    salesType,
    priceSort, searchedBrand,
    searchedCat,
    searchedCol,
    toggle,
    searchOnEnter,
    sText
  ]);

  const handleSearch = async (e) => {
    const { value } = e.target;
    setSText(value);
    resetVariables();
  };

  const optimisedSearchHandle = useCallback(debounce(handleSearch, 300), [sText]);

  const handleAdvSearch = (data) => {
    resetVariables();
    if (data.type === "salesType") {
      setSalesType(data.value);
    }
    if (data.type === "collection") {
      setToggle(!toggle)
      setSearchedCol(data.value);
    }
    if (data.type === "brand") {
      setSearchedBrand(data.value);
    }
    if (data.type === "category") {
      setSearchedCat(data.value);
    }
  };

  const resetVariables = () => {
    setAllNFTs([]);
    setCurrPage(1);
    setCardCount(0);
    setLoadMoreDisabled("");
  }


  return (
    <div>
      {/*        
      {(loadMoreDisabled && allNFTs.length > 0)
        ? NotificationManager.info("No more items to load", "", 800)
        : ""} */}
      <section className='register_hd pdd_12 register_bg' >
        <div className='container'>
          <div className='row'>
            <div className='col-md-12'>
              <h1>Marketplace</h1>
            </div>
          </div>
        </div>
      </section>
      <section className='marketplacecollection pdd_8 bgImgStyle' >
        <div className='container'>
          <div className='row'>
            <div className='col-lg-12'>
              <div className='market_search_form mb-5'>
                <div className='d-flex marketplace_form'>
                  <input
                    className='mp-search me-2'
                    type='text'
                    placeholder='Search item here...'
                    aria-label='Search'
                    onChange={optimisedSearchHandle}
                    onKeyDown={(e) => {
                      if (e.key === "Enter" && sText !== "" && sText?.trim() !== "") {
                        resetVariables();
                        setSearchOnEnter(!searchOnEnter)
                      }
                    }}
                  />
                  <select
                    className='market_select_form form-select searchBy'
                    aria-label='Default select example'
                    style={bgImgarrow}
                    value={searchBy}
                    onChange={(e) => {
                      setSearchBy(e.target.value);
                      if (sText !== "" && sText?.trim() !== "") {
                        resetVariables();
                        setSearchOnEnter(!searchOnEnter)
                      }
                    }}
                    onKeyDown={(e) => {
                      if (e.key === "Enter" && sText !== "" && sText?.trim() !== "") {
                        e.preventDefault();
                        console.log("on select enter presssed")
                        resetVariables();
                        setSearchOnEnter(!searchOnEnter)
                      }
                    }}

                  >
                    <option value='name' defaultValue>Name</option>
                    <option value='tokenID'>Token ID</option>
                  </select>
                  <button className='market_btn' type='button' onClick={() => {
                    if (sText !== "" && sText?.trim() !== "") {
                      resetVariables();
                      setSearchOnEnter(!searchOnEnter)
                    }
                  }}>
                    <img src='../img/search.svg' alt='' />
                  </button>
                </div>
                <select
                  className='market_select_form form-select'
                  aria-label='Default select example'
                  style={bgImgarrow}
                  value={ERCType}
                  onChange={(e) => {
                   resetVariables();
                    setERCType(parseInt(e.target.value));
                  }}>
                  <option value='0' defaultValue>
                    All Items
                  </option>
                  <option value='1'>Single Items</option>
                  {/* <option value='2'>Multiple Items</option> */}
                </select>
                <select
                  className='market_select_form form-select'
                  aria-label='Default select example'
                  style={bgImgarrow}
                  onChange={(e) => {
                   resetVariables();
                    setPriceSort(e.target.value);
                  }}>
                  <option value='ASC' defaultValue>
                    Price: Low to High
                  </option>
                  <option value='DESC'>Price: High to Low</option>
                </select>
                {/* <div className="market_div"> */}
                <div id='gridtwo' className='market_grid' onClick={gridtwo}>
                  <Twogrid />
                </div>
                <div id='gridthree' className='market_grid' onClick={gridthree}>
                  <Threegrid />
                </div>
                {/* </div> */}
                <button
                  type='button'
                  className='filter_btn'
                  onClick={filterToggle}>
                  Adv.Filter
                </button>
              </div>
            </div>
            <AdvancedFilter
              togglemode={togglemode}
              category={category}
              brands={brands}
              onAdvSearch={handleAdvSearch}
            />
          </div>

          <div className='row'>

            {allNFTs?.length > 0 ? (
              allNFTs?.map((card, key) => {
                return (
                  <div className={grid} key={key}>
                    <div className='items_slide h-100' key={key}>
                      <div className="refresh-icon">
                        <i onClick={async () => {
                          setActiveKey(key)
                          setActiveRefresh(true);
                          let data = await refreshNFTMeta({ nftID: card.id })
                          NotificationManager.success("Refresh is in Queue, it may take few minutes", "", NOTIFICATION_DELAY);
                          setTimeout(() => {
                            setActiveRefresh(false);
                          }, 5000)
                        }} className={`${(activeRefresh && activeKey === key) ? "active" : ""} fa fa-refresh`} aria-hidden="true"></i>
                      </div>
                      <div className='items_profileimg'>
                        <a
                          href={
                            card?.brand?._id
                              ? `/collectionwithcollection/${card?.brand?._id}`
                              : ``
                          }>
                          <div className='profile_left nft-logo-img'>

                            <img
                              alt=''
                              className='profile_img creatorImg'
                              src={
                                card?.brand?.logoImage
                              }
                              key={card}
                              onError={(e) =>
                              (e.target.src =
                                "../img/collections/list4.png")
                              }
                            />
                          </div>
                        </a>
                      </div>

                      <a href={`/NFTdetails/${card.id}`} className='nft-cont'>
                        {
                          (card?.previewImg || card?.image) ?
                            <img
                              src={card?.previewImg ? card?.previewImg : card?.image}
                              className='img-fluid items_img w-100 my-3'
                              alt=''
                              onError={(e) => {
                                e.target.src = card?.previewImg ? card?.previewImg : "../img/collections/list4.png";
                              }}
                            /> :
                            <div className="blur_img_div">

                              <img
                                src={card?.collectionData[0]?.logoImage}
                                className='img-fluid items_img w-100 my-3 blur_img'
                                alt='nft'
                                onError={(e) => {
                                  e.target.src = "../img/collections/list4.png";
                                }}
                              />
                              <span className="no_img">No Image</span>
                            </div>
                        }



                      </a>
                      <div className='items_text nft-info-div'>
                        <div className='items_info '>
                          <div className='items_left'>
                            <h3 className='' data-toggle="tooltip" title={card?.name}>
                              {card?.name?.length > 50
                                ? card?.name?.slice(0, 50) + "..."
                                : card?.name}
                            </h3>
                            {card.paymentToken ? (
                              <div className='d-flex'>
                                <div className='token_img'>
                                  <img
                                    src={
                                      Tokens[
                                        card?.paymentToken?.toLowerCase()
                                      ]?.icon
                                    }
                                    alt='payment token'
                                  />
                                </div>
                                <p>
                                  {" "}
                                  {card.price}{" "}
                                  {
                                    Tokens[card?.paymentToken?.toLowerCase()]
                                      ?.symbolName
                                  }{" "}
                                </p>
                              </div>
                            ) : (
                              <p>--</p>
                            )}
                          </div>
                          {/* <div className="items_right justify-content-end d-flex">
                              <span>
                                <svg
                                  width="16"
                                  height="14"
                                  viewBox="0 0 16 14"
                                  fill="none"
                                  xmlns="http://www.w3.org/2000/svg"
                                >
                                  <path
                                    d="M15.1062 2.75379C14.866 2.21491 14.5197 1.72658 14.0866 1.31613C13.6532 0.904465 13.1422 0.577318 12.5814 0.352482C11.9998 0.118416 11.3761 -0.00139215 10.7464 1.22043e-05C9.86295 1.22043e-05 9.00102 0.234414 8.25198 0.677172C8.07278 0.783086 7.90255 0.899419 7.74127 1.02617C7.57999 0.899419 7.40976 0.783086 7.23056 0.677172C6.48152 0.234414 5.61959 1.22043e-05 4.73615 1.22043e-05C4.10001 1.22043e-05 3.48357 0.118081 2.90118 0.352482C2.33851 0.578202 1.83138 0.902892 1.39594 1.31613C0.962277 1.72611 0.615857 2.21456 0.376312 2.75379C0.127229 3.31462 0 3.91017 0 4.52309C0 5.10128 0.121853 5.70378 0.363768 6.31669C0.56626 6.82891 0.856557 7.36021 1.22749 7.89673C1.81526 8.74579 2.62343 9.6313 3.62693 10.529C5.28987 12.017 6.93668 13.0449 7.00657 13.0866L7.43126 13.3505C7.61942 13.4668 7.86133 13.4668 8.04949 13.3505L8.47418 13.0866C8.54407 13.0431 10.1891 12.017 11.8538 10.529C12.8573 9.6313 13.6655 8.74579 14.2533 7.89673C14.6242 7.36021 14.9163 6.82891 15.117 6.31669C15.3589 5.70378 15.4808 5.10128 15.4808 4.52309C15.4825 3.91017 15.3553 3.31462 15.1062 2.75379Z"
                                    fill="#AAAAAA"
                                  />
                                </svg>
                                {card.like}
                              </span>
                            </div> */}
                        </div>
                        <Link
                          to={`/NFTdetails/${card.id}`}
                          className='border_btn width-100 title_color buy-btn'>
                          {card.salesType === 0
                            ? "Buy Now"
                            : card.salesType === 1 || card.salesType === 2
                              ? "Place Bid"
                              : "View"}
                        </Link>
                      </div>
                    </div>
                  </div>
                );

              })
            ) : (
              ""
            )}
            {loader ? <LoadingSpinner /> : allNFTs?.length <= 0 ? (<div className="col-md-12">
              <h4 className="no_data_text text-muted">No NFTs Available</h4>
            </div>) : ""}
          </div>
          {!loader && allNFTs[0]?.count > 12 ? (
            <div className='row'>
              <div className='col-md-12 text-center mt-5'>
                <button
                  type='button'
                  className={`btn view_all_bdr ${loadMoreDisabled}`}
                  onClick={() => {
                    setCurrPage(currPage + 1);
                    setLoadMore(!loadMore);
                  }}>
                  Load More
                </button>
              </div>
            </div>
          ) : (
            ""
          )}
        </div>
      </section>
      <Footer />
    </div>
  );
}

export default Marketplace;
