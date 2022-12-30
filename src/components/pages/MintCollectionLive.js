import React, { useState, useEffect } from "react";
import Footer from "../components/footer";
import Minttab from "../components/Minttab";
import Mintlivetab from "../components/MintLivetab";
import { getCollections } from "../../helpers/getterFunctions";
import moment from "moment";

var register_bg = {
  backgroundImage: "url(./img/mint/bg.jpg)",
  backgroundRepeat: "no-repeat",
  backgroundSize: "cover",
  backgroundPositionX: "center",
  backgroundPositionY: "center",
};
function MintCollectionLive() {
  const [ongoing, setOngoing] = useState([]);
  const [launched, setLaunched] = useState([]);
  const [upcoming, setUpcoming] = useState([]);
  const [allCollections, setAllCollections] = useState([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    window.scrollTo(0, 0);
  }, []);

  useEffect(() => {
    setLoading(true);
    const fetch = async () => {
      try {
        const reqData = {
          page: 1,
          limit: 12,
        };
        const res = await getCollections(reqData);
        setAllCollections(res);
        if (res.length > 0) {

          let _ongoing = [];
          let _upcoming = [];
          let _launched = [];
          res?.map((coln) => {
            const st = moment.utc(coln.saleStartTime).local().format();
            const et = moment.utc(coln.saleEndTime).local().format();
            const ct = moment(new Date()).format();

            if (ct < st) {
              _upcoming.push(coln);
            } else if (ct >= st && ct < et) {
              _ongoing.push(coln);
            } else {
              _launched.push(coln);
            }
          });
          setOngoing(_ongoing);
          setUpcoming(_upcoming);
          setLaunched(_launched);
          setLoading(false)
        }
        else {
          setAllCollections("null")
        }
      } catch (e) {
        console.log("Error in fetching all collections list", e);
      }
    }
    fetch();
  }, []);


  // useEffect(() => {


  //   setLoading(false)
  // }, [allCollections]);



  return (
    <div>
      <section className='register_hd pdd_12' style={register_bg}>
        <div className='container'>
          <div className='row'>
            <div className='col-md-12'>
              <h1>Minting</h1>
            </div>
          </div>
        </div>
      </section>
      {ongoing && ongoing.length > 0 ? <section className='pdd_8 pb-0'>

        <Mintlivetab ongoing={ongoing} loading={loading} />
      </section> : ""}

      <section className='pdd_8'>
        <Minttab upcoming={upcoming} past={launched} loading={loading} />
      </section>
      <Footer />
    </div>
  );
}

export default MintCollectionLive;
