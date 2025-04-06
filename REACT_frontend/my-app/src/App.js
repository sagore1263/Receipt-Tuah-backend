import { useState, useEffect } from 'react';
import './App.css';
import ChatAssistant from './ChatAssistant';
import { login, signup } from './AuthService';
import { PieChart, Pie, Cell, Tooltip, ResponsiveContainer, Legend } from 'recharts';


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
  // Add this inside your App component
  const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042', '#A28DFF'];
  const categoryData = [
    { name: 'Food', value: 400 },
    { name: 'Utilities', value: 300 },
    { name: 'Shopping', value: 300 },
    { name: 'Travel', value: 200 },
    { name: 'Other', value: 278 },
  ];
  
  // Add state for selected category
  const [selectedCategory, setSelectedCategory] = useState(null);
const sampleCategoryData = [
  { name: 'Food', value: 400 },
  { name: 'Utilities', value: 300 },
  { name: 'Shopping', value: 300 },
  { name: 'Travel', value: 200 },
  { name: 'Other', value: 278 },
];
  
  // Create chart component
  const CategoryPieChart = () => (
    <div className="chart-container">
      <h3>Spending by Category</h3>
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
            onClick={(data) => setSelectedCategory(data.name)}
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
        </PieChart>
      </ResponsiveContainer>
    </div>
  );

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

      // Upload files and store receipts
      files.forEach(file => {
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
        });
        })
        .catch(error => console.error('Upload error:', error));
      });
    });
  };

  const handleLogin = (email, accountId) => {
    sessionStorage.setItem('isAuthenticated', 'true');
    sessionStorage.setItem('email', email);
    sessionStorage.setItem('accountId', accountId);
    setIsAuthenticated(true);
    setUsername(email);
    setActiveTab('Home');
  };

  const handleLogout = () => {
    sessionStorage.clear();
    setIsAuthenticated(false);
    setUsername('');
    setReceipts([]);
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
          <button onClick={handleLogout} className="logout-button">
            Logout
          </button>
        </div>
  
        {/* Analytics Section */}
        <div className="analytics-section">
          <h3>Spending Overview</h3>
          <div className="chart-container">
            <ResponsiveContainer width="100%" height={300}>
              <PieChart>
                <Pie
                  data={sampleCategoryData}
                  cx="50%"
                  cy="50%"
                  innerRadius={60}
                  outerRadius={80}
                  paddingAngle={5}
                  dataKey="value"
                  onClick={(data) => setSelectedCategory(data.name)}
                >
                  {sampleCategoryData.map((entry, index) => (
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
                {receipts[index] && (
                  <div className="receipt-info">
                    <p>Total: ${receipts[index].Total}</p>
                    <p>Merchant: {receipts[index].Merchant}</p>
                  </div>
                )}
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