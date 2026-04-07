const express = require('express');
const router = express.Router();

const {
    createContact,
    getAllContacts,
    getContact,
    updateContact,
    deleteContact
} = require('../controllers/contactController');

const authenticateUser = require('../middleware/auth');

// Public route - anyone can submit contact form
router.post('/', createContact);

// Admin only routes
router.get('/', authenticateUser, getAllContacts);
router.get('/:id', authenticateUser, getContact);
router.patch('/:id', authenticateUser, updateContact);
router.delete('/:id', authenticateUser, deleteContact);

module.exports = router;
