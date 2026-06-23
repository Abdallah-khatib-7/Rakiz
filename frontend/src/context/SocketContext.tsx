import { createContext, useContext, useEffect, useRef, useState, type ReactNode } from 'react'
import { io } from 'socket.io-client'
import { useAuthStore } from '@/store/authStore'

type SocketContextValue = {
  unreadCount: number
  setUnreadCount: (n: number | ((prev: number) => number)) => void
}

const SocketContext = createContext<SocketContextValue>({
  unreadCount: 0,
  setUnreadCount: () => {},
})

// eslint-disable-next-line react-refresh/only-export-components
export function useSocket() {
  return useContext(SocketContext)
}

export function SocketProvider({ children }: { children: ReactNode }) {
  const accessToken = useAuthStore((s) => s.accessToken)
  const socketRef = useRef<ReturnType<typeof io> | null>(null)
  const [unreadCount, setUnreadCount] = useState(0)

  useEffect(() => {
    if (!accessToken) {
      socketRef.current?.disconnect()
      socketRef.current = null
      return
    }

    const apiUrl = import.meta.env.VITE_API_URL || 'http://localhost:5000'
    const socket = io(apiUrl, {
      auth: { token: accessToken },
      transports: ['websocket'],
    })

    socket.on('notification:new', () => {
      setUnreadCount((prev) => prev + 1)
    })

    socketRef.current = socket

    return () => {
      socket.disconnect()
    }
  }, [accessToken])

  return (
    <SocketContext.Provider value={{ unreadCount, setUnreadCount }}>
      {children}
    </SocketContext.Provider>
  )
}
