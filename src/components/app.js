import React, { useState, useEffect } from "react";
import Home from "./pages/home";
import Login from "./pages/login";
import Register from "./pages/Register";
import Marketplacecollection from "./pages/Marketplacecollection";
import Marketplace from "./pages/Marketplace";
import NFTDetails from "./pages/NFTDetails";
import BlogTagged from "./pages/BlogTagged";
import Helpcenter from "./pages/Helpcenter";
import Collection from "./pages/collection";
import CollectionWithCollection from "./pages/CollectionWithCollection";
import Author from "./pages/Author";
import CollectionActivity from "./pages/CollectionActivity";
import UserProfile from "./pages/UserProfile";
import Profile from "./components/Profile";
import Notifications from "./pages/Notifications";
import NotificationsArea from "./components/NotificationsArea";
import Blog from "./pages/Blog";
import BlogContent from "./components/BlogContent";
import ContactUs from "./pages/ContactUs";
import MintCollection from "./pages/MintCollection";
import MintCollectionLive from "./pages/MintCollectionLive";
import "./components-css/App.scss";
import Blogdetails from "./pages/Blogdetails";
import Minttab from "./components/Minttab";
import UpdateProfile from "./pages/updateProfile";
import { BrowserRouter as Router, Routes, Route } from "react-router-dom";
import ItemNotFound from "./pages/ItemNotFound";
import MintingPage from "./pages/MintingPage";
import MultiMintingPage from "./pages/MultiMintingPage";
import Partners from "./pages/Partners";
import HelpCenterQuery from "./pages/HelpCenterQuery";
import HelpCenterDetail from "./pages/HelpCenterDetail";
import Offers from "./pages/Offers";
import AccountSupport from "./pages/AccountSupport";
import Earnings from "./pages/Earnings";
import Header from "./menu/header";
import MyNFTs from "./pages/MyNFTs";
import ModalPage from './pages/ModalPage';
import { useCookies } from "react-cookie";
import { NotificationContainer, NotificationManager } from "react-notifications";
import { SkeletonTheme } from "react-loading-skeleton";
import DisplayPopupModal from "./components/AccountModal/DisplayPopup";
import { checkAuthorization } from "../apiServices";
import { NOTIFICATION_DELAY } from "../helpers/constants";
import { onboard } from "./menu/header";
import evt from "../events/events";

const App = (props) => {
  const [currentUser, setCurrentUser] = useState();
  const [cookies, setCookies, removeCookies] = useCookies([]);

  useEffect(() => {
    if (cookies["selected_account"])
      setCurrentUser(cookies["selected_account"]);

  }, [cookies["selected_account"]]);

  useEffect(() => {
    const fetch = async () => {
      let res = await checkAuthorization()
      if (res !== true) {
        await onboard.disconnectWallet({ label: cookies.label })
        NotificationManager.error("Unauthorised User", "", NOTIFICATION_DELAY)
        evt.emit("refreshState");
        setCurrentUser("");
      }
    }
    if (currentUser)
      fetch()

  }, [currentUser])


  return (
    <SkeletonTheme baseColor="#202020" highlightColor="#444">
      <Router>
        <Header />
        <Routes>
          <Route exact path="/" element={<Home />} />
          <Route exact path="/author/:id" element={<Author />} />
          <Route exact path="/myNfts" element={<MyNFTs />} />
          <Route exact path="/login" element={<Login />} />
          <Route path="/register" element={<Register />} />
          <Route
            path="/marketplaceCollection"
            element={<Marketplacecollection />}
          />
          <Route
            path="/marketplaceCollection/:searchedText"
            element={<Marketplacecollection />}
          />
          <Route path="/marketplace" element={<Marketplace />} />
          <Route path="/marketplace/:searchedText" element={<Marketplace />} />
          <Route path="/NFTdetails/:id" element={<NFTDetails />} />
          <Route path="/updateProfile" element={<UpdateProfile />} />
          <Route path="/userprofile" element={<UserProfile />} />
          <Route path="/profile" element={<Profile />} />
          <Route path="/collection/:id" element={<Collection />} />

          <Route
            path="/collectionwithcollection"
            element={<CollectionWithCollection />}
          />
          <Route
            path="/collectionwithcollection/:brandID"
            element={<CollectionWithCollection />}
          />
          <Route path="/collectionActivity" element={<CollectionActivity />} />
          <Route path="/Notifications" element={<Notifications />} />
          <Route path="/NotificationsArea" element={<NotificationsArea />} />
          <Route path="/blog" element={<Blog />} />
          <Route path="/modalpage" element={<ModalPage />} />
          <Route path="/blogcontent" element={<BlogContent />} />
          <Route path="/blogtagged" element={<BlogTagged />} />
          <Route path="/contact" element={<ContactUs />} />
          <Route path="/blogdetails" element={<Blogdetails />} />
          <Route path="/helpcenter" element={<Helpcenter />} />
          <Route path="/mintcollection" element={<MintCollection />} />
          <Route path="/mintcollectionlive" element={<MintCollectionLive />} />
          <Route path="/minttab" element={<Minttab />} />
          <Route path="/mintingpage" element={<MintingPage />} />
          <Route path="/multimintingpage/:id" element={<MultiMintingPage />} />
          <Route path="/partners" element={<Partners />} />
          <Route path="/helpcenterquery" element={<HelpCenterQuery />} />
          <Route path="/helpcenterdetail" element={<HelpCenterDetail />} />
          <Route path="/earnings" element={<Earnings />} />
          <Route path="/offers" element={<Offers />} />
          <Route path="/accountsupport" element={<AccountSupport />} />
          <Route
            path="/viewImage"
            element={<DisplayPopupModal />}
          />
          <Route path="*" element={ItemNotFound} />
        </Routes>
        <NotificationContainer />
      </Router>

    </SkeletonTheme>
  );
};

export default App;
