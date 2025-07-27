import React from 'react';
import { GoogleLogin } from '@react-oauth/google';
import { jwtDecode } from 'jwt-decode';

const GoogleAuthTest = () => {
  const handleSuccess = (credentialResponse) => {
    try {
      const decoded = jwtDecode(credentialResponse.credential);
      console.log('✅ Google OAuth Success:', {
        credential: credentialResponse.credential,
        decoded: decoded,
        clientId: process.env.REACT_APP_GOOGLE_CLIENT_ID,
        currentUrl: window.location.href
      });
      alert('Google OAuth Success! Check console for details.');
    } catch (error) {
      console.error('❌ Decode error:', error);
      alert('Google OAuth succeeded but failed to decode token');
    }
  };

  const handleError = (error) => {
    console.error('❌ Google OAuth Error:', {
      error: error,
      clientId: process.env.REACT_APP_GOOGLE_CLIENT_ID,
      currentUrl: window.location.href
    });
    alert('Google OAuth failed! Check console for details.');
  };

  return (
    <div style={{ padding: '20px', border: '1px solid #ccc', margin: '20px' }}>
      <h3>Google OAuth Test</h3>
      <p><strong>Current URL:</strong> {window.location.href}</p>
      <p><strong>Client ID:</strong> {process.env.REACT_APP_GOOGLE_CLIENT_ID}</p>
      <GoogleLogin
        onSuccess={handleSuccess}
        onError={handleError}
        useOneTap={false}
        theme="outline"
        size="large"
      />
    </div>
  );
};

export default GoogleAuthTest;
