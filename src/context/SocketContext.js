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
    // Connects to the same origin by default
    const socketIo = io();

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
