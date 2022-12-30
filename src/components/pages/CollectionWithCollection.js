import React, { useState, useEffect, useCallback } from "react";
import Footer from "../components/footer";
import CollectionList from "../components/CollectionList";
import Relatedcollection from "../components/Relatedcollection";
import { Link, NavLink, useParams } from "react-router-dom";
import ItemSVG from "../SVG/ItemSVG";
import ActivitySVG from "../SVG/ActivitySVG";
import Threegrid from "../SVG/Threegrid";
import Twogrid from "../SVG/Twogrid";
import UpArrow from "../SVG/dropdown";
import {
  getBrandDetailsById,
  getCollections,
  getNFTsOnDetailPage,
  getCategory,
  getPrice,
  getUserById,
  fetchHistory
} from "../../helpers/getterFunctions";
import arrow from "./../../assets/images/ep_arrow-right-bold.png";

import { convertToEth } from "../../helpers/numberFormatter";
import NotificationManager from "react-notifications/lib/NotificationManager";
import { getAllBrands, getBrandsStats, getBrandVol, getCollectionStats } from "../../apiServices";
import AdvancedFilter from "../components/AdvancedFilter";

import { Tokens } from "../../helpers/tokensToSymbol";
import moment from "moment";
import { perPageCount } from "../../helpers/constants";
import { Pagination } from "@material-ui/lab";
import { makeStyles } from "@material-ui/core/styles";
import LoadingSpinner from "../components/Loader";
import { getPriceFeed } from "../../helpers/priceFeed";
import debounce from "lodash.debounce";

import $ from 'jquery';


const useStyles = makeStyles(() => ({
  ul: {
    "& .MuiPaginationItem-root": {
      color: "#fff"
    }
  }
}));


