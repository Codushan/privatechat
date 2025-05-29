import { Server as NetServer } from 'http';
import { Server as SocketIOServer } from 'socket.io';
import { NextApiRequest } from 'next';
import { NextApiResponse } from 'next';

export type NextApiResponseWithSocket = NextApiResponse & {
  socket: {
    server: NetServer & {
      io?: SocketIOServer;
    };
  };
};

export const initSocketServer = (req: NextApiRequest, res: NextApiResponseWithSocket) => {
  if (!res.socket.server.io) {
    const io = new SocketIOServer(res.socket.server);
    
    io.on('connection', (socket) => {
      console.log('Socket connected:', socket.id);
      
      socket.on('join-chat', (userId) => {
        socket.join('private-chat');
        console.log(`User ${userId} joined private-chat`);
        
        // Notify others that user is online
        socket.to('private-chat').emit('user-status', { userId, status: 'online' });
        
        // Handle disconnection
        socket.on('disconnect', () => {
          console.log(`User ${userId} disconnected`);
          socket.to('private-chat').emit('user-status', { userId, status: 'offline' });
        });
      });
      
      // Handle new message
      socket.on('send-message', (message) => {
        socket.to('private-chat').emit('receive-message', message);
      });
      
      // Handle typing indicator
      socket.on('typing', (data) => {
        socket.to('private-chat').emit('user-typing', data);
      });
      
      // Handle read receipts
      socket.on('read-messages', (data) => {
        socket.to('private-chat').emit('messages-read', data);
      });
    });
    
    res.socket.server.io = io;
  }
  
  return res.socket.server.io;
};