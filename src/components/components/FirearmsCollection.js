import React from "react";
import Slider from "./slick-loader/slider";
import "slick-carousel/slick/slick.css";
import "slick-carousel/slick/slick-theme.css";

function FirearmsCollection(props) {
  var settings = {
    infinite: false,
    speed: 500,
    slidesToShow: 4,
    slidesToScroll: 1,
    initialSlide: 0,
    responsive: [
      {
        breakpoint: 1300,
        settings: {
          slidesToShow: 3,
          slidesToScroll: 1,
          infinite: false,
        },
      },
      {
        breakpoint: 992,
        settings: {
          slidesToShow: 2,
          slidesToScroll: 1,
          infinite: false,
        },
      },
      {
        breakpoint: 767,
        settings: {
          slidesToShow: 1,
          slidesToScroll: 1,
          initialSlide: 2,
        },
      },
    ],
  };

  return (
    <div className='nftdetails'>
      <Slider {...settings}>
        {props.nfts
          ? props.nfts.map((card, key) => {
            if (card.id !== props.currNFTID) {
              return (
                <div className='nft_slide' key={key}>
                  <a href={`/NFTdetails/${card.id}`}>
                   
                  {
                    card?.previewImg || card?.image ? 

                    <img
                      src={card.previewImg ? card.previewImg : card.image}
                      className='img-fluid items_img w-100 my-3'
                      alt=''
                    /> :
                    <div className="blur_img_div mb-3">
                    <img
                      src={card?.collectionData[0]?.logoImage}
                      className='img-fluid items_img w-100 blur_img my-3'
                      alt='nft'
                      onError={(e) => {
                       e.target.src =  "../img/collections/list4.png";
                     }}
                    />
                    <span className="no_img">No Image</span>
                  </div>
                  }
                   


                    <div className='nft_info'>
                      <span className="text-left">
                        {props.collectionName} Collection &nbsp;
                        {/* <img
                          alt=''
                          src={"../img/check.png"}
                          className='img-fluid'
                        /> */}
                      </span>
                      <h3 className='text-left'>{card.name || card.name === undefined ? card.name: "--"}</h3>
                      {/* <p>
                          <img
                            alt=''
                            src={"../img/favicon.png"}
                            className='img-fluid'
                          />
                          {card.price} 
                        </p> */}
                    </div>
                  </a>
                </div>
              );
            }
          })
          : ""}
      </Slider>
    </div>
  );
}

export default FirearmsCollection;
