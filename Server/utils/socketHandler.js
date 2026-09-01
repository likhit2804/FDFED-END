import jwt from "jsonwebtoken";

// helper: extract JWT token from socket handshake (auth, cookies, or query)
function getTokenFromSocketHandshake(socket) {
  // Priority 1: auth object (sent via socket.io-client config)
  if (socket.handshake.auth?.token) {
    return socket.handshake.auth.token;
  }

  // Priority 2: cookies (httpOnly cookie)
  const cookieHeader = socket.handshake.headers?.cookie;
  if (cookieHeader) {
    const tokenCookie = cookieHeader
      .split(";")
      .map((c) => c.trim())
      .find((c) => c.startsWith("token="));

    if (tokenCookie) {
      const token = tokenCookie.split("=")[1];
      if (token && token !== "undefined") return token;
    }
  }

  return null;
}

export function initSocketHandlers(io) {
  io.on("connection", (socket) => {
    console.log("🔥 Socket connected:", socket.id);

    try {
      const token = getTokenFromSocketHandshake(socket);
      console.log("🔍 Token extracted:", token ? "✅ Found" : "❌ Not found");

      if (token) {
        const payload = jwt.verify(token, process.env.JWT_SECRET);
        console.log("✅ Token verified. Payload:", {
          id: payload.id,
          email: payload.email,
          userType: payload.userType,
          community: payload.community,
        });

        // Join Community Broadcast Room
        if (payload.community) {
          const communityRoom = `community_${payload.community}`;
          socket.join(communityRoom);
          socket.data.communityId = payload.community;
          console.log(`✅ ${payload.userType} (${payload.id}) joined community room: ${communityRoom}`);
        }

        // Join Role/Personal Specific Rooms
        if (payload.userType === "CommunityManager" || payload.userType === "communityManager") {
          socket.data.userId = payload.id;
          socket.data.userType = payload.userType;
          console.log(`✅ Manager (${payload.id}) online`);
        } else if (payload.userType === "Resident") {
          const residentRoom = `resident_${payload.id}`;
          socket.join(residentRoom);
          socket.data.userId = payload.id;
          socket.data.userType = payload.userType;
          console.log(`✅ Resident (${payload.id}) joined room: ${residentRoom}`);
        } else if (payload.userType === "Worker") {
          const workerRoom = `worker_${payload.id}`;
          socket.join(workerRoom);
          socket.data.userId = payload.id;
          socket.data.userType = payload.userType;
          console.log(`✅ Worker (${payload.id}) joined room: ${workerRoom}`);
        } else if (payload.userType === "Security") {
          const securityRoom = `security_${payload.id}`;
          socket.join(securityRoom);
          socket.data.userId = payload.id;
          socket.data.userType = payload.userType;
          console.log(`✅ Security (${payload.id}) joined room: ${securityRoom}`);
        } else {
          console.log(`ℹ️ User type '${payload.userType}' does not have a personal room mapping`);
        }
      } else {
        console.warn("⚠️ No token provided in socket handshake");
      }
    } catch (err) {
      console.warn("❌ Socket auth failed:", err.message);
    }

    socket.on("disconnect", () => {
      console.log("❌ Socket disconnected:", socket.id);
    });
  });
}
