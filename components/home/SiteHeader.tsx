"use client";

import { Camera, Pin, Palette } from "lucide-react";
import { Icon } from "@/components/ui/Icon";

export default function SiteHeader() {
  return (
    <>
      <div id="loading" className="preloader-wrap">
        <div className="preloader-text-container text-center">
          <div className="preloader-text-line">Two hearts.</div>
          <div className="preloader-text-line">One story.</div>
          <div className="preloader-text-line">Forever begins here.</div>
          <div className="preloader-text-line highlight">Herman & Jennifer</div>
        </div>
      </div>

      <div id="magic-cursor">
        <div id="ball"></div>
      </div>

      <div className="tp-offcanvas-area">
        <div className="tp-offcanvas-wrapper">
          <div className="tp-offcanvas-top d-flex align-items-center justify-content-between">
            <div className="tp-offcanvas-logo">
              <a href="/">
                <img className="logo-1" src="/img/logo01.png" alt="" />
                <img className="logo-2" src="/img/logo01.png" alt="" />
              </a>
            </div>
            <div className="tp-offcanvas-close">
              <button className="tp-offcanvas-close-btn" type="button">
                <svg width="37" height="38" viewBox="0 0 37 38" fill="none" xmlns="http://www.w3.org/2000/svg">
                  <path d="M9.19141 9.80762L27.5762 28.1924" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
                  <path d="M9.19141 28.1924L27.5762 9.80761" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
                </svg>
              </button>
            </div>
          </div>
          <div className="tp-offcanvas-main">
            <div className="tp-offcanvas-content">
              <h3 className="tp-offcanvas-title">Our Love Story</h3>
              <p>
                From Kinshasa to the United States, our journey is one of faith, love, and purpose. Jennifer, a dedicated Closing Coordinator, and Herman, a creative Graphic Designer and IT Engineer, found not only love—but a shared calling.
                Together, we’re building a future grounded in faith and filled with joy.
              </p>
            </div>
            <div className="tp-main-menu-mobile d-xl-none"></div>
            <div className="tp-offcanvas-gallery">
              <div className="row gx-2">
                {["vhj-01", "vhj-02", "vhj-03", "vhj-06"].map((img) => (
                  <div className="col-md-3 col-3" key={img}>
                    <div className="tp-offcanvas-gallery-img fix">
                      <a href="#">
                        <img src={`/img/${img}.jpg`} alt="" />
                      </a>
                    </div>
                  </div>
                ))}
              </div>
            </div>
            <div className="tp-offcanvas-contact">
              <h3 className="tp-offcanvas-title sm">Information</h3>
              <ul>
                <li><a href="tel:1245654">+243 80 770 1007</a></li>
                <li><a href="mailto:hello@jennifer-herman.com">hello@jennifer-herman.com</a></li>
                <li>
                  <a href="#">
                    Bloomington, Illinois<br />
                    Parke Regency Hotel & Conference Center
                  </a>
                </li>
              </ul>
            </div>
            <div className="tp-offcanvas-social">
              <h3 className="tp-offcanvas-title sm">Join us</h3>
              <ul>
                <li><a href="#"><Icon icon={Pin} size={18} /></a></li>
                <li><a href="#"><Icon icon={Camera} size={18} /></a></li>
                <li><a href="#"><Icon icon={Palette} size={18} /></a></li>
              </ul>
            </div>
          </div>
        </div>
      </div>
      <div className="body-overlay"></div>

      <header>
        <div id="header-sticky" className="tp-header-4-area tp-header-4-mob-space tp-transparent z-index-5">
          <div className="container">
            <div className="row align-items-center">
              <div className="col-xl-2 col-lg-2 col-6">
                <div className="tp-header-logo">
                  <a className="logo-1" href="/">
                    <img src="/img/logo.png" alt="" />
                  </a>
                  <a className="logo-2" href="/">
                    <img src="/img/logo.png" alt="" />
                  </a>
                </div>
              </div>
              <div className="col-xl-8 col-lg-9 d-none d-xl-block">
                <div className="tp-header-menu header-main-menu text-center">
                  <nav className="tp-main-menu-content">
                    <ul>
                      <li><a href="#!" className="text-white">Home</a></li>
                      <li><a href="/savethedate" className="text-white">Save the Date</a></li>
                      <li><a href="#!" className="text-white">Dress Code</a></li>
                      <li><a href="#!" className="text-white">Contact</a></li>
                    </ul>
                  </nav>
                </div>
              </div>
              <div className="col-xl-2 col-lg col-6">
                <div className="tp-header-10-menubar text-end">
                  <button className="tp-offcanvas-open-btn" type="button">
                    <span></span>
                    <span></span>
                    <span></span>
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      </header>
    </>
  );
}
