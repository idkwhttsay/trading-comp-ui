import React, { useEffect, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { buildupHandler, getBuildupData, HTTPStatusCodes } from '../HelperClasses/api.js';
import { useSocket } from '../providers';
import './AuthPage.css';

const AuthPage = () => {
    const [username, setUsername] = useState('');
    const [apiKey, setApiKey] = useState('');
    const [subscribeVar, setSubscribeVar] = useState(0);
    const [auth, setAuth] = useState(false);
    const [error, setError] = useState(null);
    const didAutoBuildupRef = useRef(false);
    const navigate = useNavigate();
    const socket = useSocket();

    useEffect(() => {
        if (didAutoBuildupRef.current) return;
        didAutoBuildupRef.current = true;

        const cachedUsername = localStorage.getItem('username');
        const cachedApiKey = localStorage.getItem('apiKey');
        if (cachedUsername && cachedApiKey) {
            buildupHandler({ username: cachedUsername, apiKey: cachedApiKey }, setSubscribeVar);
        }
    }, []);

    useEffect(() => {
        if (subscribeVar > 0) {
            const data = getBuildupData();

            if (data && data.status === HTTPStatusCodes.OK) {
                setAuth(true);
                socket.connect();
                navigate('/dashboard');
            } else {
                setAuth(false);
                setError('Authentication failed. Please try again.');
            }
        }
    }, [subscribeVar, navigate, socket]);

    const handleApiKeyChange = (e) => {
        setApiKey(e.target.value);
    };

    const handleUsernameChange = (e) => {
        setUsername(e.target.value);
    };

    const handleSubmit = (e) => {
        e.preventDefault();
        setError(null);
        buildupHandler({ username, apiKey }, setSubscribeVar);
    };

    return (
        <div className="auth-page">
            <h2 className="authentication-text"> Authentication Required </h2>
            <p> Please enter your credentials to proceed. </p>

            <input
                type="text"
                value={username}
                onChange={handleUsernameChange}
                placeholder="Your username"
            />
            <input
                type="password"
                value={apiKey}
                onChange={handleApiKeyChange}
                placeholder="Your API Authentication Key"
            />

            <button onClick={handleSubmit}> Submit </button>

            {auth && <p> ✅Authentication Succeeded!Redirecting... </p>}
            {!auth && subscribeVar > 0 && <p> ❌Authentication Failed </p>}
            {error && <p className="error"> {error} </p>}
        </div>
    );
};
export default AuthPage;
