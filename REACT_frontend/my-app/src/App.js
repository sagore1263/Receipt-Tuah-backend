// App.js
import { useState, useEffect } from 'react';
import './App.css';
import { a } from 'framer-motion/client';

const Login = ({ onLogin }) => {
  const [credentials, setCredentials] = useState({
    username: '',
    password: ''
  });

  const handleSubmit = (e) => {
    e.preventDefault();
    // Simple validation - replace with real authentication logic
    if (credentials.username && credentials.password) {
      sessionStorage.setItem('isAuthenticated', 'true');
      onLogin();
    }
  };

  return (
    <div className="login-container">
      <form onSubmit={handleSubmit} className="login-form">
        <h2>Login</h2>
        <div className="form-group">
          <label>Username:</label>
          <input
            type="text"
            value={credentials.username}
            onChange={(e) => setCredentials({ ...credentials, username: e.target.value })}
          />
        </div>
        <div className="form-group">
          <label>Password:</label>
          <input
            type="password"
            value={credentials.password}
            onChange={(e) => setCredentials({ ...credentials, password: e.target.value })}
          />
        </div>
        <button type="submit" className="login-button">
          Login
        </button>
      </form>
    </div>
  );
};

const App = () => {
  const [activeTab, setActiveTab] = useState('Home');
  const [images, setImages] = useState([]);
  const [isAuthenticated, setIsAuthenticated] = useState(false);

  // Check authentication on mount
  useEffect(() => {
    const authStatus = sessionStorage.getItem('isAuthenticated');
    if (authStatus === 'true') {
      setIsAuthenticated(true);
    }
    
    // Load images from localStorage
    const savedImages = localStorage.getItem('images');
    if (savedImages) {
      setImages(JSON.parse(savedImages));
    }
  }, []);

  const handleFileChange = (e) => {
    const files = Array.from(e.target.files);
    const newImagesPromises = files.map(file => {
      return new Promise((resolve) => {
        const reader = new FileReader();
        reader.onloadend = () => {
          resolve({
            name: file.name,
            url: reader.result,
            size: file.size,
            type: file.type,
            lastModified: file.lastModified,
          });
        };
        reader.readAsDataURL(file);
      });
    });

    Promise.all(newImagesPromises).then(newImages => {
      setImages(prev => {
        const updatedImages = [...prev, ...newImages];
        localStorage.setItem('images', JSON.stringify(updatedImages));
        return updatedImages;
      });
      e.target.value = null;
    });
  };

  const handleLogout = () => {
    sessionStorage.removeItem('isAuthenticated');
    setIsAuthenticated(false);
    // Images remain in localStorage
  };

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
      <div className="header-row">
        <h2>{children}</h2>
        <button onClick={handleLogout} className="logout-button">
          Logout
        </button>
      </div>
      <div className="upload-section">
        <input
          type="file"
          id="upload-input"
          style={{ display: 'none' }}
          onChange={handleFileChange}
          accept="image/*"
          multiple
        />
        <label htmlFor="upload-input" className="upload-button">
          Upload image
        </label>
        <div className="image-preview-container">
          {images.map((image, index) => (
            <div key={index} className="image-preview">
              <img 
                src={image.url} 
                alt={image.name}
                className="preview-image"
              />
              <p>{image.name}</p>
            </div>
          ))}
        </div>
      </div>
    </div>
  );

  if (!isAuthenticated) {
    return <Login onLogin={() => setIsAuthenticated(true)} />;
  }

  return (
    <div className="app-container">
      <div className="sidebar">
        <h1 className="logo">Recip</h1>
        <h2 className="sidebar-title">Records</h2>
        <div className="tabs-container">
          <TabButton name="Home" label="Home" />
          <TabButton name="TabX" label="Tabx" />
          <TabButton name="TabY" label="Taby" />
          <TabButton name="TabZ" label="Tabz" />
        </div>
      </div>
      {activeTab === 'Home' && <TabContent>Home</TabContent>}
      {activeTab === 'TabX' && <TabContent>Tab X Content</TabContent>}
      {activeTab === 'TabY' && <TabContent>Tab Y Content</TabContent>}
      {activeTab === 'TabZ' && <TabContent>Tab Z Content</TabContent>}
    </div>
  );
};

export default App;