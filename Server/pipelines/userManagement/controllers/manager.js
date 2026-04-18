import Resident from "../../../models/resident.js";
import Worker from "../../../models/workers.js";
import Security from "../../../models/security.js";
import Ad from "../../../models/Ad.js";
import bcrypt from "bcrypt";
import { sendPassword } from "../../../controllers/shared/OTP.js";
import { sendError, sendSuccess } from "../../shared/helpers.js";
import { handleMongooseError } from "../../../controllers/shared/errorHandler.js";

const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const PHONE_REGEX = /^[0-9]{10}$/;

const toSafeText = (value, max = 120) => String(value || "").trim().slice(0, max);

const validateResidentPayload = (payload) => {
    const firstName = toSafeText(payload.residentFirstname, 60);
    const lastName = toSafeText(payload.residentLastname, 60);
    const email = toSafeText(payload.email, 120).toLowerCase();
    const uCode = toSafeText(payload.uCode, 32).toUpperCase();
    const contact = toSafeText(payload.contact, 20);

    if (!firstName || !lastName || !email || !uCode) {
        return { error: "First name, last name, email, and UCode are required" };
    }
    if (!EMAIL_REGEX.test(email)) {
        return { error: "Invalid email address" };
    }
    if (contact && !PHONE_REGEX.test(contact)) {
        return { error: "Contact number must be a 10-digit value" };
    }

    return { value: { firstName, lastName, email, uCode, contact } };
};

const validateWorkerPayload = (payload) => {
    const name = toSafeText(payload.workerName, 80);
    const email = toSafeText(payload.workerEmail, 120).toLowerCase();
    const jobRole = toSafeText(payload.workerJobRole, 80);
    const contact = toSafeText(payload.workerContact, 20);
    const address = toSafeText(payload.workerAddress, 200);
    const salaryRaw = payload.workerSalary;
    const salary = Number(salaryRaw);

    if (!name || !email || !jobRole) {
        return { error: "Name, email, and job role are required" };
    }
    if (!EMAIL_REGEX.test(email)) {
        return { error: "Invalid worker email address" };
    }
    if (contact && !PHONE_REGEX.test(contact)) {
        return { error: "Worker contact must be a 10-digit value" };
    }
    if (salaryRaw !== undefined && salaryRaw !== "" && (!Number.isFinite(salary) || salary < 0)) {
        return { error: "Worker salary must be a non-negative number" };
    }

    return {
        value: {
            name,
            email,
            jobRole,
            contact,
            address,
            salary: salaryRaw === undefined || salaryRaw === "" ? undefined : salary,
        }
    };
};

export const getUserManagement = async (req, res) => {
    const ads = await Ad.find({
        community: req.user.community,
        status: "Active",
    });

    const R = await Resident.find({ community: req.user.community });
    const W = await Worker.find({ community: req.user.community });
    const S = await Security.find({ community: req.user.community });

    res.json({ ads, R, W, S });
};

export const createResident = async (req, res) => {
    try {
        const { Rid, residentFirstname, residentLastname, email, uCode, contact } =
            req.body;
        const parsed = validateResidentPayload({
            residentFirstname,
            residentLastname,
            email,
            uCode,
            contact,
        });
        if (parsed.error) {
            return sendError(res, 400, parsed.error);
        }
        const { firstName, lastName, email: safeEmail, uCode: safeUCode, contact: safeContact } = parsed.value;

        if (Rid) {
            const r = await Resident.findOne({ _id: Rid, community: req.user.community });
            if (!r) {
                return sendError(res, 404, `Resident with ID ${Rid} not found`);
            }

            r.residentFirstname = firstName;
            r.residentLastname = lastName;
            r.email = safeEmail;
            r.uCode = safeUCode;
            r.contact = safeContact;

            await r.save();
            res.json({ success: true, resident: r, isUpdate: true });
        } else {
            const r = await Resident.create({
                residentFirstname: firstName,
                residentLastname: lastName,
                email: safeEmail,
                contact: safeContact,
                uCode: safeUCode,
                community: req.user.community,
            });

            const password = await sendPassword({ email: safeEmail, userType: "Resident" });
            const hashedPassword = await bcrypt.hash(password, 10);
            r.password = hashedPassword;
            await r.save();

            res.json({ success: true, resident: r });
        }
    } catch (err) {
        console.error("Error in /userManagement/resident:", err);
        return handleMongooseError(err, res);
    }
};

