const User = require('../models/User');

// Track user activity and time on site.
// Throttled to one write per minute per user; time is credited from the gap since the
// last activity (gaps over 10 minutes count as a new visit and add nothing).
exports.trackActivity = async (req, res, next) => {
  if (req.user) {
    try {
      const now = Date.now();
      const last = req.user.lastActivity ? new Date(req.user.lastActivity).getTime() : 0;
      if (now - last >= 60 * 1000) {
        const gap = now - last;
        const credit = last && gap < 10 * 60 * 1000 ? Math.round(gap / 1000) : 0;
        await User.updateOne(
          { _id: req.user._id },
          { $set: { lastActivity: new Date(now), isOnline: Boolean(req.user.currentSessionStart) || req.user.isOnline }, $inc: { totalTimeOnSite: credit } }
        );
      }
    } catch (error) {
      console.error('Activity tracking error:', error);
    }
  }
  next();
};

// Track login
exports.trackLogin = async (userId, ipAddress, userAgent) => {
  try {
    const user = await User.findById(userId);
    if (user) {
      await user.addLoginSession(ipAddress, userAgent);
    }
  } catch (error) {
    console.error('Login tracking error:', error);
  }
};

// Track logout
exports.trackLogout = async (userId) => {
  try {
    const user = await User.findById(userId);
    if (user) {
      await user.endSession();
    }
  } catch (error) {
    console.error('Logout tracking error:', error);
  }
};

