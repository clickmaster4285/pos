// controllers/courier.controller.js
import IndexModel from '../models/indexModel.js';
import {
  encryptSecret,
  decryptSecret,
  maskCredentials,
  pingCourier,
} from '../utils/courierCredientials.js';

const SECRET_KEYS = new Set(['password', 'clientSecret', 'apiKey']);
/* ------------ tiny helpers ------------ */
function actorFromReq(req) {
  return req?.user?.userId || req?.user?.id || req?.user?.email || 'system';
}

function requireCompanyId(req, res) {
  const companyId =
    req.user?.companyId || req.query?.companyId || req.body?.companyId;
  if (!companyId) {
    res.status(400).json({ success: false, message: 'companyId is required' });
    return null;
  }
  return companyId;
}

function scrubSecrets(doc) {
  if (!doc) return doc;
  const ret =
    typeof doc.toJSON === 'function'
      ? doc.toJSON()
      : JSON.parse(JSON.stringify(doc));
  if (ret.credentials) {
    delete ret.credentials.clientSecret;
    delete ret.credentials.apiKey;
    delete ret.credentials.password;
  }
  return ret;
}

export function normalizeCode(input = '') {
  const s = String(input)
    .trim()
    .toUpperCase()
    .replace(/[^A-Z0-9-]/g, '');
  return s.slice(0, 20) || null;
}

export function codeFromName(name = '') {
  // take letters/numbers from name, collapse spaces, keep dashes, cap length
  const base = String(name)
    .trim()
    .toUpperCase()
    .replace(/[^A-Z0-9-]+/g, '-') // spaces/punct -> hyphen
    .replace(/-+/g, '-') // collapse multiple
    .replace(/^-|-$/g, '') // trim hyphens
    .slice(0, 12);

  return base || 'COURIER';
}
function fitWithSuffix(base, suffix, maxLen = 20) {
  const sfx = `-${suffix}`;
  const room = maxLen - sfx.length;
  const trimmed = base.slice(0, Math.max(1, room));
  return `${trimmed}${sfx}`;
}

async function nextAvailableCode({
  model,
  companyId,
  environment,
  baseCode,
  maxLen = 20,
}) {
  // Find ALL codes (active or deleted) that collide with base: TCS, TCS-1, TCS-2, ...
  const rx = new RegExp(`^${baseCode}(?:-(\\d+))?$`, 'i');
  const existing = await model
    .find(
      {
        companyId,
        environment,
        code: { $regex: `^${baseCode}(-\\d+)?$`, $options: 'i' },
      },
      { code: 1 }
    )
    .lean();

  if (!existing?.length) return baseCode.slice(0, maxLen);

  const codes = new Set(existing.map((d) => String(d.code).toUpperCase()));
  if (!codes.has(baseCode)) return baseCode.slice(0, maxLen);

  // base is taken—choose next integer suffix
  let maxSeen = 0;
  for (const c of codes) {
    const m = c.match(rx);
    if (m && m[1]) maxSeen = Math.max(maxSeen, Number(m[1]));
  }
  return fitWithSuffix(baseCode, maxSeen + 1, maxLen);
}

/* ------------ CRUD ------------ */