export const getResident = async (req, res) => {
    const id = req.params.id;
    const r = await Resident.findById(id);
    res.status(200).json({ success: true, r });
};

export const deleteResident = async (req, res) => {
    const id = req.params.id;
    await Resident.deleteOne({ _id: id });
    res.status(200).json({ ok: true });
};

export const createSecurity = async (req, res) => {
    try {
        const {
            Sid,
            securityName,
            securityEmail,
            securityContact,
            securityAddress,
            securityShift,
            gate,
        } = req.body;

        if (Sid) {
            const s = await Security.findById(Sid);
            if (!s) {
                return sendError(res, 404, `Security staff with ID ${Sid} not found`);
            }

            s.name = securityName;
            s.email = securityEmail;
            s.contact = securityContact;
            s.address = securityAddress;
            s.shift = securityShift;
            s.workplace = gate;

            await s.save();
            res.json({ success: true, security: s, isUpdate: true });
        } else {
            const s = await Security.create({
                name: securityName,
                email: securityEmail,
                contact: securityContact,
                address: securityAddress,
                Shift: securityShift,
                workplace: gate,
                community: req.user.community,
            });

            const password = await sendPassword({
                email: securityEmail,
                userType: "Security",
            });
            const hashedPassword = await bcrypt.hash(password, 10);
            s.password = hashedPassword;
            await s.save();

            res.status(200).json({ success: true, security: s });
        }
    } catch (err) {
        console.error("Error in /userManagement/security:", err);
        return handleMongooseError(err, res);
    }
};

export const getSecurity = async (req, res) => {
    const id = req.params.id;
    const r = await Security.findById(id);
    res.status(200).json({ success: true, r });
};

export const deleteSecurity = async (req, res) => {
    const id = req.params.id;
    await Security.deleteOne({ _id: id });
    res.status(200).json({ ok: true });
};

export const createWorker = async (req, res) => {
    try {
        const {
            Wid,
            workerName,
            workerEmail,
            workerJobRole,
            workerContact,
            workerAddress,
            workerSalary,
        } = req.body;
        const parsed = validateWorkerPayload({
            workerName,
            workerEmail,
            workerJobRole,
            workerContact,
            workerAddress,
            workerSalary,
        });
        if (parsed.error) {
            return sendError(res, 400, parsed.error);
        }
        const { name, email, jobRole, contact, address, salary } = parsed.value;

        if (Wid) {
            const w = await Worker.findOne({ _id: Wid, community: req.user.community });
            if (!w) {
                return sendError(res, 404, `Worker with ID ${Wid} not found`);
            }

            w.name = name;
            w.email = email;
            w.jobRole = jobRole;
            w.contact = contact;
            w.address = address;
            if (salary !== undefined) {
                w.salary = salary;
            }
            await w.save();
            return res.json({ success: true, worker: w, isUpdate: true });
        } else {
            const w = await Worker.create({
                name,
                email,
                jobRole,
                contact,
                address,
                salary,
                community: req.user.community,
            });

            const password = await sendPassword({
                email,
                userType: "Worker",
            });

            const hashedPassword = await bcrypt.hash(password, 10);
            w.password = hashedPassword;
            await w.save();

            res.json({ success: true, worker: w });
        }
    } catch (err) {
        console.error("Error in /userManagement/worker:", err);
        return handleMongooseError(err, res);
    }
};

export const getWorker = async (req, res) => {
    const id = req.params.id;
    const r = await Worker.findById(id);
    res.status(200).json({ success: true, r });
};

export const deleteWorker = async (req, res) => {
    const id = req.params.id;
    await Worker.deleteOne({ _id: id });
    res.status(200).json({ ok: true });
};

export const getWorkers = async (req, res) => {
    try {
        const workers = await Worker.find({
            community: req.user.community,
            isActive: true
        }).select('name jobRole _id');
        res.json({ success: true, workers });
    } catch (error) {
        console.error("Error fetching workers:", error);
        return sendError(res, 500, "Server error", error);
    }
};
