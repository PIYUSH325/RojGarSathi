const Contact = require('../models/Contact');
const { StatusCodes } = require('http-status-codes');
const { BadRequestError, NotFoundError } = require('../errors');

const createContact = async (req, res) => {
    const { name, email, subject, message } = req.body;

    if (!name || !email || !subject || !message) {
        throw new BadRequestError('Please provide all required fields');
    }

    const contact = await Contact.create({ name, email, subject, message });

    res.status(StatusCodes.CREATED).json({
        msg: 'Contact form submitted successfully',
        contact
    });
};

const getAllContacts = async (req, res) => {
    const contacts = await Contact.find({}).sort({ createdAt: -1 });
    res.status(StatusCodes.OK).json({ contacts, count: contacts.length });
};

const getContact = async (req, res) => {
    const { id } = req.params;
    const contact = await Contact.findById(id);

    if (!contact) {
        throw new NotFoundError(`No contact found with id ${id}`);
    }

    res.status(StatusCodes.OK).json({ contact });
};

const updateContact = async (req, res) => {
    const { id } = req.params;
    const { status, adminReply } = req.body;

    const contact = await Contact.findByIdAndUpdate(
        id,
        { status, adminReply, repliedAt: status === 'replied' ? new Date() : undefined },
        { new: true, runValidators: true }
    );

    if (!contact) {
        throw new NotFoundError(`No contact found with id ${id}`);
    }

    res.status(StatusCodes.OK).json({ contact });
};

const deleteContact = async (req, res) => {
    const { id } = req.params;
    const contact = await Contact.findByIdAndDelete(id);

    if (!contact) {
        throw new NotFoundError(`No contact found with id ${id}`);
    }

    res.status(StatusCodes.OK).json({ msg: 'Contact deleted successfully' });
};

module.exports = {
    createContact,
    getAllContacts,
    getContact,
    updateContact,
    deleteContact
};
