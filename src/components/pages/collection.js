import React, { useState, useEffect, useCallback } from "react";
import Footer from "../components/footer";
import CollectionList from "../components/CollectionList";
import ItemSVG from "../SVG/ItemSVG";
import ActivitySVG from "../SVG/ActivitySVG";
import { Link, NavLink } from "react-router-dom";
import { useCookies } from "react-cookie";
import { NotificationManager } from "react-notifications";
import Threegrid from "../SVG/Threegrid";
import Twogrid from "../SVG/Twogrid";
import { useParams } from "react-router-dom";
import {
  getCollections,
  getNFTsOnDetailPage,
  getCategory,
  getPrice,
  fetchHistory,
} from "../../helpers/getterFunctions";
import { CopyToClipboard } from "react-copy-to-clipboard";
import arrow from "./../../assets/images/ep_arrow-right-bold.png";
import BGImg from "../../assets/images/background.jpg";
import { convertToEth } from "../../helpers/numberFormatter";
import { Tokens } from "../../helpers/tokensToSymbol";
import moment from "moment";
import { perPageCount } from "../../helpers/constants";
import { Pagination } from "@material-ui/lab";
import { makeStyles } from "@material-ui/core/styles";
import LoadingSpinner from "../components/Loader";
import { getCollectionStats, getCollectionVol } from "../../apiServices";
import { getPriceFeed } from "../../helpers/priceFeed";
import debounce from "lodash.debounce";

const options = [
  { value: "chocolate", label: "Chocolate" },
  { value: "strawberry", label: "Strawberry" },
  { value: "vanilla", label: "Vanilla" },
];

const useStyles = makeStyles(() => ({
  ul: {
    "& .MuiPaginationItem-root": {
      color: "#fff"
    }
  }
}));

