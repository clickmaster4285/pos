import jwt from 'jsonwebtoken';
import mongoose from 'mongoose';
import IndexModel from '../models/indexModel.js';

/* ---------------- helpers ---------------- */

function getActor(req) {
  if (req.user) {
    return {
      userId: req.user.userId || String(req.user._id || ''),
      companyId: req.user.companyId || null,
      role: String(req.user.role || '').toLowerCase() || null,
      email: req.user.email || null,
      name: req.user.name || req.user.fullName || null,
    };
  }
  try {
    const raw = req.headers.authorization || '';
    const token = raw.startsWith('Bearer ') ? raw.slice(7) : null;
    if (!token) return {};
    const d = jwt.verify(token, process.env.JWT_SECRET) || {};
    return {
      userId: d.userId || d.id || d.uid || null,
      companyId: d.companyId || d.company || null,
      role: (d.role || '').toLowerCase() || null,
      email: d.email || null,
      name: d.name || d.fullName || null,
    };
  } catch {
    return {};
  }
}

function normalizeCompanyIdValue(companyId) {
  return mongoose.isValidObjectId(companyId)
    ? new mongoose.Types.ObjectId(companyId)
    : companyId;
}

async function resolveCompanyId(req, actor) {
  const tokenCompanyId = actor.companyId || null;
  const paramCompanyId = (req.params?.companyId || '').trim();
  const queryCompanyId = (req.query?.companyId || '').trim();
  const headerCompanyId = String(req.headers['x-company-id'] || '').trim();
  const explicit = paramCompanyId || queryCompanyId || headerCompanyId;

  const isPriv = actor.role === 'superadmin' || actor.role === 'admin';
  if (isPriv && explicit) return explicit;
  if (tokenCompanyId) return tokenCompanyId;

  const candidate = explicit;
  if (!candidate) return null;
  if (!actor.userId) return null;

  const orConds = [];
  if (actor.userId) orConds.push({ userId: actor.userId });
  if (mongoose.isValidObjectId(actor.userId)) {
    orConds.push({ _id: new mongoose.Types.ObjectId(actor.userId) });
  }
  if (orConds.length === 0) return null;

  const user = await IndexModel.User.findOne({
    companyId: candidate,
    $or: orConds,
  })
    .select('_id companyId')
    .lean();

  return user?.companyId || null;
}

function getModelsWithHistory() {
  return Object.entries(IndexModel)
    .filter(([_, Model]) => Model?.schema?.paths?.history)
    .map(([key, Model]) => ({ key: key.toLowerCase(), Model }));
}

/* ---------- entity name helpers (NEW) ---------- */

// which fields to fetch and how to derive a label per entity
const ENTITY_NAME_CONFIG = {
  vendor: { select: 'name', pick: (r) => r?.name },
  bill: { select: 'billNumber', pick: (r) => r?.billNumber },
  order: { select: 'orderNumber', pick: (r) => r?.orderNumber },
  inventory: { select: 'itemName', pick: (r) => r?.itemName },
  company: { select: 'name', pick: (r) => r?.name },
  user: {
    select: 'name email userId',
    pick: (r) => r?.name || r?.email || r?.userId,
  },
  staff: {
    select: 'name email userId',
    pick: (r) => r?.name || r?.email || r?.userId,
  },
  // fallback for any other model that still has history
  default: { select: 'name title', pick: (r) => r?.name || r?.title || null },
};

function getEntityNameSelect(key) {
  const cfg = ENTITY_NAME_CONFIG[key] || ENTITY_NAME_CONFIG.default;
  return cfg.select;
}
function pickEntityName(key, record) {
  const cfg = ENTITY_NAME_CONFIG[key] || ENTITY_NAME_CONFIG.default;
  return cfg.pick(record) || null;
}

/* ---------- action helpers ---------- */

function normalizeActionType(txt = '') {
  const t = String(txt).toLowerCase();
  if (t.includes('permission')) return 'permission_changed';
  if (t.includes('deleted') || t.includes('removed') || t.includes('archiv'))
    return 'deleted';
  if (t.includes('created') || t.startsWith('created')) return 'created';
  return 'updated';
}
function isCreateAction(txt = '') {
  return normalizeActionType(txt) === 'created';
}

function isCompanyEchoAction(txt = '') {
  const t = String(txt).toLowerCase();
  return (
    t.includes('vendor created') ||
    t.includes('inventory created') ||
    (t.includes('employee ') && t.includes(' added to staff')) ||
    t.includes('order created') ||
    t.includes('bill created')
  );
}
function isInventoryOrderAdjustment(txt = '') {
  return /^order\s+[a-z0-9-]+:/.test(String(txt).toLowerCase());
}

