import mongoose from 'mongoose';
import bcrypt from 'bcryptjs';

const userSchema = new mongoose.Schema(
  {
    username: {
      type: String,
      required: [true, 'Username is required'],
      unique: true,
      trim: true,
      minlength: [3, 'Username must be at least 3 characters'],
      maxlength: [30, 'Username cannot exceed 30 characters'],
    },
    email: {
      type: String,
      required: [true, 'Email is required'],
      unique: true,
      lowercase: true,
      trim: true,
      match: [/^\S+@\S+\.\S+$/, 'Please provide a valid email address'],
    },
    passwordHash: {
      type: String,
      required: false,
      default: '',
    },
    googleId: {
      type: String,
      sparse: true,
      index: true,
    },
    role: {
      type: String,
      enum: ['student', 'admin', 'moderator'],
      default: 'student',
    },
    bio: {
      type: String,
      default: '',
      maxlength: [500, 'Bio cannot exceed 500 characters'],
    },
    skills: {
      type: [String],
      default: ['Linux', 'Git', 'Open Source'],
    },
    avatar: {
      type: String,
      default: '',
    },
    terminalState: {
      fs: {
        type: mongoose.Schema.Types.Mixed,
        default: null,
      },
      history: {
        type: [String],
        default: [],
      },
      cwd: {
        type: String,
        default: '/home/user',
      },
      updatedAt: {
        type: Date,
        default: Date.now,
      },
    },
  },
  {
    timestamps: true,
    toJSON: {
      transform(_doc, ret) {
        ret.id = ret._id.toString();
        delete ret._id;
        delete ret.__v;
        delete ret.passwordHash;
        return ret;
      },
    },
  }
);

userSchema.methods.comparePassword = async function (candidatePassword) {
  if (!this.passwordHash) return false;
  return bcrypt.compare(candidatePassword, this.passwordHash);
};

userSchema.statics.hashPassword = async function (plainPassword) {
  return bcrypt.hash(plainPassword, 10);
};

export const User = mongoose.model('User', userSchema);

