// controllers/shipment.controller.js
import IndexModel from '../models/indexModel.js';
import { generateAwbNumber } from '../utils/generateShippmentNumber.js';

/* -------- internal utils (not exported) -------- */
function mapRawToNormalized(raw = '') {
  const s = String(raw).toLowerCase();
  if (s.includes('cancel')) return 'CANCELLED';
  if (s.includes('return')) return 'RETURNED';
  if (s.includes('out for delivery')) return 'OUT_FOR_DELIVERY';
  if (s.includes('delivered')) return 'DELIVERED';
  if (s.includes('in transit') || s.includes('depart') || s.includes('sort'))
    return 'IN_TRANSIT';
  if (s.includes('created') || s.includes('pending') || s.includes('await'))
    return 'PENDING';
  return 'IN_TRANSIT';
}

const actorFrom = (req) =>
  req.user?.userId || req.user?.id || req.user?.email || 'system';

const pushHistory = (doc, action, req) => {
  doc.history = doc.history || [];
  doc.history.push({
    action,
    performedBy: actorFrom(req),
    createdAt: new Date(),
  });
};

/* ================== CREATE (company-scoped) ================== */
// POST /api/shipments
export const createShipment = async (req, res, next) => {
  try {
    const companyId = req.user?.companyId || req.body.companyId;
    if (!companyId) {
      return res
        .status(400)
        .json({ success: false, message: 'companyId is required' });
    }

    const {
      awb, // optional; will be generated if missing
      courierId,
      courierCode,
      courierName,
      from_wareHouse,
      recipientName,
      toAddress,
      toCity,
      toPhone,
      cod = {},
      weightKg,
      dimensions,
      serviceLevel = 'Standard',
      statusRaw = 'Created',
      statusNormalized, // optional; will derive if absent
      checkpoints = [],
    } = req.body;

    const normalized = statusNormalized || mapRawToNormalized(statusRaw);

    // auto-generate AWB if client didn't send one
    const finalAwb =
      awb && String(awb).trim().length
        ? awb.trim()
        : await generateAwbNumber(companyId);

    const createdAt = new Date();
    const initialCheckpoints =
      checkpoints.length > 0
        ? checkpoints
        : [
            {
              ts: createdAt,
              description: 'Shipment created',
              rawStatus: statusRaw,
              normalized,
            },
          ];

    const shipment = new IndexModel.Shipment({
      awb: finalAwb,
      companyId,
      courierId,
      courierCode,
      courierName,
      from_wareHouse,
      recipientName,
      toAddress,
      toCity,
      toPhone,
      cod: { enabled: !!cod.enabled, amount: cod.amount ?? undefined },
      weightKg,
      dimensions,
      serviceLevel,
      statusRaw,
      statusNormalized: normalized,
      createdAt,
      checkpoints: initialCheckpoints,
      createdBy: actorFrom(req),
    });

    pushHistory(shipment, 'Created', req);

    await shipment.save();
    return res.status(201).json({ success: true, data: shipment });
  } catch (err) {
    if (err?.code === 11000 && err?.keyPattern?.awb) {
      return res
        .status(409)
        .json({ success: false, message: 'AWB collision, please retry.' });
    }
    next(err);
  }
};

/* ================== LIST (company-scoped) ================== */
// GET /api/shipments
export const listShipments = async (req, res, next) => {
  try {
    const companyId = req.user?.companyId || req.query.companyId;
    if (!companyId) {
      return res
        .status(400)
        .json({ success: false, message: 'companyId is required' });
    }

    const {
      q,
      status,
      courierId,
      from,
      to,
      deleted, // 'true' | 'false' | undefined
      page = 1,
      limit = 20,
      sort = '-createdAt',
    } = req.query;

    // Base filter: must match company
    const filter = { companyId };

    // Soft-delete logic: default exclude deleted; allow explicit override
    if (deleted === 'true') filter.deleted = true;
    else if (deleted === 'false') filter.deleted = false;
    else filter.deleted = { $ne: true };

    if (q) filter.awb = { $regex: String(q), $options: 'i' };
    if (status) filter.statusNormalized = String(status);
    if (courierId) filter.courierId = String(courierId);

    if (from || to) {
      const range = {};
      if (from) range.$gte = new Date(from);
      if (to) range.$lte = new Date(to);
      filter.createdAt = range;
    }

    const pageNum = Math.max(1, parseInt(page, 10) || 1);
    const limitNum = Math.min(200, Math.max(1, parseInt(limit, 10) || 20));
    const skip = (pageNum - 1) * limitNum;

    const [items, total] = await Promise.all([
      IndexModel.Shipment.find(filter)
        .sort(sort)
        .skip(skip)
        .limit(limitNum)
        .lean()
        .exec(),
      IndexModel.Shipment.countDocuments(filter),
    ]);

    res.json({
      success: true,
      data: items,
      meta: {
        page: pageNum,
        limit: limitNum,
        total,
        pages: Math.ceil(total / limitNum),
      },
    });
  } catch (err) {
    next(err);
  }
};

