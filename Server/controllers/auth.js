import jwt from 'jsonwebtoken';

const auth = async (req, res, next) => {
    const token = req.cookies.token;
    console.log("token in auth : ", req.cookies);


    try {
        const decoded = await jwt.verify(token, process.env.JWT_SECRET);
        req.user = decoded;
        console.log(req.user);

        next();
    } catch (error) {
        console.log("Invalid token:", error.message);
        return res.json({ message: 'Unauthorized' });
    }
};

export default auth;
