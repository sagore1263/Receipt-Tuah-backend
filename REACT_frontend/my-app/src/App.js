// App.js
import { useState, useEffect } from 'react';
import './App.css';
import ChatAssistant from './ChatAssistant';
import { login, signup } from './AuthService';

const Login = ({ onLogin }) => {
  const [isLogin, setIsLogin] = useState(true);
  const [credentials, setCredentials] = useState({
    email: '',
    password: ''
  });
  const [error, setError] = useState('');

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      const authFunction = isLogin ? login : signup;
      const response = await authFunction(credentials.email, credentials.password);
      
      // Store the received token and email
      sessionStorage.setItem('token', response.token);
      sessionStorage.setItem('email', credentials.email); // Use the email from form
      
      // Pass the email to onLogin
      onLogin(credentials.email);
    } catch (err) {
      setError(err.message);
    }
  };

  return (
    <div className="login-container">
      <form onSubmit={handleSubmit} className="login-form">
        <h2>{isLogin ? 'Login' : 'Sign Up'}</h2>
        {error && <div className="error-message">{error}</div>}
        <div className="form-group">
          <label>Email:</label>
          <input
            type="email"
            value={credentials.email}
            onChange={(e) => setCredentials({ ...credentials, email: e.target.value })}
            required
          />
        </div>
        <div className="form-group">
          <label>Password:</label>
          <input
            type="password"
            value={credentials.password}
            onChange={(e) => setCredentials({ ...credentials, password: e.target.value })}
            required
          />
        </div>
        <button type="submit" className="login-button">
          {isLogin ? 'Login' : 'Create Account'}
        </button>
        <button
          type="button"
          className="toggle-button"
          onClick={() => setIsLogin(!isLogin)}
        >
          {isLogin ? 'Create new account' : 'Already have an account?'}
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
      setActiveTab('Home');
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

  // Update the handleFileChange function in App.js
const handleFileChange = (e) => {
  const files = Array.from(e.target.files);
  
  // Process files for preview
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

    // Upload files to backend
    files.forEach(file => {
      const formData = new FormData();
      formData.append("file", file);
      formData.append("email", username); // username is the logged-in email

      fetch('http://localhost:8000/upload-image', {
        method: 'POST',
        body: formData,
        headers: {
          'Authorization': `Bearer ${sessionStorage.getItem('token')}`
        }
      })
      .then(response => {
        if (!response.ok) throw new Error('Upload failed');
        const yur = response.json();
        console.log(yur)
        return yur;
      })
      .then(data => console.log('Upload success:', data))
      .catch(error => console.error('Upload error:', error));
    });
  });
};

   // Update the handleLogin function in App component
   const handleLogin = (email) => {
    sessionStorage.setItem('isAuthenticated', 'true');
    sessionStorage.setItem('email', email);
    setIsAuthenticated(true);
    setUsername(email); // Set username to email
    setActiveTab('Home');
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
        <div className="user-greeting">
          <h2>{children}</h2>
        </div>
        <button onClick={handleLogout} className="logout-button">
          Logout
        </button>
      </div>
      
      {/* Show upload section only on Home tab */}
      {activeTab === 'Home' && (
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
                  ×
                </button>
                <p>{image.name}</p>
              </div>
            ))}
          </div>
        </div>
      )}
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