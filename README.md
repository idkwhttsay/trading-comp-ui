# Trading Competition

Overview
This project is a user interface (UI) designed for a trading competition, integrating with a matching engine that facilitates order matching, order management, and real-time price updates. The UI provides participants with essential tools to interact with the trading engine by submitting orders, monitoring trades, visualizing the order book, and tracking market prices. It also supports WebSocket integration for real-time communication with the server.

Motivation
The Trading Club will host internal trading competitions, which require infrastructure for order matching and backend processing. This UI connects with a matching engine to offer users a seamless experience for placing and managing trades during these competitions.

Goals
Deliver a clean, functional UI for traders to interact with the matching engine.
Provide users with the ability to submit, cancel, and monitor orders using a REST API.
Visualize the order book, display trade history, and track real-time prices.

Enable real-time communication between the client and server through WebSockets.

Features

1. Order Book Visualization
   Display current buy and sell orders with real-time updates from the server.
   Highlight the best bid/ask prices and show market depth.
2. Order Management
   Submit Orders: Users can place new orders (market, limit, stop-loss, etc.).
   Cancel/Modify Orders: Interface to cancel or modify existing orders.
   Order Status: View real-time status updates on open, filled, or partially filled orders.
3. Real-Time Updates
   Price Tracking: View live prices of assets with real-time updates.
   WebSocket Integration: Real-time communication with the matching engine to receive updates on orders, trades, and prices.
4. Past Trades & Price Charts
   Analyze past trades to study market activity.
   View interactive price charts to observe price movements over time.
5. Position Monitoring
   Track and visualize current positions and see profit/loss status.

Matching Engine/Trading API Integration
The UI interacts with a backend matching engine that powers the trading competition. Here’s how the key components are integrated:

1. Order Book
   The engine maintains the core data structure that lists buy and sell orders, which are visualized in the UI.
   This component prioritizes low-latency performance to handle high-frequency trading efficiently.
2. REST API
   The API allows users to interact with the engine for the following actions:
   Order Submission: Submit new orders (market, limit, stop-loss, etc.).
   Order Cancellation: Cancel or modify open orders.
   Order Query/Visualization: Retrieve the status of orders and visualize them in the UI.
3. Matching Logic
   The matching logic behind the engine matches orders based on price-time priority:
   Price-Time Matching: Orders are matched first based on price, and if the price is the same, on a first-come, first-served basis.
   Partial Fills: When an order is partially filled, the remaining part stays open in the order book.
4. Supported Order Types
   Market Orders: Executed immediately at the best available price.
   Limit Orders: Executed only at a specific price or better.
   Stop-Loss and Stop-Take Orders: Triggers to limit risk or take profits automatically.

Technologies Used
Frontend: HTML, CSS, JavaScript (with libraries/frameworks like React or Vue for a modern user interface).
Backend: Node.js (for handling WebSocket communication), REST APIs for trading operations.
APIs: REST API for order submission, cancellation, and status queries.
WebSocket: For real-time updates on order book changes, prices, and trade executions.