// POST /api/couriers
export async function createCourier(req, res) {
  try {
    const companyId = req.user?.companyId || req.body.companyId;
    if (!companyId)
      return res.status(400).json({ error: 'companyId is required' });

    const actor = actorFromReq(req);
    const {
      name,
      environment = 'Sandbox',
      supportsCOD = true,
      maxWeightKg = 30,
      domesticOnly = false,
      priority = 100,
      code: codeFromClient, // optional
      reviveIfDeleted = false, // <-- default FALSE now
    } = req.body || {};

    if (!name) return res.status(400).json({ error: 'name is required' });

    const baseCode =
      normalizeCode(codeFromClient) ||
      normalizeCode(codeFromName(name)) ||
      'COURIER';

    // Check if an exact code exists (active or deleted)
    const existing = await IndexModel.Courier.findOne({
      companyId,
      environment,
      code: baseCode,
    });

    // If an exact match exists AND is soft-deleted, either revive (opt-in) or create a suffixed code
    if (existing && existing.deleted) {
      if (reviveIfDeleted) {
        existing.set({
          deleted: false,
          isActive: true,
          status: 'Not Connected',
          name: String(name).trim(),
          supportsCOD: !!supportsCOD,
          maxWeightKg,
          domesticOnly: !!domesticOnly,
          priority,
        });
        existing.history.push({
          action: 'Updated', // or 'Restored'
          performedBy: actor,
          createdAt: new Date(),
        });
        await existing.save();

        const json = scrubSecrets(existing);
        return res.status(200).json({ revived: true, data: json });
      }
      // else fall through to suffixing across *all* docs (deleted included)
    }

    // If an active one exists with the same base code, or a deleted one exists and we don't want to revive,
    // choose next available code across ALL documents (so we don't reuse codes of deleted docs).
    const finalCode = await nextAvailableCode({
      model: IndexModel.Courier,
      companyId,
      environment,
      baseCode,
      maxLen: 20,
    });

    const courier = await IndexModel.Courier.create({
      companyId,
      code: finalCode,
      name: String(name).trim(),
      environment,
      supportsCOD: !!supportsCOD,
      maxWeightKg,
      domesticOnly: !!domesticOnly,
      priority,
      createdBy: actor,
      history: [
        { action: 'Created', performedBy: actor, createdAt: new Date() },
      ],
    });

    const json = scrubSecrets(courier);
    return res.status(201).json({ data: json });
  } catch (err) {
    if (err?.code === 11000) {
      return res.status(409).json({
        error: 'Courier already exists for this company & environment',
      });
    }
    return res
      .status(500)
      .json({ error: err.message || 'Failed to create courier' });
  }
}

// GET /api/couriers
export async function listCouriers(req, res) {
  try {
    const companyId = requireCompanyId(req, res);
    if (!companyId) return;

    const {
      q,
      environment,
      status,
      includeDeleted,
      page = 1,
      limit = 20,
      sort = '-createdAt',
    } = req.query;

    const filter = { companyId };
    if (!includeDeleted) filter.deleted = false;
    if (environment) filter.environment = environment;
    if (status) filter.status = status;
    if (q) {
      filter.$or = [{ code: new RegExp(q, 'i') }, { name: new RegExp(q, 'i') }];
    }

    const pg = Math.max(parseInt(page, 10) || 1, 1);
    const lim = Math.min(Math.max(parseInt(limit, 10) || 20, 1), 100);

    const [items, total] = await Promise.all([
      IndexModel.Courier.find(filter)
        .sort(sort)
        .skip((pg - 1) * lim)
        .limit(lim)
        .lean(),
      IndexModel.Courier.countDocuments(filter),
    ]);

    res.json({
      success: true,
      data: items.map(scrubSecrets),
      pagination: {
        page: pg,
        limit: lim,
        total,
        pages: Math.ceil(total / lim),
      },
    });
  } catch (err) {
    res.status(500).json({
      success: false,
      message: err.message || 'Failed to list couriers',
    });
  }
}

// GET /api/couriers/:id
export async function getCourier(req, res) {
  try {
    const companyId = requireCompanyId(req, res);
    if (!companyId) return;

    const { id } = req.params;
    const doc = await IndexModel.Courier.findOne({
      _id: id,
      companyId,
      deleted: { $ne: true },
    });
    if (!doc)
      return res
        .status(404)
        .json({ success: false, message: 'Courier not found' });

    res.json({ success: true, data: scrubSecrets(doc) });
  } catch (err) {
    res.status(500).json({
      success: false,
      message: err.message || 'Failed to get courier',
    });
  }
}

