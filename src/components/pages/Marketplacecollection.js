import React, { useState, useEffect } from "react";
import Footer from "../components/footer";
import {
  getCategoryWithCollectionData,
  getCollections,
  getCollectionTabs,
} from "../../helpers/getterFunctions";
import { useParams, useNavigate } from "react-router-dom";
import { NotificationManager } from "react-notifications";
import BGImg from "./../../assets/images/background.jpg";
import MarketplaceBGIamge from "../../assets/marketplace-bg.jpg";
import CollectionSkeletonCard from "../components/Skeleton/CollectionSkeletonCard";
// import { Link, useNavigate } from "@reach/router";
import $ from "jquery";
import LoadingSpinner from "../components/Loader";

function Marketplacecollection() {
  var register_bg = {
    backgroundImage: `url(${MarketplaceBGIamge})`,
    backgroundRepeat: "no-repeat",
    backgroundSize: "cover",
    backgroundPositionX: "center",
    backgroundPositionY: "center",
  };
  var bgImgStyle = {
    backgroundImage: `url(${BGImg})`,
    backgroundRepeat: "no-repeat",
    backgroundSize: "cover",
    backgroundPositionX: "center",
    backgroundPositionY: "center",
    backgroundColor: "#000",
  };

  let { searchedText } = useParams();
  const [allCollections, setAllCollections] = useState("none");
  const [listCount, setListCount] = useState(12);
  const [loadMoreDisabledAll, setLoadMoreDisabledAll] = useState("");
  const [categories, setCategories] = useState([]);
  const [allActiveTab, setAllActiveTab] = useState("active");
  const [allActive, setAllActive] = useState("show active");
  const [loader, setLoader] = useState(false);
  const [cardCount, setCardCount] = useState(0);
  const [currPage, setCurrPage] = useState(1);
  const [isPageChange, setIsPageChange] = useState(0);
  const [tabCatID, setTabCatID] = useState("");
  const [tabCatIndex, setTabCatIndex] = useState(0);
  const [tabPageCount, setTabPageCount] = useState(1);
  const navigate = useNavigate();
  const [reload, setReload] = useState();

if(searchedText || searchedText !== undefined)
  searchedText = window.location.hash !== undefined ? searchedText + window.location.hash : searchedText

  useEffect(() => {
    const fetch = async () => {
      setLoader(true);
      try {
        setCurrPage(1);
        setIsPageChange(0);
        resetClasses();
        getCollectionData();
        getCategory();
      } catch (e) {
        console.log("Error in fetching all collections list", e);
      }
      setLoader(false);
    };
    fetch();
  }, [searchedText, reload]);

  useEffect(() => {
    const fetch = async () => {
      try {
        getCategory();
      } catch (e) {
        console.log("Error in fetching all Category list", e);
      }
    };
    fetch();
  }, [currPage, isPageChange]);

  useEffect(() => {
    const fetch = async () => {
      setLoader(true);
      try {
        await getCollectionPagination();
      } catch (e) {
        console.log("Error in tabs Pagination", e);
      }
      setLoader(false);
    };
    fetch();
  }, [tabPageCount]);

  async function resetClasses() {
    $("#pills-tab .nav-link").removeClass("active");
    $("#pills-tabContent .tab-pane.fade").removeClass("active");
    $("#pills-tabContent .tab-pane.fade").removeClass("show");
  }

  async function getCategory() {
    setLoader(true);
    const reqData = {
      page: currPage,
      limit: listCount,
      isOnMarketplace: 1,
      searchText: searchedText ? searchedText : "",
    };

    const res = await getCollections(reqData);
    setCardCount(cardCount + res.length);
    if (isPageChange === 0) {
      setAllCollections(Object.assign([], [res]));
    } else {
      let temp = [...allCollections[0], ...res];
      setAllCollections([temp]);
    }
    setLoader(false);
  }

  async function updateCategoryCollection(catID = "", catIndex = 0) {
    setTabCatID(catID);
    setTabCatIndex(catIndex);
    setTabPageCount(parseInt(categories[catIndex]?.currPage) + 1);
  }

  async function getCollectionPagination() {
    const reqData = {
      page: tabPageCount,
      limit: listCount,
      isOnMarketplace: 1,
      categoryID: tabCatID,
    };
    const res = await getCollectionTabs(reqData);
    categories[tabCatIndex].currPage++;
    let temp = [...categories[tabCatIndex].CollectionData, ...res.results];
    categories[tabCatIndex].CollectionData = temp;
    console.log("categories", categories)
    setCategories(categories);
  }

  async function getCollectionData(catID = "All") {
    setLoader(true);
    let isanyActive = 0;
    if (searchedText === undefined) {
      setAllActiveTab("active");
      setAllActive("show active");
    }
    const reqData = {
      page: currPage,
      limit: listCount,
      isOnMarketplace: 1,
    };
    if (catID !== "All" && catID !== "" && searchedText === undefined) {
      reqData.categoryID = catID;
    }
    const res1 = await getCategoryWithCollectionData(reqData);
    if (res1?.length > 0) {
      for (const myCat of res1) {
        myCat.loadmore = "";
        myCat.isActiveTab = "";
        myCat.isActive = "";
        myCat.currPage = 1;
        if (searchedText === myCat.name && isanyActive === 0) {
          myCat.isActiveTab = "active";
          myCat.isActive = "show active";
          setAllActiveTab("");
          setAllActive("");
          isanyActive = 1;
        }
      }
    }
    setCategories(res1);
    setLoader(false);
  }

  return (
    <div>
      <section className="register_hd pdd_12" style={register_bg}>
        <div className="container">
          <div className="row">
            <div className="col-md-12">
              <h1>Collections</h1>
            </div>
          </div>
        </div>
      </section>

      <section className="marketplace-tab pdd_8" style={bgImgStyle}>
        <div className="container">
          <div className="row">
            <div className="col-md-12">
              <ul
                className="tab_btn mb-5 nav nav-pills1"
                id="pills-tab"
                role="tablist"
              >
                {categories?.length > 0 ? (
                  <li className="nav-item" role="presentation">
                    <button
                      className={`nav-link ${allActiveTab}`}
                      id="pills-allNFTs-tab"
                      data-bs-toggle="pill"
                      data-bs-target="#pills-allNFTs"
                      type="button"
                      role="tab"
                      aria-controls="pills-allNFTs"
                      aria-selected="true"
                      onClick={() => {
                        navigate("/marketplaceCollection", { replace: true });
                      }}
                    >
                      All
                    </button>
                  </li>
                ) : (
                  ""
                )}
                {categories?.length > 0 ? (
                  categories?.map((cat, key) => {
                    return (
                      <li
                        key={key}
                        index={key}
                        className="nav-item"
                        role="presentation"
                      >
                        <button
                          className={`nav-link ${cat?.isActiveTab}`}
                          id={`pills-${cat._id}-tab`}
                          data-bs-toggle="pill"
                          data-bs-target={`#pills-${cat._id}`}
                          type="button"
                          role="tab"
                          aria-controls={`pills-${cat._id}`}
                          aria-selected="true"
                        >
                          {cat.name}
                        </button>
                      </li>
                    );
                  })
                ) : (
                  <LoadingSpinner />
                )}
              </ul>
            </div>
          </div>
          <div className="tab-content" id="pills-tabContent">
            {categories?.length > 0 ? (
              <div
                className={`tab-pane fade ${allActive}`}
                id="pills-allNFTs"
                role="tabpanel"
                aria-labelledby="pills-allNFTs-tab"
              >
                <div className="row">
                  {allCollections !== "none" && allCollections?.length > 0
                    ? allCollections?.map((oIndex, key1) => {
                      return oIndex?.map((card, key2) => (
                        <div key={key1} className="col-lg-4 col-md-6 mb-5">
                          <div className="collection_slide" key={key2}>
                            <a href={`/collection/${card?._id}`}>
                              <div className="mint_img">
                                <img
                                  className="img-fluid w-100"
                                  src={card?.coverImg}
                                  onError={(e) => {
                                    e.target.src =
                                      "../img/collections/list4.png";
                                  }}
                                  alt=""
                                />
                              </div>
                            </a>
                            <div className="collection_text">
                              <a href={`/collection/${card?._id}`}>
                                <div className="coll_profileimg">
                                  <div className="rotater_border profile_img">
                                    <a
                                      className="rounded-circle"
                                      href={`/collectionwithcollection/${card?.brand?._id}`}
                                    >
                                      <img
                                        alt=""
                                        className=""
                                        src={card.brand?.logoImage}
                                        onError={(e) => {
                                          e.target.src =
                                            "../img/collections/list4.png";
                                        }}
                                      />
                                    </a>
                                  </div>
                                </div>

                                <h4 className="collname">
                                  {card.name?.length > 15
                                    ? card.name?.slice(0, 15)
                                    : card.name}
                                </h4>
                                <p>
                                  {card.desc?.length > 15
                                    ? card.desc?.slice(0, 15) + "..."
                                    : card.desc}
                                </p>
                              </a>
                            </div>
                          </div>
                        </div>
                      ));
                    })
                    : ""}
                  {loader || allCollections === "none" ? (
                    <LoadingSpinner />
                  ) : allCollections !== "none" &&
                    allCollections?.length <= 0 || allCollections[0]?.length <=0 &&
                    !loader ? (
                    <div className="col-md-12">
                      <h4 className="no_data_text text-muted">
                        No Collections Available
                      </h4>
                    </div>
                  ) : (
                    ""
                  )}
                  {!loader &&
                    allCollections[0]?.[0]?.count > allCollections[0]?.length ? (
                    <div className="col-md-12 text-center mt-0 mt-lg-5 mt-xl-5 mt-md-5">
                      <button
                        type="button"
                        className={`btn view_all_bdr ${loadMoreDisabledAll}`}
                        onClick={() => {
                          setCurrPage(currPage + 1);
                          setIsPageChange(1);
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
            ) : (
              ""
            )}

            {categories?.length > 0
              ? categories?.map((cat, key) => {
                return (
                  <>
                    <div
                      key={key}
                      className={`tab-pane fade ${cat?.isActive}`}
                      id={`pills-${cat._id}`}
                      role="tabpanel"
                      aria-labelledby={`pills-${cat._id}-tab`}
                    >
                      <div className="row">
                        {cat?.CollectionData?.length > 0
                          ? cat.CollectionData?.map((card, key) => {
                            return (
                              <>
                                <div
                                  key={key}
                                  className="col-lg-4 col-md-6 mb-5"
                                >
                                  <div className="collection_slide">
                                    <a href={`/collection/${card?._id}`}>
                                      <div className="mint_img">
                                        <img
                                          className="img-fluid w-100"
                                          src={card?.coverImage}
                                          onError={(e) => {
                                            e.target.src =
                                              "../img/collections/list4.png";
                                          }}
                                          alt=""
                                        />
                                      </div>
                                    </a>
                                    <div className="collection_text">
                                      <div className="coll_profileimg">
                                        <div className="rotater_border profile_img">
                                          <a
                                            className="rounded-circle"
                                            href={`/collectionwithcollection/${card?.BrandData[0]?._id}`}
                                          >
                                            <img
                                              alt=""
                                              className=""
                                              src={
                                                card.BrandData[0]?.logoImage
                                              }
                                              onError={(e) => {
                                                e.target.src =
                                                  "../img/collections/list4.png";
                                              }}
                                            />
                                          </a>
                                        </div>
                                      </div>

                                      <h4 className="collname">
                                        {card.name?.length > 15
                                          ? card.name?.slice(0, 15)
                                          : card.name}
                                      </h4>
                                      <p>
                                        {card.description?.length > 15
                                          ? card.description?.slice(0, 15) +
                                          "..."
                                          : card.description}
                                      </p>
                                    </div>
                                  </div>
                                </div>
                              </>
                            );
                          })
                          : ""}
                        {loader ? (
                          <LoadingSpinner />
                        ) : cat?.CollectionData?.length <= 0 ? (
                          <div className="col-md-12">
                            <h4 className="no_data_text text-muted">
                              No Collections Available
                            </h4>
                          </div>
                        ) : (
                          ""
                        )}

                        {!loader &&
                          cat?.CollectionData2[0]?.count >
                          cat?.CollectionData?.length ? (
                          <div className="col-md-12 text-center mt-0 mt-lg-5 mt-xl-5 mt-md-5">
                            <button
                              type="button"
                              className={`btn view_all_bdr tabss ${loadMoreDisabledAll}`}
                              onClick={() => {
                                updateCategoryCollection(cat._id, key);
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
                  </>
                );
              })
              : ""}
          </div>
        </div>
      </section>

      <Footer />
    </div>
  );
}

export default Marketplacecollection;
