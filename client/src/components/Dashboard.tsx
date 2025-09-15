import React, { useState, useEffect } from 'react';
import { contractAPI, authAPI } from '../services/api';
import { User, Contract, getUserDisplayId } from '../utils/types';
import ContractCreator from './ContractCreator';
import ContractManager from './ContractManager';
import QRScanner from './QRScanner';

const Dashboard: React.FC<{ user: User; onLogout: () => void }> = ({ user, onLogout }) => {
  const [contracts, setContracts] = useState<Contract[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [showQRScanner, setShowQRScanner] = useState(false);
  const [showContractManager, setShowContractManager] = useState(false);
  const [selectedContract, setSelectedContract] = useState<Contract | null>(null);
  const [stats, setStats] = useState({ totalContracts: 0, activeContracts: 0, revokedContracts: 0 });

  useEffect(() => {
    loadContracts();
    loadStats();
  }, []);

  const loadContracts = async () => {
    try {
      const response = await contractAPI.getMyContracts();
      setContracts(response.data);
    } catch (err: any) {
      setError('Failed to load contracts');
    } finally {
      setLoading(false);
    }
  };

  const loadStats = async () => {
    try {
      const response = await authAPI.getStats();
      setStats(response.data);
    } catch (err: any) {
      console.error('Failed to load stats');
    }
  };

  const handleContractCreated = (contract: Contract) => {
    setContracts([contract, ...contracts]);
    setShowCreateForm(false);
    loadStats();
  };

  const handleContractUpdated = (updatedContract: Contract) => {
    setContracts(contracts.map(c => 
      c.contractId === updatedContract.contractId ? updatedContract : c
    ));
    setSelectedContract(updatedContract);
    loadStats();
  };

  const handleLogout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    onLogout();
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'draft': return '#ff9800';
      case 'pending': return '#2196f3';
      case 'active': return '#4caf50';
      case 'revoked': return '#f44336';
      case 'invalid': return '#9c27b0';
      default: return '#666';
    }
  };

  if (showCreateForm) {
    return (
      <div style={{ padding: '20px' }}>
        <div style={{ marginBottom: '20px' }}>
          <button
            onClick={() => setShowCreateForm(false)}
            style={{
              padding: '8px 16px',
              backgroundColor: '#666',
              color: 'white',
              border: 'none',
              borderRadius: '4px',
              cursor: 'pointer'
            }}
          >
            ← Back to Dashboard
          </button>
        </div>
        <ContractCreator user={user} onContractCreated={handleContractCreated} />
      </div>
    );
  }

  if (showContractManager) {
    return (
      <div style={{ padding: '20px' }}>
        <div style={{ marginBottom: '20px' }}>
          <button
            onClick={() => setShowContractManager(false)}
            style={{
              padding: '8px 16px',
              backgroundColor: '#6c757d',
              color: 'white',
              border: 'none',
              borderRadius: '4px',
              cursor: 'pointer'
            }}
          >
            ← Back to Dashboard
          </button>
        </div>
        <ContractManager 
          contracts={contracts}
          user={user}
          onContractUpdated={handleContractUpdated}
          onContractDeleted={(contractId) => {
            setContracts(contracts.filter(c => c.contractId !== contractId));
            loadStats();
          }}
          onGenerateQR={(contract) => {
            // Navigate to QR scanner with the contract
            setShowContractManager(false);
            setShowQRScanner(true);
          }}
        />
      </div>
    );
  }

  if (selectedContract) {
    return (
      <div style={{ padding: '20px' }}>
        <div style={{ marginBottom: '20px' }}>
          <button
            onClick={() => setSelectedContract(null)}
            style={{
              padding: '8px 16px',
              backgroundColor: '#666',
              color: 'white',
              border: 'none',
              borderRadius: '4px',
              cursor: 'pointer'
            }}
          >
            ← Back to Dashboard
          </button>
        </div>
        <div style={{ 
          backgroundColor: '#f8f9fa', 
          padding: '20px', 
          borderRadius: '8px',
          marginBottom: '20px'
        }}>
          <h2 style={{ margin: '0 0 20px 0' }}>Contract Details</h2>
          
          <div style={{ 
            display: 'grid', 
            gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', 
            gap: '20px',
            marginBottom: '20px'
          }}>
            <div>
              <strong>Contract ID:</strong><br />
              {selectedContract.contractId}
            </div>
            <div>
              <strong>Status:</strong><br />
              <span style={{
                padding: '4px 8px',
                borderRadius: '4px',
                backgroundColor: selectedContract.status === 'active' ? '#d4edda' : 
                               selectedContract.status === 'inactive' ? '#fff3cd' : '#f8d7da',
                color: selectedContract.status === 'active' ? '#155724' : 
                       selectedContract.status === 'inactive' ? '#856404' : '#721c24'
              }}>
                {selectedContract.status.toUpperCase()}
              </span>
            </div>
            <div>
              <strong>Start Time:</strong><br />
              {new Date(selectedContract.startDateTime).toLocaleString()}
            </div>
            <div>
              <strong>End Time:</strong><br />
              {new Date(selectedContract.endDateTime).toLocaleString()}
            </div>
            {selectedContract.revokedBy && (
              <div>
                <strong>Revoked By:</strong><br />
                {selectedContract.revokedBy}
              </div>
            )}
          </div>
        </div>
      </div>
    );
  }

  if (showQRScanner) {
    return (
      <div style={{ padding: '20px' }}>
        <div style={{ marginBottom: '20px' }}>
          <button
            onClick={() => setShowQRScanner(false)}
            style={{
              padding: '8px 16px',
              backgroundColor: '#6c757d',
              color: 'white',
              border: 'none',
              borderRadius: '4px',
              cursor: 'pointer'
            }}
          >
            ← Back to Dashboard
          </button>
        </div>
        <QRScanner 
          user={user}
          onContractFound={handleContractUpdated} 
        />
      </div>
    );
  }

  return (
    <div style={{ padding: '20px' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '30px' }}>
        <div>
          <h1>Dashboard</h1>
          <p>Welcome, {getUserDisplayId(user)} ({user.role})</p>
          <p style={{ fontSize: '14px', color: '#666' }}>
            Active: {user.signCount} | Revoked: {user.revokeCount}
          </p>
        </div>
        <button
          onClick={handleLogout}
          style={{
            padding: '8px 16px',
            backgroundColor: '#dc004e',
            color: 'white',
            border: 'none',
            borderRadius: '4px',
            cursor: 'pointer'
          }}
        >
          Logout
        </button>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: '20px' }}>
        {/* Quick Actions */}
        <div style={{ border: '1px solid #ddd', borderRadius: '8px', padding: '20px' }}>
          <h3>Quick Actions</h3>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
            <button
              onClick={() => setShowCreateForm(true)}
              style={{
                padding: '10px',
                backgroundColor: '#1976d2',
                color: 'white',
                border: 'none',
                borderRadius: '4px',
                cursor: 'pointer'
              }}
            >
              Create New Contract
            </button>
            <button
              onClick={() => setShowQRScanner(true)}
              style={{
                padding: '10px',
                backgroundColor: '#28a745',
                color: 'white',
                border: 'none',
                borderRadius: '4px',
                cursor: 'pointer'
              }}
            >
              QR Code Scanner
            </button>
            <button
              onClick={() => setShowContractManager(true)}
              style={{
                padding: '10px',
                backgroundColor: '#17a2b8',
                color: 'white',
                border: 'none',
                borderRadius: '4px',
                cursor: 'pointer'
              }}
            >
              Manage Contracts
            </button>
            {user.role === 'lawyer' && (
              <button
                style={{
                  padding: '10px',
                  backgroundColor: '#ff9800',
                  color: 'white',
                  border: 'none',
                  borderRadius: '4px',
                  cursor: 'pointer'
                }}
              >
                Review Contracts
              </button>
            )}
          </div>
        </div>

        {/* Recent Contracts */}
        <div style={{ border: '1px solid #ddd', borderRadius: '8px', padding: '20px' }}>
          <h3>Recent Contracts</h3>
          {loading ? (
            <p>Loading contracts...</p>
          ) : error ? (
            <p style={{ color: 'red' }}>{error}</p>
          ) : contracts.length === 0 ? (
            <p>No contracts found. Create your first contract!</p>
          ) : (
            <div>
              {contracts.slice(0, 5).map((contract) => (
                <div
                  key={contract.contractId}
                  onClick={() => setSelectedContract(contract)}
                  style={{
                    padding: '15px',
                    border: '1px solid #eee',
                    borderRadius: '4px',
                    marginBottom: '10px',
                    cursor: 'pointer',
                    transition: 'background-color 0.2s'
                  }}
                  onMouseEnter={(e) => e.currentTarget.style.backgroundColor = '#f5f5f5'}
                  onMouseLeave={(e) => e.currentTarget.style.backgroundColor = 'white'}
                >
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '5px' }}>
                    <div style={{ fontWeight: 'bold' }}>
                      Contract {contract.contractId.slice(0, 8)}...
                    </div>
                    <span style={{ 
                      padding: '2px 8px', 
                      borderRadius: '12px', 
                      color: 'white', 
                      backgroundColor: getStatusColor(contract.status),
                      fontSize: '12px'
                    }}>
                      {contract.status.toUpperCase()}
                    </span>
                  </div>
                  <div style={{ fontSize: '14px', color: '#666' }}>
                    <div>Contract ID: {contract.contractId}</div>
                    <div>Status: {contract.status}</div>
                    {contract.revokedBy && <div>Revoked by: {contract.revokedBy}</div>}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* User Stats */}
      <div style={{ marginTop: '30px', border: '1px solid #ddd', borderRadius: '8px', padding: '20px' }}>
        <h3>Your Statistics</h3>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '20px' }}>
          <div style={{ textAlign: 'center' }}>
            <div style={{ fontSize: '24px', fontWeight: 'bold', color: '#1976d2' }}>
              {stats.totalContracts}
            </div>
            <div>Total Contracts</div>
          </div>
          <div style={{ textAlign: 'center' }}>
            <div style={{ fontSize: '24px', fontWeight: 'bold', color: '#4caf50' }}>
              {stats.activeContracts}
            </div>
            <div>Active Contracts</div>
          </div>
          <div style={{ textAlign: 'center' }}>
            <div style={{ fontSize: '24px', fontWeight: 'bold', color: '#f44336' }}>
              {stats.revokedContracts}
            </div>
            <div>Revoked Contracts</div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;
