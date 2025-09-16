import React, { useState, useEffect } from 'react';
import { contractAPI, authAPI } from '../services/api';
import { User, Contract } from '../utils/types';
import ContractCreator from './ContractCreator';
import ContractManager from './ContractManager';
import QRScanner from './QRScanner';
import { generateProfileQRCodeDataUrl } from '../vendor/qrCodeGen';
import styles from './Dashboard.module.css';

const Dashboard: React.FC<{ user: User; onLogout: () => void }> = ({ user, onLogout }) => {
  const [contracts, setContracts] = useState<Contract[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [showQRScanner, setShowQRScanner] = useState(false);
  const [showContractManager, setShowContractManager] = useState(false);
  const [selectedContract, setSelectedContract] = useState<Contract | null>(null);
  const [stats, setStats] = useState({ totalContracts: 0, activeContracts: 0, revokedContracts: 0, invalidContracts: 0 } as any);
  const [showProfileQR, setShowProfileQR] = useState(false);
  const [profileQRData, setProfileQRData] = useState<string>('');

  useEffect(() => {
    loadContracts();
    loadStats();
  }, []);

  const loadContracts = async () => {
    try {
      // Show all contracts in Contract Management
      const response = await contractAPI.getAll();
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

  const generateProfileQR = () => {
    const payload = {
      userId: user.id,
      totalContracts: stats.totalContracts ?? 0,
      activeContracts: stats.activeContracts ?? 0,
      revokedContracts: stats.revokedContracts ?? 0,
      invalidContracts: stats.invalidContracts ?? 0,
      generatedAt: new Date().toISOString()
    };
    const dataUrl = generateProfileQRCodeDataUrl(JSON.stringify(payload));
    setProfileQRData(dataUrl);
    setShowProfileQR(true);
  };

  const shareProfileQR = async () => {
    try {
      // Convert data URL to blob
      const res = await fetch(profileQRData);
      const blob = await res.blob();
      const file = new File([blob], 'profile-qr.svg', { type: 'image/svg+xml' });
      if ((navigator as any).canShare && (navigator as any).canShare({ files: [file] })) {
        await (navigator as any).share({ files: [file], title: 'Profile QR', text: 'My profile QR code' });
      } else if ((navigator as any).share) {
        await (navigator as any).share({ title: 'Profile QR', text: 'My profile QR code', url: profileQRData });
      } else {
        window.open(profileQRData, '_blank');
      }
    } catch (_) {}
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
            Back to Dashboard
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
            Back to Dashboard
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
            Back to Dashboard
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
            Back to Dashboard
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
    <div className={styles.container}>
      <div className={styles.header}>
        <div>
          <h1>Dashboard</h1>
          <button onClick={generateProfileQR} className={`${styles.btn} ${styles.btnPrimary}`}>
            Profile QR Code
          </button>
        </div>
      </div>

      <div className={styles.grid}>
        {/* Quick Actions */}
        <div className={styles.card}>
          <h3>Quick Actions</h3>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
            <button onClick={() => setShowCreateForm(true)} className={`${styles.btn} ${styles.btnPrimary}`}>
              Create New Contract
            </button>
            <button onClick={() => setShowQRScanner(true)} className={`${styles.btn} ${styles.btnInfo}`}>
              QR Code Scanner
            </button>
            <button onClick={() => setShowContractManager(true)} className={`${styles.btn} ${styles.btnInfo}`}>
              Manage Contracts
            </button>
            {user.role === 'lawyer' && (
              <button className={`${styles.btn} ${styles.btnPrimary}`}>
                Review Contracts
              </button>
            )}
          </div>
        </div>

        {/* Recent Contracts */}
        <div className={styles.card}>
          <h3>Recent Contracts</h3>
          {loading ? (
            <p>Loading contracts...</p>
          ) : error ? (
            <p style={{ color: 'red' }}>{error}</p>
          ) : contracts.length === 0 ? (
            <p>No contracts found. Create your first contract!</p>
          ) : (
            <div>
              {contracts.slice(0, 1).map((contract) => (
                <div key={contract.contractId} onClick={() => setSelectedContract(contract)} className={styles.recentItem}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '5px' }}>
                    <div style={{ fontWeight: 'bold' }}>
                      Contract {contract.contractId.slice(0, 8)}...
                    </div>
                    <span className={`${styles.statusBadge} ${contract.status === 'active' ? styles.statusActive : contract.status === 'revoked' ? styles.statusRevoked : styles.statusInactive}`}>
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
      <div className={styles.card} style={{ marginTop: '30px' }}>
        <div className={styles.grid} style={{ gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))' }}>
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

      {/* Profile QR Modal */}
      {showProfileQR && (
        <div className={styles.qrBackdrop} onClick={() => setShowProfileQR(false)}>
          <div className={styles.qrModal} onClick={e => e.stopPropagation()}>
            <h3 style={{ marginTop: 0, color: '#333' }}>Your Profile QR Code</h3>

            <div style={{ marginBottom: '20px' }}>
              {/* QR Code Only */}
              <div style={{ 
                display: 'flex', 
                justifyContent: 'center', 
                marginBottom: '20px',
                padding: '20px',
                backgroundColor: 'white',
                border: '1px solid #dee2e6',
                borderRadius: '8px'
              }}>
                <object data={profileQRData} type="image/svg+xml" style={{ width: 200, height: 200 }}>
                  <img src={profileQRData} alt="QR Code" style={{ width: 200, height: 200 }} />
                </object>
              </div>
            </div>

            <div className={styles.qrActions}>
              <button onClick={shareProfileQR} className={`${styles.btn} ${styles.btnInfo}`}>Share QR Code</button>
              <a href={profileQRData} download="profile-qr.svg" className={`${styles.btn} ${styles.btnPrimary}`}>Download QR Code</a>
              <button onClick={() => setShowProfileQR(false)} className={`${styles.btn} ${styles.btnDanger}`}>Close</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Dashboard;
