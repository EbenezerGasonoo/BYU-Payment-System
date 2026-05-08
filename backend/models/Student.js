const { DataTypes, Model } = require('sequelize');
const { sequelize } = require('../config/database');

class Student extends Model {
  toJSON() {
    const values = { ...this.get() };
    values._id = String(values.id);
    return values;
  }
}

Student.init(
  {
    id: {
      type: DataTypes.INTEGER.UNSIGNED,
      autoIncrement: true,
      primaryKey: true
    },
    name: {
      type: DataTypes.STRING(255),
      allowNull: false
    },
    byuId: {
      type: DataTypes.STRING(20),
      allowNull: false,
      unique: true
    },
    email: {
      type: DataTypes.STRING(255),
      allowNull: false,
      unique: true,
      set(value) {
        this.setDataValue('email', value ? String(value).toLowerCase().trim() : value);
      }
    },
    phone: {
      type: DataTypes.STRING(32),
      allowNull: false
    },
    isVerified: {
      type: DataTypes.BOOLEAN,
      allowNull: false,
      defaultValue: false
    },
    verificationToken: {
      type: DataTypes.STRING(128),
      allowNull: true
    },
    status: {
      type: DataTypes.ENUM('active', 'deleted'),
      allowNull: false,
      defaultValue: 'active'
    },
    deletedAt: {
      type: DataTypes.DATE,
      allowNull: true
    }
  },
  {
    sequelize,
    modelName: 'Student',
    tableName: 'students'
  }
);

module.exports = Student;
