import React from "react";
import Collection from "./collections";

function CreateCollection(props) {
  return (
    <div className="wrapper">
      <Collection />
    </div>
  );
}

export default React.memo(CreateCollection);
