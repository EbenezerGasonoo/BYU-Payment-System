import { Link } from 'react-router-dom';
import { BrandMark } from './SiteHeader';
import { SUPPORT } from '../utils/siteInfo';

function SiteFooter() {
  return (
    <footer className="cp-footer">
      <div className="cp-container">
        <div className="cp-footer__top">
          <div>
            <Link to="/" className="cp-brand">
              <BrandMark />
              ConnectPay
            </Link>
            <p className="cp-footer__tag">
              Single-use USD cards for BYU-Pathway tuition, paid with Mobile Money in Ghana or Paystack in Nigeria.
            </p>
          </div>

          <div className="cp-footer__links">
            <div>
              <h4>Service</h4>
              <ul>
                <li><Link to="/#how-it-works">How it works</Link></li>
                <li><Link to="/#fees">Fees and timing</Link></li>
                <li><Link to="/request">Request a card</Link></li>
              </ul>
            </div>
            <div>
              <h4>Account</h4>
              <ul>
                <li><Link to="/register">Create account</Link></li>
                <li><Link to="/login">Sign in</Link></li>
                <li><Link to="/forgot-password">Reset password</Link></li>
              </ul>
            </div>
            <div>
              <h4>Help</h4>
              <ul>
                <li><Link to="/faq">FAQ</Link></li>
                <li><Link to="/contact">Contact support</Link></li>
                <li><a href={SUPPORT.whatsappUrl} target="_blank" rel="noopener noreferrer">WhatsApp</a></li>
              </ul>
            </div>
          </div>
        </div>

        <div className="cp-footer__legal">
          <p>
            ConnectPay is an independent service. It is not affiliated with, endorsed by, or operated by
            BYU-Pathway Worldwide, Brigham Young University, or The Church of Jesus Christ of Latter-day Saints.
          </p>
          <p>&copy; {new Date().getFullYear()} ConnectPay</p>
        </div>
      </div>
    </footer>
  );
}

export default SiteFooter;
