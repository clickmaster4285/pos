import IndexModel from "../models/indexModel.js";

const createPlan = async (req, res, next) => {
  try {
    if (!req.user || req.user.role !== "superAdmin") {
      res.status(403);
      throw new Error("Not authorized, admin access required");
    }
    const {
      name,
      description,
      price,
      limitations,
      validateDays,
      currencyCode,
    } = req.body;

    const planExists = await IndexModel.Plan.findOne({ name, deleted: false });
    if (planExists) {
      res.status(400);
      throw new Error("Plan with this name already exists");
    }

    const plan = await IndexModel.Plan.create({
      name,
      description,
      price: price || 0,
      limitations,
      validateDays,
      currencyCode,
      createdBy: req.user.userId,
      isActive: true,
    });

    res.status(201).json({
      success: true,
      data: plan,
    });
  } catch (error) {
    next(error);
  }
};

const updatePlan = async (req, res, next) => {
  try {
    const { id } = req.params;
    if (!req.user || req.user.role !== "superAdmin") {
      res.status(403);
      throw new Error("Not authorized, admin access required");
    }

    const plan = await IndexModel.Plan.findOne({ _id: id, deleted: false });

    if (!plan) {
      res.status(404);
      throw new Error("Plan not found");
    }

    const updatedPlan = await IndexModel.Plan.findByIdAndUpdate(
      id,
      { ...req.body, updatedAt: Date.now() },
      {
        new: true,
        runValidators: true,
      }
    );

    res.status(200).json({
      success: true,
      data: updatedPlan,
    });
  } catch (error) {
    next(error);
  }
};

const deletePlan = async (req, res, next) => {
  try {
    if (!req.user || req.user.role !== "superAdmin") {
      res.status(403);
      throw new Error("Not authorized, superAdmin access required");
    }

    const plan = await IndexModel.Plan.findById(req.params.id);

    if (!plan) {
      res.status(404);
      throw new Error("Plan not found");
    }

    await IndexModel.Plan.findByIdAndUpdate(
      req.params.id,
      { deleted: true, isActive: false, updatedAt: Date.now() },
      { new: true }
    );

    res.status(200).json({
      success: true,
      message: "Plan deleted successfully",
    });
  } catch (error) {
    next(error);
  }
};
// GET ALL PLANS
const getAllPlans = async (req, res) => {
  try {
    const plans = await IndexModel.Plan.find({
      deleted: false,
      isActive: true,
    });

    res.status(200).json(plans);
  } catch (error) {
    res
      .status(400)
      .json({ message: "Error fetching plans", error: error.message });
  }
};

// GET ALL PLANS
const getAllPlansforUser = async (req, res) => {
  try {
    const { companyId } = req.user;

    // find the company
    const company = await IndexModel.Company.findOne({ companyId });
    if (!company) {
      return res.status(404).json({ message: "Company not found" });
    }

    // check if company already has a free plan
    const hasFreePlan = company.plan?.some((plan) => plan.price === 0);

    // base filter
    const filter = { deleted: false, isActive: true };

    // if company already has free plan, exclude free plans from the list
    if (hasFreePlan) {
      filter.price = { $ne: 0 };
    }

    const plans = await IndexModel.Plan.find(filter);

    res.status(200).json(plans);
  } catch (error) {
    res
      .status(400)
      .json({ message: "Error fetching plans", error: error.message });
  }
};

export default {
  createPlan,
  updatePlan,
  deletePlan,
  getAllPlans,
  getAllPlansforUser,
};
