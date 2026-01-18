import React from 'react';
import './Contestdash.css';
import Announcement from './Announcement';
import DataFinder from '../../lib/DataFinder';

const Contestdash = () => {
    return (
        <div className="Contestdash">
            {DataFinder.getAllAnouncements().map((item) => (
                <Announcement key={item.id} text={item.text} />
            ))}
        </div>
    );
};

export default Contestdash;