/* ================== READ (company-scoped) ================== */
// GET /api/shipments/:id
export const getShipmentById = async (req, res, next) => {
  try {
    const companyId = req.user?.companyId || req.query.companyId;
    if (!companyId) {
      return res
        .status(400)
        .json({ success: false, message: 'companyId is required' });
    }

    const doc = await IndexModel.Shipment.findOne({
      _id: req.params.id,
      companyId,
    });

    if (!doc)
      return res
        .status(404)
        .json({ success: false, message: 'Shipment not found' });
    res.json({ success: true, data: doc });
  } catch (err) {
    next(err);
  }
};

// GET /api/shipments/awb/:awb
export const getShipmentByAwb = async (req, res, next) => {
  try {
    const companyId = req.user?.companyId || req.query.companyId;
    if (!companyId) {
      return res
        .status(400)
        .json({ success: false, message: 'companyId is required' });
    }

    const doc = await IndexModel.Shipment.findOne({
      awb: req.params.awb,
      companyId,
    });

    if (!doc)
      return res
        .status(404)
        .json({ success: false, message: 'Shipment not found' });
    res.json({ success: true, data: doc });
  } catch (err) {
    next(err);
  }
};

/* ================== UPDATE (company-scoped) ================== */
// PATCH /api/shipments/:id
export const updateShipment = async (req, res, next) => {
  try {
    const companyId = req.user?.companyId || req.body.companyId;
    if (!companyId) {
      return res
        .status(400)
        .json({ success: false, message: 'companyId is required' });
    }

    const allowed = [
      'courierId',
      'courierCode',
      'courierName',
      'from_wareHouse',
      'recipientName',
      'toAddress',
      'toCity',
      'toPhone',
      'cod',
      'weightKg',
      'dimensions',
      'serviceLevel',
    ];

    const updates = {};
    for (const k of allowed) {
      if (req.body[k] !== undefined) updates[k] = req.body[k];
    }

    const doc = await IndexModel.Shipment.findOne({
      _id: req.params.id,
      companyId,
    });
    if (!doc)
      return res
        .status(404)
        .json({ success: false, message: 'Shipment not found' });

    Object.assign(doc, updates);
    pushHistory(doc, 'Updated', req);

    await doc.save();
    res.json({ success: true, data: doc });
  } catch (err) {
    next(err);
  }
};

/* ================== STATUS CHANGE (company-scoped) ================== */
// PATCH /api/shipments/:id/status
export const updateStatus = async (req, res, next) => {
  try {
    const companyId = req.user?.companyId || req.body.companyId;
    if (!companyId) {
      return res
        .status(400)
        .json({ success: false, message: 'companyId is required' });
    }

    const { rawStatus, normalized, description, location, ts } = req.body;

    if (!rawStatus && !normalized) {
      return res
        .status(400)
        .json({ success: false, message: 'Provide rawStatus or normalized' });
    }

    const doc = await IndexModel.Shipment.findOne({
      _id: req.params.id,
      companyId,
    });
    if (!doc)
      return res
        .status(404)
        .json({ success: false, message: 'Shipment not found' });

    const norm = normalized || mapRawToNormalized(rawStatus);
    const raw = rawStatus || norm.replaceAll('_', ' ');

    doc.statusRaw = raw;
    doc.statusNormalized = norm;

    doc.checkpoints.push({
      ts: ts ? new Date(ts) : new Date(),
      location,
      description: description || `Status updated to ${norm}`,
      rawStatus: raw,
      normalized: norm,
    });

    pushHistory(doc, 'StatusChanged', req);
    if (norm === 'CANCELLED') pushHistory(doc, 'Cancelled', req);

    await doc.save();
    res.json({ success: true, data: doc });
  } catch (err) {
    next(err);
  }
};

