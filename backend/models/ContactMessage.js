const { DataTypes, Model } = require('sequelize');
const { sequelize } = require('../config/database');

class ContactMessage extends Model {
  toJSON() {
    const values = { ...this.get() };
    values._id = String(values.id);
    return values;
  }
}

ContactMessage.init(
  {
    id: {
      type: DataTypes.INTEGER,
      autoIncrement: true,
      primaryKey: true
    },
    name: {
      type: DataTypes.STRING(255),
      allowNull: false
    },
    email: {
      type: DataTypes.STRING(255),
      allowNull: false,
      set(value) {
        this.setDataValue('email', value ? String(value).toLowerCase().trim() : value);
      }
    },
    byuId: {
      type: DataTypes.STRING(20),
      allowNull: true
    },
    subject: {
      type: DataTypes.ENUM('general', 'card-request', 'registration', 'payment', 'technical', 'other'),
      allowNull: false,
      defaultValue: 'general'
    },
    message: {
      type: DataTypes.TEXT,
      allowNull: false
    },
    status: {
      type: DataTypes.ENUM('new', 'read', 'responded', 'resolved'),
      allowNull: false,
      defaultValue: 'new'
    },
    respondedAt: {
      type: DataTypes.DATE,
      allowNull: true
    }
  },
  {
    sequelize,
    modelName: 'ContactMessage',
    tableName: 'contact_messages'
  }
);

module.exports = ContactMessage;