function eventKey(e) {
  const actionType = normalizeActionType(e.action);
  const ts = e.at ? new Date(e.at).getTime() : 0;
  const bucket = Math.floor(ts / 1000);
  return `${e.entity}|${e.entityId}|${actionType}|${
    e.performedBy || ''
  }|${bucket}`;
}

/* ---------- history normalizer (updated to include entityName) ---------- */
function normalizeHistory(entity, record, historyItem) {
  return {
    source: 'history',
    entity,
    entityId: record._id,
    entityName: pickEntityName(entity, record), // ← populated here
    action: historyItem?.action || 'unknown',
    performedBy: historyItem?.performedBy || null,
    at: historyItem?.createdAt || record?.createdAt,
    createdBy: record?.createdBy || null,
    isDeleted: historyItem?.deleted || record?.deleted || false,
  };
}

async function resolvePlatformUserId(input) {
  if (!input) return null;
  if (!mongoose.isValidObjectId(input)) return String(input);
  const oid = new mongoose.Types.ObjectId(input);

  const user = await IndexModel.User.findOne({ _id: oid })
    .select('userId')
    .lean();
  if (user?.userId) return user.userId;

  const StaffModel = IndexModel.Staff || IndexModel.User;
  if (StaffModel) {
    const staff = await StaffModel.findOne({ _id: oid })
      .select('userId')
      .lean();
    if (staff?.userId) return staff.userId;
  }
  return String(input);
}

/* ------------- collector (with filters + dedupe) ------------- */

async function collectActivities({ companyId, filterUserId = null }) {
  const models = getModelsWithHistory();
  const cid = normalizeCompanyIdValue(companyId);

  const seen = new Map();
  const pushOnce = (ev) => {
    const k = eventKey(ev);
    const existing = seen.get(k);
    if (!existing) {
      seen.set(k, ev);
      return;
    }
    if (existing.source === 'synthetic' && ev.source === 'history') {
      seen.set(k, ev);
    }
  };

  for (const { key, Model } of models) {
    const baseQuery = { companyId: cid };
    if (filterUserId) {
      baseQuery.$or = [
        { createdBy: filterUserId },
        { 'history.performedBy': filterUserId },
      ];
    }

    // 🔑 select entity-specific label fields too
    const extra = getEntityNameSelect(key);
    const selectStr = `_id companyId createdBy createdAt deleted history ${extra}`;

    const records = await Model.find(baseQuery).select(selectStr).lean();

    for (const record of records) {
      // 1) history items
      if (Array.isArray(record.history)) {
        for (const item of record.history) {
          if (key === 'company' && isCompanyEchoAction(item?.action)) continue;
          if (key === 'inventory' && isInventoryOrderAdjustment(item?.action))
            continue;
          if (filterUserId && item?.performedBy !== filterUserId) continue;

          pushOnce(normalizeHistory(key, record, item));
        }
      }

      // 2) synthetic "created" if not present in history
      const hasCreateInHistory =
        Array.isArray(record.history) &&
        record.history.some((h) => isCreateAction(h?.action));
      const createdByMatches = filterUserId
        ? record.createdBy === filterUserId
        : true;

      if (
        !hasCreateInHistory &&
        record.createdBy &&
        record.createdAt &&
        createdByMatches
      ) {
        pushOnce({
          source: 'synthetic',
          entity: key,
          entityId: record._id,
          entityName: pickEntityName(key, record), // ← also set here
          action: 'created',
          performedBy: record.createdBy,
          at: record.createdAt,
          createdBy: record.createdBy,
          isDeleted: record.deleted || false,
        });
      }
    }
  }

  return Array.from(seen.values()).sort(
    (a, b) => new Date(b.at) - new Date(a.at)
  );
}

/* ---------------- handlers ---------------- */

async function getAllActivity(req, res) {
  try {
    const actor = getActor(req);
    const companyId = await resolveCompanyId(req, actor);
    if (!companyId) {
      return res
        .status(401)
        .json({ success: false, message: 'Missing or invalid companyId' });
    }

    const allActivities = await collectActivities({ companyId });
    res.json({
      success: true,
      count: allActivities.length,
      data: allActivities,
    });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
}

async function getUserActivity(req, res) {
  try {
    const actor = getActor(req);
    const companyId = await resolveCompanyId(req, actor);
    const rawParam = req.params.userId;

    if (!companyId) {
      return res
        .status(401)
        .json({ success: false, message: 'Missing or invalid companyId' });
    }
    if (!rawParam) {
      return res
        .status(400)
        .json({ success: false, message: 'userId param required' });
    }

    const platformUserId = await resolvePlatformUserId(rawParam);
    const userActivities = await collectActivities({
      companyId,
      filterUserId: platformUserId,
    });

    res.json({
      success: true,
      count: userActivities.length,
      data: userActivities,
    });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
}

export default { getAllActivity, getUserActivity };
