import React, { useState, useEffect } from "react";
import { Link, NavLink } from "react-router-dom";
import Dashboardsvg from "../SVG/dashboardsvg";
import Formsvg from "../SVG/formsvg";
import Tablesvg from "../SVG/tablesvg";
import Performancesvg from "../SVG/performancesvg";
import Collectionsvg from "../SVG/collectionsvg";
import Nftsvg from "../SVG/nftsvg";
import { isSuperAdmin } from "../../apiServices";
import { useCookies } from "react-cookie";

function Sidebar() {

  const [cookies] = useCookies([]);
  const [currentUser, setCurrentUser] = useState("");

  useEffect(() => {
    if (cookies.da_selected_account)
      setCurrentUser(cookies.da_selected_account);
    // else NotificationManager.error("Connect Your Metamask", "", 800);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [cookies.da_selected_account]);

  return (
    <nav id="sidebar" className="sidebar">
      <ul className="list-unstyled components text-uppercase">
      {((isSuperAdmin && isSuperAdmin()) || cookies.da_role === "admin") ? 
      <li>
              <NavLink
                to={"/"}
                className="text-decoration-none text-light"
                activeclassname="active-link"
              >
                <Dashboardsvg /> Dashboard
              </NavLink>
            </li>:""}
        {(isSuperAdmin && isSuperAdmin()) ? (
          <li>
            <NavLink to={"/admins"} className="text-decoration-none text-light">
              <Formsvg /> Admin's List
            </NavLink>
          </li>
        ) : null}
         {(isSuperAdmin && isSuperAdmin()) ? (
          <li>
            <NavLink to={"/addColor"} className="text-decoration-none text-light">
              <Formsvg /> Change color
            </NavLink>
          </li>
        ) : null}
         {(isSuperAdmin && isSuperAdmin()) ? (
          <li>
            <NavLink to={"/addLogo"} className="text-decoration-none text-light">
              <Formsvg /> Add Logo
            </NavLink>
          </li>
        ) : null}

        {(isSuperAdmin && isSuperAdmin()) ? (
          <li>
            <NavLink to={"/AddMintableCollections"} className="text-decoration-none text-light">
              <Formsvg /> Mintable Collection's List
            </NavLink>
          </li>

        ) : null}

        {(isSuperAdmin && isSuperAdmin()) ? (
          <li>
            <NavLink to={"/AddWhiteListing"} className="text-decoration-none text-light">
              <Formsvg /> Whitelisting
            </NavLink>
          </li>

        ) : null}

        {(cookies.da_role === "admin") && !isSuperAdmin() ? (
          <li>
            <NavLink
              to={"/importedCollections"}
              className="text-decoration-none text-light"
            >
              <Collectionsvg />Imported Collections
            </NavLink>
          </li>
        ) : null}

        {((isSuperAdmin && isSuperAdmin()) || cookies.da_role === "admin") ? (
          <>
           
            <li>
              <NavLink
                to={"/createcollection"}
                className="text-decoration-none text-light"
              >
                <Collectionsvg />  Collections
              </NavLink>
            </li>

            <li>
              <NavLink
                to={"/createnfts"}
                className="text-decoration-none text-light"
              >
                <Nftsvg />  NFTs
              </NavLink>
            </li>
            <li>
              <NavLink
                to={"/createbrands"}
                className="text-decoration-none text-light"
              >
                <Performancesvg />  Brands
              </NavLink>
            </li>
            <li>
              <NavLink
                to={"/createcategories"}
                className="text-decoration-none text-light"
              >
                <Performancesvg />  Categories
              </NavLink>
            </li>
          </>
        ) : (
          ""
        )}
        {/* <li>
          <NavLink
            to={"/performance"}
            className="text-decoration-none text-light"
          >
            <Performancesvg /> Performance
          </NavLink>
        </li> */}
      </ul>
    </nav>
  );
}

export default Sidebar;
