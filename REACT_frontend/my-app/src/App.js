import { useState, useEffect } from 'react';
import './App.css';
import ChatAssistant from './ChatAssistant';
import { login, signup } from './AuthService';
import { PieChart, Pie, Cell, Tooltip, Legend, ResponsiveContainer } from "recharts";
import Webcam from 'react-webcam';
import { useRef } from 'react';

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
      const { email, accountId } = await authFunction(credentials.email, credentials.password);
      
      sessionStorage.setItem('email', email);
      sessionStorage.setItem('accountId', accountId);
      onLogin(email, accountId);
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
  const [receipts, setReceipts] = useState([]);
  const COLORS = ["#8884d8", "#8dd1e1", "#82ca9d", "#a4de6c", "#d0ed57", "#ffc658"];
  const [categoryData, setCategoryData] = useState([]);
const [userId, setUserId] = useState('');
const [chartLoading, setChartLoading] = useState(true);
const [chartError, setChartError] = useState(null);
const [chartRefreshTrigger, setChartRefreshTrigger] = useState(0);
const [useLocation, setUseLocation] = useState(
  sessionStorage.getItem('useLocation') === 'true'
);
const [location, setLocation] = useState(
  sessionStorage.getItem('userLocation') || ''
);
const [locationStatus, setLocationStatus] = useState('');
const [selectedCategory, setSelectedCategory] = useState(null);
const webRef = useRef(null);
  const showImage = () => {
    const file = webRef.current.getScreenshot();
    console.log(file);

        const formData = new FormData();
        formData.append("file", file);
        formData.append("email", username);
  
        fetch('http://localhost:8000/upload-image', {
          method: 'POST',
          body: formData,
          headers: {
            'Authorization': `Bearer ${sessionStorage.getItem('token')}`
          }
        }).then(response => {
          if (!response.ok) throw new Error('Upload failed');
          return response.json();
        }).catch(error => console.error('Upload error:', error));
  };

  useEffect(() => {
    if (userId) {
      setChartLoading(true);
      fetch(`http://localhost:8000/category-pie-chart?id=${userId}`)
        .then(response => {
          if (!response.ok) throw new Error('Failed to fetch categories');
          const yur = response.json();
          console.log(yur)
          return yur;
        })
        .then(data => {
          // Transform API response to Recharts format
          const formattedData = Object.entries(data).map(([name, value]) => ({
            name,
            value
          }));
          setCategoryData(formattedData);
          setChartError(null);
        })
        .catch(error => {
          console.error('Chart data error:', error);
          setChartError(error.message);
        })
        .finally(() => setChartLoading(false));
    }
  }, [userId, chartRefreshTrigger]);

  const fetchSubcategoryData = (category) => {
    setSubcategoryLoading(true);
    fetch(`http://localhost:8000/subcategory-pie-chart?id=${userId}&category=${category}`)
      .then(response => {
        if (!response.ok) throw new Error('Failed to fetch subcategories');
        return response.json();
      })
      .then(data => {
        const formattedData = Object.entries(data).map(([name, value]) => ({
          name,
          value
        }));
        setSubcategoryData(formattedData);
        setViewingSubcategories(true);
      })
      .catch(error => {
        console.error('Subcategory data error:', error);
      })
      .finally(() => setSubcategoryLoading(false));
  };

  const handleBackButton = () => {
    setViewingSubcategories(false);
    setCurrentCategory(null);
  };

  const CategoryPieChart = () => {
    const handleCategoryClick = (category) => {
      setCurrentCategory(category);
      fetchSubcategoryData(category);
    };

    return (
      <div className="chart-container">
        <div className="chart-header">
          <h3>
            {viewingSubcategories ? `${currentCategory} Subcategories` : 'Spending by Category'}
          </h3>
          {viewingSubcategories && (
            <button className="back-button" onClick={handleBackButton}>
              ← Back to Categories
            </button>
          )}
        </div>

        {/* Loading States */}
        {(viewingSubcategories ? subcategoryLoading : chartLoading) ? (
          <div className="loading-message">Loading chart data...</div>
        ) : viewingSubcategories ? (
          // Subcategory Pie Chart
          subcategoryData.length > 0 ? (
            <ResponsiveContainer width="100%" height={300}>
              <PieChart>
                <Pie
                  data={subcategoryData}
                  cx="50%"
                  cy="50%"
                  innerRadius={60}
                  outerRadius={80}
                  paddingAngle={5}
                  dataKey="value"
                >
                  {subcategoryData.map((entry, index) => (
                    <Cell 
                      key={`cell-${index}`} 
                      fill={COLORS[index % COLORS.length]}
                      stroke="#fff"
                    />
                  ))}
                </Pie>
                <Tooltip />
                <Legend />
              </PieChart>
            </ResponsiveContainer>
          ) : (
            <div className="no-data-message">No subcategory data available</div>
          )
        ) : chartError ? (
          // Error display
          <div className="error-message">Error loading chart: {chartError}</div>
        ) : categoryData.length > 0 ? (
          // Main Category Pie Chart
          <ResponsiveContainer width="100%" height={300}>
            <PieChart>
              <Pie
                data={categoryData}
                cx="50%"
                cy="50%"
                innerRadius={60}
                outerRadius={80}
                paddingAngle={5}
                dataKey="value"
                onClick={(data) => handleCategoryClick(data.name)}
              >
                {categoryData.map((entry, index) => (
                  <Cell 
                    key={`cell-${index}`} 
                    fill={COLORS[index % COLORS.length]}
                    stroke="#fff"
                  />
                ))}
              </Pie>
              <Tooltip />
              <Legend />
            </PieChart>
          </ResponsiveContainer>
        ) : (
          <div className="no-data-message">No spending data available</div>
        )}
      </div>
    );
  };

  useEffect(() => {
    const authStatus = sessionStorage.getItem('isAuthenticated');
    const storedEmail = sessionStorage.getItem('email');
    
    if (authStatus === 'true' && storedEmail) {
      setIsAuthenticated(true);
      setUsername(storedEmail);
      setActiveTab('Home');
    }

    const savedImages = localStorage.getItem('images');
    if (savedImages) setImages(JSON.parse(savedImages));
  }, []);

  const processFiles = (files) => {
    // Process files for preview
    const newImagesPromises = files.map(file => {
      return new Promise((resolve) => {
        const reader = new FileReader();
        reader.onloadend = () => {
          resolve({
            id: Date.now() + Math.random(), // Add unique ID
            name: file.name || `Camera_${new Date().toLocaleString()}`,
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
  
      // Upload files and store receipts
      newImages.forEach((image, index) => {
        const file = files[index];
        const formData = new FormData();
        formData.append("file", file);
        formData.append("email", username);
  
        fetch('http://localhost:8000/upload-image', {
          method: 'POST',
          body: formData,
          headers: {
            'Authorization': `Bearer ${sessionStorage.getItem('token')}`
          }
        })
        .then(response => {
          if (!response.ok) throw new Error('Upload failed');
          console.log('Image uploaded successfully');
          return response.json();
        })
        .then(receiptData => {
          console.log('Upload success:', receiptData);
          setReceipts(prev => [...prev, receiptData]);
          const accountId = sessionStorage.getItem('accountId');
          return fetch('http://localhost:3001/receipt', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            id: accountId,
            purchase: receiptData
          })
        })
        .then(response => {
          // Trigger chart refresh by incrementing the refresh trigger
        setChartRefreshTrigger(prev => prev + 1);
          return response.json();
        });
        })
        .catch(error => console.error('Upload error:', error));
      });
    });
  };

  const handleFileChange = (e) => {
    const files = Array.from(e.target.files);
    processFiles(files);
    e.target.value = null; // Reset input
  };

  const handleLogin = (email, accountId) => {
    sessionStorage.setItem('isAuthenticated', 'true');
    sessionStorage.setItem('email', email);
    sessionStorage.setItem('accountId', accountId);
    setIsAuthenticated(true);
    setUsername(email);
    setActiveTab('Home');
    
    // Set user ID from backend response
    fetch(`http://localhost:8000/set-id?id=${accountId}`)
      .then(response => {
        if (!response.ok) throw new Error('ID setting failed');
        return response.json();
      })
      .then(id => {
        console.log('ID set to:', id);
        setUserId(id); // Store the actual user ID from backend
      })
      .catch(error => console.error('ID setting error:', error));
  };
  

  const handleLogout = () => {
  sessionStorage.clear();
  setIsAuthenticated(false);
  setUsername('');
  setReceipts([]);
  setUserId('');
  setCategoryData([]);
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

  const TabContent = ({ children }) => {
    const [selectedCategory, setSelectedCategory] = useState(null);
    const [selectedReceipt, setSelectedReceipt] = useState(null);
  
    // Sample receipt data structure
    const sampleReceipts = [
      {
        id: 1,
        Merchant: "Grocery Store",
        Total: "120.00",
        Date: "2023-08-20",
        Category: "Food",
        Items: [{ name: "Apples", price: 5.00 }, { name: "Bread", price: 3.00 }]
      },
      // Add more sample receipts...
    ];
  
    return (
      <div className="content-area">
        <div className="header-row">
          <div className="user-greeting">
            <h2>{children}</h2>
            <p>Welcome, {username}</p>
          </div>
        </div>
  
        {/* Analytics Section */}
        <div className="analytics-section">
          <h3>Spending Overview</h3>
          <div className="chart-container">
            <CategoryPieChart />
          </div>
  
          {selectedCategory && (
            <div className="category-receipts">
              <h4>Receipts in {selectedCategory}</h4>
              <div className="receipts-list">
                {sampleReceipts
                  .filter(r => r.Category === selectedCategory)
                  .map(receipt => (
                    <div 
                      key={receipt.id} 
                      className="receipt-card"
                      onClick={() => setSelectedReceipt(receipt)}
                    >
                      <div className="receipt-header">
                        <span className="merchant">{receipt.Merchant}</span>
                        <span className="amount">${receipt.Total}</span>
                      </div>
                      <div className="receipt-details">
                        <span>{receipt.Date}</span>
                        <span>{receipt.Items.length} items</span>
                      </div>
                    </div>
                  ))}
              </div>
            </div>
          )}
        </div>
  
        {/* Receipt Detail Modal */}
        {selectedReceipt && (
          <div className="receipt-modal">
            <div className="modal-content">
              <button 
                className="close-modal"
                onClick={() => setSelectedReceipt(null)}
              >
                ×
              </button>
              <h3>{selectedReceipt.Merchant}</h3>
              <p>Date: {selectedReceipt.Date}</p>
              <p>Total: ${selectedReceipt.Total}</p>
              <div className="items-list">
                {selectedReceipt.Items.map((item, index) => (
                  <div key={index} className="item-row">
                    <span>{item.name}</span>
                    <span>${item.price || '0.00'}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}
  
        {/* Upload Section */}
        <div className="upload-section">
          {/* File upload button */}
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
          <Webcam ref={webRef} />
          <button onClick={() => {showImage();}} className="capture-button">Capture</button>
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
      </div>
    );
  };

  if (!isAuthenticated) {
    return <Login onLogin={handleLogin} />;
  }

  return (
    <div className="app-container">
      <div className="sidebar">
        <h1 className="logo">Expense Expert</h1>
        <h2 className="sidebar-title">Records</h2>
        <div className="tabs-container">
          <TabButton name="Home" label="Home" />
          <TabButton name="TabX" label="Tabx" />
          <TabButton name="History" label="History" />
          <TabButton name="Settings" label="Settings" />
        </div>
      </div>
      {activeTab === 'Home' && <TabContent>Home</TabContent>}
      {activeTab === 'TabX' && <TabContent>Tab X Content</TabContent>}
      {activeTab === 'History' && <TabContent>Tab Y Content</TabContent>}
      {activeTab === 'Settings' && (
  <div className="content-area">
    <div className="header-row">
      <div className="user-greeting">
        <h2>Settings</h2>
        <p>Account Preferences</p>
      </div>
    </div>
    
    <div className="settings-container">
      <div className="setting-group">
        <label className="location-toggle">
          <input
            type="checkbox"
            checked={useLocation}
            onChange={(e) => {
              setUseLocation(e.target.checked);
              sessionStorage.setItem('useLocation', e.target.checked);
              if (!e.target.checked) setLocation('');
            }}
          />
          <span>I want answers based on my location</span>
        </label>
        
        {useLocation && (
          <div className="location-input-group">
            <input
              type="text"
              placeholder="Enter your location"
              value={location}
              onChange={(e) => setLocation(e.target.value)}
              className="location-input"
            />
            <button
              onClick={handleLocationSubmit}
              className="location-submit-button"
            >
              Save Location
            </button>
          </div>
        )}
        
        {locationStatus && (
          <div className={`location-status ${locationStatus.includes('Error') ? 'error' : 'success'}`}>
            {locationStatus}
          </div>
        )}
      </div>
      
      <div className="setting-group">
        <h3>Account Actions</h3>
        <button 
          onClick={handleLogout} 
          className="logout-button settings-logout"
        >
          Logout
        </button>
      </div>
    </div>
  </div>
)}
      <ChatAssistant />
    </div>
  );
};

export default App;