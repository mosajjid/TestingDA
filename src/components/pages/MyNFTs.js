import React, { useEffect, useState, useCallback } from "react";
import Footer from "../components/footer";
import AuthorListing from "../components/AuthorListing";
import DownloadSVG from "../SVG/DownloadSVG";
import OffermadeSVG from "../SVG/OffermadeSVG";
import { Link, NavLink } from "react-router-dom";
import { AuthorCard } from "../../Data/dummyJSON";
import Threegrid from "../SVG/Threegrid";
import Twogrid from "../SVG/Twogrid";
import { useParams } from "react-router-dom";
import {
  GetIndividualAuthorDetail,
  getOnSaleItems,
  GetOwnedNftList,
  getProfile,
} from "../../apiServices";
import moment from "moment";
import coverImg from "./../../assets/images/authorbg.jpg";
import arrow from "./../../assets/images/ep_arrow-right-bold.png";
import UpArrow from "../SVG/dropdown";
import { getCategory, getOfferMade, getOfferReceived } from "../../helpers/getterFunctions";
import GeneralOffer from "../components/GeneralOffer";
import NFThistory from "../components/NFThistory";
import { useCookies } from "react-cookie";
import LoadingSpinner from "../components/Loader";
import { CopyToClipboard } from "react-copy-to-clipboard";
import debounce from 'lodash.debounce';

