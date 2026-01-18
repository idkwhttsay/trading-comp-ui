import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import './profile.css';

const Profile = () => {
  const [username] = useState(localStorage.getItem('username'));
  const navigate = useNavigate();

  const handleLogout = () => {
    localStorage.removeItem('username');
    localStorage.removeItem('apiKey');
    navigate('/');
  };

  return (
    <div className="profile-widget">
      <p>
        <strong>Username: </strong>
        {username}
      </p>
      <button onClick={handleLogout}>Logout</button>
    </div>
  );
};

export default Profile;
