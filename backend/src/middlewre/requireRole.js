export default function requireRole(...allowedRoles) {
  return (req, res, next) => {
    const userRoles = req.user?.roles || [];
    const permitted = userRoles.some((r) => allowedRoles.includes(r));

    if (!permitted) {
      return res.status(403).json({
        status: "FORBIDDEN",
        message: "You do not have permission to perform this action",
      });
    }
    next();
  };
}