import express from 'express';
import { 
  getAllUsers, getUserById, createUser, updateUser, deleteUser,
  getAllProjects, getProjectById, getUsersByProject, searchUsers
} from '../database.js';
import { authenticateToken, requireAdmin } from '../middleware/auth.js';
import { sendWelcomeEmail, sendProjectAssignmentEmail } from '../services/emailService.js';

const adminRouter = express.Router();

adminRouter.use(authenticateToken, requireAdmin);

adminRouter.get('/users', async (req, res) => {
  try {
    const users = await getAllUsers();
    res.json({ success: true, data: users });
  } catch (error) {
    res.status(500).json({ success: false, error: 'Failed to fetch users' });
  }
});

adminRouter.get('/users/search', async (req, res) => {
  try {
    const { q } = req.query;
    if (!q) {
      return res.json({ success: true, data: [] });
    }
    const users = await searchUsers(q);
    res.json({ success: true, data: users });
  } catch (error) {
    res.status(500).json({ success: false, error: 'Search failed' });
  }
});

adminRouter.post('/users', async (req, res) => {
  try {
    const { firstName, lastName, email, role, assignedProjects } = req.body;
    
    if (!firstName || !lastName || !email) {
      return res.status(400).json({ success: false, error: 'First name, last name, and email are required' });
    }

    const existingUser = await import('../database.js').then(m => m.getUserByEmail(email));
    if (existingUser) {
      return res.status(400).json({ success: false, error: 'User with this email already exists' });
    }

    const tempPassword = `${firstName.charAt(0).toUpperCase()}${lastName.charAt(0).toLowerCase()}@${Math.random().toString(36).slice(-6)}${Math.floor(Math.random() * 100)}`;
    
    const newUser = await createUser({
      firstName,
      lastName,
      email,
      password: tempPassword,
      role: role || 'user',
      assignedProjects: assignedProjects || [],
      mustChangePassword: true
    });

    const emailResult = await sendWelcomeEmail(newUser, tempPassword);

    res.status(201).json({ 
      success: true, 
      data: {
        id: newUser._id,
        firstName: newUser.firstName,
        lastName: newUser.lastName,
        email: newUser.email,
        role: newUser.role,
        assignedProjects: newUser.assignedProjects,
        mustChangePassword: newUser.mustChangePassword
      },
      tempPassword: tempPassword,
      emailSent: emailResult.success
    });
  } catch (error) {
    console.error('Create user error:', error);
    res.status(500).json({ success: false, error: 'Failed to create user' });
  }
});

adminRouter.put('/users/:id', async (req, res) => {
  try {
    const { firstName, lastName, email, role, isActive, assignedProjects } = req.body;
    const updateData = {};
    
    if (firstName !== undefined) updateData.firstName = firstName;
    if (lastName !== undefined) updateData.lastName = lastName;
    if (email !== undefined) updateData.email = email;
    if (role !== undefined) updateData.role = role;
    if (isActive !== undefined) updateData.isActive = isActive;
    if (assignedProjects !== undefined) updateData.assignedProjects = assignedProjects;

    const updatedUser = await updateUser(req.params.id, updateData);
    if (!updatedUser) {
      return res.status(404).json({ success: false, error: 'User not found' });
    }

    res.json({ success: true, data: updatedUser });
  } catch (error) {
    res.status(500).json({ success: false, error: 'Failed to update user' });
  }
});

adminRouter.delete('/users/:id', async (req, res) => {
  try {
    const user = await getUserById(req.params.id);
    if (!user) {
      return res.status(404).json({ success: false, error: 'User not found' });
    }

    if (user.role === 'admin') {
      const adminCount = await getAllUsers().then(users => users.filter(u => u.role === 'admin').length);
      if (adminCount <= 1) {
        return res.status(400).json({ success: false, error: 'Cannot delete the last admin user' });
      }
    }

    await deleteUser(req.params.id);
    res.json({ success: true, message: 'User deleted successfully' });
  } catch (error) {
    res.status(500).json({ success: false, error: 'Failed to delete user' });
  }
});

adminRouter.post('/users/:id/reset-password', async (req, res) => {
  try {
    const user = await getUserById(req.params.id);
    if (!user) {
      return res.status(404).json({ success: false, error: 'User not found' });
    }

    const tempPassword = `${user.firstName.charAt(0).toUpperCase()}${Math.random().toString(36).slice(-8)}${Math.floor(Math.random() * 100)}`;
    
    await updateUser(req.params.id, { 
      password: tempPassword, 
      mustChangePassword: true 
    });

    const emailResult = await sendWelcomeEmail(user, tempPassword);

    res.json({ 
      success: true, 
      message: 'Password reset successfully',
      tempPassword: tempPassword,
      emailSent: emailResult.success
    });
  } catch (error) {
    res.status(500).json({ success: false, error: 'Failed to reset password' });
  }
});

adminRouter.post('/projects/:projectId/assign', async (req, res) => {
  try {
    const { userIds } = req.body;
    const { projectId } = req.params;

    const project = await getProjectById(projectId);
    if (!project) {
      return res.status(404).json({ success: false, error: 'Project not found' });
    }

    const assignedUsers = [];
    for (const userId of userIds) {
      const user = await getUserById(userId);
      if (user && !user.assignedProjects.includes(projectId)) {
        await updateUser(userId, { 
          $push: { assignedProjects: projectId } 
        });
        assignedUsers.push(user);
        await sendProjectAssignmentEmail(user, project, req.user);
      }
    }

    res.json({ 
      success: true, 
      message: `Project assigned to ${assignedUsers.length} users`,
      assignedUsers: assignedUsers.map(u => ({ id: u._id, firstName: u.firstName, lastName: u.lastName, email: u.email }))
    });
  } catch (error) {
    res.status(500).json({ success: false, error: 'Failed to assign project' });
  }
});

adminRouter.get('/projects/:projectId/users', async (req, res) => {
  try {
    const users = await getUsersByProject(req.params.projectId);
    res.json({ success: true, data: users });
  } catch (error) {
    res.status(500).json({ success: false, error: 'Failed to fetch project users' });
  }
});

export default adminRouter;
