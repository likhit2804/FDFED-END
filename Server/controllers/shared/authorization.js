const handleForbidden = (req, res, redirectPath) => {
    const isApi = req.originalUrl.includes('/api') || 
                  req.headers.accept?.includes('application/json') ||
                  req.headers.authorization?.startsWith('Bearer');
                  
    if (isApi) {
        return res.status(403).json({ success: false, message: "Forbidden: You do not have permission to access this resource." });
    }
    return res.redirect(redirectPath);
};

// Factory to build single-role authorizers (keeps existing behaviour, case-insensitive)
const buildAuthorize = (requiredUserType, redirectPath) => {
    return (req, res, next) => {
        const currentUserType = String(req.user?.userType || req.user?.role || "").toLowerCase();
        const targetUserType = String(requiredUserType || "").toLowerCase();
        if (currentUserType !== targetUserType) {
            return handleForbidden(req, res, redirectPath);
        }
        next();
    };
};

// Existing specific middlewares (backwards-compatible)
const authorizeR = buildAuthorize("Resident", "/login");
const authorizeS = buildAuthorize("Security", "/login");
const authorizeW = buildAuthorize("Worker", "/login");
const authorizeC = buildAuthorize("CommunityManager", "/login");
const authorizeA = buildAuthorize("admin", "/AdminLogin");

// New: generic role-based authorizer for specific routes
const authorizeRoles = (roles, redirectPath = "/login") => {
    const allowed = (Array.isArray(roles) ? roles : [roles]).map(r => String(r).toLowerCase());

    return (req, res, next) => {
        const currentUserType = String(req.user?.userType || req.user?.role || "").toLowerCase();

        if (!currentUserType || !allowed.includes(currentUserType)) {
            return handleForbidden(req, res, redirectPath);
        }

        next();
    };
};

export { authorizeR, authorizeS, authorizeW, authorizeC, authorizeA, authorizeRoles };