// AuthService.js (or in your component)
export const login = async (email, password) => {
    try {
      const response = await fetch('http://localhost:3001/login', { // Add http://
        method: 'POST',
        mode: 'cors',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          email: email,
          password: password
        })
      });
  
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Login failed');
      }
  
      const data = await response.json();
      
      // Store token and user data
      sessionStorage.setItem('authToken', data.token);
      sessionStorage.setItem('userEmail', data.email);
      
      return data;
    } catch (error) {
      console.error('Login error:', error);
      throw error;
    }
  };
  
  export const signup = async (email, password) => {
      const response = await fetch('http://localhost:3001/signup', {
        method: 'POST',
        mode: 'cors',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          email: email,
          password: password
        })
      });
  
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Registration failed');
      }
  
      return await response.json();
    
  };