export const getCsrfToken = () => {
  const cookie = document.cookie
    .split(';')
    .map((value) => value.trim())
    .find((value) => value.startsWith('csrftoken='));
  return cookie ? decodeURIComponent(cookie.slice('csrftoken='.length)) : '';
};

export const clearAuthState = (navigate, setIsAuthenticated, setUsername) => {
  localStorage.removeItem('token');
  localStorage.removeItem('refresh_token');
  localStorage.removeItem('username');
  localStorage.removeItem('availableRooms');
  setIsAuthenticated(false);
  setUsername('');
  navigate('/', {replace: true});
};

export const refreshAccessToken = async (
  navigate,
  setIsAuthenticated,
  setUsername
) => {
  const refreshToken = localStorage.getItem('refresh_token');
  if (!refreshToken) {
    clearAuthState(navigate, setIsAuthenticated, setUsername);
    return false;
  }

  try {
    const response = await fetch('/api/token/refresh/', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'X-CSRFToken': getCsrfToken(),
      },
      body: JSON.stringify({refresh_token: refreshToken}),
    });
    if (!response.ok) {
      throw new Error('Unable to refresh login');
    }
    const data = await response.json();
    localStorage.setItem('token', data.access);
    return true;
  } catch (error) {
    clearAuthState(navigate, setIsAuthenticated, setUsername);
    return false;
  }
};

export const authenticatedFetch = async (
  url,
  options,
  navigate,
  setIsAuthenticated,
  setUsername
) => {
  const makeRequest = () =>
    fetch(url, {
      ...options,
      headers: {
        ...(options?.headers || {}),
        Authorization: `Bearer ${localStorage.getItem('token')}`,
        'X-CSRFToken': getCsrfToken(),
      },
    });

  let response = await makeRequest();
  if (response.status === 401) {
    const refreshed = await refreshAccessToken(
      navigate,
      setIsAuthenticated,
      setUsername
    );
    if (!refreshed) return response;
    response = await makeRequest();
  }
  return response;
};

export const websocketUrl = (roomName) => {
  const protocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
  const token = encodeURIComponent(localStorage.getItem('token') || '');
  return `${protocol}//${window.location.host}/ws/${roomName}/?token=${token}`;
};
