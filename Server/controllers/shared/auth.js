import jwt from 'jsonwebtoken';

const auth = async (req, res, next) => {
    // Check both cookies and Authorization header
    let token = req.cookies.token;
    if (req.headers.authorization && req.headers.authorization.startsWith('Bearer ')) {
        token = req.headers.authorization.split(' ')[1];
    }
    
    console.log("token in auth : ", token ? "Found" : "Not Found");

    const isApi = req.originalUrl.includes('/api') || 
                  req.headers.accept?.includes('application/json') ||
                  req.headers.authorization?.startsWith('Bearer');

    if (!token) {
        if (isApi) {
            return res.status(401).json({ success: false, message: 'Unauthorized: No token provided' });
        }
        return res.redirect('/login');
    }

    try {
        const decoded = jwt.verify(token, process.env.JWT_SECRET);
        req.user = decoded;  
        next(); 
    } catch (error) {
        res.clearCookie('token');  
        if (isApi) {
            return res.status(401).json({ success: false, message: 'Session expired or invalid, please log in again' });
        }
        return res.redirect('/login');
    }
};

export default auth;