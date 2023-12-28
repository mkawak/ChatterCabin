import {getCsrfToken} from '../components/Auth';


const logout = async (navigate, setIsAuthenticated, setUsername) => {
  try {
    await fetch('/api/logout/', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'X-CSRFToken': getCsrfToken(),
      },
      body: JSON.stringify({
        refresh_token: localStorage.getItem('refresh_token'),
      }),
    });
  } finally {
    localStorage.removeItem('token');
    localStorage.removeItem('refresh_token');
    localStorage.removeItem('username');
    localStorage.removeItem('availableRooms');
    setIsAuthenticated(false);
    setUsername('');
    navigate('/', {replace: true});
  }
};

export default logout;