function Collection() {
  var bgImgarrow = {
    backgroundImage: `url(${arrow})`,
    backgroundRepeat: "no-repeat",
  };

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
  useEffect(() => {
    window.scrollTo(0, 0);
  }, []);

  const [grid, setgrid] = useState("col-xl-3 col-lg-4 col-md-6 col-sm-12 mb-4");

  const [currentUser, setCurrentUser] = useState("");
  const [cookies, setCookie, removeCookie] = useCookies([]);
  const [collectionDetails, setCollectionDetails] = useState([]);
  const [isCopied, setIsCopied] = useState(false);
  const [nftList, setNftList] = useState([]);
  const [category, setCategory] = useState([]);
  const [togglemode, setTogglemode] = useState("filterhide");
  const [currPage, setCurrPage] = useState(1);
  const [loadMore, setLoadMore] = useState(false);
  const [loadMoreDisabled, setLoadMoreDisabled] = useState("");
  const [cardCount, setCardCount] = useState(0);
  const [loader, setLoader] = useState(false);
  const [searchFor, setSearchFor] = useState("");
  const { id, searchedText } = useParams();
  const [salesType, setSalesType] = useState(-2);
  const [priceSort, setPriceSort] = useState("ASC");
  const [history, setHistory] = useState([]);
  const [currHPage, setCurrHPage] = useState(1);
  const [totalPages, setTotalPages] = useState(0);
  const classes = useStyles();
  const [totalCnt, setTotalCnt] = useState(0);
  const [filterCnt, setFilterCnt] = useState(0);
  const [stats, setStats] = useState({})
  // const [dollars, setDollars] = useState([]);
  const [toggle, setToggle] = useState(false);
  const [searchBy, setSearchBy] = useState('name');
  const [searchOnEnter, setSearchOnEnter] = useState('false')

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
    const fetch = async () => {
      try {
        const c = await getCollectionStats({ collectionID: id });
        const vol = await getCollectionVol({ collectionID: id })
        c.vol = vol?.volumnTraded
        setStats(c);
      } catch (e) {
        console.log("Error", e);
      }
    };
    fetch();
  }, [id])

  useEffect(() => {
    if (cookies.selected_account) setCurrentUser(cookies.selected_account);
  }, [currentUser]);



  useEffect(() => {
    const fetch = async () => {
      setLoader(true);
      let temp = nftList;
      try {
        const reqData = {
          page: 1,
          limit: 1,
          collectionID: id,
          searchText: searchedText ? searchedText : "",
        };
        const res = await getCollections(reqData);
        setCollectionDetails(res[0]);

        const data = {
          page: currPage,
          limit: 12,
          collectionID: id,
          searchText: searchFor,
          salesType: salesType >= 0 ? Number(salesType) : "",
          priceSort: priceSort,
          pageName: "Collection",
          isOnMarketplace: 1,
          searchBy: searchBy
        };
        const res1 = await getNFTsOnDetailPage(data);
        const nfts = res1.formattedData;
        setTotalCnt(totalCnt + nfts.length)
        setCardCount(res1.count)
        setFilterCnt(res1.filterCount)
        if (nfts.length > 0) {
          for (let i = 0; i < nfts.length; i++) {
            const order = await getPrice(nfts[i].orderData);
            nfts[i] = {
              ...nfts[i],
              price:
                order?.price?.$numberDecimal === undefined
                  ? "--"
                  : parseFloat(Number(convertToEth(order?.price?.$numberDecimal))
                    .toFixed(4)
                    .slice(0, -2)),
              saleType: order?.salesType,
              collectionName: res[0].name,
              paymentToken: order?.paymentToken,
            };
          }
          temp = [...temp, ...nfts];
          setNftList(temp);
          setLoader(false)
        }
        if ((nfts && nfts.length <= 0) || (totalCnt + nfts.length === filterCnt)) {
          setLoader(false)
          setLoadMoreDisabled("disabled");
          return;
        }
      } catch (e) {
        setLoader(false)
        console.log("Error in fetching all collections list", e);
      }
    };
    fetch();
  }, [currPage, salesType, priceSort, searchFor, searchOnEnter]);



  useEffect(() => {
    const fetch = async () => {
      try {
        const reqData = {
          page: currHPage,
          limit: perPageCount,
          collectionID: id
        }
        const _h = await fetchHistory(reqData);
        if (_h && _h?.length > 0) {
          setTotalPages(Math.ceil(_h[0].count / perPageCount));
          setHistory(_h);
        }
      }
      catch (e) {
        console.log("Error in fetch History ", e);
      }
    }
    fetch();
  }, [currHPage])

  const handlePageChange = (e, p) => {
    setCurrHPage(p);
  };

  const handleSearch = async (e) => {
    const { value } = e.target;
    setSearchFor(value);
    resetVariables();
  };



  const optimisedSearchHandle = useCallback(debounce(handleSearch, 300), [searchFor]);


  const resetVariables = () => {
    setNftList([]);
    setCurrPage(1);
    setTotalCnt(0);
    setFilterCnt(0);
    setLoadMoreDisabled("");
  }

  return (
    <>
      <div>

        <section
          className="collection_banner pdd_8"
          style={{
            backgroundImage: `url(${collectionDetails?.coverImg})`,
            backgroundSize: "cover",
            backgroundPosition: "center",
          }}
        ></section>
        <section className="collection_info">
          <div className="container">
            <div className="collection_pick">
              <img
                alt=""
                src={collectionDetails?.brand?.logoImage}
                className="img-fluid collection_profile"
                onError={(e) => {
                  e.target.src =
                    "../img/collections/list4.png";
                }}
              />
              {/* <img
              alt=''
              src={"../img/collections/check.png"}
              className='img-fluid check_img'
            /> */}
            </div>
            <h1 className="collection_title text-center">
              {collectionDetails?.name}
            </h1>
            {/* <ul className="collection_social mb-4">
              <li>
                <a href={"/"}>
                  <i className="fa fa-facebook fa-lg"></i>
                </a>
              </li>
              <li>
                <a href={"/"}>
                  <i className="fa fa-twitter fa-lg"></i>
                </a>
              </li>
              <li>
                <a href={"/"}>
                  <i className="fa fa-linkedin fa-lg"></i>
                </a>
              </li>
              <li>
                <a href={"/"}>
                  <i className="fa fa-pinterest fa-lg"></i>
                </a>
              </li>
            </ul> */}

            <div className="coppycode text-center">
              <span className="ctc">
                <img alt="" src={"../img/favicon.png"} className="img-fluid" />
                <div className="">
                  {collectionDetails?.contractAddress
                    ? collectionDetails?.contractAddress?.slice(0, 4) +
                    "..." +
                    collectionDetails?.contractAddress?.slice(38, 42)
                    : "-"}
                </div>

                <CopyToClipboard
                  text={collectionDetails?.contractAddress}
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
            <ul className="collection_status mt-5 mb-5">
              <li>
                <h4>
                  {cardCount ? cardCount : 0}
                </h4>
                <p>items</p>
              </li>
              <li>
                <h4>
                  {stats ? stats.owners ? stats.owners : 0 : 0}
                </h4>
                <p>owners</p>
              </li>
              <li>
                <h4>
                  {stats ? stats.floorPrice ? parseFloat(Number(convertToEth(stats.floorPrice)).toFixed(2)) : 0 : 0}
                </h4>
                <p>floor price</p>
              </li>
              <li>
                <h4>
                  {stats ? stats.vol ? parseFloat(Number(convertToEth(stats.vol)).toFixed(2)) : 0 : 0}
                </h4>
                <p>volume traded</p>
              </li>
            </ul>
            <div className="collection_description text-center">


              <div className="readmoreContent">
                {!toggle ? (collectionDetails?.desc?.length > 200 ? <p>{collectionDetails?.desc?.substr(0, 200)}<span className="showMore">...</span></p> : <p>{collectionDetails?.desc}</p>) : <p>{collectionDetails?.desc}</p>}
              </div>
              {
                collectionDetails?.desc?.length > 200 && <span className="top_arrow">
                  <img alt="" src={!toggle ? "../img/bottom_arrow.png" : "../img/top_arrow.png"} onClick={() => setToggle(toggle => !toggle)} className="img-showMore less img-fluid" />
                </span>
              }



            </div>

            <div className="row ">
              <div className="col-md-12 text-center item_active">
                <ul className="author_cart nav" role="tablist">
                  <li classname="item_active">
                    <a
                      data-bs-toggle="pill"
                      data-bs-target="#pills-Items"
                      role="tab"
                      aria-controls="pills-Items"
                      aria-selected="true"
                      className="active"
                    >
                      <span className="mr-3">
                        <ItemSVG />
                      </span>{" "}
                      Items
                    </a>
                  </li>
                  <li classname="item_active">
                    <a
                      data-bs-toggle="pill"
                      data-bs-target="#pills-Activity"
                      role="tab"
                      aria-controls="pills-Activity"
                      aria-selected="true"
                    >
                      <i class="fa fa-list"></i>
                      <span className="mr-3">
                        {/* <ActivitySVG /> */}

                      </span>{" "}
                      Activity
                    </a>
                  </li>
                </ul>
              </div>
            </div>
          </div>
        </section>
        <section className="collection_list mb-5 pb-5">
          <div className="container">
            <div className="tab-content tab-padd" id="pills-tabContent">
              <div
                className="tab-pane fade show active"
                id="pills-Items"
                role="tabpanel"
                aria-labelledby="pills-Items-tab"
              >

                <div className="row">
                  <div className="col-lg-12">
                    <div className="market_search_form mb-4">
                      <div className="d-flex marketplace_form">
                        <input
                          className="mp-search me-2"
                          type="text"
                          placeholder="Search item here..."
                          aria-label="Search"
                          onChange={optimisedSearchHandle}
                          onKeyDown={(e) => {
                            if (e.key === "Enter" && searchFor !== "" && searchFor?.trim() !== "") {
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
                            if(searchFor !== "" && searchFor?.trim() !== ""){
                              resetVariables();
                              setSearchOnEnter(!searchOnEnter)
                            }
                          }}
                          onKeyDown={(e) => {
                            if (e.key === "Enter" && searchFor !== "" && searchFor?.trim() !== "") {
                              e.preventDefault();
                              resetVariables();
                              setSearchOnEnter(!searchOnEnter)
                            }
                          }}

                        >
                          <option value='name' defaultValue>Name</option>
                          <option value='tokenID'>Token ID</option>
                        </select>
                        <button className="market_btn" type="button" onClick={() => {
                          console.log("searchFor", searchFor, searchFor !== "" && searchFor?.trim() !== "")
                          if(searchFor !== "" && searchFor?.trim() !== ""){
                              resetVariables();
                              setSearchOnEnter(!searchOnEnter)
                        }
                        }}>
                          <img src="../img/search.svg" alt="" />
                        </button>
                      </div>
                      <select
                        className="market_select_form form-select"
                        aria-label="Default select example"
                        style={bgImgarrow}
                        onChange={(e) => {
                          resetVariables();
                          setSalesType(e.target.value)
                        }}
                      >
                        <option value='-2' selected>
                          All Sales Type
                        </option>
                        <option value='0'>Buy Now</option>
                        <option value='1'>On Auction</option>
                        <option value='2'>Not for Sale</option>
                      </select>
                      <select
                        className="market_select_form form-select"
                        aria-label="Default select example"
                        style={bgImgarrow}
                        onChange={(e) => {
                          resetVariables();
                          setPriceSort(e.target.value);
                        }}
                      >
                        <option value='ASC' defaultValue>
                          Price: Low to High
                        </option>
                        <option value='DESC'>Price: High to Low</option>
                      </select>
                      {/* <div className="market_div"> */}

                      <div
                        id="gridtwo"
                        className="market_grid"
                        onClick={gridtwo}
                      >
                        <Twogrid />
                      </div>
                      <div
                        id="gridthree"
                        className="market_grid"
                        onClick={gridthree}
                      >
                        <Threegrid />
                      </div>

                    </div>
                  </div>
                </div>

                <div className="row">
                  {nftList.length > 0 ? (
                    nftList?.map((n, k) => {
                      return (
                        <div className={grid} key={k}>
                          <CollectionList nft={n} />
                        </div>
                      );
                    })
                  ) : (
                    ""
                  )}
                  {loader ? <LoadingSpinner /> : nftList?.length <= 0 ? <div className='col-md-12'>
                    <h4 className='no_data_text text-muted'>
                      No NFTs Available
                    </h4>
                  </div> : ""}
                  {!loader && filterCnt > 12 ? (
                    <div className="col-md-12 text-center mt-5">
                      <button
                        className={`btn view_all_bdr ${loadMoreDisabled}`}
                        onClick={() => {
                          setCurrPage(currPage + 1);
                        }}
                      >
                        Load More
                      </button>
                    </div>
                  ) : (
                    ""
                  )}
                </div>
              </div>
              <div
                className="tab-pane fade"
                id="pills-Activity"
                role="tabpanel"
                aria-labelledby="pills-Activity-tab"
              >
                {/* <div className="row">
                  <div className="col-md-6 d-md-inline-flex">
                    <select
                      className="action_select_form form-select mr-3"
                      aria-label="Default select example"
                      style={bgImgarrow}
                    >
                      <option selected>Listings</option>
                      <option value="1">Listings Items 1</option>
                      <option value="2">Listings Items 2</option>
                      <option value="3">Listings Items 3</option>
                    </select>
                    <select
                      className="action_select_form form-select"
                      aria-label="Default select example"
                      style={bgImgarrow}
                    >
                      <option selected>Hunter Token</option>
                      <option value="1">Hunter Token 1</option>
                      <option value="2">Hunter Token 2</option>
                      <option value="3">Hunter Token 3</option>
                    </select>
                  </div>
                  <div className="col-md-6 d-flex justify-content-end">
                    <select
                      className="action_select_form form-select"
                      aria-label="Default select example"
                      style={bgImgarrow}
                    >
                      <option selected>Last 90 Days</option>
                      <option value="1">Last 40 Days</option>
                      <option value="2">Last 30 Days</option>
                      <option value="3">Last 10 Days</option>
                    </select>
                  </div>
                </div> */}
                <section className="collectionAction mb-5 pb-5 mt-5">
                  {/* <div className="row">
                    <div className="col-md-12">
                      <img
                        alt=""
                        src={"../img/collections/graph.png"}
                        className="img-fluid"
                      />
                    </div>
                  </div> */}
                  <div className="row mt-5">
                    <div className="col-md-12">
                      {history?.length <= 0 ? <div className='col-md-12'>
                        <h4 className='no_data_text text-muted'>
                          No History Yet
                        </h4>
                      </div> :
                        <div className="table-responsive">
                          <table className=" Action_table text-center">
                            <thead>
                              <tr className="">
                                <th>
                                  <div className="tb_title">List</div>
                                </th>
                                <th>
                                  <div className="tb_title">Item</div>
                                </th>
                                <th>
                                  <div className="tb_title">Price</div>
                                </th>
                                <th>
                                  <div className="tb_title">Quantity</div>
                                </th>
                                <th>
                                  <div className="tb_title">From</div>
                                </th>
                                <th>
                                  <div className="tb_title">To</div>
                                </th>
                                <th>
                                  <div className="tb_title">Time</div>
                                </th>
                              </tr>
                            </thead>
                            <tbody>
                              {
                                history?.length > 0 ?
                                  history?.map((h, i) => {

                                    return (
                                      <tr key={i}>
                                        <td className="text-left">
                                          <img
                                            alt=""
                                            src={"../img/collections/bxs_purchase-tag.png"}
                                            className="img-fluid"
                                          />{" "}
                                          {h.action}
                                        </td>
                                        <td className="d-flex  align-items-center">
                                          <div className="hist_nft_img">
                                            {/* <img
                                            alt=""
                                            src={h.nftImg}
                                            className="img-fluid"
                                            onError={(e) => {
                                              e.target.src = "../img/collections/item1.png"
                                            }}
                                          />  */}
                                          </div>{" "}
                                          {h.nftName === "" || h.nftName === undefined ? "--" : h.nftName}
                                        </td>
                                        <td>
                                          <p className="table_p d-flex justify-content-center align-items-baseline">
                                            <div className="hist_tk">
                                              <img
                                                alt=''
                                                src={h?.paymentToken ? Tokens[h?.paymentToken?.toLowerCase()]?.icon : ""}
                                                className='img-fluid'
                                              />
                                            </div>
                                            {" "}
                                            {parseFloat(Number(convertToEth(h?.price))
                                              .toFixed(4)
                                              .slice(0, -2))}

                                          </p>
                                          {/* <span className="special_text">{"$" + dollars[i]}</span> */}
                                        </td>
                                        <td>{1}</td>
                                        <td> {(h?.action === "PutOnSale" || h?.action === "RemoveFromSale") ? (h?.sellerAddress?.slice(0, 4) + "..." + h?.sellerAddress?.slice(38, 42)) :
                                          (h?.action === "Bid") ? ((h?.type === "Created" || h?.type === "Updated") ? (h?.buyerAddress?.slice(0, 4) + "..." + h?.buyerAddress?.slice(38, 42)) :
                                            (h?.type === "Accepted") ? (h?.sellerAddress?.slice(0, 4) + "..." + h?.sellerAddress?.slice(38, 42)) :
                                              (h?.type === "Rejected") ? (h?.sellerAddress?.slice(0, 4) + "..." + h?.sellerAddress?.slice(38, 42)) :
                                                (h?.type === "Cancelled") ? (h?.buyerAddress?.slice(0, 4) + "..." + h?.buyerAddress?.slice(38, 42)) : "0x0"
                                          ) :
                                            (h?.action === "Sold") ? (h?.sellerAddress?.slice(0, 4) + "..." + h?.sellerAddress?.slice(38, 42)) :
                                              (h?.action === "Offer") ? (h?.type === "Created" || h?.type === "Updated") ? (h?.buyerAddress?.slice(0, 4) + "..." + h?.buyerAddress?.slice(38, 42)) :
                                                (h?.type === "Accepted") ? (h?.sellerAddress?.slice(0, 4) + "..." + h?.sellerAddress?.slice(38, 42)) :
                                                  (h?.type === "Rejected") ? (h?.sellerAddress?.slice(0, 4) + "..." + h?.sellerAddress?.slice(38, 42)) :
                                                    h?.type === "Cancelled" ? (h?.buyerAddress?.slice(0, 4) + "..." + h?.buyerAddress?.slice(38, 42)) :
                                                      "0x0" : "0x0"}</td>
                                        <td> {h?.action === "PutOnSale" || h?.action === "RemoveFromSale" ? "0x0" :
                                          h?.action === "Bid" ? ((h?.type === "Created" || h?.type === "Updated") ? (h?.sellerAddress?.slice(0, 4) + "..." + h?.sellerAddress?.slice(38, 42)) :
                                            (h?.type === "Accepted") ? (h?.buyerAddress?.slice(0, 4) + "..." + h?.buyerAddress?.slice(38, 42)) :
                                              (h?.type === "Rejected") ? "0x0" :
                                                (h?.type === "Cancelled") ? "0x0" : "0x0"
                                          ) :
                                            h?.action === "Sold" ? (h?.buyerAddress?.slice(0, 4) + "..." + h?.buyerAddress?.slice(38, 42)) :
                                              (h?.action === "Offer") ? (h?.type === "Created" || h?.type === "Updated") ? "0x0" :
                                                (h?.type === "Accepted") ? (h?.buyerAddress?.slice(0, 4) + "..." + h?.buyerAddress?.slice(38, 42)) :
                                                  (h?.type === "Rejected") ? "0x0" :
                                                    h?.type === "Cancelled" ? "0x0" :
                                                      "0x0" : "0x0"}</td>
                                        <td>{
                                          moment.utc(h?.createdOn).local().fromNow()
                                        }</td>
                                      </tr>)
                                  })

                                  : ""
                              }

                            </tbody>

                          </table>
                        </div>}
                    </div>
                  </div>
                  {/* {history?.length > 12 && <div className="row mt-5">
                    <div className="col-md-12 text-center ">
                      <a className="view_all_bdr" href="/" disabled={historyLoadMore ? "disabled" : ""} onClick={() => {
                        setCurrHistoryPage(currHistoryPage + 1);
                      }}>
                        Load More
                      </a>
                    </div>
                  </div>} */}
                  {totalPages > 1 ? (
                    <div className="col-md-12 text-center">
                      <Pagination
                        count={totalPages}
                        size="large"
                        page={currHPage}
                        variant="outlined"
                        color="primary"
                        classes={{ ul: classes.ul }}
                        shape="rounded"
                        onChange={handlePageChange}
                      />
                    </div>
                  ) : (
                    ""
                  )}
                </section>
              </div>
            </div>
          </div>
        </section>

        <Footer />
      </div>
    </>
  );
}

export default Collection;
