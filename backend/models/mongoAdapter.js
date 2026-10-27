const dns = require('dns');
try {
  dns.setServers(['8.8.8.8', '8.8.4.4', '1.1.1.1']);
} catch (e) {}

const mongoose = require('mongoose');
const { MongoStudent, MongoCardRequest, MongoContactMessage, MongoChatMessage, MongoFloatEntry } = require('./mongoModels');

// Sequelize field operators this adapter supports, by Op symbol name
const FIELD_OPERATORS = {
  eq: '$eq',
  ne: '$ne',
  in: '$in',
  notIn: '$nin',
  gt: '$gt',
  gte: '$gte',
  lt: '$lt',
  lte: '$lte'
};

/**
 * Normalizes Sequelize `where` query into a MongoDB filter object.
 */
function translateWhere(where) {
  if (!where) return {};
  const filter = {};

  for (const key of Object.keys(where)) {
    const val = where[key];
    if (val && typeof val === 'object' && !(val instanceof Date)) {
      // Sequelize Op symbols (Op.in, Op.gte, ...) → MongoDB operators, matched by exact name.
      // Several operators on one field are combined, e.g. { [Op.gte]: a, [Op.lt]: b }.
      const symbols = Object.getOwnPropertySymbols(val);
      if (symbols.length > 0) {
        const condition = {};
        for (const sym of symbols) {
          const op = sym.description;
          if (op === 'or' || op === 'and') {
            filter[`$${op}`] = val[sym].map((part) => translateWhere({ [key]: part }));
          } else if (FIELD_OPERATORS[op]) {
            condition[FIELD_OPERATORS[op]] = val[sym];
          } else {
            // Fail loudly: silently dropping a condition matches far more documents than intended
            throw new Error(`Unsupported query operator "${op}" on field "${key}" in the MongoDB adapter`);
          }
        }
        if (Object.keys(condition).length > 0) {
          filter[key === 'id' ? '_id' : key] = condition;
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
    const op = sym.description;
    if (op === 'or' || op === 'and') {
      filter[`$${op}`] = where[sym].map(translateWhere);
    } else {
      throw new Error(`Unsupported top-level query operator "${op}" in the MongoDB adapter`);
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
const FloatEntryAdapter     = createModelWrapper(MongoFloatEntry, 'FloatEntry');

module.exports = {
  StudentAdapter,
  CardRequestAdapter,
  ContactMessageAdapter,
  ChatMessageAdapter,
  FloatEntryAdapter,
  translateWhere
};