// PATCH /api/couriers/:id
export async function updateCourier(req, res) {
  try {
    const companyId = requireCompanyId(req, res);
    if (!companyId) return;

    const { id } = req.params;
    const actor = actorFromReq(req);

    const {
      name,
      environment,
      supportsCOD,
      maxWeightKg,
      domesticOnly,
      priority,
      status,
      isActive,
      deleted, // ignore direct set
    } = req.body || {};

    const set = {};
    if (name !== undefined) set.name = name;
    if (environment !== undefined) set.environment = environment;
    if (supportsCOD !== undefined) set.supportsCOD = !!supportsCOD;
    if (maxWeightKg !== undefined) set.maxWeightKg = maxWeightKg;
    if (domesticOnly !== undefined) set.domesticOnly = !!domesticOnly;
    if (priority !== undefined) set.priority = priority;
    if (status !== undefined) set.status = status;
    if (isActive !== undefined) set.isActive = !!isActive;

    const update = {
      $set: set,
      $push: {
        history: {
          action: 'Updated',
          performedBy: actor,
          createdAt: new Date(),
        },
      },
    };

    const doc = await IndexModel.Courier.findOneAndUpdate(
      { _id: id, companyId, deleted: false },
      update,
      { new: true }
    );

    if (!doc)
      return res
        .status(404)
        .json({ success: false, message: 'Courier not found' });

    res.json({ success: true, data: scrubSecrets(doc) });
  } catch (err) {
    if (err?.code === 11000) {
      return res.status(409).json({
        success: false,
        message:
          'Courier with this code & environment already exists in this company',
      });
    }
    res.status(500).json({
      success: false,
      message: err.message || 'Failed to update courier',
    });
  }
}
//-----------------------------
// PATCH /api/couriers/:id/credentials
export async function updateCredentials(req, res) {
  const companyId = req.user?.companyId || req.body.companyId;
  if (!companyId)
    return res.status(400).json({ error: 'companyId is required' });

  const { id } = req.params;
  const doc = await IndexModel.Courier.findOne({ _id: id, companyId });
  if (!doc) return res.status(404).json({ error: 'Courier not found' });

  const patch = req.body || {};
  const nextCreds = { ...(doc.credentials || {}) };

  for (const [k, v] of Object.entries(patch)) {
    if (v == null || v === '') continue;
    nextCreds[k] = SECRET_KEYS.has(k) ? encryptSecret(v) : v;
  }
  nextCreds.updatedAt = new Date();
  nextCreds.setBy = req.user?.id || req.user?._id || 'system';

  doc.credentials = nextCreds;
  doc.history.push({
    action: 'Updated',
    performedBy: nextCreds.setBy,
    createdAt: nextCreds.updatedAt,
  });
  await doc.save();

  return res.json({
    success: true,
    data: { credentials: maskCredentials(doc.credentials) },
  });
}

//credientials-summary
export async function getCourierCredentialsSummary(req, res) {
  const companyId = req.user?.companyId || req.query.companyId;
  if (!companyId)
    return res.status(400).json({ error: 'companyId is required' });

  const { id } = req.params;
  const doc = await IndexModel.Courier.findOne({ _id: id, companyId }).lean();
  if (!doc) return res.status(404).json({ error: 'Courier not found' });

  return res.json({
    success: true,
    data: { credentials: maskCredentials(doc.credentials) },
  });
}
// POST /api/couriers/:id/auth-test

export const authTestCourier = async (req, res) => {
  try {
    const companyId = req.user?.companyId || req.body.companyId;
    if (!companyId)
      return res
        .status(400)
        .json({ success: false, message: 'companyId is required' });

    const { id } = req.params;
    const doc = await IndexModel.Courier.findOne({ _id: id, companyId });

    if (!doc)
      return res
        .status(404)
        .json({ success: false, message: 'Courier not found' });

    // ✅ Check if credentials exist
    if (!doc.credentials || Object.keys(doc.credentials).length === 0) {
      return res.status(422).json({
        success: false,
        message: 'Missing courier credentials. Please add credentials first.',
      });
    }

    // ping the courier API
    const result = await pingCourier(doc);

    const newStatus = result.ok ? 'Not Connected' : 'Connected';
    doc.status = newStatus;

    doc.history.push({
      action: 'AuthTest',
      performedBy: req.user?.id || 'system',
      createdAt: new Date(),
    });

    await doc.save();

    res.json({
      success: result.ok,
      message: result.message || 'Auth test complete',
      data: { id, status: newStatus },
    });
  } catch (err) {
    res.status(500).json({
      success: false,
      message: err.message || 'Failed to test courier authentication',
    });
  }
};


// DELETE /api/couriers/:id  (soft delete)
export async function deleteCourier(req, res) {
  try {
    const companyId = requireCompanyId(req, res);
    if (!companyId) return;

    const { id } = req.params;
    const actor = actorFromReq(req);

    const doc = await IndexModel.Courier.findOneAndUpdate(
      { _id: id, companyId, deleted: false },
      {
        $set: { deleted: true, isActive: false, status: 'Not Connected' },
        $push: {
          history: {
            action: 'Deleted',
            performedBy: actor,
            createdAt: new Date(),
          },
        },
      },
      { new: true }
    );

    if (!doc)
      return res
        .status(404)
        .json({ success: false, message: 'Courier not found' });
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({
      success: false,
      message: err.message || 'Failed to delete courier',
    });
  }
}

export default {
  listCouriers,
  getCourier,
  createCourier,
  updateCourier,
  updateCredentials,
  authTestCourier,
  deleteCourier,
};
