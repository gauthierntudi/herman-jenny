export default function SiteFooter() {
  return (
    <footer>
      <div className="tp-footer-area black-bg pt-90">
        <div className="container-fluid">
          <div className="tp-footer-wrap">
            <div className="row align-items-end">
              <div className="col-xl-5 col-lg-6">
                <div className="tp-footer-menu menu-anim">
                  <ul className="counter-row tp-text-anim">
                    <li className="active">
                      <a href="/">Home</a>
                    </li>
                    <li className="active">
                      <a href="/schedule">Schedule</a>
                    </li>
                    <li className="active">
                      <a href="/#dress-code">Dress Code</a>
                    </li>
                    <li className="active">
                      <a href="/#gift-universe">Gift Universe</a>
                    </li>
                    <li className="active">
                      <a href="#!">Contact</a>
                    </li>
                  </ul>
                </div>
              </div>
              <div className="col-xl-5 col-lg-6">
                <div className="tp-footer-middle-wrap">
                  <div className="tp-footer-content">
                    <h4 className="tp-footer-big-title footer-big-text">wedding</h4>
                  </div>
                  <div className="row">
                    <div className="col-xl-6 col-lg-6 col-md-6">
                      <div className="tp-footer-widget">
                        <h4 className="tp-footer-title tp_fade_bottom">Say hello at:</h4>
                        <div className="tp-footer-widget-info">
                          <div className="tp-footer-widget-info-mail tp_fade_bottom">
                            <a href="mailto:hello@jennifer-herman.com">hello@jennifer-herman.com</a>
                          </div>
                          <div className="tp-footer-widget-info-mail tp_fade_bottom">
                            <a href="tel:+12173775814">+1 (217) 377-5814</a>
                          </div>
                          <div className="tp-footer-widget-info-location tp_fade_bottom">
                            <a
                              href="https://www.google.com/maps/place/Parke+Regency+Hotel+%26+Conference+Center/@40.5017784,-88.9042559,19.23z/data=!4m15!1m5!3m4!2zNDDCsDMwJzA1LjgiTiA4OMKwNTQnMTMuMyJX!8m2!3d40.501618!4d-88.903681!3m8!1s0x880b7b277046d69d:0x48526d028420ebda!5m2!4m1!1i2!8m2!3d40.5014783!4d-88.9032926!16s%2Fg%2F11xg9pgd3?entry=ttu&g_ep=EgoyMDI2MDcxNC4wIKXMDSoASAFQAw%3D%3D"
                              target="_blank"
                              rel="noopener noreferrer"
                            >
                              Parke Regency Hotel &amp; Conference Center
                              <br />
                              1413 Leslie Dr, Bloomington, IL 61704
                            </a>
                          </div>
                        </div>
                      </div>
                    </div>
                    <div className="col-xl-6 col-lg-6 col-md-6">
                      <div className="tp-footer-widget">
                        <h4 className="tp-footer-title tp_fade_bottom">Stalk us</h4>
                        <ul className="tp-footer-widget-social">
                          <li className="tp_fade_bottom">
                            <a href="#">Facebook</a>
                          </li>
                          <li className="tp_fade_bottom">
                            <a href="#">Instagram</a>
                          </li>
                          <li className="tp_fade_bottom">
                            <a href="#">Behance</a>
                          </li>
                          <li className="tp_fade_bottom">
                            <a href="#">Dribbble</a>
                          </li>
                        </ul>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        <div className="container-fluid">
          <div className="tp-copyright-wrap">
            <div className="row align-items-center">
              <div className="col-xl-6 col-md-4">
                <div className="tp-copyright-logo text-center text-md-start">
                  <a href="/">
                    <img src="/img/logo.png" alt="Herman & Jennifer" />
                  </a>
                </div>
              </div>
              <div className="col-xl-6 col-md-8">
                <div className="tp-copyright-text text-center text-md-end">
                  <p>Copyright © 2026 . All rights reserved.</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </footer>
  );
}
