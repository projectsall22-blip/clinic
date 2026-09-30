const express = require('express');
const router = express.Router();
const { protect, authorize } = require('../middlewares/authMiddleware');
const {
    createBranch, getAllBranches, getBranch,
    updateBranch, deactivateBranch, getBranchStats
} = require('../controllers/branchController');

router.get('/stats', protect, authorize('admin'), getBranchStats);
router.get('/', protect, authorize('admin', 'receptionist', 'pharmaceutical'), getAllBranches);
router.post('/', protect, authorize('admin'), createBranch);
router.get('/:id', protect, authorize('admin'), getBranch);
router.put('/:id', protect, authorize('admin'), updateBranch);
router.delete('/:id', protect, authorize('admin'), deactivateBranch);

module.exports = router;
