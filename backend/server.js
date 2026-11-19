import 'dotenv/config';
import http from 'http';
import app from './app.js';
import { Server } from 'socket.io';
import jwt from 'jsonwebtoken';
import mongoose from 'mongoose';
import projectModel from './models/project.model.js';
import {generateResult} from './services/ai.service.js';
import userModel from './models/user.model.js';
import * as messageService from './services/message.service.js';
import * as aiMemoryService from './services/ai-memory.service.js';


const port = process.env.PORT || 3000;



const server = http.createServer(app);
const io = new Server(server, {
    cors: {
        origin: '*'
    }
});

app.set('io', io);

io.use(async (socket, next) => {

    try {

        const token = socket.handshake.auth?.token || socket.handshake.headers.authorization?.split(' ')[ 1 ];
        const projectId = socket.handshake.query.projectId;

        if (!mongoose.Types.ObjectId.isValid(projectId)) {
            return next(new Error('Invalid projectId'));
        }


        if (!token) {
            return next(new Error('Authentication error'))
        }

        const decoded = jwt.verify(token, process.env.JWT_SECRET);

        if (!decoded) {
            return next(new Error('Authentication error'))
        }


        const user = await userModel.findOne({ email: decoded.email });

        if (!user) {
            return next(new Error('Authentication error'));
        }

        socket.project = await projectModel.findOne({
            _id: projectId,
            users: user._id,
        });

        if (!socket.project) {
            return next(new Error('You do not have access to this project'));
        }

        socket.user = {
            _id: user._id.toString(),
            email: user.email,
        };

        next();

    } catch (error) {
        next(error)
    }

})

io.on('connection', socket => {
    socket.roomId = socket.project._id.toString()


    console.log('a user connected');



    socket.join(socket.roomId);

    socket.on('project-message', async data => {
        try {
            const message = typeof data?.message === 'string' ? data.message.trim() : '';

            if (!message || message.length > 20000) {
                return;
            }

            const aiIsPresentInMessage = message.toLowerCase().includes('@ai');
            const savedMessage = await messageService.createMessage({
                projectId: socket.project._id,
                sender: socket.user,
                message,
                isAiPrompt: aiIsPresentInMessage,
            });

            io.to(socket.roomId).emit('project-message', savedMessage.toObject());

            if (aiIsPresentInMessage) {
                const prompt = message.replace(/@ai/gi, '').trim();

                if (!prompt) {
                    return;
                }

                const aiMemoryContext = await aiMemoryService.getAiMemoryContext({
                    projectId: socket.project._id,
                });
                const result = await generateResult(prompt, aiMemoryContext);
                const aiMessage = await messageService.createMessage({
                    projectId: socket.project._id,
                    sender: { _id: 'ai', email: 'AI' },
                    message: result,
                    type: 'ai',
                });

                io.to(socket.roomId).emit('project-message', aiMessage.toObject());
                try {
                    await aiMemoryService.saveAiMemoryTurn({
                        projectId: socket.project._id,
                        prompt,
                        response: result,
                    });
                } catch (memoryError) {
                    console.error('AI response delivered, but memory could not be saved:', memoryError);
                }
            }
        } catch (error) {
            console.error('Unable to process project message:', error);
            socket.emit('project-message-error', { error: 'Message could not be sent' });
        }
    })

    socket.on('clear-project-chat', async () => {
        try {
            await messageService.clearProjectMessages({
                projectId: socket.project._id,
                userId: socket.user._id,
            });

            io.to(socket.roomId).emit('project-chat-cleared');
        } catch (error) {
            console.error('Unable to clear project chat:', error);
            socket.emit('project-message-error', { error: 'Chat history could not be cleared' });
        }
    });

    socket.on('disconnect', () => {
        console.log('user disconnected');
        socket.leave(socket.roomId)
    });
});

server.listen(port,() =>{
    console.log(`Server is running on port ${port}`)
})


