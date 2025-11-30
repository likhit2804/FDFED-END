const authorizeR = (req, res, next) => {
    if (req.user?.userType !== "Resident") {
        if (req.originalUrl.startsWith('/api') || req.headers.accept?.includes('application/json')) {
            return res.status(403).json({ message: "Forbidden" });
        }
        return res.redirect("/login");
    }
    next();
};

const authorizeS = (req, res, next) => {
    if (req.user?.userType !== "Security") {
        if (req.originalUrl.startsWith('/api') || req.headers.accept?.includes('application/json')) {
            return res.status(403).json({ message: "Forbidden" });
        }
        return res.redirect("/login");
    }
    next();
};

const authorizeW = (req, res, next) => {
    if (req.user?.userType !== "Worker") {
        if (req.originalUrl.startsWith('/api') || req.headers.accept?.includes('application/json')) {
            return res.status(403).json({ message: "Forbidden" });
        }
        return res.redirect("/login");
    }
    next();
};

const authorizeC = (req, res, next) => {
    if (req.user?.userType !== "CommunityManager") {
        if (req.originalUrl.startsWith('/api') || req.headers.accept?.includes('application/json')) {
            return res.status(403).json({ message: "Forbidden" });
        }
        return res.redirect("/login");
    }
    next();
};

const authorizeA = (req, res, next) => {
    if (req.user?.userType !== "admin") {
        if (req.originalUrl.startsWith('/api') || req.headers.accept?.includes('application/json')) {
            return res.status(403).json({ message: "Forbidden" });
        }
        return res.redirect("/AdminLogin");
    }
    next();
};

export { authorizeR, authorizeS, authorizeW, authorizeC, authorizeA };