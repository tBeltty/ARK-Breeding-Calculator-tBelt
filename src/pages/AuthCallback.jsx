import { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { authService } from '../services/authService';

export default function AuthCallback() {
    const navigate = useNavigate();

    useEffect(() => {
        const success = authService.handleCallback();
        if (success) {
            // Fetch user profile immediately
            authService.getUserProfile().then(() => {
                navigate('/dashboard');
            });
        } else {
            navigate('/');
        }
    }, [navigate]);

    return (
        <div style={{
            display: 'flex',
            justifyContent: 'center',
            alignItems: 'center',
            height: '100vh',
            background: 'var(--surface)',
            color: 'var(--on-surface)'
        }}>
            <h2>Authenticating with Discord...</h2>
        </div>
    );
}
