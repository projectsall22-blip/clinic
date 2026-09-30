const jwt            = require('jsonwebtoken');
const Admin          = require('../models/Admin');
const Receptionist   = require('../models/Receptionist');
const Pharmaceutical = require('../models/Pharmaceutical');

// @desc  Verify JWT and attach user to request
const protect = async (req, res, next) => {
    let token;

    if (req.headers.authorization && req.headers.authorization.startsWith('Bearer')) {
        try {
            token = req.headers.authorization.split(' ')[1];
            const decoded = jwt.verify(token, process.env.JWT_SECRET);

            if (decoded.role === 'admin') {
                req.user = await Admin.findById(decoded.id).select('-password');
            } else if (decoded.role === 'receptionist') {
                req.user = await Receptionist.findById(decoded.id).select('-password');
            } else if (decoded.role === 'pharmaceutical') {
                req.user = await Pharmaceutical.findById(decoded.id).select('-password');
            }

            if (!req.user) {
                return res.status(401).json({ message: 'User account not found or deactivated' });
            }

            next();
        } catch (error) {
            return res.status(401).json({ message: 'Not authorized, token failed' });
        }
    }

    if (!token) {
        return res.status(401).json({ message: 'Not authorized, no token' });
    }
};

// @desc  Restrict access by role
const authorize = (...roles) => {
    return (req, res, next) => {
        if (!roles.includes(req.user.role)) {
            return res.status(403).json({
                message: `Role '${req.user.role}' is not authorized for this route`
            });
        }
        next();
    };
};

module.exports = { protect, authorize };
