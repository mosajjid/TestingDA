import React from "react";
import { Oval } from "react-loader-spinner";
import "../components-css/App.scss";

export default function Loader() {
  return (
   
      <div className='loader-container d-flex justify-content-center'>
        <Oval
          height={60}
          width={60}
          color="#ef981d"
          wrapperStyle={{}}
          wrapperClass=""
          visible={true}
          ariaLabel='oval-loading'
          secondaryColor="#f9bf50"
          strokeWidth={3}
          strokeWidthSecondary={3}
        />
      </div>
  
  );
}
