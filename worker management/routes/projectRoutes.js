const express = require('express');
const router = express.Router();
const Project = require('../models/Project');

// GET all projects with search
router.get('/', async (req, res) => {
    try {
        const { search } = req.query;
        let query = {};
        
        if (search) {
            query.$or = [
                { name: { $regex: search, $options: 'i' } },
                { client: { $regex: search, $options: 'i' } },
                { location: { $regex: search, $options: 'i' } },
                { supervisor: { $regex: search, $options: 'i' } },
                { projectId: { $regex: search, $options: 'i' } }
            ];
        }
        
        const projects = await Project.find(query).sort({ createdAt: -1 });
        res.json(projects);
    } catch (error) {
        console.error('Error fetching projects:', error);
        res.status(500).json({ error: error.message });
    }
});

// POST - Add new project
router.post('/', async (req, res) => {
    try {
        const { user, role } = req.body;
        const projectData = { ...req.body };
        delete projectData.user;
        delete projectData.role;
        
        projectData.lastUpdatedBy = user || 'System';
        projectData.lastUpdatedRole = role || 'System';
        projectData.lastUpdatedAt = new Date();
        
        const project = new Project(projectData);
        await project.save();
        res.status(201).json(project);
    } catch (error) {
        console.error('Error adding project:', error);
        res.status(400).json({ error: error.message });
    }
});

// GET - Single project
router.get('/:id', async (req, res) => {
    try {
        const project = await Project.findById(req.params.id);
        if (!project) {
            return res.status(404).json({ error: 'Project not found' });
        }
        res.json(project);
    } catch (error) {
        console.error('Error fetching project:', error);
        res.status(500).json({ error: error.message });
    }
});

// PUT - Update project
router.put('/:id', async (req, res) => {
    try {
        const { user, role } = req.body;
        const updateData = { ...req.body };
        delete updateData.user;
        delete updateData.role;
        
        updateData.lastUpdatedBy = user || 'System';
        updateData.lastUpdatedRole = role || 'System';
        updateData.lastUpdatedAt = new Date();
        
        const project = await Project.findByIdAndUpdate(
            req.params.id,
            updateData,
            { new: true, runValidators: true }
        );
        if (!project) {
            return res.status(404).json({ error: 'Project not found' });
        }
        res.json(project);
    } catch (error) {
        console.error('Error updating project:', error);
        res.status(400).json({ error: error.message });
    }
});

// DELETE - Delete project
router.delete('/:id', async (req, res) => {
    try {
        const { user, role } = req.query;
        const project = await Project.findByIdAndDelete(req.params.id);
        if (!project) {
            return res.status(404).json({ error: 'Project not found' });
        }
        res.json({ 
            message: `Project deleted successfully`,
            deletedBy: user || 'System',
            role: role || 'System'
        });
    } catch (error) {
        console.error('Error deleting project:', error);
        res.status(500).json({ error: error.message });
    }
});

module.exports = router;