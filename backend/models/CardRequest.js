const { DataTypes, Model } = require('sequelize');
const { sequelize } = require('../config/database');

class CardRequest extends Model {
  toJSON() {
    const values = { ...this.get() };
    values._id = String(values.id);
    if (values.student && typeof values.student.toJSON === 'function') {
      values.student = values.student.toJSON();
    }
    return values;
  }
}

CardRequest.init(
  {
    id: {
      type: DataTypes.INTEGER.UNSIGNED,
      autoIncrement: true,
      primaryKey: true
    },
    studentId: {
      type: DataTypes.INTEGER.UNSIGNED,
      allowNull: false
    },
    amount: {
      type: DataTypes.DOUBLE,
      allowNull: false
    },
    amountInGHS: {
      type: DataTypes.DOUBLE,
      allowNull: true
    },
    exchangeRate: {
      type: DataTypes.DOUBLE,
      allowNull: true
    },
    chargebackFee: {
      type: DataTypes.DOUBLE,
      allowNull: false,
      defaultValue: 5
    },
    totalPaidGHS: {
      type: DataTypes.DOUBLE,
      allowNull: true
    },
    purpose: {
      type: DataTypes.STRING(255),
      allowNull: false,
      defaultValue: 'School Fees Payment'
    },
    status: {
      type: DataTypes.ENUM('pending', 'assigned', 'paid', 'expired', 'declined'),
      allowNull: false,
      defaultValue: 'pending'
    },
    paymentStatus: {
      type: DataTypes.ENUM('unpaid', 'pending', 'paid', 'failed'),
      allowNull: false,
      defaultValue: 'unpaid'
    },
    paymentReference: {
      type: DataTypes.STRING(128),
      allowNull: true
    },
    hubtelCheckoutId: {
      type: DataTypes.STRING(128),
      allowNull: true
    },
    mtnReferenceId: {
      type: DataTypes.STRING(128),
      allowNull: true
    },
    mtnTransactionId: {
      type: DataTypes.STRING(128),
      allowNull: true
    },
    paymentMethod: {
      type: DataTypes.ENUM('momo-hubtel', 'momo-direct', 'momo-manual', 'pending'),
      allowNull: true
    },
    paymentVerifiedAt: {
      type: DataTypes.DATE,
      allowNull: true
    },
    requestToken: {
      type: DataTypes.STRING(64),
      allowNull: false,
      unique: true
    },
    virtualCardNumber: {
      type: DataTypes.STRING(32),
      allowNull: true
    },
    cardholderName: {
      type: DataTypes.STRING(128),
      allowNull: true
    },
    cardExpiryDate: {
      type: DataTypes.STRING(8),
      allowNull: true
    },
    cardCVV: {
      type: DataTypes.STRING(8),
      allowNull: true
    },
    assignedAt: {
      type: DataTypes.DATE,
      allowNull: true
    },
    expiresAt: {
      type: DataTypes.DATE,
      allowNull: true
    },
    paidAt: {
      type: DataTypes.DATE,
      allowNull: true
    }
  },
  {
    sequelize,
    modelName: 'CardRequest',
    tableName: 'card_requests'
  }
);

module.exports = CardRequest;
