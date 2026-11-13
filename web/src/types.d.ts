/// <reference types="vite/client" />

declare module '@/services/socket' {
  import type { Socket } from 'socket.io-client'

  export const socket: Socket
}
