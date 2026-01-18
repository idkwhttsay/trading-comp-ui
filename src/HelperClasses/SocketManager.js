import { Client } from "@stomp/stompjs";
import { getBuildupData } from "../HelperClasses/api";
import orderBookInstance from "../HelperClasses/OrderBook";
import userPortfolio from "./UserPortfolio";
import CandlestickTracker from "./CandlestickTracker"

class SocketManager {
    constructor() {
        this.stompClient = null;
        this.connected = false;
    }

    // Initialize and configure the WebSocket connection
    async connect() {
        // Retrieve parameters from getBuildupData
        const buildupData = getBuildupData();

        if (!buildupData || !buildupData.sessionToken || !buildupData.username) {
            console.error("Buildup data is incomplete or unavailable!");
            return;
        }

        // Construct WebSocket URL with sessionId and username
        /*
        const brokerURL = `ws://ec2-13-59-143-196.us-east-2.compute.amazonaws.com:8080/exchange-socket?Session-ID=${encodeURIComponent(
            buildupData.sessionToken
        )}&Username=${encodeURIComponent(buildupData.username)}`; */
        
        const brokerURL = `ws://localhost:8080/exchange-socket?Session-ID=${encodeURIComponent(
            buildupData.sessionToken
        )}&Username=${encodeURIComponent(buildupData.username)}`
	
        // const brokerURL = `ws://ec2-18-220-60-154.us-east-2.compute.amazonaws.com:8080/exchange-socket?Session-ID=${encodeURIComponent(
        //     buildupData.sessionToken
        // )}&Username=${encodeURIComponent(buildupData.username)}`

        // Create a new STOMP client
        this.stompClient = new Client({
            brokerURL: brokerURL,
            debug: (str) => {
                //console.log(str); // Debugging logs
            },
            reconnectDelay: 5000, // Reconnect after 5 seconds if disconnected
            heartbeatIncoming: 4000, // Client heartbeat
            heartbeatOutgoing: 4000, // Server heartbeat
        });

        // Define event handlers
        this.stompClient.onConnect = (frame) => {
            this.connected = true;
            console.log("Connected to WebSocket:", frame);

            // Subscribe to topics (public and private)
            this.subscribeToTopics();
        };

        this.stompClient.onWebSocketError = (error) => {
            console.error("WebSocket Error:", error);
        };

        this.stompClient.onStompError = (frame) => {
            console.error("STOMP Error:", frame.headers["message"]);
            console.error("Additional details:", frame.body);
        };

        // Activate the WebSocket connection
        this.stompClient.activate();
    }

    // Subscribe to specific topics
    subscribeToTopics() {
        if (!this.stompClient || !this.connected) {
            console.error("Cannot subscribe: WebSocket client is not connected.");
            return;
        }

        // Subscribe to public orderbook updates
        this.stompClient.subscribe("/topic/orderbook", (message) => {
            //console.log("Orderbook message received:", message.body);
            this.handleOrderbookMessage(JSON.parse(message.body));
        });

        // Subscribe to private user-specific updates
        this.stompClient.subscribe("/user/queue/private", (message) => {
            //console.log("Private message received:", message.body);
            this.handlePrivateMessage(JSON.parse(message.body));
        });
        this.stompClient.subscribe("/topic/chart", (message) => {
            this.handleChartUpdate(JSON.parse(message.body));
        });
    }

    // Disconnect from the WebSocket server
    disconnect() {
        if (this.stompClient) {
            this.stompClient.deactivate();
            this.connected = false;
            console.log("Disconnected from WebSocket.");
        }
    }

    // Handle incoming public orderbook messages
    handleOrderbookMessage(data) {
        //console.log("Handling orderbook message:", data);

        const updates = JSON.parse(data.content);
        //console.log("OrderBook Update", updates)
        // Pass updates directly to the OrderBook instance
        orderBookInstance.updateVolumes(updates);
    }

    // Handle incoming private messages
    handlePrivateMessage(data) {
        //console.log("Handling private message:", data);
        try {
            // Ensure the message contains valid JSON content
            if (!data) {
                console.warn("Received an empty or invalid private message:", data);
                return;
            }

            // Parse the message content (assuming it's a JSON string)
            //console.log("📊 Parsed Private Message Content:", data);

            // Update the user's portfolio using the parsed message
            userPortfolio.updatePortfolio(data);

            //console.log("✅ User portfolio updated successfully.");
        } catch (error) {
            console.error("❌ Error processing private message:", error);
        }
    }
    handleChartUpdate(data) {
        if (!data || typeof data !== "object") {
            console.warn("⚠ Received invalid chart update:", data);
            return;
        }
    
        console.log("📊 Received Chart Update:", data);
    
        Object.entries(data).forEach(([ticker, ohlc]) => {
            if (
                typeof ohlc.open === "number" &&
                typeof ohlc.high === "number" &&
                typeof ohlc.low === "number" &&
                typeof ohlc.close === "number"
            ) {
                CandlestickTracker.insertCandle(ticker, {
                    open: ohlc.open,
                    high: ohlc.high,
                    low: ohlc.low,
                    close: ohlc.close,
                    timestamp: Date.now() // Use the current timestamp
                });
            } else {
                console.warn(`⚠ Invalid OHLC data for ${ticker}:`, ohlc);
            }
        });
    }
    
    

    // Add your logic to process private messages

    // Publish messages to a specific destination
    sendMessage(destination, body) {
        if (!this.stompClient || !this.connected) {
            console.error("Cannot send message: WebSocket client is not connected.");
            return;
        }

        this.stompClient.publish({
            destination: destination,
            body: JSON.stringify(body),
        });

        //console.log(`Message sent to ${destination}:`, body);
    }
}

// Export a singleton instance of SocketManager
const socketManager = new SocketManager();
export default socketManager;
