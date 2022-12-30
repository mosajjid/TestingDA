import React, { useRef, Suspense } from "react";
import { Link } from "react-router-dom";
import { Tokens } from "../../helpers/tokensToSymbol";
import { useGLTF, OrbitControls } from "@react-three/drei";
import {
  Canvas, useFrame,
  extend,
  useThree,
} from "@react-three/fiber";

//extend({OrbitControls});
const CameraControls = () => {
  // Get a reference to the Three.js Camera, and the canvas html element.
  // We need these to setup the OrbitControls component.
  // https://threejs.org/docs/#examples/en/controls/OrbitControls
  const {
    camera,
    gl: { domElement },
  } = useThree();
  // Ref to the controls, so that we can update them on every frame using useFrame
  const controls = useRef();
  useFrame((state) => controls.current.update());
  return <orbitControls ref={controls} args={[camera, domElement]} />;
};
function CollectionList(props) {
  function Model(props) {
    const { scene } = useGLTF(props.image);
    return <primitive object={scene} />;
  }
  return (
    <Link to={`/NFTdetails/${props.nft?.id}`}>
      <div className='collection_items'>
        <div className="collection__img">

          {(props?.nft?.previewImg || props?.nft?.image) ?
            <img
              src={props.nft?.fileType === "3D" || props.nft?.fileType === "Video" ? props.nft?.previewImg : props.nft?.image}
              className='img-fluid items_img w-100 '
              alt=''
              onError={(e) => {
                e.target.src = props.nft?.previewImg ? props.nft?.previewImg : "../img/collections/list4.png"
              }}
            />
            : <div className="blur_img_div h-100">
              <img
                src={props?.nft?.collectionData[0]?.logoImage}
                className='img-fluid items_img w-100 blur_img'
                alt='nft'
                onError={(e) => {
                  e.target.src = "../img/collections/list4.png";
                }}
              />
              <span className="no_img">No Image</span>
            </div>
          }


        </div>
        <div className='coll_itemstext'>
          <div className='collection_row mb-3'>
            <div className='collection_col'>
              <span>{props.nft?.collectionName} Collection</span>
              <h6 data-toggle="tooltip" title={props.nft?.name}>{props.nft?.name?.length > 50 ? props.nft?.name?.slice(0, 50) + "..." : props.nft?.name}</h6>
            </div>
            <div className='collection_col text-end'>
              <span>Price</span>
              <span className='col_proiduct_price  d-flex justify-content-end align-items-center'>
                <div className="token_img">
                  {props.nft?.paymentToken && <img src={Tokens[props?.nft?.paymentToken?.toLowerCase()]?.icon} alt="payment token symbol" />}
                </div>
                <div className="ml-3">
                  {props.nft?.price}
                </div>
              </span>
              {/* <span>
                            <svg width="12" height="12" viewBox="0 0 12 12" fill="none" xmlns="http://www.w3.org/2000/svg">
                                <path d="M6.00016 0C4.40882 0 2.88265 0.632157 1.7574 1.7574C0.632157 2.88265 0 4.40882 0 6.00016C4.10225e-05 6.78811 0.15528 7.56834 0.456854 8.29629C0.758428 9.02425 1.20043 9.68568 1.75763 10.2428C2.31482 10.8 2.9763 11.2419 3.70428 11.5434C4.43227 11.8449 5.21252 12 6.00047 12C6.78842 12 7.56865 11.8447 8.29661 11.5431C9.02456 11.2416 9.68599 10.7996 10.2431 10.2424C10.8003 9.68518 11.2422 9.0237 11.5437 8.29572C11.8452 7.56773 12.0004 6.78748 12.0003 5.99953C12.0003 2.68632 9.31337 0 6.00016 0ZM6.00016 10.7497C5.37636 10.7497 4.75867 10.6268 4.18236 10.3881C3.60605 10.1494 3.0824 9.79947 2.64131 9.35838C2.20022 8.91729 1.85033 8.39364 1.61161 7.81733C1.3729 7.24101 1.25003 6.62333 1.25003 5.99953C1.25003 5.37574 1.3729 4.75805 1.61161 4.18174C1.85033 3.60543 2.20022 3.08178 2.64131 2.64069C3.0824 2.1996 3.60605 1.84971 4.18236 1.61099C4.75867 1.37227 5.37636 1.24941 6.00016 1.24941V6.00016L10.2453 3.8776C10.5771 4.53594 10.7501 5.2629 10.7503 6.00016C10.7501 7.25986 10.2496 8.46791 9.35878 9.3586C8.46798 10.2493 7.25986 10.7497 6.00016 10.7497Z" fill="#9E9E9E"/>
                            </svg>
                            {props.date}
                        </span> */}
            </div>
          </div>
          <div className='collection_row align-items-center'>
            <div className='collection_col'>
              <Link className='buy_btn' to={`/NFTdetails/${props.nft?.id}`}>
                {props.nft?.saleType === 0
                  ? "Buy Now"
                  : props.nft?.saleType === 1 || props.nft?.saleType === 2
                    ? "Place Bid"
                    : "View"}
              </Link>
            </div>
            {/* <div className='collection_col text-end'>
              <span className='lastone'>
                <svg
                  width='16'
                  height='14'
                  viewBox='0 0 16 14'
                  fill='none'
                  xmlns='http://www.w3.org/2000/svg'>
                  <path
                    d='M15.1062 2.75379C14.866 2.21491 14.5197 1.72658 14.0866 1.31613C13.6532 0.904465 13.1422 0.577318 12.5814 0.352482C11.9998 0.118416 11.3761 -0.00139215 10.7464 1.22043e-05C9.86295 1.22043e-05 9.00102 0.234414 8.25198 0.677172C8.07278 0.783086 7.90255 0.899419 7.74127 1.02617C7.57999 0.899419 7.40976 0.783086 7.23056 0.677172C6.48152 0.234414 5.61959 1.22043e-05 4.73615 1.22043e-05C4.10001 1.22043e-05 3.48357 0.118081 2.90118 0.352482C2.33851 0.578202 1.83138 0.902892 1.39594 1.31613C0.962277 1.72611 0.615857 2.21456 0.376312 2.75379C0.127229 3.31462 0 3.91017 0 4.52309C0 5.10128 0.121853 5.70378 0.363768 6.31669C0.56626 6.82891 0.856557 7.36021 1.22749 7.89673C1.81526 8.74579 2.62343 9.6313 3.62693 10.529C5.28987 12.017 6.93668 13.0449 7.00657 13.0866L7.43126 13.3505C7.61942 13.4668 7.86133 13.4668 8.04949 13.3505L8.47418 13.0866C8.54407 13.0431 10.1891 12.017 11.8538 10.529C12.8573 9.6313 13.6655 8.74579 14.2533 7.89673C14.6242 7.36021 14.9163 6.82891 15.117 6.31669C15.3589 5.70378 15.4808 5.10128 15.4808 4.52309C15.4825 3.91017 15.3553 3.31462 15.1062 2.75379Z'
                    fill='#AAAAAA'></path>
                </svg>
                {props.nft.like}
              </span>
            </div> */}
          </div>
        </div>
      </div>
    </Link>
  );
}

export default CollectionList;
