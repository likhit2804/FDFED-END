import jwt from 'jsonwebtoken';

const auth = async (req, res, next) => {
    let token = req.cookies?.token;
    if (req.headers.authorization && req.headers.authorization.startsWith('Bearer ')) {
        token = req.headers.authorization.split(' ')[1];
    }
    console.log("token in auth : ", token ? "Found" : "Not Found");

    if (!token) {
        // Return JSON for API requests, redirect for others
        const isApi = req.originalUrl.startsWith('/api') || 
                      req.headers.accept?.includes('application/json') ||
                      req.headers.authorization?.startsWith('Bearer');
        if (isApi) {
            return res.status(401).json({ message: 'Unauthorized' });
        }
        return res.redirect('/login');
    }

    try {
        const decoded = jwt.verify(token, process.env.JWT_SECRET);
        req.user = decoded;  
        next(); 
    } catch (error) {
        res.clearCookie('token');  
        if (req.originalUrl.startsWith('/api') || req.headers.accept?.includes('application/json')) {
            return res.status(401).json({ message: 'Session expired, please log in again' });
        }
        return res.redirect('/login');
    }
};

export default auth;