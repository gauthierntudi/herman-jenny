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
                    <h4 className="tp-footer-big-title footer-big-text">forever</h4>
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
                            <a href="#!" target="_blank" rel="noreferrer">
                              Bloomington, Illinois
                              <br />
                              Parke Regency Hotel &amp; Conference Center
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
