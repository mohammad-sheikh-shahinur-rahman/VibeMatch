import express from 'express';
import path from 'path';
import dotenv from 'dotenv';
dotenv.config();

import mongoose from 'mongoose';
import http from 'http';
import { createServer as createViteServer } from 'vite';
import { Server as SocketIOServer } from 'socket.io';
import multer from 'multer';
import fs from 'fs';

import * as models from './backend/models/index.js';
import * as helpers from './backend/helpers.js';
import setupSocket from './backend/socket.js';

import setupAuthRoutes from './backend/routes/auth.js';
import setupSocialRoutes from './backend/routes/social.js';
import setupAdminRoutes from './backend/routes/admin.js';
import setupDemoRoutes from './backend/routes/demo.js';
import setupGiftsRoutes from './backend/routes/gifts.js';
import setupPaymentsRoutes from './backend/routes/payments.js';
import setupVipRoutes from './backend/routes/vip.js';
import setupCoreRoutes from './backend/routes/core.js';
import setupUsersRoutes from './backend/routes/users.js';

const app = express();
const server = http.createServer(app);
const io = new SocketIOServer(server, { cors: { origin: '*' } });
const PORT = process.env.PORT || 3000;

app.use(express.json());

// Expose public directories
app.use(express.static('public'));

setupAuthRoutes(app, io, models, helpers);
setupSocialRoutes(app, io, models, helpers);
app.use('/api/admin', (req, res, next) => {
  if (helpers.DEMO_MODE && ['POST', 'PUT', 'DELETE', 'PATCH'].includes(req.method)) {
    return res.status(403).json({ error: 'DEMO_MODE=true khaso iraj3o f .env DEMO_MODE=false' });
  }
  next();
});
setupAdminRoutes(app, io, models, helpers);
setupDemoRoutes(app, io, models, helpers);
setupGiftsRoutes(app, io, models, helpers);
setupPaymentsRoutes(app, io, models, helpers);
setupVipRoutes(app, io, models, helpers);
setupCoreRoutes(app, io, models, helpers);
setupUsersRoutes(app, io, models, helpers);

setupSocket(app, io, models, helpers);

helpers.connectDB();

async function startServer() {
  if (process.env.NODE_ENV !== 'production') {
    const vite = await createViteServer({ server: { middlewareMode: true }, appType: 'spa' });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), 'dist');
    app.use('/images', express.static(path.join(process.cwd(), 'public', 'images')));
    app.use('/videos', express.static(path.join(process.cwd(), 'public', 'videos')));
    app.use(express.static(distPath, { index: false }));
    app.get('*', async (req, res) => {
      try {
        const indexPath = path.join(distPath, 'index.html');
        let html = fs.readFileSync(indexPath, 'utf-8');
        const st = await models.Settings.findOne({ type: 'admin_settings' });
        if (st && (st.seoTitle || st.siteName)) {
          const title = st.seoTitle || st.siteName;
          html = html.replace(/<title>.*?<\/title>/, `<title>${title}</title>`);
        }
        res.send(html);
      } catch (err) {
        res.sendFile(path.join(distPath, 'index.html'));
      }
    });
  }

  server.listen(Number(PORT), '0.0.0.0', () => console.log(`Server active on http://0.0.0.0:${PORT}`));
}

startServer();
