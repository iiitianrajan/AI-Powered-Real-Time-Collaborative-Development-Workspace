import projectModel from '../models/project.model.js';
import * as projectService from '../services/project.service.js';
import userModel from '../models/user.model.js';
import { validationResult } from 'express-validator';
import * as messageService from '../services/message.service.js';
import * as fileRevisionService from '../services/file-revision.service.js';


export const createProject = async (req, res) => {

    const errors = validationResult(req);

    if (!errors.isEmpty()) {
        return res.status(400).json({ errors: errors.array() });
    }

    try {

        const { name } = req.body;
        const loggedInUser = await userModel.findOne({ email: req.user.email });
        const userId = loggedInUser._id;

        const newProject = await projectService.createProject({ name, userId });

        res.status(201).json(newProject);

    } catch (err) {
        console.log(err);
        res.status(400).send(err.message);
    }



}

export const getAllProject = async (req, res) => {
    try {

        const loggedInUser = await userModel.findOne({
            email: req.user.email
        })

        const allUserProjects = await projectService.getAllProjectByUserId({
            userId: loggedInUser._id
        })

        return res.status(200).json({
            projects: allUserProjects
        })

    } catch (err) {
        console.log(err)
        res.status(400).json({ error: err.message })
    }
}

export const addUserToProject = async (req, res) => {
    const errors = validationResult(req);

    if (!errors.isEmpty()) {
        return res.status(400).json({ errors: errors.array() });
    }

    try {

        const { projectId, users } = req.body

        const loggedInUser = await userModel.findOne({
            email: req.user.email
        })


        const project = await projectService.addUsersToProject({
            projectId,
            users,
            userId: loggedInUser._id
        })

        return res.status(200).json({
            project,
        })

    } catch (err) {
        console.log(err)
        res.status(400).json({ error: err.message })
    }


}

export const getProjectById = async (req, res) => {

    const { projectId } = req.params;

    try {

        const project = await projectService.getProjectById({ projectId });

        return res.status(200).json({
            project
        })

    } catch (err) {
        console.log(err)
        res.status(400).json({ error: err.message })
    }

}

export const updateFileTree = async (req, res) => {
    const errors = validationResult(req);

    if (!errors.isEmpty()) {
        return res.status(400).json({ errors: errors.array() });
    }

    try {

        const { projectId, fileTree } = req.body;

        const project = await projectService.updateFileTree({
            projectId,
            fileTree
        })

        return res.status(200).json({
            project
        })

    } catch (err) {
        console.log(err)
        res.status(400).json({ error: err.message })
    }

}

export const getProjectMessages = async (req, res) => {
    try {
        const loggedInUser = await userModel.findOne({ email: req.user.email });
        const messages = await messageService.getProjectMessages({
            projectId: req.params.projectId,
            userId: loggedInUser._id,
            before: req.query.before,
            limit: req.query.limit,
        });

        return res.status(200).json({ messages });
    } catch (err) {
        return res.status(400).json({ error: err.message });
    }
}

export const clearProjectMessages = async (req, res) => {
    try {
        const loggedInUser = await userModel.findOne({ email: req.user.email });
        await messageService.clearProjectMessages({
            projectId: req.params.projectId,
            userId: loggedInUser._id,
        });

        return res.status(200).json({ message: 'Chat history cleared' });
    } catch (err) {
        return res.status(400).json({ error: err.message });
    }
}

export const deleteProject = async (req, res) => {
    try {
        const loggedInUser = await userModel.findOne({ email: req.user.email });
        const deletedProject = await projectService.deleteProject({
            projectId: req.params.projectId,
            userId: loggedInUser._id,
        });

        const io = req.app.get('io');
        const roomId = deletedProject._id.toString();

        io?.to(roomId).emit('project-deleted', {
            projectId: roomId,
            message: 'This workspace was deleted by its creator.',
        });
        io?.in(roomId).disconnectSockets(true);

        return res.status(200).json({ message: 'Workspace deleted successfully' });
    } catch (err) {
        return res.status(400).json({ error: err.message });
    }
}

export const getFileRevisions = async (req, res) => {
    try {
        const loggedInUser = await userModel.findOne({ email: req.user.email });
        const revisions = await fileRevisionService.getFileRevisions({
            projectId: req.params.projectId,
            userId: loggedInUser._id,
            filePath: req.query.path,
            limit: req.query.limit,
        });

        return res.status(200).json({ revisions });
    } catch (err) {
        return res.status(400).json({ error: err.message });
    }
}

export const restoreFileRevision = async (req, res) => {
    try {
        const loggedInUser = await userModel.findOne({ email: req.user.email });
        const updatedFile = await fileRevisionService.restoreFileRevision({
            projectId: req.params.projectId,
            user: { _id: loggedInUser._id, email: loggedInUser.email },
            fileRevisionId: req.params.revisionId,
        });

        if (updatedFile.conflict) {
            return res.status(409).json(updatedFile);
        }

        const revision = updatedFile.revision.toObject();
        req.app.get('io')?.to(req.params.projectId).emit('file-content-updated', {
            filePath: revision.filePath,
            content: revision.content,
            revision: revision.revision,
            changedBy: revision.changedBy,
            createdAt: revision.createdAt,
        });

        return res.status(200).json({ revision });
    } catch (err) {
        return res.status(400).json({ error: err.message });
    }
}
