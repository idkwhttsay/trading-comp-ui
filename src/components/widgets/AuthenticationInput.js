import React, { useState, useEffect } from 'react';
import './AuthenticationInput.css';
import { buildupHandler, getBuildupData } from '../../lib/api';

const AuthenticationInput = () => {
    const [username, setUsername] = useState('');
    const [apiKey, setApiKey] = useState(''); // Store input value
    const [subscribeVar, setSubscribeVar] = useState(0);
    const [auth, setAuth] = useState(false);

    useEffect(() => {
        if (subscribeVar > 0) {
            let data = getBuildupData();
            setAuth(data['success'] && data['auth']);
        }
    }, [subscribeVar]);

    const handleApiKeyChange = (e) => {
        setApiKey(e.target.value); // Update state with new input value
    };

    const handleUsernameChange = (e) => {
        setUsername(e.target.value); // Update state with new input value
    };

    const handleSubmit = (e) => {
        e.preventDefault(); // Prevent form submission from refreshing page
        // Send input data to parent component via callback
        buildupHandler(
            {
                username: username,
                apiKey: apiKey,
            },
            setSubscribeVar,
        );
    };

    return (
        <div className="API-Auth">
            <input
                type="text"
                value={username}
                onChange={handleUsernameChange}
                placeholder="Your username"
            />
            <input
                type="text"
                value={apiKey}
                onChange={handleApiKeyChange}
                placeholder="Your API Authentication Key"
            />
            <button onClick={handleSubmit}>Submit</button>
            {auth && <p>Authentication Succeeded</p>}
            {!auth && subscribeVar > 0 && <p>Authentication Failed</p>}
        </div>
    );
};

export default AuthenticationInput;
