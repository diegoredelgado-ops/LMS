import React, { useEffect, useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { toast } from 'sonner';
import { GraduationCap, Loader2 } from 'lucide-react';

const GitHubCallback = () => {
  const [searchParams] = useSearchParams();
  const { loginWithGitHub } = useAuth();
  const navigate = useNavigate();
  const [error, setError] = useState(null);

  useEffect(() => {
    const code = searchParams.get('code');
    
    if (code) {
      loginWithGitHub(code)
        .then(() => {
          toast.success('Successfully logged in with GitHub!');
          navigate('/dashboard');
        })
        .catch((err) => {
          console.error('GitHub login error:', err);
          setError(err.response?.data?.detail || 'GitHub login failed');
          toast.error('GitHub login failed');
          setTimeout(() => navigate('/login'), 3000);
        });
    } else {
      setError('No authorization code received');
      setTimeout(() => navigate('/login'), 3000);
    }
  }, [searchParams, loginWithGitHub, navigate]);

  return (
    <div className="min-h-screen bg-background flex items-center justify-center">
      <div className="text-center space-y-6">
        <GraduationCap className="w-16 h-16 text-primary mx-auto" />
        
        {error ? (
          <>
            <h2 className="text-xl font-semibold text-destructive">{error}</h2>
            <p className="text-muted-foreground">Redirecting to login...</p>
          </>
        ) : (
          <>
            <Loader2 className="w-8 h-8 animate-spin text-primary mx-auto" />
            <h2 className="text-xl font-semibold">Completing GitHub Login...</h2>
            <p className="text-muted-foreground">Please wait while we authenticate you.</p>
          </>
        )}
      </div>
    </div>
  );
};

export default GitHubCallback;
