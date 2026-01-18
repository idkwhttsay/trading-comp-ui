import { createLogger } from '../util/logger';
import { safeParse } from '../util/validation';
import { PortfolioMessageSchema } from '../domain/schemas';

const log = createLogger('UserPortfolio');

class UserPortfolio {
    constructor() {
        this.data = {
            balance: 0,
            pnl: 0,
            positions: {},
            username: null,
            Orders: [],
        };
        this.subscribers = [];
    }

    // Subscribe to changes
    subscribe(callback) {
        if (typeof callback === 'function') {
            this.subscribers.push(callback);
        }
    }

    // Unsubscribe from changes
    unsubscribe(callback) {
        this.subscribers = this.subscribers.filter((sub) => sub !== callback);
    }

    // Notify all subscribers
    _notifySubscribers() {
        this.subscribers.forEach((callback) => callback(this.data));
    }

    // Update portfolio and notify subscribers
    updatePortfolio(message) {
        const validated = safeParse(PortfolioMessageSchema, message, {
            source: 'portfolio-update',
        });
        if (!validated) {
            log.warn('Dropping invalid portfolio message');
            return;
        }

        const { Orders, balance, pnl, positions, username } = validated;

        if (balance !== undefined) {
            this.data.balance = balance;
        }
        if (pnl !== undefined) {
            this.data.pnl = pnl;
            //console.log(pnl);
        }
        if (positions && typeof positions === 'object') {
            this.data.positions = { ...this.data.positions, ...positions };
        }
        if (username) {
            //
            this.data.username = username;
        }
        if (Orders && typeof Orders === 'object') {
            let orderList = [];
            Object.keys(Orders).forEach((ticker) => {
                Orders[ticker].forEach((order) => {
                    orderList.push({ ...order, ticker });
                });
            });
            this.data.Orders = orderList;
        } else {
            this.data.Orders = [];
        }

        this._notifySubscribers(); // Notify on updates
        //console.log("Portfolio updated:", this.data);
    }

    getPortfolio() {
        return { ...this.data };
    }
}

const userPortfolio = new UserPortfolio();
export default userPortfolio;
