import { Server as SocketIOServer } from 'socket.io';

export default function setupSocket(app: any, io: SocketIOServer, models: any, helpers: any) {
  const { User, History, Settings, Message } = models;
  const { authMiddleware, sendPushNotification } = helpers;
  
  // --- SOCKET.IO MATCHMAKING ---

interface SocketQueueEntry {
  socketId: string;
  userId: string;
  user: any;
  genderPref: string;
  countryPref: string;
  timestamp: number;
}

// Periodic online users count broadcast
setInterval(async () => {
  try {
    const settings: any = await Settings.findOne({ type: 'admin_settings' }).lean();
    if (settings && settings.showOnlineUsers !== false) {
      const realConnections = io.engine.clientsCount;
      const fakeCount = settings.fakeOnlineUsersCount || 0;
      io.emit('online_users_count', realConnections + fakeCount);
    }
  } catch (e) {
    // silently fail
  }
}, 5000);

app.get('/api/stats/online', async (req: any, res: any) => {
  try {
    const settings: any = await Settings.findOne({ type: 'admin_settings' }).lean();
    if (settings && settings.showOnlineUsers === false) {
      return res.json({ onlineUsers: null });
    }
    const realConnections = io.engine.clientsCount;
    const fakeCount = settings?.fakeOnlineUsersCount || 0;
    res.json({ onlineUsers: realConnections + fakeCount });
  } catch (e) {
    res.json({ onlineUsers: 0 });
  }
});

let ioMatchQueue: SocketQueueEntry[] = [];
// map socketId -> partnerSocketId
const activeSocketMatches: Record<string, string> = {};
// map userId -> socketId for global messaging
const userSockets = new Map<string, string>();

interface MatchSessionData {
  userId: string;
  user: any;
  startTime: number;
}
const socketSessions: Record<string, MatchSessionData> = {};

const endMatch = async (sock1: string, sock2: string) => {
  const s1 = socketSessions[sock1];
  const s2 = socketSessions[sock2];
  if (s1 && s2 && s1.startTime > 0) {
    const duration = Math.floor((Date.now() - s1.startTime) / 1000);
    const durationStr = `${String(Math.floor(duration/60)).padStart(2,'0')}:${String(duration%60).padStart(2,'0')}`;
    
    if (!s1.user.isDemo) {
      await History.create({
        id: `hist_${Date.now()}_1`, userId: s1.userId, partnerId: s2.userId, partnerName: s2.user.name, partnerUsername: s2.user.username, partnerAvatar: s2.user.avatar, partnerCountry: s2.user.country, partnerAge: s2.user.age, type: 'video_chat', duration: durationStr
      });
    }
    if (!s2.user.isDemo) {
      await History.create({
        id: `hist_${Date.now()}_2`, userId: s2.userId, partnerId: s1.userId, partnerName: s1.user.name, partnerUsername: s1.user.username, partnerAvatar: s1.user.avatar, partnerCountry: s1.user.country, partnerAge: s1.user.age, type: 'video_chat', duration: durationStr
      });
    }
    s1.startTime = 0;
    s2.startTime = 0;
  }
};

io.on('connection', (socket) => {
  socket.on('register_user', (userId: string) => {
    if (userId) {
      userSockets.set(userId, socket.id);
    }
  });

  socket.on('join_queue', async (data) => {
    const { userId, gender = 'both', country = '', superMatch = false } = data;
    
    // Cleanup stale
    const now = Date.now();
    ioMatchQueue = ioMatchQueue.filter(entry => now - entry.timestamp < 60000);

    let currentUser = await User.findOne({ id: userId });
    if (!currentUser && userId) {
      currentUser = await User.findOne({ username: userId });
      if (!currentUser) {
        try {
          currentUser = await User.findById(userId);
        } catch (_) {}
      }
    }
    if (!currentUser) {
      const fallbackId = userId || `u_${Date.now()}`;
      try {
        currentUser = await User.create({
          id: fallbackId,
          username: `user_${fallbackId.substring(0, 10)}`,
          name: 'User',
          role: 'user',
          gender: 'female',
          country: 'Global',
          countryCode: 'US',
          age: 22,
          isOnline: true
        });
      } catch (err) {
        currentUser = await User.findOne({});
      }
    }
    if (!currentUser) {
      socket.emit('match_error', { message: 'User not found' });
      return;
    }
    socketSessions[socket.id] = { userId: currentUser.id, user: currentUser, startTime: 0 };

    const matchIndex = ioMatchQueue.findIndex(entry => {
      if (entry.userId === userId) return false; // Don't match with self
      const genderMatch = (gender === 'both' || entry.user.gender === gender) && (entry.genderPref === 'both' || currentUser.gender === entry.genderPref);
      const countryMatch1 = !country || country === 'all' || country === 'All Countries' || entry.user.country?.toLowerCase() === country.toLowerCase() || entry.user.countryCode?.toLowerCase() === country.toLowerCase();
      const countryMatch2 = !entry.countryPref || entry.countryPref === 'all' || entry.countryPref === 'All Countries' || currentUser.country?.toLowerCase() === entry.countryPref.toLowerCase() || currentUser.countryCode?.toLowerCase() === entry.countryPref.toLowerCase();
      
      return genderMatch && countryMatch1 && countryMatch2;
    });

    if (matchIndex !== -1) {
      // Match found
      const partnerEntry = ioMatchQueue.splice(matchIndex, 1)[0];
      const partner = partnerEntry.user;
      
      activeSocketMatches[socket.id] = partnerEntry.socketId;
      activeSocketMatches[partnerEntry.socketId] = socket.id;

      if (socketSessions[socket.id]) socketSessions[socket.id].startTime = Date.now();
      if (socketSessions[partnerEntry.socketId]) socketSessions[partnerEntry.socketId].startTime = Date.now();

      // Notify caller (initiator)
      socket.emit('match_found', {
        partner: {
          id: partner.id, name: partner.name, username: partner.username, avatar: partner.avatar, gender: partner.gender,
          country: partner.country, countryCode: partner.countryCode, age: partner.age, likesCount: partner.likesCount || 0
        },
        socketId: partnerEntry.socketId,
        initiator: true
      });

      // Notify partner
      io.to(partnerEntry.socketId).emit('match_found', {
        partner: {
          id: currentUser.id, name: currentUser.name, username: currentUser.username, avatar: currentUser.avatar, gender: currentUser.gender,
          country: currentUser.country, countryCode: currentUser.countryCode, age: currentUser.age, likesCount: currentUser.likesCount || 0
        },
        socketId: socket.id,
        initiator: false
      });
      return;
    }

    // No real user match found immediately. Let's see if we can match with a Demo user
    const demoQuery: any = { isDemo: true, isOnline: true };
    if (gender !== 'both') demoQuery.gender = gender;
    if (country && country !== 'All Countries' && country !== 'all') {
      demoQuery.$or = [{ country }, { countryCode: country }];
    }
    let demoUsers = await User.find(demoQuery);
    
    // Fallback 1: match gender without country restriction
    if (demoUsers.length === 0 && gender !== 'both') {
      demoUsers = await User.find({ isDemo: true, isOnline: true, gender });
    }
    // Fallback 2: match any online demo user
    if (demoUsers.length === 0) {
      demoUsers = await User.find({ isDemo: true, isOnline: true });
    }
    // Fallback 3: match any demo user
    if (demoUsers.length === 0) {
      demoUsers = await User.find({ isDemo: true });
    }
    
    if (demoUsers.length > 0) {
      // Pick a random demo user
      const demoUser = demoUsers[Math.floor(Math.random() * demoUsers.length)];
      
      // Add socket to queue first, so they wait for real matches
      ioMatchQueue = ioMatchQueue.filter(entry => entry.userId !== userId);
      ioMatchQueue.push({
        socketId: socket.id,
        userId,
        user: currentUser.toObject(),
        genderPref: gender,
        countryPref: country,
        timestamp: now
      });

      // Simulate matching delay of 2 seconds
      setTimeout(() => {
        // If user already matched with someone else or left queue, do nothing
        if (activeSocketMatches[socket.id]) return;
        if (!ioMatchQueue.find(e => e.socketId === socket.id)) return;

        // Remove from queue
        ioMatchQueue = ioMatchQueue.filter(entry => entry.socketId !== socket.id);

        let videoUrl = demoUser.videoUrl;
        if (!videoUrl || videoUrl.includes('.m3u8') || videoUrl.includes('converter') || !videoUrl.startsWith('/videos/')) {
          videoUrl = demoUser.gender === 'male' ? '/videos/demo-male.mp4' : '/videos/demo-female.mp4';
        }

        // Emit match found with demo user
        socket.emit('match_found', {
          partner: {
            id: demoUser.id, name: demoUser.name, username: demoUser.username, avatar: demoUser.avatar, gender: demoUser.gender,
            country: demoUser.country, countryCode: demoUser.countryCode, age: demoUser.age, likesCount: demoUser.gems || Math.floor(Math.random() * 5000),
            videoUrl: videoUrl,
            isDemo: true
          },
          socketId: `demo_${demoUser.id}`, // Fake socket ID for demo
          initiator: true
        });
        
        // Track fake match
        activeSocketMatches[socket.id] = `demo_${demoUser.id}`;
        activeSocketMatches[`demo_${demoUser.id}`] = socket.id;
        
        socketSessions[`demo_${demoUser.id}`] = { userId: demoUser.id, user: demoUser, startTime: Date.now() };
        if (socketSessions[socket.id]) socketSessions[socket.id].startTime = Date.now();
      }, 1200);
      return;
    }

    // Add to queue if NO real match and NO demo match found
    ioMatchQueue = ioMatchQueue.filter(entry => entry.userId !== userId);
    ioMatchQueue.push({
      socketId: socket.id,
      userId,
      user: currentUser.toObject(),
      genderPref: gender,
      countryPref: country,
      timestamp: now
    });
  });

  socket.on('leave_queue', () => {
    ioMatchQueue = ioMatchQueue.filter(entry => entry.socketId !== socket.id);
  });

  socket.on('signal', (data) => {
    io.to(data.to).emit('signal', {
      from: socket.id,
      signal: data.signal
    });
  });

  socket.on('send_message', async (data) => {
    io.to(data.to).emit('receive_message', {
      from: socket.id,
      text: data.text,
      giftImage: data.giftImage
    });

    try {
      const senderSession = socketSessions[socket.id];
      const receiverSession = socketSessions[data.to];
      const sId = senderSession?.userId;
      const rId = receiverSession?.userId;

      if (sId && rId) {
        const isGift = Boolean(data.giftImage);
        const newMessage = new Message({
          id: `m_${Date.now()}_${Math.random().toString(36).substring(7)}`,
          senderId: sId,
          receiverId: rId,
          text: data.text,
          isGift: isGift,
          giftType: data.giftType || (isGift ? 'gift' : undefined),
          giftAmount: data.giftAmount || 0,
          timestamp: new Date().toISOString()
        });
        await newMessage.save();

        if (isGift && data.giftAmount > 0) {
          const parsedAmount = Number(data.giftAmount) || 0;
          const senderObj = await User.findOne({ id: sId });
          if (senderObj && senderObj.gems >= parsedAmount) {
             const settings: any = await Settings.findOne({ type: 'admin_settings' });
             const commission = settings?.giftCommissionPercentage || 0;
             const earned = Math.floor(parsedAmount * (1 - (commission / 100)));
             
             await User.updateOne({ id: sId }, { $inc: { gems: -parsedAmount } });
             await User.updateOne({ id: rId }, { $inc: { earnedGems: earned } });
          }
        }

        // Note: Bot auto-replies disabled per user request
      }
    } catch (err) {
      console.error('Failed to persist live socket message:', err);
    }
  });

  socket.on('skip_match', async () => {
    const partnerId = activeSocketMatches[socket.id];
    if (partnerId) {
      io.to(partnerId).emit('partner_skipped');
      await endMatch(socket.id, partnerId);
      delete activeSocketMatches[partnerId];
      delete activeSocketMatches[socket.id];
    }
  });

  socket.on('disconnect', () => {
    // Remove from user sockets
    for (const [userId, sockId] of userSockets.entries()) {
      if (sockId === socket.id) {
        userSockets.delete(userId);
        break;
      }
    }

    ioMatchQueue = ioMatchQueue.filter(entry => entry.socketId !== socket.id);
    const partnerId = activeSocketMatches[socket.id];
    if (partnerId) {
      io.to(partnerId).emit('partner_skipped');
      endMatch(socket.id, partnerId).then(() => {
        delete activeSocketMatches[partnerId];
        delete activeSocketMatches[socket.id];
      });
    }
  });
});


app.get('/api/matches/history', authMiddleware, async (req: any, res: any) => {
  try {
    const userId = req.user.id;
    const rawHistory = await History.find({ userId }).sort({ timestamp: -1 }).limit(100).lean();
    
    const currentUser = await User.findOne({ id: userId });
    const currentFollowing = currentUser?.following || [];

    const history = [];
    for (let i = 0; i < rawHistory.length; i++) {
      const h: any = rawHistory[i];
      const partner = await User.findOne({ id: h.partnerId });
      h.isFollowing = currentFollowing.includes(h.partnerId);
      h.isMutualFollow = h.isFollowing && (partner?.following?.includes(userId) || false);
      
      h.partner = {
        id: h.partnerId,
        name: h.partnerName || partner?.name,
        username: h.partnerUsername || partner?.username,
        avatar: h.partnerAvatar || partner?.avatar,
        country: h.partnerCountry || partner?.country,
        age: h.partnerAge || partner?.age
      };
      history.push(h);
    }

    res.json({ history });
  } catch (e) {
    res.json({ history: [] });
  }
});

app.get('/api/matches/viewed-me', authMiddleware, async (req: any, res: any) => {
  try {
    const userId = req.user.id;
    const rawHistory = await History.find({ userId, type: 'view' }).sort({ timestamp: -1 }).limit(100).lean();
    
    const currentUser = await User.findOne({ id: userId });
    const currentFollowing = currentUser?.following || [];

    const history = [];
    for (let i = 0; i < rawHistory.length; i++) {
      const h: any = rawHistory[i];
      const partner = await User.findOne({ id: h.partnerId });
      h.isFollowing = currentFollowing.includes(h.partnerId);
      h.isMutualFollow = h.isFollowing && (partner?.following?.includes(userId) || false);
      
      h.partner = {
        id: h.partnerId,
        name: h.partnerName || partner?.name,
        username: h.partnerUsername || partner?.username,
        avatar: h.partnerAvatar || partner?.avatar,
        country: h.partnerCountry || partner?.country,
        age: h.partnerAge || partner?.age
      };
      history.push(h);
    }

    res.json({ history });
  } catch (e) {
    res.json({ history: [] });
  }
});

// Submit a new report
app.post('/api/reports', async (req: any, res: any) => {
  try {
    let reporterId = 'guest';
    const authHeader = req.headers.authorization;
    if (authHeader && authHeader.startsWith('Bearer ')) {
      try {
        const decoded = jwt.verify(authHeader.split(' ')[1], JWT_SECRET) as any;
        reporterId = decoded.id;
      } catch (e) {}
    }

    const { reportedUserId, reportedUserName, reportedUserAvatar, reason, details } = req.body;
    const newReport = await Report.create({
      id: `rep_${Date.now()}`,
      reporterId,
      reportedUserId,
      reportedUserName,
      reportedUserAvatar,
      reason,
      details,
      status: 'pending'
    });
    res.json({ success: true, report: newReport });
  } catch (e) {
    res.status(500).json({ error: 'Failed to submit report' });
  }
});

app.get('/api/messages/conversations', authMiddleware, async (req: any, res: any) => {
  try {
    const userId = req.user ? req.user.id : 'u_guest';
    
    // Find all messages involving this user
    const messages = await Message.find({
      $or: [{ senderId: userId }, { receiverId: userId }]
    }).sort({ timestamp: -1 });

    const partnersMap = new Map();
    for (const msg of messages) {
      const partnerId = msg.senderId === userId ? msg.receiverId : msg.senderId;
      if (!partnersMap.has(partnerId)) {
        partnersMap.set(partnerId, msg);
      }
    }

    const conversations = [];
    
    for (const [partnerId, lastMsg] of partnersMap.entries()) {
      let partnerData: any = null;
      
      const dbUser = await User.findOne({ id: partnerId });
        if (dbUser) {
          partnerData = {
            id: dbUser.id,
            name: dbUser.name,
            username: dbUser.username,
            avatar: dbUser.avatar || 'https://api.dicebear.com/9.x/avataaars/png?seed=' + dbUser.id,
            country: dbUser.country || 'Unknown',
            isOnline: dbUser.isOnline || false,
          } as any;
        } else {
          // Fallback for guest users generated during video chat
          partnerData = {
            id: partnerId,
            name: 'Guest ' + partnerId.slice(-5),
            username: 'guest_' + partnerId.slice(-5),
            avatar: 'https://api.dicebear.com/9.x/avataaars/png?seed=' + partnerId,
            country: 'Unknown',
            isOnline: false,
          } as any;
        }

      if (partnerData) {
        const unreadCount = messages.filter(m => m.senderId === partnerId && m.receiverId === userId && !m.isRead).length;
        
                conversations.push({
          partnerId: partnerData.id,
          partnerName: partnerData.name,
          partnerUsername: partnerData.username,
          partnerAvatar: partnerData.avatar,
          partnerCountry: partnerData.country,
          isOnline: partnerData.isOnline,
          isFollowing: true,
          lastMessage: lastMsg.text,
          lastMessageTime: lastMsg.timestamp,
          unreadCount: unreadCount
        });
      }
    }

    conversations.sort((a, b) => new Date(b.lastMessageTime).getTime() - new Date(a.lastMessageTime).getTime());

    res.json({ conversations });
  } catch (e) {
    res.json({ conversations: [] });
  }
});

app.get('/api/messages/:partnerId', authMiddleware, async (req: any, res: any) => {
  try {
    const userId = req.user ? req.user.id : 'u_guest';
    const partnerId = req.params.partnerId;
    
    // Pagination params
    const limit = parseInt(req.query.limit as string) || 20;
    const skip = parseInt(req.query.skip as string) || 0;

    const msgs = await Message.find({
      $or: [
        { senderId: userId, receiverId: partnerId },
        { senderId: partnerId, receiverId: userId }
      ]
    })
    .sort({ timestamp: -1 })
    .skip(skip)
    .limit(limit + 1);
    
    const hasMore = msgs.length > limit;
    if (hasMore) {
       msgs.pop();
    }
    
    // Reverse back to ascending order for chronological display
    msgs.reverse();

    res.json({ messages: msgs, hasMore });
  } catch (e) {
    res.json({ messages: [], hasMore: false });
  }
});

app.delete('/api/messages/conversations/:partnerId', async (req: any, res: any) => {
  try {
    const userId = req.user ? req.user.id : 'u_guest';
    const partnerId = req.params.partnerId;
    await Message.deleteMany({
      $or: [
        { senderId: userId, receiverId: partnerId },
        { senderId: partnerId, receiverId: userId }
      ]
    });
    res.json({ success: true });
  } catch (e: any) {
    res.status(500).json({ error: e.message });
  }
});

app.post('/api/messages', async (req: any, res: any) => {
  try {
    const { senderId, receiverId, text, isGift, giftType, giftAmount } = req.body;
    
    // Check mutual follow
    const sender = await User.findOne({ id: senderId });
    const receiver = await User.findOne({ id: receiverId });
    
    // Admin, Demo, Guest, or previously matched users can chat freely
    const isGuestSender = !sender && senderId && senderId.length > 8 && !senderId.startsWith('admin');
    const isGuestReceiver = !receiver && receiverId && receiverId.length > 8 && !receiverId.startsWith('admin');
    const isSpecialCase = sender?.role === 'admin' || receiver?.role === 'admin' ||
                          sender?.isDemo || receiver?.isDemo ||
                          isGuestSender || isGuestReceiver;

    if (!isSpecialCase) {
      const isMutualFollow = sender?.following?.includes(receiverId) && receiver?.following?.includes(senderId);
      const hasMatched = await History.exists({
        $or: [
          { userId: senderId, partnerId: receiverId },
          { userId: receiverId, partnerId: senderId }
        ]
      });

      if (!isMutualFollow && !hasMatched) {
        return res.status(403).json({ error: 'You must mutually follow each other to chat' });
      }
    }

    const newMessage = new Message({
      id: `m_${Date.now()}`,
      senderId,
      receiverId,
      text,
      isGift: isGift || false,
      giftType,
      giftAmount: giftAmount || 0,
      timestamp: new Date().toISOString()
    });
    
    await newMessage.save();

    if (newMessage.isGift && newMessage.giftAmount > 0) {
      const parsedAmount = Number(newMessage.giftAmount) || 0;
      if (parsedAmount > 0) {
            const senderObj = await User.findOne({ id: senderId });
            if (senderObj && senderObj.gems >= parsedAmount) {
               const settings: any = await Settings.findOne({ type: 'admin_settings' });
               const commission = settings?.giftCommissionPercentage || 0;
               const earned = Math.floor(parsedAmount * (1 - (commission / 100)));

               await User.updateOne({ id: senderId }, { $inc: { gems: -parsedAmount } });
               await User.updateOne({ id: receiverId }, { $inc: { earnedGems: earned } });
            } else {
               return res.status(400).json({ error: 'Not enough gems to send this gift' });
            }
        }
    }

      // Emit real-time notification if receiver is online
      const receiverSocketId = userSockets.get(receiverId);
      if (receiverSocketId) {
        io.to(receiverSocketId).emit('new_message_notification', newMessage);
      } else {
        // Send push notification safely if user is offline
        try {
          if (typeof sendPushNotification === 'function') {
            const senderName = req.user ? (req.user.name || req.user.username) : 'Someone';
            sendPushNotification(receiverId, `New message from ${senderName}`, text, { type: 'message', senderId: senderId });
          }
        } catch (pushErr) {
          console.error('Push notification failed (ignored):', pushErr);
        }
      }

      // Note: Bot auto-replies disabled per user request
    
    res.json({ success: true, message: newMessage });
  } catch (e: any) {
    console.error('Error sending message:', e);
    res.status(500).json({ error: e?.message || 'Failed to send' });
  }
});

app.post('/api/messages/read', authMiddleware, async (req: any, res: any) => {
  try {
    const { partnerId } = req.body;
    const userId = req.user.id;
    if (!partnerId) return res.status(400).json({ error: 'Partner ID is required' });

    console.log(`Marking messages from ${partnerId} to ${userId} as read...`);

    // Mark all messages from partnerId to userId as read
    const result = await Message.updateMany(
      { senderId: partnerId, receiverId: userId, isRead: { $ne: true } },
      { $set: { isRead: true } }
    );
    
    console.log(`Update result:`, result);

    res.json({ success: true, matchedCount: result.matchedCount, modifiedCount: result.modifiedCount });
  } catch (e) {
    console.error('Failed to mark as read', e);
    res.status(500).json({ error: 'Failed to update' });
  }
});

}


