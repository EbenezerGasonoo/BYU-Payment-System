import React, { useState } from 'react';

export default function VirtualCardVisualizer({
  cardNumber,
  cardholderName,
  expiryDate,
  cvv,
  amountUsd,
  cardStatus = 'active',
  onFreezeToggle
}) {
  const [isFlipped, setIsFlipped] = useState(false);
  const [showFullNumber, setShowFullNumber] = useState(false);
  const [copiedToast, setCopiedToast] = useState('');

  const formattedNumber = cardNumber
    ? cardNumber.replace(/(.{4})/g, '$1 ').trim()
    : '4124 55•• •••• ••••';

  const maskedNumber = cardNumber
    ? `${cardNumber.slice(0, 4)} •••• •••• ${cardNumber.slice(-4)}`
    : '4124 •••• •••• 5590';

  const handleCopyDetails = (e) => {
    e.stopPropagation();
    const textToCopy = `Card Number: ${cardNumber}\nName: ${cardholderName}\nExpiry: ${expiryDate}\nCVV: ${cvv}`;
    navigator.clipboard.writeText(textToCopy);
    setCopiedToast('✓ Card details copied!');
    setTimeout(() => setCopiedToast(''), 3000);
  };

  const isFrozen = cardStatus === 'frozen';

  return (
    <div className="card-visualizer-container">
      {copiedToast && <div className="card-toast-notification">{copiedToast}</div>}

      <div 
        className={`virtual-card-3d ${isFlipped ? 'flipped' : ''} ${isFrozen ? 'frozen-card' : ''}`}
        onClick={() => setIsFlipped(!isFlipped)}
        title="Click to flip card"
      >
        {/* FRONT OF VIRTUAL CARD */}
        <div className="card-side card-front">
          <div className="card-bg-glow"></div>
          
          <div className="card-header">
            <div className="card-chip">
              <div className="chip-line"></div>
              <div className="chip-line"></div>
            </div>
            <div className="card-brand-status">
              <span className={`status-pill ${isFrozen ? 'frozen' : 'active'}`}>
                {isFrozen ? '❄️ FROZEN' : '⚡ ACTIVE'}
              </span>
              <span className="visa-logo">VISA</span>
            </div>
          </div>

          <div className="card-number-section">
            <span className="card-number-display">
              {showFullNumber ? formattedNumber : maskedNumber}
            </span>
            <button
              type="button"
              className="toggle-eye-btn"
              onClick={(e) => {
                e.stopPropagation();
                setShowFullNumber(!showFullNumber);
              }}
              title={showFullNumber ? "Hide card number" : "Show card number"}
            >
              {showFullNumber ? '👁️' : '🙈'}
            </button>
          </div>

          <div className="card-footer">
            <div className="card-holder-info">
              <span className="card-label">CARDHOLDER</span>
              <span className="card-val">{cardholderName || 'BYU PATHWAY STUDENT'}</span>
            </div>
            <div className="card-expiry-info">
              <span className="card-label">EXPIRES</span>
              <span className="card-val">{expiryDate || 'MM/YY'}</span>
            </div>
            <div className="card-balance-tag">
              <span className="card-label">BALANCE</span>
              <span className="card-val">${parseFloat(amountUsd || 0).toFixed(2)} USD</span>
            </div>
          </div>
        </div>

        {/* BACK OF VIRTUAL CARD */}
        <div className="card-side card-back">
          <div className="card-magnetic-stripe"></div>
          <div className="card-signature-section">
            <span className="card-label">AUTHORIZED SIGNATURE</span>
            <div className="signature-bar">
              <span className="cvv-box">{cvv || '***'}</span>
            </div>
          </div>
          <div className="back-info">
            <p>BYU Pathway International USD Virtual Debit Card.</p>
            <p>Issued for educational fees processing across West Africa.</p>
          </div>
          <span className="flip-hint">⇄ Tap card to flip</span>
        </div>
      </div>

      {/* QUICK CARD ACTIONS */}
      <div className="card-quick-actions">
        <button
          type="button"
          className="card-action-btn copy-btn"
          onClick={handleCopyDetails}
        >
          📋 Copy Card Info
        </button>

        {onFreezeToggle && (
          <button
            type="button"
            className={`card-action-btn freeze-btn ${isFrozen ? 'unfreeze' : 'freeze'}`}
            onClick={onFreezeToggle}
          >
            {isFrozen ? '☀️ Unfreeze Card' : '❄️ Freeze Card'}
          </button>
        )}
      </div>
    </div>
  );
}
