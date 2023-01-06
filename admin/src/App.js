import React, { useEffect, useState } from "react";
import { useCookies } from "react-cookie";
import "./App.scss";
import Home1 from "./components/pages/Home";
import { BrowserRouter, Routes, Route, Outlet } from "react-router-dom";
import CreateCollection1 from "./components/pages/CreateCollection";
import CreateNFTs1 from "./components/pages/CreateNFTs";
import Rightarrow from "./components/SVG/rightarrow";
import CreateBrands1 from "./components/pages/CreateBrands";
import Login from "./components/pages/Login";
import Register from "./components/pages/Register";
import CreateCategories1 from "./components/pages/CreateCategories";
import AddMintableCollection from "./components/pages/AddMintableCollection"
import NotificationPopup from "./components/components/NotificationPopup";
import Admins1 from "./components/pages/admins";
import AddColor from "./components/pages/addColors";
import AddLogo from "./components/pages/addLogo";
import { NotificationContainer, NotificationManager } from "react-notifications";
import withLogin from "./components/components/withLogin";
import Error404 from "./components/pages/Error404";
import Navbar, { onboard } from "./components/Navbar";
import { checkAuthorization, isSuperAdmin } from "./apiServices";
import ImportedCollections from "./components/pages/importedCollections";
import AddWhiteListing from "./components/pages/AddWhitelisting";
import { slowRefresh } from "./helpers/NotifyStatus";
import { NOTIFICATION_DELAY } from "./helpers/constants";

const Home = withLogin(Home1);
const Admins = withLogin(Admins1);
const CreateCategories = withLogin(CreateCategories1);
const CreateBrands = withLogin(CreateBrands1);
const CreateCollection = withLogin(CreateCollection1);
const CreateNFTs = withLogin(CreateNFTs1);
const AddMintableCollections = withLogin(AddMintableCollection)
export const bgColor="#000000"

//const instaImg = {
//  backgroundImage: "url(./images/main_bg.png)",
//  backgroundRepeat: "no-repeat",
//  backgroundSize: "cover",
//  backgroundPosition: "center",
//};

function App() {
  const [mode, setMode] = useState("Darkmode");
  const [notificationpopup, setNotificationPopup] = useState(null);
  const [currentUser, setCurrentUser] = useState();
  const [cookies, setCookies, removeCookies] = useCookies([]);

 




  useEffect(() => {
    if (cookies["da_selected_account"])
      setCurrentUser(cookies["da_selected_account"]);

  }, [cookies["da_selected_account"]]);

  useEffect(() => {
    const fetch = async () => {
      let res = await checkAuthorization()
      if (res === true) {
      }
      else {
        await onboard.disconnectWallet({ label: cookies.da_label })
        NotificationManager.error("Authorization expired", "", NOTIFICATION_DELAY)
        removeCookies("da_selected_account")
        setCurrentUser("")
        // slowRefresh()
      }
    }
    if (currentUser)
      fetch()

  }, [currentUser])

  return (
    <div  className="Darkmode app-main">


      <BrowserRouter>
        <Routes>

          <Route path="sadmin" exact element={<Login />} />

          <Route
            element={<>
              <Navbar />
              <Outlet />
            </>} >



            {currentUser || isSuperAdmin() ? <Route path="/" exact element={<Home />} /> : <Route path="/" />}

            {currentUser || isSuperAdmin() ? <Route path="admins" exact element={<Admins />} /> : <Route path="/" />}
            {currentUser || isSuperAdmin() ? <Route path="addColor" exact element={<AddColor />} /> : <Route path="/" />}
            {/*{currentUser || isSuperAdmin() ? <Route path="addLogo" exact element={<AddLogo />} /> : <Route path="/" />}*/}

            {isSuperAdmin() ? <Route path="AddMintableCollections" exact element={<AddMintableCollections />} /> : <Route path="/" />}

            {isSuperAdmin() ? <Route path="AddWhiteListing" exact element={<AddWhiteListing />} /> : <Route path="/" />}

            {currentUser || isSuperAdmin() ? <Route path="createcollection" exact element={<CreateCollection />} /> : <Route path="/" />}

            {currentUser || isSuperAdmin() ? <Route path="createnfts" exact element={<CreateNFTs />} /> : <Route path="/" />}

            {currentUser || isSuperAdmin() ? <Route path="createbrands" exact element={<CreateBrands />} /> : <Route path="/" />}

            {currentUser || isSuperAdmin() ? <Route path="login" exact element={<Login />} /> : <Route path="/" />}

            {currentUser || isSuperAdmin() ? <Route path="register" exact element={<Register />} /> : <Route path="/" />}

            {currentUser || isSuperAdmin() ? <Route path="importedCollections" exact element={<ImportedCollections />} /> : <Route path="/" />}

            {currentUser || isSuperAdmin() ? <Route
              path="createcategories"
              exact
              element={<CreateCategories />}
            /> : <Route path="/" />}

            {currentUser || isSuperAdmin() ? <Route
              path="notificationpopup"
              exact
              notificationpopup={notificationpopup}
              element={<NotificationPopup />}
            /> : <Route path="/" />}
          </Route>
          {!currentUser ?
            <Route
              path="*"
              exact
              element={<Error404 />}
            /> : ""}

        </Routes>

        <NotificationContainer />
      </BrowserRouter>
    </div>

  );
}

export default App;