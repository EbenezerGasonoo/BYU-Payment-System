const { sequelize, isConnected: isSqlConnected } = require('../config/database');
const { isMongoConnected } = require('../config/mongodb');
const SqlStudent = require('./Student');
const SqlCardRequest = require('./CardRequest');
const SqlContactMessage = require('./ContactMessage');
const SqlChatMessage = require('./ChatMessage');
const {
  StudentAdapter,
  CardRequestAdapter,
  ContactMessageAdapter,
  ChatMessageAdapter
} = require('./mongoAdapter');

SqlStudent.hasMany(SqlCardRequest, {
  foreignKey: { name: 'studentId', allowNull: false },
  as: 'cardRequests',
  onDelete: 'CASCADE'
});

SqlCardRequest.belongsTo(SqlStudent, {
  foreignKey: { name: 'studentId', allowNull: false },
  as: 'student'
});

const syncModels = async () => {
  if (isSqlConnected()) {
    await sequelize.sync();
    console.log('Database tables synced (PostgreSQL)');
  }
};

/**
 * Creates a dynamic proxy that delegates to MongoAdapter if MongoDB is connected,
 * otherwise delegates to the Sequelize Model.
 */
function createProxy(mongoAdapter, sqlModel) {
  return new Proxy(sqlModel, {
    get(target, prop) {
      if (isMongoConnected()) {
        if (prop in mongoAdapter) {
          return mongoAdapter[prop];
        }
      }
      return target[prop];
    }
  });
}

const Student        = createProxy(StudentAdapter,        SqlStudent);
const CardRequest    = createProxy(CardRequestAdapter,    SqlCardRequest);
const ContactMessage = createProxy(ContactMessageAdapter, SqlContactMessage);
const ChatMessage    = createProxy(ChatMessageAdapter,    SqlChatMessage);

module.exports = {
  sequelize,
  Student,
  CardRequest,
  ContactMessage,
  ChatMessage,
  syncModels
};

