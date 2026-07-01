import express from 'express';
import { getUserByEmail, updateUser, getUserById, getUserByIdWithPassword } from '../database.js';
import { generateToken, authenticateToken } from '../middleware/auth.js';

const authRouter = express.Router();

authRouter.post('/login', async (req, res) => {
  try {
    const { email, password } = req.body;
    
    if (!email || !password) {
      return res.status(400).json({ success: false, error: 'Email and password are required' });
    }

    const user = await getUserByEmail(email);
    if (!user) {
      return res.status(401).json({ success: false, error: 'Invalid email or password' });
    }

    if (!user.isActive) {
      return res.status(401).json({ success: false, error: 'Account is deactivated. Contact administrator.' });
    }

    const isPasswordValid = await user.comparePassword(password);
    if (!isPasswordValid) {
      return res.status(401).json({ success: false, error: 'Invalid email or password' });
    }

    await updateUser(user._id, { lastLogin: new Date() });

    const token = generateToken(user._id, user.role);

    res.json({
      success: true,
      data: {
        token,
        user: {
          id: user._id,
          firstName: user.firstName,
          lastName: user.lastName,
          email: user.email,
          role: user.role,
          mustChangePassword: user.mustChangePassword,
          assignedProjects: user.assignedProjects
        }
      }
    });
  } catch (error) {
    console.error('Login error:', error);
    res.status(500).json({ success: false, error: 'Internal server error' });
  }
});

authRouter.post('/change-password', authenticateToken, async (req, res) => {
  try {
    const { currentPassword, newPassword } = req.body;
    
    if (!currentPassword || !newPassword) {
      return res.status(400).json({ success: false, error: 'Current and new passwords are required' });
    }

    if (newPassword.length < 6) {
      return res.status(400).json({ success: false, error: 'New password must be at least 6 characters' });
    }

    const user = await getUserByIdWithPassword(req.user._id);
    
    if (!user) {
      return res.status(404).json({ success: false, error: 'User not found' });
    }

    const isPasswordValid = await user.comparePassword(currentPassword);
    
    if (!isPasswordValid) {
      return res.status(401).json({ success: false, error: 'Current password is incorrect' });
    }

    await updateUser(req.user._id, { 
      password: newPassword, 
      mustChangePassword: false 
    });

    res.json({ success: true, message: 'Password changed successfully' });
  } catch (error) {
    console.error('Change password error:', error);
    res.status(500).json({ success: false, error: 'Internal server error' });
  }
});

authRouter.get('/me', authenticateToken, async (req, res) => {
  try {
    const user = await getUserById(req.user._id);
    res.json({
      success: true,
      data: {
        id: user._id,
        firstName: user.firstName,
        lastName: user.lastName,
        email: user.email,
        role: user.role,
        mustChangePassword: user.mustChangePassword,
        assignedProjects: user.assignedProjects
      }
    });
  } catch (error) {
    res.status(500).json({ success: false, error: 'Internal server error' });
  }
});

export default authRouter;
