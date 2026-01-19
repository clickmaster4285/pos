import mongoose, { Schema } from "mongoose";

// EMBEDDED SCHEMAS (Only essential)
const AddressSchema = new Schema({
   street: { type: String, trim: true },
   city: { type: String, trim: true, required: true },
   state: { type: String, trim: true },
   zipCode: { type: String, trim: true },
   country: { type: String, trim: true, default: "Pakistan" },
   coordinates: {
      lat: Number,
      lng: Number
   }
}, { _id: false, versionKey: false });

const ContactSchema = new Schema({
   phone: { type: String, trim: true, required: true },
   email: { type: String, trim: true, lowercase: true }
}, { _id: false, versionKey: false });

// MAIN BRANCH SCHEMA (Optimized)
const BranchSchema = new Schema({
   // 1. IDENTIFICATION FIELDS (Indexed)
   companyId: {
      type: String,
      required: true,
   },
   branchId: {
      type: String,
      required: true,
      unique: true,
      index: true
   },
   branchCode: {
      type: String,
      uppercase: true,
      index: true
   },

   name: {
      type: String,
      required: true,
      trim: true,
      maxlength: 100,
      index: true
   },

   address: {
      type: AddressSchema,
      required: true
   },
   contact: {
      type: ContactSchema,
      required: true
   },
   openingDate: { type: Date, default: Date.now },

   managers: [{
      userId: {
         type: String,
         required: true,
         index: true
      },
      role: {
         type: String,
         enum: ['manager', 'assistant', 'supervisor'],
         default: 'manager'
      },
      assignedAt: { type: Date, default: Date.now }
   }],

   settings: {
      taxRate: { type: Number, default: 16, min: 0, max: 100 },
      currency: { type: String, default: 'PKR' },
   },

   status: {
      type: String,
      enum: ['active', 'inactive', 'closed', 'maintenance'],
      default: 'active',
      index: true
   },
   type: {
      type: String,
      enum: ['restaurant', 'retail', 'cafe', 'warehouse'],
      default: 'restaurant'
   },

      monthlyTarget: { type: Number, default: 0 },

   isDeleted: {
      type: Boolean,   
      default: false,
      index: true
   },
   deletedAt: Date,
   deletedBy: String,

   createdBy: { type: String, required: true },
   updatedBy: String

}, {
   timestamps: true,
   versionKey: false, 
   toJSON: {
      virtuals: true,
      transform: function (doc, ret) {
         delete ret._id;
         delete ret.isDeleted;
         return ret;
      }
   },
   toObject: {
      virtuals: true,
      transform: function (doc, ret) {
         delete ret._id;
         delete ret.isDeleted;
         return ret;
      }
   }
});

// INDEXES (Optimized for common queries)

// Compound indexes for common query patterns
BranchSchema.index({ companyId: 1, status: 1, isDeleted: 1 });
BranchSchema.index({ companyId: 1, "address.city": 1, isDeleted: 1 });
BranchSchema.index({ companyId: 1, "managers.userId": 1, isDeleted: 1 });
BranchSchema.index({ "address.coordinates": "2dsphere" }); // For geospatial queries

// Partial index for active branches only
BranchSchema.index({ companyId: 1 }, {
   partialFilterExpression: { status: 'active', isDeleted: false }
});

// VIRTUAL PROPERTIES (Computed on-demand)

BranchSchema.virtual('fullAddress').get(function () {
   const addr = this.address;
   return `${addr.street || ''}, ${addr.city}, ${addr.state || ''} ${addr.zipCode || ''}, ${addr.country}`.trim();
});

BranchSchema.virtual('primaryManager').get(function () {
   return this.managers.find(m => m.role === 'manager') || this.managers[0];
});

// MIDDLEWARE (Only essential)

// Auto-generate branch code
BranchSchema.pre('save', function (next) {
   if (!this.branchCode && this.name) {
      const code = this.name
         .split(' ')
         .map(word => word.charAt(0))
         .join('')
         .toUpperCase();
      this.branchCode = `${code}${this.branchId.slice(-3)}`;
   }
   next();
});

// Soft delete protection
BranchSchema.pre(['find', 'findOne', 'findOneAndUpdate'], function () {
   if (!this.getFilter().isDeleted) {
      this.where({ isDeleted: false });
   }
});

// STATIC METHODS (Optimized queries)
BranchSchema.statics.findByCompany = function (companyId, options = {}) {
   const query = { companyId, isDeleted: false };

   // Add filters if provided
   if (options.status) query.status = options.status;
   if (options.city) query["address.city"] = options.city;
   if (options.type) query.type = options.type;

   // Projection for performance
   const projection = options.lightweight ?
      { name: 1, branchCode: 1, status: 1, "address.city": 1, managers: 1 } :
      {};

   return this.find(query, projection)
      .sort({ createdAt: -1 })
      .limit(options.limit || 100);
};

BranchSchema.statics.findByManager = function (userId) {
   return this.find({
      "managers.userId": userId,
      isDeleted: false,
      status: 'active'
   }, {
      name: 1,
      branchCode: 1,
      "address.city": 1,
      stats: 1
   });
};

BranchSchema.statics.findNearby = function (lat, lng, radiusInKm = 5) {
   return this.find({
      "address.coordinates": {
         $nearSphere: {
            $geometry: {
               type: "Point",
               coordinates: [lng, lat]
            },
            $maxDistance: radiusInKm * 1000 // Convert to meters
         }
      },
      status: 'active',
      isDeleted: false
   }, {
      name: 1,
      "address.street": 1,
      "address.city": 1,
      "contact.phone": 1,
      isOpenNow: { $meta: "textScore" } // Virtual field
   });
};

// INSTANCE METHODS (Essential operations)
BranchSchema.methods.addManager = function (userId, role = 'manager', addedBy) {
   // Check if already a manager
   if (!this.managers.some(m => m.userId === userId && m.role === role)) {
      this.managers.push({
         userId,
         role,
         assignedAt: new Date()
      });

      this.logAudit('manager_added', addedBy || userId, { userId, role });
   }
   return this;
};

BranchSchema.methods.removeManager = function (userId, removedBy, reason = '') {
   const index = this.managers.findIndex(m => m.userId === userId);
   if (index > -1) {
      this.managers.splice(index, 1);
      this.logAudit('manager_removed', removedBy, { userId, reason });
   }
   return this;
};

BranchSchema.methods.softDelete = function (deletedBy, reason = '') {
   this.isDeleted = true;
   this.deletedAt = new Date();
   this.deletedBy = deletedBy;
   this.status = 'closed';

   this.logAudit('branch_deleted', deletedBy, { reason });

   return this;
};

export default mongoose.model("Branch", BranchSchema);