function CollectionWithCollection() {

  const { brandID } = useParams();
  const [brandDetails, setBrandDetails] = useState([]);
  const [user, setUser] = useState([]);
  const [collections, setCollections] = useState([]);
  const [togglemode, setTogglemode] = useState("filterhide");
  const [nfts, setNfts] = useState([]);
  const [salesType, setSalesType] = useState("");
  const [category, setCategory] = useState([]);
  const [currPage, setCurrPage] = useState(1);
  const [loader, setLoader] = useState(false);
  const [loadMoreDisabled, setLoadMoreDisabled] = useState("");
  const [cardCount, setCardCount] = useState(0);
  const [searchFor, setSearchFor] = useState("");
  const [ERCType, setERCType] = useState();
  const [brands, setBrands] = useState([]);
  const [priceSort, setPriceSort] = useState("ASC");
  const [searchedCol, setSearchedCol] = useState("");
  const [searchedBrand, setSearchedBrand] = useState("");
  const [searchedCat, setSearchedCat] = useState("");
  const [history, setHistory] = useState([]);
  const [currHPage, setCurrHPage] = useState(1);
  const [totalPages, setTotalPages] = useState(0);
  const classes = useStyles();
  const [totalCnt, setTotalCnt] = useState(0);
  const [filterCnt, setFilterCnt] = useState(0);
  const [dollars, setDollars] = useState([]);
  const [stats, setStats] = useState({});
  const [toggle, setToggle] = useState(false);
  const [searchBy, setSearchBy] = useState('name');
  const [searchOnEnter, setSearchOnEnter] = useState('false')

  const filterToggle = () => {
    setLoadMoreDisabled("");
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
        const c = await getBrandsStats({ brandID: brandID });
        const vol = await getBrandVol({ brandID: brandID })
        c.vol = vol?.volumnTraded
        setStats(c);
      } catch (e) {
        console.log("Error", e);
      }
    };
    if (brandID)
      fetch();
  }, [brandID])

  useEffect(() => {
    const fetch = async () => {
      try {
        const c = await getCategory();
        setCategory(c);
      } catch (e) {
        console.log("Error", e);
      }
      try {
        const b = await getAllBrands();
        setBrands(b);
      } catch (e) {
        console.log("Error", e);
      }
    };
    fetch();
  }, []);

  var bgImgarrow = {
    backgroundImage: `url(${arrow})`,
    backgroundRepeat: "no-repeat",
  };

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

  useEffect(() => {
    const fetch = async () => {
      setLoader(true);
      try {
        const brand = await getBrandDetailsById(brandID);
        setBrandDetails(brand);
        const user = await getUserById({
          page: 1,
          limit: 4,
          userID: brand?.createdBy,
        });
        setUser(user);
        const cols = await getCollections({
          brandID: brandID,
        });
        setCollections(cols);
        let temp = nfts;
        const res1 = await getNFTsOnDetailPage({
          page: currPage,
          limit: 12,
          brandID: brandID,
          searchText: searchFor ? searchFor : "",
          ERCType: ERCType,
          salesType: salesType >= 0 ? salesType : "",
          priceSort: priceSort,
          categoryID: searchedCat,
          brandID: brandID,
          collectionID: searchedCol,
          isOnMarketplace: 1,
          pageName: "Brand",
          searchBy: searchBy
        });

        const nft = res1.formattedData;
        setTotalCnt(totalCnt + nft.length)
        setCardCount(res1.count)
        setFilterCnt(res1.filterCount)
        if (nft.length > 0) {
          for (let i = 0; i < nft.length; i++) {
            const order = await getPrice(nft[i].orderData);
            nft[i] = {
              ...nft[i],
              price:
                order?.price?.$numberDecimal === undefined
                  ? "--"
                  : parseFloat(Number(convertToEth(order?.price?.$numberDecimal))
                    .toFixed(4)
                    .slice(0, -2)),
              saleType: order?.salesType,
              paymentToken: order?.paymentToken,
              collectionName: nft[i].collectionData[0].name,
            };
          }
          temp = [...temp, ...nft];
          setLoader(false)
          setNfts(temp);
        } if ((nft && nft.length <= 0) || (totalCnt + nft.length === filterCnt)) {
          setLoader(false)
          setLoadMoreDisabled("disabled");
          return;
        }
      } catch (e) {
        console.log("error in get brandbyID", e);
      }
    };
    fetch();
  }, [
    currPage,
    ERCType,
    priceSort,
    searchedBrand,
    searchedCat,
    searchedCol,
    salesType,
    searchOnEnter,
    searchFor
  ]);


  const getDollars = async (h) => {
    let k = [];
    h?.map(async (t, i) => {
      const p = await getPriceFeed(t?.paymentToken);
      setDollars(d => [...d, parseFloat(Number(convertToEth(p * t?.price))?.toFixed(4)?.slice(0, -2))]);
    })

  }
  useEffect(() => {
    setDollars([])
    const fetch = async () => {
      try {
        const reqData = {
          page: currHPage,
          limit: perPageCount,
          brandID: brandID
        }
        const _h = await fetchHistory(reqData);
        if (_h && _h?.length > 0) {
          setTotalPages(Math.ceil(_h[0].count / perPageCount));
          setHistory(_h);
          await getDollars(_h);

        }

      }
      catch (e) {
        console.log("Error in Fetch History", e);
      }
    }
    fetch();
  }, [currHPage])

  const handlePageChange = (e, p) => {
    setCurrHPage(p);
  };

  const bgImage = {
    backgroundImage: `url(${brandDetails?.coverImage})`,
    backgroundSize: "cover",
    backgroundPosition: "center",
  };

  const handleAdvSearch = (data) => {
    resetVariables();
    if (data.type === "salesType") setSalesType(data.value);
    if (data.type === "collection") setSearchedCol(data.value);
    if (data.type === "brand") setSearchedBrand(data.value);
    if (data.type === "category") setSearchedCat(data.value);
  };

  const handleSearch = async (e) => {
    const { value } = e.target;
    resetVariables();
    setSearchFor(value);
  };



  const optimisedSearchHandle = useCallback(debounce(handleSearch, 300), [searchFor]);


  const resetVariables = () => {
    setNfts([]);
    setCurrPage(1);
    setLoadMoreDisabled("");
    setFilterCnt(0);
    setTotalCnt(0);
  }

  return (
    <div>
      <section className='collection_banner pdd_8' style={bgImage}></section>
      <section className='collection_info'>
        <div className='container'>
          <div className='collection_pick'>
            <img
              alt=''
              src={brandDetails?.logoImage}
              className='img-fluid collection_profile'
              onError={(e) => (e.target.src = "../img/collections/list4.png")}
            />

          </div>
          <h1 className='collection_title text-center'>{brandDetails?.name}</h1>


          <ul className='collection_status mt-5 mb-5'>
            <li>
              <h4>{cardCount}</h4>
              <p>items</p>
            </li>
            <li>
              <h4>{stats ? stats?.owners ? stats?.owners : "0" : "0"}</h4>
              <p>owners</p>
            </li>
            <li>
              
              <h4>{stats ? stats?.floorPrice ? parseFloat(Number(convertToEth(stats.floorPrice)).toFixed(2)) : "0" : "0"}</h4>
              <p>floor price</p>
            </li>
            <li>
              <h4>{stats ? stats.vol ? parseFloat(Number(convertToEth(stats.vol)).toFixed(2)) : 0 : 0}</h4>
              <p>volume traded</p>
            </li>
          </ul>

          <div className="collection_description text-center">

            <div className="readmoreContent">
              {!toggle ? (brandDetails?.description?.length > 200 ? <p>{brandDetails?.description?.substr(0, 200)}<span className="showMore">...</span></p> : <p>{brandDetails?.description}</p>) : <p>{brandDetails?.description}</p>}
            </div>
            {
              brandDetails?.description?.length > 200 && <span className="top_arrow">
                <img alt="" src={!toggle ? "../img/bottom_arrow.png" : "../img/top_arrow.png"} onClick={() => setToggle(toggle => !toggle)} className="img-showMore less img-fluid" />
              </span>
            }


          </div>
          {collections.length > 0 ?
            (<div className='row'>
              <div className='col-md-12'>
                <h4 className='second_hd text-center mb-3'>Collection</h4>
              </div>
            </div>) : ""}
          <Relatedcollection collections={collections} />

          <div className='row'>
            <div className='col-md-12 text-center item_active'>
              <ul className='author_cart nav' role='tablist'>
                <li classname='item_active'>
                  <a
                    data-bs-toggle='pill'
                    data-bs-target='#pills-Items'
                    role='tab'
                    aria-controls='pills-Items'
                    aria-selected='true'
                    className='active'>
                    <span className='mr-3'>
                      <ItemSVG />
                    </span>{" "}
                    <span>Items</span>
                  </a>
                </li>
                <li classname='item_active'>
                  <a
                    data-bs-toggle='pill'
                    data-bs-target='#pills-Activity'
                    role='tab'
                    aria-controls='pills-Activity'
                    aria-selected='true'>
                    <span className='mr-3'>
                      {/* <ActivitySVG /> */}
                      <i class="fa fa-list"></i>
                    </span>{" "}
                    <span>Activity</span>
                  </a>
                </li>
              </ul>
            </div>
          </div>
        </div>
      </section>
      <section className='collection_list mb-5 pb-5'>
        <div className='container'>
          <div className='tab-content' id='pills-tabContent'>
            <div
              className='tab-pane fade show active'
              id='pills-Items'
              role='tabpanel'
              aria-labelledby='pills-Items-tab'>
              <div className='row'>
                <div className='col-lg-12  mb-5'>
                  <div className='market_search_form'>
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
                          if(searchFor !== "" && searchFor?.trim() !== "")
                          resetVariables();
                              setSearchOnEnter(!searchOnEnter)
                        }
                        }
                        onKeyDown={(e) => {
                          if (e.key === "Enter") {
                            e.preventDefault();
                            resetVariables();
                            setSearchOnEnter(!searchOnEnter)
                          }
                        }}
                      >
                        <option value='name' defaultValue>Name</option>
                        <option value='tokenID'>Token ID</option>
                      </select>
                      <button className='market_btn' type='submit' onClick={() => {
                         if(searchFor !== "" && searchFor?.trim() !== "")
                         resetVariables();
                             setSearchOnEnter(!searchOnEnter)
                       }}
                      >
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
                      <option value='0' selected>
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
                    <div
                      id='gridthree'
                      className='market_grid'
                      onClick={gridthree}>
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
                  {/* <div className='search_qt mt-3'>10,000 items</div> */}
                </div>
                <AdvancedFilter
                  togglemode={togglemode}
                  category={category}
                  brands={brands}
                  onAdvSearch={handleAdvSearch}
                  brandName={brandDetails?.name}
                />

              </div>

              <div className='row'>
                {nfts?.length > 0 ? (

                  nfts?.map((card, key) => {
                    return (
                      <div className={grid} key={key}>
                        <CollectionList nft={card} />
                      </div>
                    );
                  })

                ) : (
                  ""
                )}
                {
                  loader ? <LoadingSpinner /> : nfts?.length <= 0 ? (<div className='col-md-12'>
                    <h4 className='no_data_text text-muted'>
                      No NFTs Available
                    </h4>
                  </div>) : ""}
                {!loader && filterCnt > 12 ? (
                  <div className='col-md-12 text-center mt-5'>
                    <button
                      type='button'
                      className={`btn view_all_bdr ${loadMoreDisabled}`}
                      onClick={() => {
                        setCurrPage(currPage + 1);
                      }}>
                      Load More
                    </button>
                  </div>
                ) : ("")}
              </div>
            </div>
            <div
              className='tab-pane fade'
              id='pills-Activity'
              role='tabpanel'
              aria-labelledby='pills-Activity-tab'>
              {/* <div className='row'>
                <div className='col-md-6 d-md-inline-flex'>
                  <select
                    className='action_select_form form-select mr-3'
                    aria-label='Default select example'
                    style={bgImgarrow}>
                    <option selected>Listings</option>
                    <option value='1'>Listings Items 1</option>
                    <option value='2'>Listings Items 2</option>
                    <option value='3'>Listings Items 3</option>
                  </select>
                  <select
                    className='action_select_form form-select'
                    aria-label='Default select example'
                    style={bgImgarrow}>
                    <option selected>Hunter Token</option>
                    <option value='1'>Hunter Token 1</option>
                    <option value='2'>Hunter Token 2</option>
                    <option value='3'>Hunter Token 3</option>
                  </select>
                </div>
                <div className='col-md-6 d-flex justify-content-end'>
                  <select
                    className='action_select_form form-select'
                    aria-label='Default select example'
                    style={bgImgarrow}>
                    <option selected>Last 90 Days</option>
                    <option value='1'>Last 40 Days</option>
                    <option value='2'>Last 30 Days</option>
                    <option value='3'>Last 10 Days</option>
                  </select>
                </div>
              </div> */}
              <section className='collectionAction mb-5 pb-5 mt-5'>
                <div className='container'>
                  {/* <div className='row'>
                    <div className='col-md-12'>
                      <img
                        alt=''
                        src={"../img/collections/graph.png"}
                        className='img-fluid'
                      />
                    </div>
                  </div> */}
                  <div className='row mt-5'>
                    <div className='col-md-12'>
                      {history?.length <= 0 ? <div className='col-md-12'>
                        <h4 className='no_data_text text-muted'>
                          No History Yet
                        </h4>
                      </div> :
                        <div className='table-responsive'>
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
                                          /> */}
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
                                          {/* <span className="special_text ">{"$" + `${dollars[i] !== undefined ? dollars[i] : ""}`}</span> */}
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
                      <a className="view_all_bdr" href="/">
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
                </div>
              </section>
            </div>
          </div>
        </div>
      </section>

      <Footer />
    </div>
  );
}

export default CollectionWithCollection;
