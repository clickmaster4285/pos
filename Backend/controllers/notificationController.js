// controllers/notificationController.js
import IndexModel from '../models/indexModel.js';

const getNotifications = async (req, res) => {
  try {
    const { companyId, userId } = req.user;
    const { page = 1, limit = 20 } = req.query;

    const pageNum = parseInt(page, 10) || 1;
    const limitNum = parseInt(limit, 10) || 20;
    const skip = (pageNum - 1) * limitNum;

    const filter = {
      companyId,
      // user-specific + global for company (userId null)
      $or: [{ userId }, { userId: null }],
    };

    const [items, total] = await Promise.all([
      IndexModel.Notification.find(filter)
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limitNum)
        .lean(),
      IndexModel.Notification.countDocuments(filter),
    ]);

    res.json({
      success: true,
      data: items,
      pagination: {
        page: pageNum,
        total,
        totalPages: Math.ceil(total / limitNum),
      },
    });
  } catch (err) {
    console.error('Error fetching notifications:', err);
    res
      .status(500)
      .json({ success: false, message: 'Error fetching notifications' });
  }
};

const markNotificationRead = async (req, res) => {
  try {
    const { companyId, userId } = req.user;
    const { id } = req.params;

    const updated = await IndexModel.Notification.findOneAndUpdate(
      { _id: id, companyId, $or: [{ userId }, { userId: null }] },
      { isRead: true },
      { new: true }
    );

    if (!updated) {
      return res
        .status(404)
        .json({ success: false, message: 'Notification not found' });
    }

    res.json({ success: true, data: updated });
  } catch (err) {
    console.error('Error updating notification:', err);
    res
      .status(500)
      .json({ success: false, message: 'Error updating notification' });
  }
};

export default {
  getNotifications,
  markNotificationRead,
};
