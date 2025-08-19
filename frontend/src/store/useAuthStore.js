import { create } from "zustand";
import { axiosInstance } from "../lib/axios.js";
import toast from "react-hot-toast";
import { io } from "socket.io-client";

const BASE_URL = import.meta.env.MODE === "development" ? "http://localhost:5001" : "/";

export const useAuthStore = create((set, get) => ({
  authUser: null,
  isSigningUp: false,
  isLoggingIn: false,
  isUpdatingProfile: false,
  isCheckingAuth: true,
  onlineUsers: [],
  socket: null,


checkAuth: async () => {
  try {
    const res = await axiosInstance.get("/auth/check");
    set({ authUser: res.data });
    get().connectSocket();
  } catch (error) {
    console.log("Error in checkAuth:", error);
    set({ authUser: null });
  } finally {
    set({ isCheckingAuth: false });
  }
},

signup: async (data) => {
  set({ isSigningUp: true });
  try {
    const res = await axiosInstance.post("/auth/signup", data);
    set({ authUser: res.data });
    toast.success("Account created successfully");
    get().connectSocket();
  } catch (error) {
    toast.error(error.response.data.message);
  } finally {
    set({ isSigningUp: false });
  }
},

login: async (data) => {
  set({ isLoggingIn: true });
  try {
    const res = await axiosInstance.post("/auth/login", data);
    set({ authUser: res.data });
    toast.success("Logged in successfully");

    get().connectSocket();
  } catch (error) {
    toast.error(error.response.data.message);
  } finally {
    set({ isLoggingIn: false });
  }
},

logout: async () => {
  try {
    await axiosInstance.post("/auth/logout");
    get().disconnectSocket(); // Disconnect socket first
    set({ authUser: null, onlineUsers: [] }); // Then clear state
    toast.success("Logged out successfully");
  } catch (error) {
    toast.error(error.response.data.message);
  }
},

updateProfile: async (data) => {
    set({ isUpdatingProfile: true });
    try {
      const res = await axiosInstance.put("/auth/update-profile", data);
      set({ authUser: res.data });
      toast.success("Profile updated successfully");
    } catch (error) {
      console.log("error in update profile:", error);
      toast.error(error.response.data.message);
    } finally {
      set({ isUpdatingProfile: false });
    }
},

// And update the connectSocket function to handle reconnections better
connectSocket: () => {
  const { authUser, socket } = get();
  if (!authUser) return;
  // If socket already exists and is connected, don't create a new one
  if (socket?.connected) return;
  // If socket exists but is disconnected, disconnect it first
  if (socket) {
    socket.disconnect();
    socket.off("getOnlineUsers");
  }
  const newSocket = io(BASE_URL, {
    query: {
      userId: authUser._id,
    },
  });
  newSocket.connect();
  set({ socket: newSocket });
  newSocket.on("getOnlineUsers", (userIds) => {
    set({ onlineUsers: userIds });
  });
  
  // Handle socket errors and reconnections
  newSocket.on("disconnect", () => {
    console.log("Socket disconnected");
  });
  
  newSocket.on("connect_error", (error) => {
    console.log("Socket connection error:", error);
  });
},
 // In useAuthStore.js, update the disconnectSocket function
disconnectSocket: () => {
  const { socket } = get();
  if (socket?.connected) {
    socket.disconnect();
    socket.off("getOnlineUsers"); // Remove the event listener
    set({ socket: null, onlineUsers: [] });
  }
},

}));
