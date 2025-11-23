import mongoose from 'mongoose';

const snippetSchema = new mongoose.Schema({
  name: {
    type: String,
    required: [true, "Snippet name is required."],
    trim: true,
    minlength: 1,
    maxlength: 100
  },
  code: {
    type: String,
    required: [true, "Code content is required."]
  },
  language: {
    type: String,
    default: "javascript"
  },
  isEncrypted: {
    type: Boolean,
    default: false
  },
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
    index: true
  }
}, { timestamps: true });

export const Snippet = mongoose.model('Snippet', snippetSchema);
