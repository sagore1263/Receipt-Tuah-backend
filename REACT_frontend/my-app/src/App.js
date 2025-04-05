// App.js
import { useState } from 'react';
import './App.css';

const App = () => {
  const [activeTab, setActiveTab] = useState('Home');

  const TabButton = ({ name, label }) => (
    <button 
      className={`tab-button ${activeTab === name ? 'active' : ''}`}
      onClick={() => setActiveTab(name)}
    >
      {label}
    </button>
  );

  const TabContent = ({ children }) => (
    <div className="content-area">
      <h2>{children}</h2>
      <div className="upload-section">
        <input
          type="file"
          id="upload-input"
          style={{ display: 'none' }}
          onChange={() => {}} // Placeholder for now
        />
        <label htmlFor="upload-input" className="upload-button">
          Upload image
        </label>
      </div>
    </div>
  );

  return (
    <div className="app-container">
      <div className="sidebar">
        <h1 className="logo">Receipt Tuah</h1>
        <h2 className="sidebar-title">Records</h2>
        <div className="tabs-container">
          <TabButton name="Home" label="Home" />
          <TabButton name="TabX" label="Tabx" />
          <TabButton name="TabY" label="Taby" />
          <TabButton name="TabZ" label="Tabz" />
        </div>
      </div>
      {activeTab === 'Home' && <TabContent>Home Content</TabContent>}
      {activeTab === 'TabX' && <TabContent>Tab X Content</TabContent>}
      {activeTab === 'TabY' && <TabContent>Tab Y Content</TabContent>}
      {activeTab === 'TabZ' && <TabContent>Tab Z Content</TabContent>}
    </div>
  );
};

export default App;
