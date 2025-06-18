const express = require('express');
const http = require('http');
const { Server } = require('socket.io');
const cors = require('cors');
const admin = require('firebase-admin');
const serviceAccount = require('./firebase-admin-key.json');

admin.initializeApp({
  credential: admin.credential.cert(serviceAccount),
});

const db = admin.firestore();
const app = express();
const server = http.createServer(app);

const io = new Server(server, {
  cors: {
    origin: '*',
  },
});

io.on('connection', (socket) => {
  console.log('✅ New client connected');

  socket.on('join-pod', (podId) => {
    socket.join(podId);
    console.log(`👥 User joined pod: ${podId}`);
  });

  socket.on('send-message', async ({ podId, text, sender }) => {
    const message = {
      text,
      sender,
      timestamp: admin.firestore.FieldValue.serverTimestamp(), // ✅ Firestore native timestamp
    };

    try {
      // Save to Firestore first
      await db.collection('pods').doc(podId).collection('messages').add(message);

      // Emit back to room (can also await, but not required)
      io.to(podId).emit('receive-message', message);

      console.log(`📨 Message from ${sender} saved to pod ${podId}`);
    } catch (error) {
      console.error('❌ Error saving message to Firestore:', error);
    }
  });

  socket.on('disconnect', () => {
    console.log('❎ Client disconnected');
  });
});

app.get('/', (req, res) => {
  res.send({ message: '🔌 Socket.IO server is running!' });
});

const PORT = 5000;
server.listen(PORT, () => {
  console.log(`🚀 Server running on port ${PORT}`);
});
