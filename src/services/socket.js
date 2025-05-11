import io from 'socket.io-client';
import { Platform } from 'react-native';
import { API_URL } from '@env';

// For iOS simulator, use localhost
// For Android emulator, use 10.0.2.2
const SOCKET_URL = Platform.OS === 'ios' ? 'http://localhost:5001' : 'http://10.0.2.2:5001';

// Event types
const EVENTS = {
  JOIN_AUCTION: 'join_auction',
  LEAVE_AUCTION: 'leave_auction',
  NEW_BID: 'new_bid',
  PLACE_BID: 'place_bid',
  AUCTION_ENDED: 'auction_ended',
  OUTBID: 'outbid',
  AUCTION_STARTED: 'auction_started',
  ERROR: 'error'
};

class SocketService {
  constructor() {
    this.socket = null;
    this.connected = false;
    this.reconnectAttempts = 0;
    this.maxReconnectAttempts = 5;
  }

  connect() {
    if (!this.socket) {
      console.log(`Connecting to socket server at ${SOCKET_URL}`);
      
      this.socket = io(SOCKET_URL, {
        transports: ['websocket'],
        autoConnect: true,
        reconnection: true,
        reconnectionAttempts: this.maxReconnectAttempts,
        reconnectionDelay: 1000,
        reconnectionDelayMax: 5000,
        timeout: 20000,
        forceNew: true
      });

      this.setupEventListeners();
    }
    return this.socket;
  }

  setupEventListeners() {
    if (!this.socket) return;

    this.socket.on('connect', () => {
      console.log('Connected to WebSocket server');
      this.connected = true;
      this.reconnectAttempts = 0;
    });

    this.socket.on('disconnect', () => {
      console.log('Disconnected from WebSocket server');
      this.connected = false;
    });

    this.socket.on('connect_error', (error) => {
      console.error('Connection error:', error);
      this.reconnectAttempts++;
      
      if (this.reconnectAttempts >= this.maxReconnectAttempts) {
        console.error('Max reconnection attempts reached');
        this.disconnect();
      }
    });

    this.socket.on('error', (error) => {
      console.error('WebSocket error:', error);
    });
  }

  disconnect() {
    if (this.socket) {
      this.removeAllListeners();
      this.socket.disconnect();
      this.socket = null;
      this.connected = false;
      console.log('Socket disconnected');
    }
  }

  isConnected() {
    return this.connected && this.socket?.connected;
  }

  joinAuction(auctionId) {
    if (this.isConnected()) {
      console.log(`Joining auction room: auction_${auctionId}`);
      this.socket.emit(EVENTS.JOIN_AUCTION, auctionId);
      console.log('Joined auction room:', auctionId);
    } else {
      console.warn('Socket not connected. Attempting to reconnect...');
      this.connect();
    }
  }

  leaveAuction(auctionId) {
    if (this.isConnected()) {
      console.log(`Leaving auction room: auction_${auctionId}`);
      this.socket.emit(EVENTS.LEAVE_AUCTION, auctionId);
      console.log('Left auction room:', auctionId);
    }
  }

  onNewBid(callback) {
    if (this.socket) {
      this.socket.on(EVENTS.NEW_BID, (data) => {
        console.log('New bid received:', data);
        callback(data);
      });
    }
  }

  onAuctionEnded(callback) {
    if (this.socket) {
      this.socket.on(EVENTS.AUCTION_ENDED, callback);
    }
  }

  onOutbid(callback) {
    if (this.socket) {
      this.socket.on(EVENTS.OUTBID, callback);
    }
  }

  onAuctionStarted(callback) {
    if (this.socket) {
      this.socket.on(EVENTS.AUCTION_STARTED, callback);
    }
  }

  placeBid(auctionId, amount) {
    if (this.isConnected()) {
      console.log(`Placing bid on auction ${auctionId}:`, amount);
      this.socket.emit(EVENTS.PLACE_BID, { auctionId, amount });
    } else {
      console.warn('Socket not connected. Cannot place bid.');
    }
  }

  removeAllListeners() {
    if (this.socket) {
      Object.values(EVENTS).forEach(event => {
        this.socket.removeAllListeners(event);
      });
      console.log('Removed all socket listeners');
    }
  }
}

// Create a singleton instance
const socketService = new SocketService();
export default socketService;