/* ================== ADD CHECKPOINT (company-scoped) ================== */
// POST /api/shipments/:id/checkpoints
export const addCheckpoint = async (req, res, next) => {
  try {
    const companyId = req.user?.companyId || req.body.companyId;
    if (!companyId) {
      return res
        .status(400)
        .json({ success: false, message: 'companyId is required' });
    }

    const { ts, location, description, rawStatus, normalized } = req.body;

    if (!rawStatus && !normalized) {
      return res
        .status(400)
        .json({ success: false, message: 'Provide rawStatus or normalized' });
    }

    const doc = await IndexModel.Shipment.findOne({
      _id: req.params.id,
      companyId,
    });
    if (!doc)
      return res
        .status(404)
        .json({ success: false, message: 'Shipment not found' });

    const norm = normalized || mapRawToNormalized(rawStatus);
    const raw = rawStatus || norm.replaceAll('_', ' ');

    doc.checkpoints.push({
      ts: ts ? new Date(ts) : new Date(),
      location,
      description,
      rawStatus: raw,
      normalized: norm,
    });

    // optionally mirror as current status
    doc.statusRaw = raw;
    doc.statusNormalized = norm;

    pushHistory(doc, 'Updated', req);
    await doc.save();

    res.json({ success: true, data: doc });
  } catch (err) {
    next(err);
  }
};

/* ================== CANCEL (company-scoped) ================== */
// PATCH /api/shipments/:id/cancel
export const cancelShipment = async (req, res, next) => {
  try {
    const companyId = req.user?.companyId || req.body.companyId;
    if (!companyId) {
      return res
        .status(400)
        .json({ success: false, message: 'companyId is required' });
    }

    const doc = await IndexModel.Shipment.findOne({
      _id: req.params.id,
      companyId,
    });
    if (!doc)
      return res
        .status(404)
        .json({ success: false, message: 'Shipment not found' });

    const norm = 'CANCELLED';
    const raw = 'Cancelled';

    doc.statusRaw = raw;
    doc.statusNormalized = norm;
    doc.checkpoints.push({
      ts: new Date(),
      description: 'Shipment cancelled',
      rawStatus: raw,
      normalized: norm,
    });

    pushHistory(doc, 'Cancelled', req);
    await doc.save();

    res.json({ success: true, data: doc });
  } catch (err) {
    next(err);
  }
};

/* ================== SOFT DELETE / RESTORE (company-scoped) ================== */
// PATCH /api/shipments/:id/soft-delete
export const softDeleteShipment = async (req, res, next) => {
  try {
    const companyId = req.user?.companyId || req.body.companyId;
    if (!companyId) {
      return res
        .status(400)
        .json({ success: false, message: 'companyId is required' });
    }

    const doc = await IndexModel.Shipment.findOne({
      _id: req.params.id,
      companyId,
    });
    if (!doc)
      return res
        .status(404)
        .json({ success: false, message: 'Shipment not found' });

    doc.deleted = true;
    doc.isActive = false;
    pushHistory(doc, 'Deleted', req);

    await doc.save();
    res.json({ success: true, data: doc });
  } catch (err) {
    next(err);
  }
};

// PATCH /api/shipments/:id/restore
export const restoreShipment = async (req, res, next) => {
  try {
    const companyId = req.user?.companyId || req.body.companyId;
    if (!companyId) {
      return res
        .status(400)
        .json({ success: false, message: 'companyId is required' });
    }

    const doc = await IndexModel.Shipment.findOne({
      _id: req.params.id,
      companyId,
    });
    if (!doc)
      return res
        .status(404)
        .json({ success: false, message: 'Shipment not found' });

    doc.deleted = false;
    doc.isActive = true;
    pushHistory(doc, 'Updated', req);

    await doc.save();
    res.json({ success: true, data: doc });
  } catch (err) {
    next(err);
  }
};

export default {
  createShipment,
  listShipments,
  getShipmentById,
  getShipmentByAwb,
  updateShipment,
  updateStatus,
  addCheckpoint,
  cancelShipment,
  softDeleteShipment,
  restoreShipment,
};
