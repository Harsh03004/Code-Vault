import { Snippet } from '../models/Snippet.model.js';

export const getAllSnippets = async (req, res) => {
  try {
    const snippets = await Snippet.find({ userId: req.user._id }).sort({ updatedAt: -1 });

    res.status(200).json({
      success: true,
      data: snippets
    });
  } catch (err) {
    console.error('Get snippets error:', err);
    res.status(500).json({ success: false, message: 'Server error' });
  }
};

export const createSnippet = async (req, res) => {
  try {
    const { name, code, language, isEncrypted } = req.body;

    if (!name || !code) {
      return res.status(400).json({ success: false, message: 'Snippet name and code are required' });
    }

    // Check for duplicate name
    const existing = await Snippet.findOne({ userId: req.user._id, name });
    if (existing) {
      return res.status(409).json({ success: false, message: 'Snippet with this name already exists' });
    }

    const snippet = await Snippet.create({
      name,
      code,
      language: language || 'javascript',
      isEncrypted: isEncrypted || false,
      userId: req.user._id
    });

    res.status(201).json({
      success: true,
      data: snippet,
      message: 'Snippet saved successfully'
    });
  } catch (err) {
    console.error('Create snippet error:', err);
    res.status(500).json({ success: false, message: 'Server error' });
  }
};

export const getSnippetById = async (req, res) => {
  try {
    const snippet = await Snippet.findOne({ _id: req.params.id, userId: req.user._id });

    if (!snippet) {
      return res.status(404).json({ success: false, message: 'Snippet not found' });
    }

    res.status(200).json({
      success: true,
      data: snippet
    });
  } catch (err) {
    console.error('Get snippet error:', err);
    res.status(500).json({ success: false, message: 'Server error' });
  }
};

export const updateSnippet = async (req, res) => {
  try {
    const { name, code, language, isEncrypted } = req.body;

    if (!name || !code) {
      return res.status(400).json({ success: false, message: 'Snippet name and code are required' });
    }

    const snippet = await Snippet.findOneAndUpdate(
      { _id: req.params.id, userId: req.user._id },
      { $set: { name, code, language, isEncrypted: isEncrypted || false } },
      { new: true }
    );

    if (!snippet) {
      return res.status(404).json({ success: false, message: 'Snippet not found' });
    }

    res.status(200).json({
      success: true,
      data: snippet,
      message: 'Snippet updated successfully'
    });
  } catch (err) {
    console.error('Update snippet error:', err);
    res.status(500).json({ success: false, message: 'Server error' });
  }
};

export const deleteSnippet = async (req, res) => {
  try {
    const snippet = await Snippet.findOneAndDelete({ _id: req.params.id, userId: req.user._id });

    if (!snippet) {
      return res.status(404).json({ success: false, message: 'Snippet not found' });
    }

    res.status(200).json({
      success: true,
      message: 'Snippet deleted successfully'
    });
  } catch (err) {
    console.error('Delete snippet error:', err);
    res.status(500).json({ success: false, message: 'Server error' });
  }
};
