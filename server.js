const http = require('http'); 
const { Server } = require('socket.io'); 
const { createApp, connectToDatabase } = require('./app');

let io;
const app = createApp({
    onEmergencyBroadcast: (emergency) => {
        if (io) io.emit('new_emergency', emergency);
    }
});
const server = http.createServer(app);
io = new Server(server, { cors: { origin: '*' } });

connectToDatabase()
    .then(() => console.log('✅ Database Connected'))
    .catch(err => console.error('❌ Connection Failed:', err));

const PORT = process.env.PORT || 5000;
server.listen(PORT, () => console.log(`Server running on port ${PORT}`));