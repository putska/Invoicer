"use client";

import { useEffect, useState, useContext, createContext } from "react";
import io from "socket.io-client";

const SocketContext = createContext();

export const useSocket = () => {
  return useContext(SocketContext);
};

export const SocketProvider = ({ children }) => {
  const [socket, setSocket] = useState(null);

  useEffect(() => {
    //this was added to make sure we listen on 4000 when running locally.  Still need to test in production.
    const dev = process.env.NODE_ENV !== "production";
    const SOCKET_SERVER_URL = dev
      ? "http://localhost:4000"
      : "http://209.38.77.21:3000";

    const socketIo = io(SOCKET_SERVER_URL);

    setSocket(socketIo);

    function cleanup() {
      socketIo.disconnect();
    }

    return cleanup;
  }, []);

  return (
    <SocketContext.Provider value={socket}>{children}</SocketContext.Provider>
  );
};
