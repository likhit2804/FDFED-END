import { useEffect, useRef, useState } from "react";
import { io } from "socket.io-client";

export const useSocket = (url = "", options = {}) => {
  const socketRef = useRef(null);
  const [socket, setSocket] = useState(null);

  useEffect(() => {
    // Get token from localStorage (set during login)
    const token = localStorage.getItem("token");

    console.log(
      "🔍 useSocket Hook - Token in localStorage:",
      token ? "✅ Found" : "❌ Not found"
    );

    if (!token) {
      console.warn(
        "⚠️ No token found in localStorage. Socket connection skipped."
      );
      return;
    }

    // Connect with token in auth object
    console.log("🔗 Connecting to Socket.IO at:", url);
    const s = io(url, {
      withCredentials: true,
      auth: {
        token: token,
      },
      reconnection: true,
      reconnectionDelay: 1000,
      reconnectionAttempts: 10,
      ...options,
    });

    socketRef.current = s;
    setSocket(s);

    s.on("connect", () => {
      console.log("✅ Socket connected with ID:", s.id);
    });

    s.on("connect_error", (error) => {
      console.error("❌ Socket connection error:", error);
    });

    s.on("disconnect", (reason) => {
      console.log("❌ Socket disconnected. Reason:", reason);
      setSocket(null);
    });

    return () => {
      if (s) s.disconnect();
    };
  }, []);

  return socket;
};
