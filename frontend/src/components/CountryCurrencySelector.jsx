import React from 'react';

export const WEST_AFRICA_COUNTRIES = [
  { code: 'GH', name: 'Ghana', flag: '🇬🇭', dialCode: '+233', currency: 'GHS', placeholder: '024 123 4567' },
  { code: 'NG', name: 'Nigeria', flag: '🇳🇬', dialCode: '+234', currency: 'NGN', placeholder: '0803 123 4567' },
  { code: 'CI', name: "Côte d'Ivoire", flag: '🇨🇮', dialCode: '+225', currency: 'XOF', placeholder: '07 01 23 45 67' },
  { code: 'SN', name: 'Senegal', flag: '🇸🇳', dialCode: '+221', currency: 'XOF', placeholder: '77 123 45 67' },
  { code: 'LR', name: 'Liberia', flag: '🇱🇷', dialCode: '+231', placeholder: '088 123 4567', currency: 'LRD' },
  { code: 'SL', name: 'Sierra Leone', flag: '🇸🇱', dialCode: '+232', currency: 'SLE', placeholder: '076 123 456' }
];

export default function CountryCurrencySelector({
  selectedCountry,
  onCountryChange,
  phoneValue,
  onPhoneChange,
  disabled = false
}) {
  const activeCountry = WEST_AFRICA_COUNTRIES.find(c => c.code === selectedCountry) || WEST_AFRICA_COUNTRIES[0];

  return (
    <div className="country-currency-container">
      <div className="form-group country-select-group">
        <label className="form-label">
          <span className="label-icon">🌍</span> Country / Pays
        </label>
        <div className="country-dropdown-wrapper">
          <select
            value={selectedCountry}
            onChange={(e) => onCountryChange(e.target.value)}
            disabled={disabled}
            className="form-control country-select"
          >
            {WEST_AFRICA_COUNTRIES.map(country => (
              <option key={country.code} value={country.code}>
                {country.flag} {country.name} ({country.currency})
              </option>
            ))}
          </select>
          <span className="currency-badge">{activeCountry.currency}</span>
        </div>
      </div>

      <div className="form-group phone-input-group">
        <label className="form-label">
          <span className="label-icon">📱</span> Mobile Phone Number
        </label>
        <div className="phone-input-wrapper">
          <span className="dial-code-prefix">{activeCountry.flag} {activeCountry.dialCode}</span>
          <input
            type="tel"
            className="form-control phone-input"
            placeholder={activeCountry.placeholder}
            value={phoneValue}
            onChange={(e) => onPhoneChange(e.target.value)}
            disabled={disabled}
            required
          />
        </div>
      </div>
    </div>
  );
}
