import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { getCategory } from '../../helpers/getterFunctions';
import Firearmsvg from "../SVG/Firearmsvg";

const Footer = function () {
    const [catg, setCatg] = useState([])
    useEffect(() => {
        async function setCategory() {
            const cat = await getCategory();
            setCatg(cat);
        }
        setCategory();
    }, []);

    // const subscribe = () => {

    // }
    
    return (
        <footer className="footer-dark pt-5 pb-5">
            <div className="container nav-container">
                <div className="row">
                    <div className="col-lg-3 col-md-6 col-sm-12 col-xs-12 mb-3">
                        <div className="widget text-widget">
                            <img alt='' src={'../img/logo.svg'} className="mb-3" />
                            <p>The #1 NFT firearms supplier for interoperable gaming.</p>
                        </div>
                    </div>
                    <div className="col-lg-3 col-md-6 col-sm-12 col-xs-12 mb-3">
                        <div className="menu-widget widget">
                            <h5 className='mb-4'>Marketplace</h5>
                            <ul>
                                <li><Link to="/marketplace">All NFTs</Link></li>
                                {catg?.length > 0
                                    ? catg?.map((c, key) => {
                                        return (
                                            <li key={key}>
                                                <Link
                                                    to={`/marketplacecollection/${c.name}`}
                                                    className="sub-items"
                                                >
                                                    {/* <Firearmsvg /> */}
                                                    {c.name}
                                                </Link>
                                            </li>
                                        );
                                    })
                                    : ""}

                            </ul>
                        </div>
                    </div>
                    <div className="col-lg-3 col-md-6 col-sm-12 col-xs-12 mb-3">
                        <div className="menu-widget widget">
                            <h5 className='mb-4'>Company</h5>
                            <ul>
                                <li><a href={`${process.env.REACT_APP_BLOG_URL}about`}>About</a></li>
                                <li><a href={`${process.env.REACT_APP_BLOG_URL}careers`}>Careers</a></li>
                                <li><a href={`${process.env.REACT_APP_BLOG_URL}contact-us`}>Contact</a></li>
                                <li><a href={`${process.env.REACT_APP_BLOG_URL}legal`}>Legal</a></li>
                                <li><a href={`${process.env.REACT_APP_BLOG_URL}terms-conditions`}>T&Cs</a></li>
                                <li><a href={`${process.env.REACT_APP_BLOG_URL}privacy-policy`}>Privacy</a></li>
                                <li><a href={`${process.env.REACT_APP_BLOG_URL}disclaimer`}>Disclaimer</a></li>
                            </ul>
                        </div>
                        {/* <div className="menu-widget widget mt-5">
                            <h5 className='mb-4'>For Linking</h5>
                            <ul>
                                <li><Link to={'/Author'}>author</Link></li>
                                <li><Link to={'/login'}>Login</Link></li>
                                <li><Link to={'/register'}>Register</Link></li>
                                <li><Link to={'/marketplace'}>MarketPlace</Link></li>
                                <li><Link to={"/marketplacecollection"}>Market Place Collection</Link></li>
                                <li><Link to={"/NFTdetails"}>NFTdetails</Link></li>
                                <li><Link to={'/contact'}>Contact</Link></li>
                                <li><Link to={"/userprofile"}>Profile</Link></li>
                                <li><Link to={"/collection"}>Collection</Link></li>
                                <li><Link to={"/brand"}>Collection With Collection</Link></li>
                                <li><Link to={"/collectionActivity"}>Collection Activity</Link></li>
                                <li><Link to={"/blog"}>Blog</Link></li>
                                <li><Link to={"/blogtagged"}>BlogTagged</Link></li>
                                <li><Link to={'/blogdetails'}>Blogdetails</Link></li>
                            </ul>
                        </div> */}
                    </div>
                    <div className="col-lg-3 col-md-6 col-sm-12 col-xs-12 mb-3">
                        {/* <div className="widget newsletter-widget">
                            <h5 className="mb-4">Newsletter</h5>
                            <p>Don't miss an NFT drop, signup for the latest news </p>
                            <form action="#" className="form-dark mb-1" id="form_subscribe" method="post" name="form_subscribe">
                                <div className="newsletter_box">
                                    <input className="form-control" id="txt_subscribe" name="txt_subscribe" placeholder="enter your email" type="text" />
                                    <button type='button' id="btn-subscribe">
                                        <i className="arrow_right bg-color-secondary"></i>
                                    </button>
                                    <div className="clearfix"></div>
                                </div>
                            </form>
                            <div className="botton-text">your email is safe with us. We don’t spam.</div>

                        </div> */}
                        <div className="widget newsletter-widget">
                            <h5 className="mb-4">Newsletter</h5>
                            <p>Don't miss an NFT drop, signup for the latest news </p>
                         <div id="mc_embed_signup">
                      <form action="https://decryptblock.us12.list-manage.com/subscribe/post?u=e073743c2d0952008675f92e2&amp;id=4730b6b108&amp;f_id=00734de0f0" method="post" id="mc-embedded-subscribe-form" name="mc-embedded-subscribe-form" className="validate" target="_blank" noValidate>
                          <div id="mc_embed_signup_scroll">
                          <h2>Subscribe</h2>
                          <div className="indicates-required"><span className="asterisk">*</span> indicates required</div>
                            <div className="mc-field-group">
                                <label htmlFor="mce-EMAIL">Email Address  <span className="asterisk">*</span>
                            </label>
                                <input type="email"  name="EMAIL" className="required email footer-email" id="mce-EMAIL" placeholder='Enter your Email' required />
                                <span id="mce-EMAIL-HELPERTEXT" className="helper_text"></span>
                            </div>
                                <div id="mce-responses" className="clear foot">
                                <div className="response" id="mce-error-response" style={{"display":"none"}}></div>
                                <div className="response" id="mce-success-response" style={{"display":"none"}}></div>
                                </div>   
                      <div style={{"position": "absolute", "left": "-5000px"}} aria-hidden="true"><input type="text" name="b_e073743c2d0952008675f92e2_4730b6b108" tabIndex="-1" value=""/></div>
                          <div className="optionalParent">
                              <div className="clear foot">
                                  <input type="submit" value="Subscribe" name="subscribe" id="mc-embedded-subscribe" className="button" />
                                  <p className="brandingLogo"><a href="http://eepurl.com/h8-k0T" title="Mailchimp - email marketing made easy and fun"><img src="https://eep.io/mc-cdn-images/template_images/branding_logo_text_dark_dtp.svg" /></a></p>
                              </div>
                          </div>
                      </div>
                  </form>
                  <div className="botton-text">your email is safe with us. We don’t spam.</div>
                  </div>
                    </div>
                    </div>
                </div>
            </div>
            <div className="subfooter">
                <div className="container nav-container">
                    <div className="row align-items-end">
                        <div className="col-lg-3 col-md-6 col-sm-12 col-xs-12 ">
                            <span onClick={() => window.open("", "_self")}>
                                <span className="copy">&copy;Copyright 2022 - HunterToken - in partnership with BlockchainAustralia</span>
                            </span>
                        </div>
                        <div className='col-lg-3 col-md-6 col-sm-12 col-xs-12 '></div>
                        <div className='col-lg-3 col-md-6 col-sm-12 col-xs-12 '></div> 
                        <div className='col-lg-3 col-md-6 col-sm-12 col-xs-12 '>
                            <ul className="social-icons">
                                <li><a href="https://www.facebook.com/digitalarmsnft"><i className="fa fa-facebook fa-lg"></i></a></li>
                                <li><a href="https://twitter.com/DigitalArmsNFT"><i className="fa fa-twitter fa-lg"></i></a></li>
                                <li><a href="https://www.linkedin.com/company/digital-arms-hntr-token/"><i className="fa fa-linkedin fa-lg"></i></a></li>
                                <li><Link to=""><i className="fa fa-gamepad fa-lg"></i></Link></li>
                            </ul>
                        </div>
                    </div>
                </div>
            </div>
        </footer>
    );
}
export default Footer;