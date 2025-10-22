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

    // 1️⃣ Find the company
    const company = await IndexModel.Company.findOne({
      companyId: req.user.companyId,
      deleted: false,
      isActive: true,
    });

    if (!company) {
      return res.status(404).json({ message: "Company not found" });
    }

    // 2️⃣ Remove only plans that are "not started"
    const beforeCount = company.plan.length;

    company.plan = company.plan.filter((p) => {
      const isTarget =
      (p.id.toString() === changingPlanId ||
      p.id.toString() === newPlanId) &&
      p.status === "not started";
      return !isTarget; // keep everything else
      });
      
    const removedCount = beforeCount - company.plan.length;

    // 3️⃣ Fetch new plan from Plan collection (ignore isActive)
    const newPlan = await IndexModel.Plan.findOne({
      _id: newPlanId,
      deleted: false,
      isActive: true,
    });

    if (!newPlan) {
      return res.status(404).json({ message: "New plan not found" });
    }

    // 4️⃣ Add new plan only if it’s different
    // const isAlreadyExist = company.plan.some(
    //   (p) =>
    //     p.id.toString() === newPlan._id.toString() &&
    //     p.status !== "not started"
    // );

    // if (!isAlreadyExist) {
      const newPlanObj = newPlan.toObject();
      // delete newPlanObj._id; // prevent duplicate key issue

      company.plan.push({
        ...newPlanObj,
        isActive: newPlan.price === 0,
        status: "not started",
        planId: await generatePlanId(req.user.companyId, req.user.userId),
      });
    // }

      // console.log("thje company.plan: ", company)

    // 5️⃣ Save company
    await company.save();

    // 6️⃣ Respond success
    return res.status(200).json({
      success: true,
      message:
        removedCount > 0
          ? `Removed ${removedCount} 'not started' plan(s) and added new plan successfully`
          : "Plan changed successfully",
      updatedPlans: company.plan,
    });
  } catch (error) {
    console.error("Error changing plan:", error);
    return res.status(400).json({
      success: false,
      message: "Error changing plan",
      error: error.message,
    });
  }
};

export default { createPlan, updatePlan, deletePlan, getAllPlans, changePlan };
