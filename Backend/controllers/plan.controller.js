import IndexModel from '../models/indexModel.js';

const createPlan = async (req, res, next) => {
  console.log('thje console of reeq, body is:');
  try {
    // Check if user is Admin
    if (!req.user || req.user.role !== 'superAdmin') {
      res.status(403);
      throw new Error('Not authorized, admin access required');
    }
    const { name, description, price, limitations, validateDays } = req.body;

    const planExists = await IndexModel.Plan.findOne({ name, deleted: false });
    if (planExists) {
      res.status(400);
      throw new Error('Plan with this name already exists');
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
    if (!req.user || req.user.role !== 'superAdmin') {
      res.status(403);
      throw new Error('Not authorized, admin access required');
    }

    const plan = await IndexModel.Plan.findOne({ _id: id, deleted: false });

    if (!plan) {
      res.status(404);
      throw new Error('Plan not found');
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
    if (!req.user || req.user.role !== 'superAdmin') {
      res.status(403);
      throw new Error('Not authorized, superAdmin access required');
    }

    const plan = await IndexModel.Plan.findById(req.params.id);

    if (!plan) {
      res.status(404);
      throw new Error('Plan not found');
    }

    await IndexModel.Plan.findByIdAndUpdate(
      req.params.id,
      { deleted: true, isActive: false, updatedAt: Date.now() },
      { new: true }
    );

    res.status(200).json({
      success: true,
      message: 'Plan deleted successfully',
    });
  } catch (error) {
    next(error);
  }
};

// GET ALL PLANS
const getAllPlans = async (req, res) => {
  try {
    const plans = await IndexModel.Plan.find({deleted: false, isActive: true });

    res.status(200).json(plans);
  } catch (error) {
    res
      .status(400)
      .json({ message: 'Error fetching plans', error: error.message });
  }
};

export default { createPlan, updatePlan, deletePlan, getAllPlans };
