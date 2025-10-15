import IndexModel from "../models/indexModel.js";
import {generatePlanId} from "../utils/generatePlanIdPurchased.js"

const createPlan = async (req, res, next) => {
  try {
    // Check if user is Admin
    if (!req.user || req.user.role !== "superAdmin") {
      res.status(403);
      throw new Error("Not authorized, admin access required");
    }
    const { name, description, price, limitations, validateDays } = req.body;

    const planExists = await IndexModel.Plan.findOne({ name, deleted: false });
    if (planExists) {
      res.status(400);
      throw new Error("Plan with this name already exists");
    }

    const plan = await IndexModel.Plan.create({
      name,
      description,
      price,
      limitations,
      validateDays,
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
    // Check if user is Admin
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
    // Check if user is Admin
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


const changePlan = async (req, res) => {
  try {
    const { changingPlanId, newPlanId } = req.body;

    // Find current company
    const company = await IndexModel.Company.findOne({
      companyId: req.user.companyId,
      deleted: false,
      isActive: true,
    });

    if (!company) {
      return res.status(404).json({ message: "Company not found" });
    }

    // Find the currently active plan
    const currentPlan = company.plan.find(
      (p) => p._id.toString() === changingPlanId && p.isActive === false && p.status === "not started"
    );

    if (!currentPlan) {
      res.status(200).json({
      success: true,
      message: "Plan changed successfully",
      updatedPlans: company.plan,
    });
    }

    // Find the new plan from Plan collection
    const newPlan = await IndexModel.Plan.findOne({
      _id: newPlanId,
      deleted: false,
      isActive: true,
    });

    if (!newPlan) {
      return res.status(404).json({ message: "New plan not found" });
    }

    // Only replace if they are different plans
    if (newPlan._id.toString() !== currentPlan._id.toString()) {
      // Remove the current plan from company's plan array
      company.plan = company.plan.filter(
        (p) => p._id.toString() !== currentPlan._id.toString()
      );

      // Add the new plan (copy full details)
      company.plan.push({
        ...newPlan.toObject(),
        isActive: newPlan.price === 0,
        status: "not started",
        planId: await generatePlanId(req.user.companyId, req.user.userId),
      });
    }

    await company.save();

    res.status(200).json({
      success: true,
      message: "Plan changed successfully",
      updatedPlans: company.plan,
    });
  } catch (error) {
    res.status(400).json({
      success: false,
      message: "Error changing plan",
      error: error.message,
    });
  }
};


export default { createPlan, updatePlan, deletePlan, getAllPlans, changePlan };
