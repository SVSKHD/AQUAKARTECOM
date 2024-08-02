import React from "react";
import PropTypes from "prop-types";

const AquaPaymentDetails = ({ paymentInstrument }) => {
  if (!paymentInstrument) {
    return <p className="text-gray-600">No payment details available.</p>;
  }

  const { type, utr, cardNetwork, accountType, last4, expiry } =
    paymentInstrument;

  return (
    <div className="ml-4 mt-4">
      {type && <p className="text-gray-900">Type: {type}</p>}
      {utr && <p className="text-gray-900">UTR: {utr}</p>}
      {cardNetwork && (
        <p className="text-gray-900">Card Network: {cardNetwork}</p>
      )}
      {accountType && (
        <p className="text-gray-900">Account Type: {accountType}</p>
      )}
      {last4 && <p className="text-gray-900">Ending with {last4}</p>}
      {expiry && <p className="text-gray-600">Expires {expiry}</p>}
    </div>
  );
};

AquaPaymentDetails.propTypes = {
  paymentInstrument: PropTypes.shape({
    type: PropTypes.string,
    utr: PropTypes.string,
    cardNetwork: PropTypes.string,
    accountType: PropTypes.string,
    last4: PropTypes.string,
    expiry: PropTypes.string,
  }),
};

export default AquaPaymentDetails;
