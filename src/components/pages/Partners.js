import React from 'react';
import Footer from '../components/footer';
import PartnersBanner from '../components/PartnersBanner';
import {DUMMY_COLLECTIONS} from "../../Data/dummyJSON";
import {PartnerWithUs} from "../../Data/dummyJSON";
// import collection from './collection';
import Arrow from '../SVG/Arrow';
import { PartnersLogos } from '../../Data/dummyJSON';
import { Link } from 'react-router-dom';

  var bgImgStylesec1 = {
    backgroundImage: "url(./img/background/banner-home.jpg)",
    backgroundRepeat: "no-repeat",
    backgroundSize: "cover",
    backgroundPositionX: "center",
    backgroundPositionY: "center",
    backgroundColor: "#000",
  };

function Partners() {
  return (
    <div>
            <section style={bgImgStylesec1} className="jumbotron breadcumb no-bg h-vh pdd_8">
                <PartnersBanner />
            </section>
            <section className="pdd_8">
                <div className="container">
                    <div className="row mb-5">
                        <div className="col-md-12">
                            <h2 className="text-center main-title text-light mb-4">Why partner with Hunter Token</h2>
                            <p className="text-24 text-light text-center">Lorem ipsum dolor sit amet, consectetur adipiscing elit. Nec volutpat nulla nec orci tellus, ornare arcu, condimentum. Quam morbi mauris at feugiat tristique vitae tincidunt quam sit. Cursus lacus nunc in metus lectus egestas fames. Tellus ullamcorper ut volutpat mattis non ornare purus. Nec nunc elit in nulla vitae a nullam nullam egestas. In donec duis sed non massa fusce massa.</p>
                        </div>
                    </div>
                    <div className="row">
                        {DUMMY_COLLECTIONS.map(collection=>(
                            <div className="col-md-4 mb-5" key={collection.id}>
                            <div className="width-100 text-center partner_items">
                                <img className="mb-3" src={collection.img} alt="" />
                                <h6 className="mb-3">{collection.Heading}</h6>
                                <p>{collection.Text}</p>
                            </div>
                        </div>
                            ))}
                    </div>
                </div>
            </section>
            <section className="pdd_8 pt-0">
                <div className="container">
                    <div className="row mb-5">
                        <div className="col-md-12">
                            <h2 className="text-center main-title text-light mb-4">Who has partnered with us</h2>
                            <p className="text-24 text-light text-center">Lorem ipsum dolor sit amet, consectetur adipiscing elit. Nec volutpat nulla nec orci tellus, ornare arcu, condimentum. Quam morbi mauris at feugiat tristique vitae tincidunt quam sit.</p>
                        </div>
                    </div>
                    <div className="row">
                        {PartnerWithUs?.map(partners=>(
                            <div className="col-xl-4 col-lg-6 mb-4" key={partners.id}>
                                <div className="collection_slide" tabIndex="-1">
                                    <img src={partners.img} className="img-fluid" alt="" />
                                    <div className="collection_text">
                                        <div className="coll_profileimg">
                                            <div className="rotater_border profile_img">
                                                <Link to={""} className="rounded-circle">
                                                    <img alt="" className="" src={partners.profile_img} />
                                                </Link>
                                            </div>
                                        </div>
                                        <h3 className="collname">{partners.Heading} <img alt="" className="" src="../img/collections/check.png" /></h3>
                                        <p><span className='text-light'>by</span> {partners.Subheading} <img alt="" className="" src="../img/collections/check.png" /></p>
                                        <div className='description text-center text-light'>{partners.Text}</div>
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            </section>
            <section className="pdd_8 pt-0 partner_sec">
                <div className="container">
                    <div className="row mb-5">
                        <div className="col-md-12">
                            <h2 className="text-center main-title text-light mb-4">FAQs</h2>
                            <p className="text-24 text-light text-center">For more FAQs visit our partnership page in our <Link className='title_color' to='/helpcenter'>help center</Link></p>
                        </div>
                    </div>
                    <div className="row partner_faq">
                        <div className="col-md-12">
                            <div className="accordion" id="accordionExample">
                                <div className="accordion-item1">
                                    <h2 className="accordion-header" id="headingOne">
                                    <button className="accordion-button1" type="button" data-bs-toggle="collapse" data-bs-target="#collapseOne" aria-expanded="true" aria-controls="collapseOne">
                                        What is an NFT? What makes them so great? <span className="arrow_faq"><Arrow /></span>
                                    </button>
                                    </h2>
                                    <div id="collapseOne" className="accordion-collapse collapse show" aria-labelledby="headingOne" data-bs-parent="#accordionExample">
                                    <div className="accordion-body">
                                        <strong>This is the first item's accordion body.</strong> It is shown by default, until the collapse plugin adds the appropriate classes that we use to style each element. These classes control the overall appearance, as well as the showing and hiding via CSS transitions. You can modify any of this with custom CSS or overriding our default variables. It's also worth noting that just about any HTML can go within the, though the transition does limit overflow.
                                    </div>
                                    </div>
                                </div>
                                <div className="accordion-item1">
                                    <h2 className="accordion-header" id="headingTwo">
                                    <button className="accordion-button1 collapsed" type="button" data-bs-toggle="collapse" data-bs-target="#collapseTwo" aria-expanded="false" aria-controls="collapseTwo">
                                        What makes HunterToken special? <span className="arrow_faq"><Arrow /></span>
                                    </button>
                                    </h2>
                                    <div id="collapseTwo" className="accordion-collapse collapse" aria-labelledby="headingTwo" data-bs-parent="#accordionExample">
                                    <div className="accordion-body">
                                        <strong>This is the second item's accordion body.</strong> It is hidden by default, until the collapse plugin adds the appropriate classes that we use to style each element. These classes control the overall appearance, as well as the showing and hiding via CSS transitions. You can modify any of this with custom CSS or overriding our default variables. It's also worth noting that just about any HTML can go within the, though the transition does limit overflow.
                                    </div>
                                    </div>
                                </div>
                                <div className="accordion-item1">
                                    <h2 className="accordion-header" id="headingThree">
                                    <button className="accordion-button1 collapsed" type="button" data-bs-toggle="collapse" data-bs-target="#collapseThree" aria-expanded="false" aria-controls="collapseThree">
                                        What does a partnership with huntertoken entail? <span className="arrow_faq"><Arrow /></span>
                                    </button>
                                    </h2>
                                    <div id="collapseThree" className="accordion-collapse collapse" aria-labelledby="headingThree" data-bs-parent="#accordionExample">
                                    <div className="accordion-body">
                                        <strong>This is the third item's accordion body.</strong> It is hidden by default, until the collapse plugin adds the appropriate classes that we use to style each element. These classes control the overall appearance, as well as the showing and hiding via CSS transitions. You can modify any of this with custom CSS or overriding our default variables. It's also worth noting that just about any HTML can go within the, though the transition does limit overflow.
                                    </div>
                                    </div>
                                </div>
                                <div className="accordion-item1">
                                    <h2 className="accordion-header" id="headingThree">
                                    <button className="accordion-button1 collapsed" type="button" data-bs-toggle="collapse" data-bs-target="#collapseFour" aria-expanded="false" aria-controls="collapseFour">
                                        What does it cost to partner with HunterToken <span className="arrow_faq"><Arrow /></span>
                                    </button>
                                    </h2>
                                    <div id="collapseFour" className="accordion-collapse collapse" aria-labelledby="headingThree" data-bs-parent="#accordionExample">
                                    <div className="accordion-body">
                                        <strong>This is the third item's accordion body.</strong> It is hidden by default, until the collapse plugin adds the appropriate classes that we use to style each element. These classes control the overall appearance, as well as the showing and hiding via CSS transitions. You can modify any of this with custom CSS or overriding our default variables. It's also worth noting that just about any HTML can go within the, though the transition does limit overflow.
                                    </div>
                                    </div>
                                </div>
                                <div className="accordion-item1">
                                    <h2 className="accordion-header" id="headingThree">
                                    <button className="accordion-button1 collapsed" type="button" data-bs-toggle="collapse" data-bs-target="#collapseFive" aria-expanded="false" aria-controls="collapseFive">
                                        How do we get started? <span className="arrow_faq"><Arrow /></span>
                                    </button>
                                    </h2>
                                    <div id="collapseFive" className="accordion-collapse collapse" aria-labelledby="headingThree" data-bs-parent="#accordionExample">
                                    <div className="accordion-body">
                                        <strong>This is the third item's accordion body.</strong> It is hidden by default, until the collapse plugin adds the appropriate classes that we use to style each element. These classes control the overall appearance, as well as the showing and hiding via CSS transitions. You can modify any of this with custom CSS or overriding our default variables. It's also worth noting that just about any HTML can go within the, though the transition does limit overflow.
                                    </div>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </section>
            <section className="pt-5 pb-5 bg_yellow">
                <div className="container">
                    <div className="row align-items-center">
                        {PartnersLogos?.map(partnerlogo =>(
                            <div className="col" key={partnerlogo.id}>
                                <img src={partnerlogo.img} className="img-fluid" alt="" />
                            </div>
                        ))}
                    </div>
                </div>
            </section>
        <Footer />
    </div>
  )
}

export default Partners
