document.addEventListener('DOMContentLoaded', () => {
  const loginForm = document.getElementById('loginForm');
  const registerForm = document.getElementById('registerForm');

  // Handle login
  loginForm.addEventListener('submit', async (e) => {
    e.preventDefault();
    const username = document.getElementById('username').value.trim();
    const password = document.getElementById('password').value;

    if (!username || !password) {
      alert('Please fill in all fields');
      return;
    }

    try {
      const response = await fetch('/api/login', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ username, password }),
      });

      const data = await response.json();
      
      if (data.success) {
        // Store user data in localStorage
        localStorage.setItem('userData', JSON.stringify(data.user));
        alert('Login successful! Welcome back, ' + data.user.username);
        // Use replace instead of href to prevent back button issues
        window.location.replace('/dashboard');
      } else {
        alert(data.message);
      }
    } catch (error) {
      alert('Error during login. Please try again.');
      console.error('Login error:', error);
    }
  });

  // Handle registration
  registerForm.addEventListener('submit', async (e) => {
    e.preventDefault();
    const username = document.getElementById('reg-username').value.trim();
    const email = document.getElementById('reg-email').value.trim();
    const password = document.getElementById('reg-password').value;

    // Basic validation
    if (!username || !email || !password) {
      alert('Please fill in all fields');
      return;
    }

    if (username.length < 3) {
      alert('Username must be at least 3 characters long');
      return;
    }

    if (password.length < 6) {
      alert('Password must be at least 6 characters long');
      return;
    }

    if (!email.match(/^\w+([\.-]?\w+)*@\w+([\.-]?\w+)*(\.\w{2,3})+$/)) {
      alert('Please enter a valid email address');
      return;
    }

    try {
      const response = await fetch('/api/register', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ username, email, password }),
      });

      const data = await response.json();
      
      if (data.success) {
        alert(data.message);
        // Clear registration form
        document.getElementById('reg-username').value = '';
        document.getElementById('reg-email').value = '';
        document.getElementById('reg-password').value = '';
        // Switch to login form and pre-fill username
        document.getElementById('loginForm').style.display = 'block';
        document.getElementById('registerForm').style.display = 'none';
        document.getElementById('username').value = username;
        document.getElementById('password').focus();
      } else {
        alert(data.message);
      }
    } catch (error) {
      alert('Error during registration. Please try again.');
      console.error('Registration error:', error);
    }
  });

  console.log('Script loaded successfully!'); // Debug line
}); 