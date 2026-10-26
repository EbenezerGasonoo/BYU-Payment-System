const { DataTypes, Model } = require('sequelize');
const { sequelize } = require('../config/database');

// One line of a country's USD card float: positive top-ups, negative card debits
class FloatEntry extends Model {
  toJSON() {
    const values = { ...this.get() };
    values._id = String(values.id);
    return values;
  }
}

FloatEntry.init(
  {
    id: {
      type: DataTypes.INTEGER,
      autoIncrement: true,
      primaryKey: true
    },
    country: {
      type: DataTypes.STRING(10),
      allowNull: false
    },
    type: {
      type: DataTypes.ENUM('topup', 'debit'),
      allowNull: false
    },
    amountUsd: {
      type: DataTypes.DOUBLE,
      allowNull: false
    },
    entryDate: {
      type: DataTypes.DATE,
      allowNull: false,
      defaultValue: DataTypes.NOW
    },
    note: {
      type: DataTypes.STRING(255),
      allowNull: true,
      defaultValue: ''
    },
    cardRequestId: {
      type: DataTypes.STRING(64),
      allowNull: true
    }
  },
  {
    sequelize,
    modelName: 'FloatEntry',
    tableName: 'float_entries'
  }
);

module.exports = FloatEntry;
