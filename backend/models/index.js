const { sequelize } = require('../config/database');
const Student = require('./Student');
const CardRequest = require('./CardRequest');
const ContactMessage = require('./ContactMessage');
const ChatMessage = require('./ChatMessage');

Student.hasMany(CardRequest, {
  foreignKey: { name: 'studentId', allowNull: false },
  as: 'cardRequests',
  onDelete: 'CASCADE'
});

CardRequest.belongsTo(Student, {
  foreignKey: { name: 'studentId', allowNull: false },
  as: 'student'
});

const syncModels = async () => {
  await sequelize.sync();
  console.log('MySQL tables synced');
};

module.exports = {
  sequelize,
  Student,
  CardRequest,
  ContactMessage,
  ChatMessage,
  syncModels
};