function MyNFTs() {
  const [profile, setProfile] = useState();
  const [ownedNFTs, setOwnedNFTs] = useState([]);
  const [totalOwned, setTotalOwned] = useState(0);
  const [category, setCategory] = useState([]);
  const [togglemode, setTogglemode] = useState("filterhide");
  const [loader, setLoader] = useState(false);
  const [onSaleNFTs, setOnSaleNFTs] = useState([]);
  const [searchFor1, setSearchFor1] = useState("");
  const [priceSort1, setPriceSort1] = useState('ASC');
  const [ERCType1, setERCType1] = useState();
  const [searchFor2, setSearchFor2] = useState("");
  const [priceSort2, setPriceSort2] = useState('ASC');
  const [ERCType2, setERCType2] = useState();
  const [onSaleCount, setOnSaleCount] = useState(0);
  const [offerMade, setOfferMade] = useState([]);
  const [offerReceived, setOfferReceived] = useState([]);
  const [showFilter, setShowFilter] = useState(true);
  const [cookies] = useCookies([]);
  const [currPageforOwned, setCurrPageforOwned] = useState(1);
  const [currPageforOnSale, setCurrPageforOnSale] = useState(1);
  const [filterFor, setFilterFor] = useState("Owned");
  const [loadMoreDisabled, setLoadMoreDisabled] = useState("");
  const [isCopied, setIsCopied] = useState(false);
  const [cardCount1, setCardCount1] = useState(0);
  const [filterCnt1, setFilterCnt1] = useState(0);
  const [cardCount2, setCardCount2] = useState(0);
  const [filterCnt2, setFilterCnt2] = useState(0);
  const [searchBy1, setSearchBy1] = useState('name');
  const [searchBy2, setSearchBy2] = useState('name');
  const [searchOnEnter1, setSearchOnEnter1] = useState('false')
  const [searchOnEnter2, setSearchOnEnter2] = useState('false')

  const bgImage = {
    backgroundImage: `url(${coverImg})`,
    backgroundSize: "cover",
    backgroundPosition: "center",
  };

  var bgImgarrow = {
    backgroundImage: `url(${arrow})`,
    backgroundRepeat: "no-repeat",
  };

  useEffect(() => {
    const fetch = async () => {
      try {
        const c = await getCategory();
        setCategory(c);
      } catch (e) {
        console.log("Error", e);
      }
    };
    fetch();
  }, []);

  useEffect(() => {

    const fetchOwnedItems = async () => {
      setLoader(true);
      let temp = ownedNFTs;
      try {
        let reqBody = {
          page: currPageforOwned,
          limit: 12,
          userWalletAddress: cookies?.selected_account?.toLowerCase(),
          searchType: "owned",
          searchText: searchFor1,
          priceSort: priceSort1,
          ERCType: ERCType1,
          isOnMarketplace: 1,
          searchBy: searchBy1
        };
        let _owned = await GetOwnedNftList(reqBody);
        setTotalOwned(_owned?.count);
        setFilterCnt1(_owned?.filterCount);
        if (_owned?.results?.length > 0) {
          setCardCount1(cardCount1 + _owned?.results?.length)
          temp = [...temp, ..._owned?.results];
          setOwnedNFTs(temp);
          setLoader(false);
        }

        if ((_owned && _owned?.results?.length <= 0) || (cardCount1 + _owned?.results?.length === _owned?.filterCount)) {
          setLoader(false);
          setLoadMoreDisabled("owned");
          return;
        }


      } catch (e) {
        setLoader(false);
        console.log("Error in fetching owned nfts", e);
      }
    }
    fetchOwnedItems();
  }, [currPageforOwned, priceSort1, searchOnEnter1, searchFor1, ERCType1])

  useEffect(() => {
    const fetchOnSaleItems = async () => {
      setLoader(true)
      let temp = onSaleNFTs;
      try {
        let reqBody = {
          page: currPageforOnSale,
          limit: 12,
          userWalletAddress: cookies?.selected_account?.toLowerCase(),
          searchText: searchFor2,
          priceSort: priceSort2,
          ERCType: ERCType2,
          isOnMarketplace: 1,
          searchBy: searchBy2
        };
        const onsale = await getOnSaleItems(reqBody);
        setOnSaleCount(onsale?.count);
        setFilterCnt2(onsale?.filterCount);
        if (onsale?.results?.length > 0) {

          setCardCount2(cardCount2 + onsale?.results?.length)
          temp = [...temp, ...onsale?.results]
          setOnSaleNFTs(temp);
          setLoader(false)
        } if ((onsale && onsale?.results?.length <= 0) || (cardCount2 + onsale?.results?.length === onsale?.filterCount)) {
          setLoader(false);
          setLoadMoreDisabled("onSale");
          return;
        }
      } catch (e) {
        setLoader(false)
        console.log("Error in fetching onSale Items", e);
      }
    }
    fetchOnSaleItems();
  }, [currPageforOnSale, priceSort2, searchOnEnter2, searchFor2, ERCType2])

  const fetch = async () => {
    setLoader(true);
    let user = await getProfile();
    let _profile = await GetIndividualAuthorDetail({ userID: user?.data?._id });
    setProfile(_profile);


    try {
      const _offerMade = await getOfferMade({
        page: 1,
        limit: 12,
        userID: user?.data?._id
      })
      setOfferMade(_offerMade);

      const _offerReceived = await getOfferReceived({
        page: 1,
        limit: 12,
        userWalletAddress: _profile?.walletAddress?.toLowerCase()
      })
      setOfferReceived(_offerReceived);
    }
    catch (e) {
      console.log("Error in fetching offers", e)
    }
  };
  useEffect(() => {

    fetch();
  }, []);

  useEffect(() => {
    window.scrollTo(0, 0);
  }, []);

  const gridtwo = () => {
    setgrid("col-md-6 mb-4");
    document.getElementById("gridtwo").classList.add("active");
    document.getElementById("gridthree").classList.remove("active");
  };
  const gridthree = () => {
    setgrid("col-md-4 mb-4");
    document.getElementById("gridthree").classList.add("active");
    document.getElementById("gridtwo").classList.remove("active");
  };

  const [grid, setgrid] = useState("col-md-3 mb-4");

  const handleSearch = async (e) => {
    const { value } = e.target;
    resetVariables();
    if (filterFor === "Owned") {
      setSearchFor1(value);
    }
    else {
      setSearchFor2(value);
    }
  }


  const optimisedSearchHandle = useCallback(debounce(handleSearch, 300), [searchFor1, searchFor2]);

  const resetVariables = () => {
    if (filterFor === "Owned") {
      setOwnedNFTs([]);
      setCurrPageforOwned(1);
      setLoadMoreDisabled("")
      setCardCount1(0)
      setFilterCnt1(0)
    }
    else {
      setOnSaleNFTs([]);
      setCurrPageforOnSale(1)
      setLoadMoreDisabled("")
      setCardCount2(0)
      setFilterCnt2(0)
    }
  }

  return (
    <div>
      <section
        className='collection_banner pdd_8 d-flex align-items-center justify-content-center'
        style={bgImage}></section>
      <section className='collection_info'>
        <div className='container'>
          <div className='row align-items-end martop-100'>
            <div className='col-md-4'></div>
            <div className='col-md-4 d-flex justify-content-center'>
              <div className='auther_pick'>
                <img
                  alt=''
                  src={
                    profile?.profileIcon
                      ? profile?.profileIcon
                      : "../img/author/icon5.svg"
                  }
                  className='img-fluid collection_profile'
                />
                {/* <div className="overlat_btn">
                  <button type="" className="img_edit_btn">
                    <i className="fa fa-edit fa-lg"></i>
                  </button>
                </div> */}
              </div>
            </div>
            {/* <div className='col-md-4 d-flex justify-content-end'>
              <div className='follow_btns'>
                <button type='button' className='white_btn mr10'>
                  5.2k Followers
                </button>
                <button type='button' className='yellow_btn'>
                  5.2k Following
                </button>
              </div>
            </div> */}
          </div>
          {/* <div className="collection_pick">
            <img alt='' src={'../img/author/user-img.png'} className="img-fluid collection_profile" />
            <div className="overlat_btn"><button type="" className="img_edit_btn"><i className='fa fa-edit fa-lg'></i></button></div>
          </div> */}

          <h1 className='collection_title text-center'>
            {profile?.username ? profile?.username : "Unnamed"}{" "}
            {/* <img alt='' src={"../img/author/check.png"} className='img-fluid' /> */}
          </h1>

          <div className='coppycode text-center mb-4'>
            <span className="ctc">
              <img alt="" src={"../img/favicon.png"} className="img-fluid" />
              <div className="">
                {profile?.walletAddress
                  ? profile?.walletAddress?.slice(0, 4) +
                  "..." +
                  profile?.walletAddress?.slice(38, 42)
                  : "-"}
              </div>

              <CopyToClipboard
                text={profile?.walletAddress}
                onCopy={() => {
                  setIsCopied(true);
                  setTimeout(() => {
                    setIsCopied(false);
                  }, 1000);
                }}
              >
                <svg
                  width="21"
                  height="24"
                  viewBox="0 0 21 24"
                  fill="none"
                  xmlns="http://www.w3.org/2000/svg"
                >
                  <path
                    d="M15 21V22.875C15 23.4963 14.4963 24 13.875 24H1.125C0.503672 24 0 23.4963 0 22.875V5.625C0 5.00367 0.503672 4.5 1.125 4.5H4.5V18.375C4.5 19.8225 5.67755 21 7.125 21H15ZM15 4.875V0H7.125C6.50367 0 6 0.503672 6 1.125V18.375C6 18.9963 6.50367 19.5 7.125 19.5H19.875C20.4963 19.5 21 18.9963 21 18.375V6H16.125C15.5063 6 15 5.49375 15 4.875ZM20.6705 3.42052L17.5795 0.329484C17.3685 0.11852 17.0824 1.55998e-06 16.784 0L16.5 0V4.5H21V4.21598C21 3.91763 20.8815 3.63149 20.6705 3.42052Z"
                    fill="#fff"
                  />
                </svg>
              </CopyToClipboard>
              {isCopied ? <p className="copied">Copied!</p> : ""}
            </span>
          </div>
          <div className='user_description text-center mb-5'>
            <p>{profile?.bio}</p>
            <h6>Joined {moment(profile?.createdOn).format("MMMM YYYY")}</h6>
          </div>

          <ul className='author_cart nav' role='tablist'>
            <li>
              <button
                data-bs-toggle='pill'
                data-bs-target='#pills-Owned'
                type='button'
                role='tab'
                aria-controls='pills-Owned'
                aria-selected='true'
                className='active'
                onClick={() => {
                  setFilterFor("Owned");
                  setShowFilter(true);
                  setLoadMoreDisabled("");
                  setSearchBy1('name')
                  setSearchFor1("")
                }}
              >
                <img
                  alt=''
                  src={"../img/author/icon1.svg"}
                  className='img-fluid'
                />{" "}
                Owned {totalOwned >= 1 ? `(${totalOwned})` : ""}
              </button>
            </li>
            <li>
              <button
                data-bs-toggle='pill'
                data-bs-target='#pills-Sale'
                type='button'
                role='tab'
                aria-controls='pills-Sale'
                aria-selected='true'
                onClick={() => {
                  setFilterFor("OnSale");
                  setShowFilter(true);
                  setLoadMoreDisabled("");
                  setSearchBy2('name')
                  setSearchFor2("")
                }}
              >
                On Sale {onSaleCount >= 1 ? `(${onSaleCount})` : ""}
              </button>
            </li>
            <li>
              <button
                data-bs-toggle='pill'
                data-bs-target='#pills-Activity'
                type='button'
                role='tab'
                aria-controls='pills-Activity'
                aria-selected='true'
                onClick={() => setShowFilter(false)}
              >
                <img
                  alt=''
                  src={"../img/author/icon4.svg"}
                  className='img-fluid'
                />{" "}
                Activity
              </button>
            </li>
            <li>
              <button
                type='button'
                className='dropdown-toggle'
                to={""}
                role='button'
                id='dropdownMenuLink'
                data-bs-toggle='dropdown'
                aria-expanded='false'

              >
                Offers
              </button>
              <ul className='dropdown-menu Autherpagetab' aria-labelledby='dropdownMenuLink'>
                <li>
                  <button
                    data-bs-toggle='pill'
                    data-bs-target='#pills-NFToffer'
                    type='button'
                    role='tab'
                    aria-controls='pills-NFToffer'
                    aria-selected='true'
                    onClick={() => setShowFilter(false)}
                    className="w-100"
                  >
                    <DownloadSVG /> Offer Received
                  </button>
                </li>
                <li>
                  <button
                    data-bs-toggle='pill'
                    data-bs-target='#pills-NFTmade'
                    type='button'
                    role='tab'
                    aria-controls='pills-NFTmade'
                    aria-selected='true'
                    onClick={() => setShowFilter(false)}
                    className="w-100"
                  >
                    <OffermadeSVG /> Offer Made
                  </button>
                </li>
              </ul>
            </li>
          </ul>
          {
            showFilter && <div className='row'>
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
                        if (e.key === "Enter") {
                          resetVariables();
                          if (filterFor === "Owned") {
                            setSearchOnEnter1(!searchOnEnter1);
                          }
                          else {
                            setSearchOnEnter2(!searchOnEnter2);
                          }
                        }
                      }}

                    />
                    <select
                      className='market_select_form form-select searchBy'
                      aria-label='Default select example'
                      style={bgImgarrow}
                      value={filterFor === "Owned" ? searchBy1 : searchBy2}
                      onChange={(e) => {
                        if (filterFor === "Owned") {
                          setSearchBy1(e.target.value);
                        }
                        else {
                          setSearchBy2(e.target.value);
                        }

                        if (filterFor === "Owned" && searchFor1 !== "" && searchFor1?.trim() !== "") {
                          resetVariables();
                          setSearchOnEnter1(!searchOnEnter1);
                        }
                        if (filterFor !== "Owned" && searchFor2 !== "" && searchFor2?.trim() !== "") {
                          resetVariables();
                          setSearchOnEnter2(!searchOnEnter2);
                        }
                      }}
                      onKeyDown={(e) => {
                        if (e.key === "Enter") {
                          e.preventDefault();
                          resetVariables();
                          if (filterFor === "Owned") {
                            setSearchOnEnter1(!searchOnEnter1);
                          }
                          else {
                            setSearchOnEnter2(!searchOnEnter2);
                          }
                        }
                      }}
                    >
                      <option value='name' defaultValue>Name</option>
                      <option value='tokenID'>Token ID</option>
                    </select>
                    <button className='market_btn' type='submit' onClick={(e) => {

                      if (filterFor === "Owned" && searchFor1 !== "" && searchFor1?.trim() !== "") {
                        resetVariables();
                        setSearchOnEnter1(!searchOnEnter1);
                      }
                      if (filterFor !== "Owned" && searchFor2 !== "" && searchFor2?.trim() !== "") {
                        resetVariables();
                        setSearchOnEnter2(!searchOnEnter2);
                      }
                    }}>
                      <img src='../img/search.svg' alt='' />
                    </button>
                  </div>
                  <select
                    className='market_select_form form-select'
                    aria-label='Default select example'
                    style={bgImgarrow}
                    onChange={(e) => {
                      resetVariables();
                      if (filterFor === "Owned") {
                        setERCType1(parseInt(e.target.value));
                      }
                      else {
                        setERCType2(parseInt(e.target.value));
                      }
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
                      if (filterFor === "Owned") {
                        setPriceSort1(e.target.value);
                      }
                      else {
                        setPriceSort2(e.target.value);
                      }

                    }
                    }
                  >
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
                  {/* <button
                type="button"
                className="filter_btn"
                onClick={filterToggle}
              >
                Adv.Filter
              </button> */}
                </div>
              </div>
              <div className={`filter mb-5 ${togglemode}`}>
                <div className='filtercol'>
                  <form>
                    <button
                      type='button'
                      className='drop_down_tlt'
                      data-bs-toggle='collapse'
                      data-bs-target='#demo'>
                      Status <UpArrow />
                    </button>
                    <div id='demo' className='collapse show'>
                      <ul className='status_ul'>
                        <li>
                          <Link to={"/"} className='filter_border'>
                            Buy Now
                          </Link>
                          <Link to={"/"} className='filter_border'>
                            On Auction
                          </Link>
                        </li>
                        <li>
                          <Link to={"/"} className='filter_border'>
                            Now
                          </Link>
                          <Link to={"/"} className='filter_border'>
                            Offers
                          </Link>
                        </li>
                      </ul>
                    </div>

                    {/* <button
                  type="button"
                  className="drop_down_tlt"
                  data-bs-toggle="collapse"
                  data-bs-target="#demo2"
                >
                  Price <UpArrow />
                </button> */}
                    {/* <div id="demo2" className="collapse show">
                  <ul className="status_ul">
                    <li>
                      <select
                        className="form-select filter_apply filter-text-left"
                        aria-label="Default select example"
                      >
                        <option selected>$ Australian Dollar (AUD)</option>
                        <option value="1">One</option>
                        <option value="2">Two</option>
                        <option value="3">Three</option>
                      </select>
                    </li>
                    <li>
                      <div className="range_input">
                        <input
                          type="text"
                          className="form-control"
                          id="exampleInputPassword1"
                          placeholder="Min"
                        />
                        <span className="span_class">to</span>
                        <input
                          type="text"
                          className="form-control"
                          id="exampleInputPassword1"
                          placeholder="Max"
                        />
                      </div>
                    </li>
                    <li>
                      <button type="submit" className="filter_apply">
                        Apply
                      </button>
                    </li>
                  </ul>
                </div> */}
                  </form>
                </div>
                <div className='filtercol'>
                  <form>
                    <button
                      type='button'
                      className='drop_down_tlt'
                      data-bs-toggle='collapse'
                      data-bs-target='#demo3'>
                      Collections <UpArrow />
                    </button>
                    <div id='demo3' className='collapse show'>
                      <input
                        type='text'
                        placeholder='Filter'
                        className='filter_apply filter-text-left filter_padd'
                      />
                    </div>
                  </form>
                </div>
                <div className='filtercol'>
                  <button
                    type='button'
                    className='drop_down_tlt mb-4'
                    data-bs-toggle='collapse'
                    data-bs-target='#demo4'>
                    Categories <UpArrow />
                  </button>
                  <div id='demo4' className='collapse show'>
                    <ul>
                      <li className='sub-items'>
                        <form action='#' className='checked_form'>
                          <div className='form-check form-check-inline'>
                            <input type='radio' id='allnfts' name='radio-group' />
                            <label htmlFor='allnfts'>All NFTs</label>
                          </div>
                          {category
                            ? category?.map((c, key) => {
                              return (
                                <div className='form-check form-check-inline' key={key}>
                                  <input
                                    type='radio'
                                    id={c.name}
                                    name='radio-group'
                                    key={c}
                                  />
                                  <label htmlFor={c.name}>{c.name}</label>
                                </div>
                              );
                            })
                            : ""}
                        </form>
                      </li>
                    </ul>
                  </div>
                </div>
                <div className='filtercol'>
                  <button
                    type='button'
                    className='drop_down_tlt mb-4'
                    data-bs-toggle='collapse'
                    data-bs-target='#demo5'>
                    Brands <UpArrow />
                  </button>
                  <div id='demo5' className='collapse show'>
                    <ul>
                      <li>
                        <input
                          type='text'
                          placeholder='Filter'
                          className='filter_apply  filter-text-left filter_padd'
                        />
                      </li>
                      <li>
                        <form action='#' className='checked_form'>
                          <div className='form-check form-check-inline'>
                            <input type='radio' id='test1' name='radio-group' />
                            <label htmlFor='test1'>Apple</label>
                          </div>
                          <div className='form-check form-check-inline'>
                            <input type='radio' id='test2' name='radio-group' />
                            <label htmlFor='test2'>Apple</label>
                          </div>
                        </form>
                      </li>
                    </ul>
                  </div>
                </div>
              </div>
            </div>
          }

        </div>
      </section>
      <section className='collection_list mb-5 pb-5'>
        <div className='container'>
          <div className='tab-content' id='pills-tabContent'>
            <div
              className='tab-pane fade show active'
              id='pills-Owned'
              role='tabpanel'
              aria-labelledby='pills-Owned-tab'>
              <div className='row'>
                {
                  ownedNFTs && ownedNFTs?.length > 0 ? ownedNFTs?.map((card, key) => {
                    return (<div className={grid} key={key}>
                      <AuthorListing
                        previewImg={card?.previewImg}
                        image={card.image}
                        fileType={card.fileType}
                        card={card}
                        link={`/nftDetails/${card._id}`}
                        bttn={card?.OrderData ? card?.OrderData[0]?.salesType : ""}
                        flag="mynft"
                      />
                    </div>
                    )
                  }
                  ) : (
                    ""
                  )
                }
                {loader ? <LoadingSpinner /> : ownedNFTs?.length <= 0 ? <div className='col-md-12'>
                  <h4 className='no_data_text text-muted'>
                    No NFTs Available
                  </h4>
                </div> : ""}
              </div>
              {
                !loader && filterCnt1 > 12 ? <div className='col-md-12 text-center mt-5'>
                  <button
                    type='button'
                    className={`btn view_all_bdr ${loadMoreDisabled === "owned" ? "disabled" : ""}`}
                    onClick={() => {
                      setCurrPageforOwned(currPageforOwned + 1);

                    }}
                  >
                    Load More
                  </button>
                </div> : ""
              }

            </div>
            <div
              className='tab-pane fade'
              id='pills-Sale'
              role='tabpanel'
              aria-labelledby='pills-Sale-tab'>
              <div className='row'>

                {
                  onSaleNFTs && onSaleNFTs?.length > 0 ? onSaleNFTs?.map((card, key) => {
                    return (
                      <div className={grid} key={key}>
                        <AuthorListing
                          previewImg={card?.previewImg}
                          image={card?.image}
                          fileType={card?.fileType}
                          card={card}
                          link={`/nftDetails/${card?._id}`}
                          bttn={card?.OrderData ? card?.OrderData[0]?.salesType : ""}
                          flag="mynft"
                        />
                      </div>)

                  })
                    : (
                      ""
                    )
                }
                {loader ? <LoadingSpinner /> : onSaleNFTs?.length <= 0 ? <div className='col-md-12'>
                  <h4 className='no_data_text text-muted'>
                    No NFTs Available
                  </h4>
                </div> : ""}
              </div>
              {
                !loader && filterCnt2 > 12 ? <div className='col-md-12 text-center mt-5'>
                  <button
                    type='button'
                    className={`btn view_all_bdr ${loadMoreDisabled === "onSale" ? "disabled" : ""}`}
                    onClick={() => setCurrPageforOnSale(currPageforOnSale + 1)}
                  >
                    Load More
                  </button>
                </div> : ""
              }

            </div>
            <div
              className='tab-pane fade'
              id='pills-Favourited'
              role='tabpanel'
              aria-labelledby='pills-Favourited-tab'>
              <div className='row'>
                {/* {AuthorCard?.map((card, key) => (
                  <div className={grid} key={key}>
                    <AuthorListing
                      fileType="Image"
                      image={card.img}
                      submenu={card.Subheading}
                      heading={card.Heading}
                      price={card.price}
                      date={card.Date}
                      button={card.Slug}
                      link={card.Like}
                    />
                  </div>
                ))} */}
              </div>
            </div>
            <div
              className='tab-pane fade'
              id='pills-Activity'
              role='tabpanel'
              aria-labelledby='pills-Activity-tab'>
              <div className='row'>
                <div className="col-md-12 mb-5">
                  <h3 className="title_36 mb-4">History</h3>

                  <NFThistory userID={localStorage.getItem('userId')} />

                </div>
              </div>
            </div>
            <div
              className='tab-pane fade'
              id='pills-NFToffer'
              role='tabpanel'
              aria-labelledby='pills-NFToffer-tab'>
              <div className='row'>
                <div className="col-md-12 mb-5">
                  <h3 className="title_36 mb-4">Offers Received</h3>
                  <GeneralOffer offers={offerReceived} fetch={fetch} />
                </div>
              </div>
            </div>
            <div
              className='tab-pane fade'
              id='pills-NFTmade'
              role='tabpanel'
              aria-labelledby='pills-NFTmade-tab'>
              <div className='row'>
                <div className="col-md-12 mb-5">
                  <h3 className="title_36 mb-4">Offers Made</h3>
                  <GeneralOffer offers={offerMade} fetch={fetch} />
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>
      <Footer />
    </div>
  );
}

export default MyNFTs;
