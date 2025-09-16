import React, { useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { contractAPI, authAPI } from '../services/api';
import { Contract, User } from '../utils/types';

const ContractLanding: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();

  const [user, setUser] = useState<User | null>(null);
  const [contract, setContract] = useState<Contract | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [signing, setSigning] = useState(false);

  useEffect(() => {
    const init = async () => {
      try {
        setLoading(true);
        setError('');

        // 1) Try to get currently logged-in user
        try {
          const profile = await authAPI.getProfile();
          setUser(profile.data);
        } catch (e) {
          setUser(null);
        }

        // 2) Load contract status/info (public status endpoint)
        if (id) {
          try {
            await contractAPI.getStatus(id);
          } catch (e: any) {
            // If status fails, proceed; detailed fetch requires auth anyway
          }
        }

        // 3) If logged in, fetch full contract details (auth required)
        if (id && user) {
          try {
            const { data } = await contractAPI.getContract(id);
            // API returns { contract, annotations }
            setContract((data.contract ?? data) as Contract);
          } catch (e: any) {
            // Not authorized yet; user may not be a party
          }
        }
      } finally {
        setLoading(false);
      }
    };
    init();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [id]);

  const goToLogin = () => {
    localStorage.setItem('postLoginRedirect', `/contracts/${id}`);
    navigate('/login');
  };

  const approveAndSign = async () => {
    if (!id) return;
    if (!user) {
      goToLogin();
      return;
    }
    setSigning(true);
    setError('');
    try {
      // Single-step consent; backend sets party B if needed
      await contractAPI.giveConsent(id);
      const { data } = await contractAPI.getContract(id);
      setContract((data.contract ?? data) as Contract);
    } catch (e: any) {
      setError(e.response?.data?.error || 'Failed to sign');
    } finally {
      setSigning(false);
    }
  };

  const renderContent = () => {
    if (loading) return <p>Loading...</p>;

    return (
      <div style={{ maxWidth: '600px', margin: '0 auto', padding: '20px' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <h2 style={{ marginTop: 0 }}>Contract Invitation</h2>
          <button onClick={() => navigate('/')} style={{ padding: '8px 12px', background: '#6c757d', color: 'white', border: 'none', borderRadius: 4, cursor: 'pointer' }}>Back to Dashboard</button>
        </div>

        {error && (
          <div style={{ color: 'red', background: '#ffebee', padding: '10px', borderRadius: '4px', marginBottom: '16px' }}>{error}</div>
        )}

        <div style={{ background: '#f8f9fa', padding: '16px', borderRadius: '8px', marginBottom: '16px' }}>
          <div style={{ marginBottom: '8px' }}>
            <strong>Contract ID:</strong> {id}
          </div>
          {contract && (
            <div style={{ marginTop: '8px' }}>
              <div><strong>Status:</strong> {contract.status}</div>
              <div><strong>Start:</strong> {new Date(contract.startDateTime).toLocaleString()}</div>
              <div><strong>End:</strong> {new Date(contract.endDateTime).toLocaleString()}</div>
            </div>
          )}
        </div>

        {!user && (
          <div style={{ background: '#fff3cd', padding: '12px', borderRadius: '6px', marginBottom: '12px' }}>
            Please sign in to continue.
          </div>
        )}

        <div style={{ display: 'flex', gap: '10px' }}>
          {!user && (
            <button onClick={goToLogin} style={{ padding: '10px 16px', background: '#1976d2', color: 'white', border: 'none', borderRadius: '4px', cursor: 'pointer' }}>
              Sign in
            </button>
          )}
          <button onClick={approveAndSign} disabled={signing} style={{ padding: '10px 16px', background: '#28a745', color: 'white', border: 'none', borderRadius: '4px', cursor: signing ? 'not-allowed' : 'pointer' }}>
            {signing ? 'Processing...' : user ? 'Approve & Sign' : 'Approve after Sign-in'}
          </button>
        </div>
      </div>
    );
  };

  return renderContent();
};

export default ContractLanding;


