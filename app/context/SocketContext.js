"use client";

import { useEffect, useState, useContext, createContext } from "react";
import io from "socket.io-client";
import { useUser, getToken } from "@clerk/nextjs"; // or useSession

const SocketContext = createContext();

export const useSocket = () => {
  return useContext(SocketContext);
};

export const SocketProvider = ({ children }) => {
  // const [socket, setSocket] = useState(null);
  // const { isLoaded, isSignedIn, user } = useUser(); // This hook provides your session info, including tokens

  // useEffect(() => {
  //   console.log("Auth state:", { isLoaded, user });
  //   if (!isLoaded) return;

  //   //this was added to make sure we listen on 4000 when running locally.  Still need to test in production.
  //   const dev = process.env.NODE_ENV !== "production";
  //   const SOCKET_SERVER_URL = dev
  //     ? "http://localhost:4000"
  //     : "http://209.38.77.21/";
  //   console.log("user: ", user);
  //   const token = user ? user.idToken : null;
  //   const socketIo = io(SOCKET_SERVER_URL, {
  //     auth: { token },
  //   });

  //   // const socketIo = io(SOCKET_SERVER_URL);

  //   setSocket(socketIo);

  //   function cleanup() {
  //     socketIo.disconnect();
  //   }

  //   return cleanup;
  // }, [isLoaded, user]);

  // return (
  //   <SocketContext.Provider value={socket}>{children}</SocketContext.Provider>
  // );
  return (
    <SocketContext.Provider value={null}>{children}</SocketContext.Provider>
  );
};
