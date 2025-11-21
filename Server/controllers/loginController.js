import bcrypt from 'bcrypt';
import jwt from 'jsonwebtoken';
import  CommunityManager from '../models/cManager.js' ;
import Resident from '../models/resident.js';
import Security from '../models/security.js';
import Worker from '../models/workers.js';
import Admin from '../models/admin.js';

async function authenticateUser(model, email, password) {
    const user = await model.findOne({ email });
    if (!user) return null;

    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) return null;

    const userType = model.modelName;

    const userPayload = {
        id: user._id,
        email: user.email,
        userType
    };

    if (user.community) {
        userPayload.community = user.community;
    }

    const token = jwt.sign(
        userPayload,
        process.env.JWT_SECRET,
        { expiresIn: '7d' }
    );

    return {
        token,
        user: userPayload
    };
}
export async function AuthenticateR(email, password) {
    return authenticateUser(Resident, email, password);
}

export async function AuthenticateS(email, password) {
    return authenticateUser(Security, email, password);
}

export async function AuthenticateW(email, password) {
    return authenticateUser(Worker, email, password);
}

export async function AuthenticateA(email, password) {
    return authenticateUser(Admin, email, password);
}

export async function AuthenticateC(email, password) {
    return authenticateUser(CommunityManager, email, password);
}
