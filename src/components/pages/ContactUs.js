// import { Link } from 'react-router-dom';
import React from 'react';
import Footer from "../components/footer";
import { Link } from '@reach/router';

var register_bg = {
    backgroundImage: "url(./img/contact/contact_bg.jpg)",
    backgroundRepeat: "no-repeat",
    backgroundSize: "cover",
    backgroundPositionX: "center",
    backgroundPositionY: "center",
};

function ContactUs() {
  return (
    <div>
        <section className='register_hd pdd_12' style={register_bg}>
            <div className='container'>
                <div className='row'>
                    <div className='col-md-12'>
                        <h1>Contact Us</h1>
                    </div>
                </div>
            </div>
        </section>
        <section className='contact_form pdd_8'>
            <div className='container'>
                <div className='row'>
                    <div className='col-lg-7'>
                        <h4>Do you have any questions?</h4>
                        <form className='mt-5'>
                            <div className="row">
                                <div className="col-md-12 mb-4">
                                    <input type="text" className="form-control" placeholder="First Name - Last Name" name="name" />
                                </div>
                                <div className="col-md-12 mb-4">
                                    <input type="text" className="form-control" placeholder="Your Email" name="email" />
                                </div>
                                <div className="col-md-12 mb-4">
                                    <input type="tel" className="form-control" id="phone" name="phone" pattern="[0-9]{3}-[0-9]{2}-[0-9]{3}" placeholder='Your Phone Number' />
                                </div>
                                <div className="col-md-12 mb-4">
                                    <textarea id="story" className="form-control" name="story" rows="7">Your Message</textarea>
                                </div>
                                <div className="col-md-12">
                                    <button type="submit" className="btn main_btn mt-4">Submit Form</button>
                                </div>
                            </div>
                        </form>
                    </div>
                    <div className="col-lg-1"></div>
                    <div className="col-lg-4">
                        <div className="contact_d">
                            <div className="contact_details contact_without_bg">
                                <h4>Australia Office</h4>
                                <ul>
                                    <li><i className="fa fa-map-marker"></i> Office Address line, Line 2, line 3, etc.</li>
                                    <li><Link to="tel:60 1234 5678" ><i className="fa fa-phone"></i> +60 1234 5678</Link></li>
                                    <li><Link to="mailto:contact@example.com" ><i className="fa fa-envelope"></i> contact@example.com</Link></li>
                                </ul>
                            </div>
                            <div className="contact_details contact_bg">
                            <h4>US Office</h4>
                                <ul>
                                    <li><i className="fa fa-map-marker"></i> Office Address line, Line 2, line 3, etc.</li>
                                    <li><Link to="tel:60 1234 5678" ><i className="fa fa-phone"></i> +60 1234 5678</Link></li>
                                    <li><Link to="mailto:contact@example.com" ><i className="fa fa-envelope"></i> contact@example.com</Link></li>
                                </ul>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </section>
        <Footer />
    </div>
  )
}

export default ContactUs
