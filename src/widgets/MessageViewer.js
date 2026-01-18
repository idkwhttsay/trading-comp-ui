import React, { useState, useEffect } from 'react';
import { getMessageList, ErrorCodes } from '../HelperClasses/api';
import { controls } from '../HelperClasses/controls';
import './MessageViewer.css';

const MessageViewer = () => {
  const [messages, setMessages] = useState([]);
  const [initialized, setInitialized] = useState(false);
  const [subscribeVar, setSubscribeVar] = useState(0);

  useEffect(() => {
    if (!initialized) {
      controls.messageSubscriber = setSubscribeVar;
      setInitialized(true);
    }
  }, [initialized]);

  useEffect(() => {
    const messages = getMessageList();
    const reversedMessages = [...messages].reverse();
    setMessages(reversedMessages);
  }, [subscribeVar]);

  return (
    <div className="message-viewer">
      <div className="message-widget">
        {messages.map((msg, index) => (
          <div
            key={index}
            className={msg.errorCode === ErrorCodes.SUCCESS ? 'message-success' : 'message-error'}
          >
            {msg.errorMessage}
          </div>
        ))}
      </div>
    </div>
  );
};

export default MessageViewer;
