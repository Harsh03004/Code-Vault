import { User } from '../models/User.model.js';
import jwt from 'jsonwebtoken';

const generateAccessAndRefreshToken = async (userId) => {
  try {
    const user = await User.findById(userId);
    const accessToken = user.generateAccessToken();
    const refreshToken = user.generateRefreshToken();

    user.refreshToken = refreshToken;
    await user.save({ validateBeforeSave: false });

    return { accessToken, refreshToken };
  } catch (error) {
    throw new Error('Error generating tokens');
  }
};

export const register = async (req, res) => {
  try {
    const { username, email, fullname, password } = req.body;

    if (!username || !email || !fullname || !password) {
      return res.status(400).json({ success: false, message: 'All fields are required' });
    }

    if (password.length < 8) {
      return res.status(400).json({ success: false, message: 'Password must be at least 8 characters long' });
    }

    const existedUser = await User.findOne({ $or: [{ username }, { email }] });
    if (existedUser) {
      return res.status(409).json({ success: false, message: 'User already exists with this username or email' });
    }

    const user = await User.create({ fullname, username, email, password });
    const createdUser = await User.findById(user._id).select('-password -refreshToken');

    res.status(201).json({
      success: true,
      data: createdUser,
      message: 'User registered successfully'
    });
  } catch (err) {
    console.error('Register error:', err);
    res.status(500).json({ success: false, message: 'Server error during registration' });
  }
};

export const login = async (req, res) => {
  try {
    const { username, email, password } = req.body;

    if (!(username || email)) {
      return res.status(400).json({ success: false, message: 'Username or email is required' });
    }

    if (!password) {
      return res.status(400).json({ success: false, message: 'Password is required' });
    }

    const user = await User.findOne({ $or: [{ username }, { email }] });
    if (!user) {
      return res.status(404).json({ success: false, message: 'User not found' });
    }

    const isValidPass = await user.isPasswordCorrect(password);
    if (!isValidPass) {
      return res.status(401).json({ success: false, message: 'Invalid credentials' });
    }

    const { accessToken, refreshToken } = await generateAccessAndRefreshToken(user._id);
    const loggedinUser = await User.findById(user._id).select('-password -refreshToken');

    const options = {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax'
    };

    res.status(200)
      .cookie('refreshToken', refreshToken, options)
      .cookie('accessToken', accessToken, options)
      .json({
        success: true,
        data: {
          user: loggedinUser,
          accessToken,
          refreshToken
        },
        message: 'Login successful'
      });
  } catch (err) {
    console.error('Login error:', err);
    res.status(500).json({ success: false, message: 'Server error during login' });
  }
};

export const logout = async (req, res) => {
  try {
    const token = req.cookies?.accessToken || req.header("Authorization")?.replace("Bearer ", "");

    if (!token) {
      return res.status(401).json({ success: false, message: 'Unauthorized' });
    }

    const decodedToken = jwt.verify(token, process.env.ACCESS_TOKEN_SECRET);
    await User.findByIdAndUpdate(decodedToken._id, { $set: { refreshToken: undefined } });

    const options = {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax'
    };

    res.status(200)
      .clearCookie('refreshToken', options)
      .clearCookie('accessToken', options)
      .json({ success: true, message: 'Logged out successfully' });
  } catch (err) {
    console.error('Logout error:', err);
    res.status(500).json({ success: false, message: 'Server error during logout' });
  }
};
