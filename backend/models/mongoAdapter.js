const dns = require('dns');
try {
  dns.setServers(['8.8.8.8', '8.8.4.4', '1.1.1.1']);
} catch (e) {}

const mongoose = require('mongoose');
const { MongoStudent, MongoCardRequest, MongoContactMessage, MongoChatMessage } = require('./mongoModels');

/**
 * Normalizes Sequelize `where` query into a MongoDB filter object.
 */
function translateWhere(where) {
  if (!where) return {};
  const filter = {};

  for (const key of Object.keys(where)) {
    const val = where[key];
    if (val && typeof val === 'object') {
      // Check for Symbol keys from Sequelize Op (e.g. Op.ne, Op.or, Op.and)
      const symbols = Object.getOwnPropertySymbols(val);
      if (symbols.length > 0) {
        for (const sym of symbols) {
          const symStr = sym.toString();
          if (symStr.includes('ne')) {
            filter[key] = { $ne: val[sym] };
          } else if (symStr.includes('or')) {
            filter.$or = val[sym].map(translateWhere);
          } else if (symStr.includes('and')) {
            filter.$and = val[sym].map(translateWhere);
          } else if (symStr.includes('gt')) {
            filter[key] = { $gt: val[sym] };
          } else if (symStr.includes('lt')) {
            filter[key] = { $lt: val[sym] };
          } else if (symStr.includes('gte')) {
            filter[key] = { $gte: val[sym] };
          } else if (symStr.includes('lte')) {
            filter[key] = { $lte: val[sym] };
          }
        }
      } else {
        filter[key] = val;
      }
    } else {
      if (key === 'id') {
        filter._id = val;
      } else {
        filter[key] = val;
      }
    }
  }

  // Handle top-level symbols (like Op.or)
  const topSymbols = Object.getOwnPropertySymbols(where);
  for (const sym of topSymbols) {
    const symStr = sym.toString();
    if (symStr.includes('or')) {
      filter.$or = where[sym].map(translateWhere);
    } else if (symStr.includes('and')) {
      filter.$and = where[sym].map(translateWhere);
    }
  }

  return filter;
}

/**
 * Wraps a Mongoose document or plain object to provide both `id`, `_id`, `.save()`, `.toJSON()`.
 */
function wrapDoc(doc) {
  if (!doc) return null;
  if (!doc.id && doc._id) {
    doc.id = doc._id.toString();
  }
  return doc;
}

function createModelWrapper(MongooseModel, modelName) {
  return {
    async findOne(options = {}) {
      const filter = translateWhere(options.where);
      let query = MongooseModel.findOne(filter);
      if (options.include && options.include.some(inc => inc.as === 'student' || inc.model)) {
        query = query.populate('student');
      }
      const res = await query.exec();
      return wrapDoc(res);
    },

    async findByPk(id, options = {}) {
      if (!id) return null;
      let query = MongooseModel.findById(id);
      if (options.include && options.include.some(inc => inc.as === 'student' || inc.model)) {
        query = query.populate('student');
      }
      const res = await query.exec();
      return wrapDoc(res);
    },

    async findAll(options = {}) {
      const filter = translateWhere(options.where);

      // Handle group aggregation requests from admin routes
      if (options.group) {
        if (modelName === 'Student') {
          const aggr = await MongooseModel.aggregate([
            { $match: filter },
            { $group: { _id: '$countryCode', count: { $sum: 1 } } }
          ]);
          return aggr.map(r => ({ countryCode: r._id || 'GH', count: r.count }));
        }

        if (modelName === 'CardRequest') {
          const aggr = await MongooseModel.aggregate([
            { $match: filter },
            { $lookup: { from: 'students', localField: 'studentId', foreignField: '_id', as: 'student' } },
            { $unwind: { path: '$student', preserveNullAndEmptyArrays: true } },
            { $group: { _id: '$student.countryCode', count: { $sum: 1 } } }
          ]);
          return aggr.map(r => ({ 'student.countryCode': r._id || 'GH', count: r.count }));
        }
      }

      let query = MongooseModel.find(filter);

      if (options.order) {
        const sortObj = {};
        for (const orderItem of options.order) {
          if (Array.isArray(orderItem)) {
            const [field, dir] = orderItem;
            sortObj[field === 'id' ? '_id' : field] = dir.toLowerCase() === 'desc' ? -1 : 1;
          }
        }
        query = query.sort(sortObj);
      } else {
        query = query.sort({ createdAt: -1 });
      }

      if (options.include && options.include.some(inc => inc.as === 'student' || inc.model)) {
        query = query.populate('student');
      }

      const list = await query.exec();
      return list.map(wrapDoc);
    },

    async count(options = {}) {
      const filter = translateWhere(options.where);
      return await MongooseModel.countDocuments(filter);
    },

    async create(data) {
      const doc = new MongooseModel(data);
      await doc.save();
      return wrapDoc(doc);
    }
  };
}

const StudentAdapter        = createModelWrapper(MongoStudent, 'Student');
const CardRequestAdapter    = createModelWrapper(MongoCardRequest, 'CardRequest');
const ContactMessageAdapter = createModelWrapper(MongoContactMessage, 'ContactMessage');
const ChatMessageAdapter    = createModelWrapper(MongoChatMessage, 'ChatMessage');

module.exports = {
  StudentAdapter,
  CardRequestAdapter,
  ContactMessageAdapter,
  ChatMessageAdapter
};
