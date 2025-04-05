// App.js
import { useState, useEffect } from 'react';
import './App.css';
import { a } from 'framer-motion/client';
import ChatAssistant from './ChatAssistant';
const Login = ({ onLogin }) => {
  const [credentials, setCredentials] = useState({
    username: '',
    password: ''
  });

  const handleSubmit = (e) => {
    e.preventDefault();
    if (credentials.username && credentials.password) {
      onLogin(credentials.username); // Pass username to parent
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
  const [username, setUsername] = useState('');
  // Check authentication on mount
  useEffect(() => {
    const authStatus = sessionStorage.getItem('isAuthenticated');
    if (authStatus === 'true') {
      setIsAuthenticated(true);
    }
    const storedUsername = sessionStorage.getItem('username');
    if (authStatus === 'true' && storedUsername) {
      setIsAuthenticated(true);
      setUsername(storedUsername);
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

   // Update login handler
   const handleLogin = (username) => {
    sessionStorage.setItem('isAuthenticated', 'true');
    sessionStorage.setItem('username', username);
    setIsAuthenticated(true);
    setUsername(username);
  };

  const handleLogout = () => {
    sessionStorage.removeItem('isAuthenticated');
    sessionStorage.removeItem('username');
    setIsAuthenticated(false);
    setUsername('');
  };
  const handleDeleteImage = (indexToDelete) => {
    setImages(prev => {
      const updatedImages = prev.filter((_, index) => index !== indexToDelete);
      localStorage.setItem('images', JSON.stringify(updatedImages));
      return updatedImages;
    });
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
          <p>Welcome, {username}</p>
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
               <button 
              className="delete-image-btn"
              onClick={() => handleDeleteImage(index)}
            >
              x
            </button>
              <p>{image.name}</p>
            </div>
          ))}
        </div>
      </div>
    </div>
  );

  if (!isAuthenticated) {
    return <Login onLogin={handleLogin} />;
  }

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
      {activeTab === 'Home' && <TabContent>Home</TabContent>}
      {activeTab === 'TabX' && <TabContent>Tab X Content</TabContent>}
      {activeTab === 'TabY' && <TabContent>Tab Y Content</TabContent>}
      {activeTab === 'TabZ' && <TabContent>Tab Z Content</TabContent>}
      <ChatAssistant />
    </div>
  );
};

export default App;