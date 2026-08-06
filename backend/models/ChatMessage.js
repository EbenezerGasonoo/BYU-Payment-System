const { DataTypes, Model } = require('sequelize');
const { sequelize } = require('../config/database');

class ChatMessage extends Model {
  toJSON() {
    const values = { ...this.get() };
    values._id = String(values.id);
    return values;
  }
}

ChatMessage.init(
  {
    id: {
      type: DataTypes.INTEGER,
      autoIncrement: true,
      primaryKey: true
    },
    sessionId: {
      type: DataTypes.STRING(128),
      allowNull: false
    },
    sender: {
      type: DataTypes.ENUM('user', 'admin'),
      allowNull: false
    },
    senderName: {
      type: DataTypes.STRING(128),
      allowNull: false
    },
    message: {
      type: DataTypes.TEXT,
      allowNull: false
    },
    read: {
      type: DataTypes.BOOLEAN,
      allowNull: false,
      defaultValue: false
    }
  },
  {
    sequelize,
    modelName: 'ChatMessage',
    tableName: 'chat_messages',
    indexes: [{ fields: ['sessionId'] }]
  }
);

module.exports = ChatMessage;
