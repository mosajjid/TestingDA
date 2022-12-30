import React, { useEffect, useState } from "react";
import BellSVG from "../SVG/BellSVG";
import ListSVG from "../SVG/ListSVG";
import CartSVG from "../SVG/CartSVG";
import TransferSVG from "../SVG/TransferSVG";
import CancelledSVG from "../SVG/CancelledSVG";
import { fetchHistory } from "../../helpers/getterFunctions";
import { Tokens } from "../../helpers/tokensToSymbol";
import { convertToEth } from "../../helpers/numberFormatter";
import moment from "moment";
import LoadingSpinner from "../components/Loader";
import InfiniteScroll from "react-infinite-scroll-component";
import { BeatLoader } from "react-spinners"

const NFThistory = (props) => {
  const [history, setHistory] = useState("none");
  const [contentLoader, setContentLoader] = useState(false);
  const [currPage, setCurrPage] = useState(1);
  const [totalRes, setTotalRes] = useState(0);
  const [count, setCount] = useState(0)

  const fetch = async (nftID, userID, flag = false) => {
    try {
      let tmp = history !== "none" ? history : [];
      if (flag) {
        setHistory("none")
        tmp = [];
        setCount(0);
        setTotalRes(0);
      }
      const data = {
        page: currPage,
        limit: 12,
        nftID: nftID,
        userID: userID
      };
      const hist = await fetchHistory(data);
      setCount(count + hist.length)
      tmp = [...tmp, ...hist];
      setHistory(tmp);
      setTotalRes(tmp[0]?.count);
    } catch (e) {
      console.log("Error in fetching history", e);
    }
    setContentLoader(false)
  };



  useEffect(() => {
    if (currPage <= 1)
      setContentLoader(true);

    if (props.nftID) { fetch(props.nftID, "") }
    else if (props.userID) {
      fetch("", props.userID)
    };
  }, [currPage]);


  useEffect(() => {
    setCurrPage(1);
    setHistory("none");
    setCount(0);
    setTotalRes(0);
    setContentLoader(true);
    if (props.nftID) {
      fetch(props.nftID, "", true)
    }
    else if (props.userID) {
      fetch("", props.userID, true)
    };

  }, [props.nftID, props.userID, props.reloadContent])

  const fetchMore = () => {
    setCurrPage(currPage + 1);
  }

  return (
    <div className='row'>

      {contentLoader || history === "none" ? <LoadingSpinner /> : (history !== "none" && history && history?.length <= 0 && !contentLoader) ? <div className="col-md-12">
        <h4 className="no_data_text text-muted">No History Yet</h4>
      </div> : ""}
      {history !== "none" && history?.length > 0 ?
        <div className="table-responsive">
          <div className='col-md-12'>
            <div className='nft_list'>
              <table className='table text-light'>
                <thead>
                  <tr>
                    <th>EVENT</th>
                    <th>TYPE</th>
                    <th>PRICE</th>
                    <th>FROM</th>
                    <th>TO</th>
                    <th>DATE</th>
                  </tr>
                </thead>
                <tbody>

                  <InfiniteScroll
                    dataLength={history.length}
                    next={fetchMore}
                    hasMore={count < totalRes}
                    height={200}
                    loader={<div className="col-12 text-center m-3"><BeatLoader color="#ef981d" /></div>}
                  >
                    {
                      history !== "none" && history && history.length > 0 ? history?.map((h, i) => {

                        return (
                          <tr key={i}>
                            <td>
                              {
                                (h?.action === "PutOnSale") ? <>
                                  <span className='nft_svg'>
                                    <ListSVG />
                                  </span>
                                  List
                                </> : (h?.action === "RemoveFromSale") ? <>
                                  <span className='nft_svg'>
                                    <CancelledSVG />
                                  </span>
                                  List Cancelled
                                </> : (h?.action === "Sold") ? <>
                                  <span className='nft_svg'>
                                    <CartSVG />
                                  </span>
                                  Sold
                                </> : (h?.action === "Offer") ? <>
                                  <span className='nft_svg'>
                                    <BellSVG />
                                  </span>
                                  Offer
                                </> : <>
                                  <span className='nft_svg'>
                                    <BellSVG />
                                  </span>
                                  Bid
                                </>
                              }

                            </td>
                            <td>
                              {h?.type}
                            </td>
                            <td>
                              <img
                                alt=''
                                src={h?.paymentToken ? Tokens[h?.paymentToken?.toLowerCase()]?.icon : ""}
                                className='img-fluid hunter_fav'
                              />{" "}
                              {parseFloat(Number(convertToEth(h?.price))
                                ?.toFixed(4)
                                ?.slice(0, -2))}
                            </td>
                            <td>
                              <span className={`${h?.action === "putOnSale" ? "yellow_dot" : h?.action === "RemoveFromSale" ? "blue_dot" : h?.action === "Offer" ? "lightblue_dot" : "yellow_dot"} circle_dot`}></span>
                              {(h?.action === "PutOnSale" || h?.action === "RemoveFromSale") ? (h?.sellerAddress?.slice(0, 4) + "..." + h?.sellerAddress?.slice(38, 42)) :
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
                                            "0x0" : "0x0"}
                            </td>
                            <td>
                              <span className={`${h?.action === "putOnSale" ? "yellow_dot" : h?.action === "RemoveFromSale" ? "blue_dot" : h?.action === "Offer" ? "lightblue_dot" : "yellow_dot"} circle_dot`}></span>
                              {h?.action === "PutOnSale" || h?.action === "RemoveFromSale" ? "0x0" :
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
                                            "0x0" : "0x0"}
                            </td>
                            <td>{moment.utc(h?.createdOn).local().format("DD/MM/YYYY")}&nbsp;  <span className="nft_time">{moment.utc(h?.createdOn).local().format("hh:mm A")}</span></td>
                          </tr>
                        )
                      }) : ""
                    }
                  </InfiniteScroll>

                </tbody>
              </table>
            </div>
          </div>
        </div>
        : ""}

    </div>
  );
};

export default NFThistory;
