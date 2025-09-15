import React, { useState } from 'react';
import { contractAPI } from '../services/api';
import { Contract, User } from '../utils/types';

interface QRScannerProps {
  onContractFound: (contract: Contract) => void;
  user?: User;
}

const QRScanner: React.FC<QRScannerProps> = ({ onContractFound, user }) => {
  const [qrCode, setQrCode] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [contract, setContract] = useState<Contract | null>(null);
  const [generatedQR, setGeneratedQR] = useState<string>('');

  const handleQRCodeChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setQrCode(e.target.value);
    setError('');
    setContract(null);
  };

  const handleScan = async () => {
    if (!qrCode.trim()) {
      setError('Please enter a QR code or contract ID');
      return;
    }

    setLoading(true);
    setError('');

    try {
      // Extract contract ID from QR code URL or use as direct ID
      let contractId = qrCode.trim();
      
      // If it's a full URL, extract the contract ID
      if (qrCode.includes('/contracts/')) {
        const match = qrCode.match(/\/contracts\/([a-zA-Z0-9-]+)/);
        if (match) {
          contractId = match[1];
        }
      }

      const response = await contractAPI.getContract(contractId);
      setContract(response.data);
    } catch (err: any) {
      setError(err.response?.data?.error || 'Contract not found');
    } finally {
      setLoading(false);
    }
  };

  const handleSign = async () => {
    if (!contract || !user) {
      setError('Please log in to sign the contract');
      return;
    }

    setLoading(true);
    setError('');

    try {
      // Sign the contract by giving consent
      await contractAPI.giveInitialConsent(contract.contractId);
      
      // Update the contract status
      const response = await contractAPI.getContract(contract.contractId);
      setContract(response.data);
      
      // Notify parent component
      onContractFound(response.data);
      
      setError('');
    } catch (err: any) {
      setError(err.response?.data?.error || 'Failed to sign contract');
    } finally {
      setLoading(false);
    }
  };

  const generateQRCode = async () => {
    if (!user) {
      setError('Please log in to generate QR codes');
      return;
    }

    setLoading(true);
    setError('');

    try {
      // Create a new contract for QR code generation
      const contractData = {
        partyBId: 'pending', // Will be filled when someone scans
        startDateTime: new Date().toISOString(),
        endDateTime: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString() // 24 hours from now
      };

      const response = await contractAPI.create(contractData);
      const newContract = response.data;
      
      // Generate QR code URL
      const qrCodeUrl = `${window.location.origin}/contracts/${newContract.contractId}`;
      setGeneratedQR(qrCodeUrl);
      setContract(newContract);
      
    } catch (err: any) {
      setError(err.response?.data?.error || 'Failed to generate QR code');
    } finally {
      setLoading(false);
    }
  };

  const copyQRCode = () => {
    if (generatedQR) {
      navigator.clipboard.writeText(generatedQR);
      alert('QR Code URL copied to clipboard!');
    }
  };

  const formatDateTime = (dateString: string) => {
    return new Date(dateString).toLocaleString();
  };

  return (
    <div style={{ maxWidth: '800px', margin: '0 auto', padding: '20px' }}>
      <h2>Contract QR Code Scanner & Generator</h2>
      
      {/* QR Code Generator Section */}
      <div style={{ 
        backgroundColor: '#f8f9fa', 
        padding: '20px', 
        borderRadius: '8px', 
        marginBottom: '20px' 
      }}>
        <h3>Generate QR Code for New Contract</h3>
        <p style={{ color: '#666', marginBottom: '15px' }}>
          Create a new contract and generate a QR code that others can scan to sign.
        </p>
        
        <button
          onClick={generateQRCode}
          disabled={loading || !user}
          style={{
            padding: '12px 24px',
            backgroundColor: user ? '#28a745' : '#6c757d',
            color: 'white',
            border: 'none',
            borderRadius: '4px',
            cursor: user ? 'pointer' : 'not-allowed',
            fontSize: '16px',
            marginBottom: '15px'
          }}
        >
          {loading ? 'Generating...' : 'Generate New Contract QR Code'}
        </button>

        {generatedQR && (
          <div style={{ 
            backgroundColor: 'white', 
            padding: '15px', 
            borderRadius: '4px', 
            border: '1px solid #dee2e6' 
          }}>
            <h4>Generated QR Code URL:</h4>
            <div style={{ 
              display: 'flex', 
              gap: '10px', 
              alignItems: 'center',
              marginBottom: '10px'
            }}>
              <input
                type="text"
                value={generatedQR}
                readOnly
                style={{ 
                  flex: 1, 
                  padding: '8px', 
                  border: '1px solid #ccc', 
                  borderRadius: '4px',
                  fontSize: '12px'
                }}
              />
              <button
                onClick={copyQRCode}
                style={{
                  padding: '8px 16px',
                  backgroundColor: '#007bff',
                  color: 'white',
                  border: 'none',
                  borderRadius: '4px',
                  cursor: 'pointer'
                }}
              >
                Copy
              </button>
            </div>
            <p style={{ fontSize: '12px', color: '#666', margin: 0 }}>
              Share this URL or QR code with the other party to sign the contract.
            </p>
          </div>
        )}
      </div>

      {/* QR Code Scanner Section */}
      <div style={{ 
        backgroundColor: '#f8f9fa', 
        padding: '20px', 
        borderRadius: '8px', 
        marginBottom: '20px' 
      }}>
        <h3>Scan QR Code to Sign Contract</h3>
        <p style={{ color: '#666', marginBottom: '15px' }}>
          Enter a QR code or contract ID to view and sign an existing contract.
        </p>
        
        <div style={{ marginBottom: '20px' }}>
          <label style={{ display: 'block', marginBottom: '5px', fontWeight: 'bold' }}>
            Enter QR Code or Contract ID:
          </label>
          <div style={{ display: 'flex', gap: '10px' }}>
            <input
              type="text"
              value={qrCode}
              onChange={handleQRCodeChange}
              placeholder="Scan QR code or enter contract ID"
              style={{ 
                flex: 1, 
                padding: '10px', 
                border: '1px solid #ccc', 
                borderRadius: '4px' 
              }}
            />
            <button
              onClick={handleScan}
              disabled={loading}
              style={{
                padding: '10px 20px',
                backgroundColor: '#1976d2',
                color: 'white',
                border: 'none',
                borderRadius: '4px',
                cursor: loading ? 'not-allowed' : 'pointer'
              }}
            >
              {loading ? 'Scanning...' : 'Scan'}
            </button>
          </div>
        </div>
      </div>

      {error && (
        <div style={{ 
          color: 'red', 
          marginBottom: '20px', 
          padding: '10px', 
          backgroundColor: '#ffebee', 
          borderRadius: '4px' 
        }}>
          {error}
        </div>
      )}

      {contract && (
        <div style={{ 
          border: '1px solid #ddd', 
          borderRadius: '8px', 
          padding: '20px', 
          marginBottom: '20px' 
        }}>
          <h3>Contract Details</h3>
          <div style={{ 
            display: 'grid', 
            gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', 
            gap: '15px',
            marginBottom: '20px'
          }}>
            <div>
              <strong>Contract ID:</strong><br />
              {contract.contractId}
            </div>
            <div>
              <strong>Status:</strong><br />
              <span style={{ 
                padding: '4px 8px',
                borderRadius: '4px',
                backgroundColor: contract.status === 'active' ? '#d4edda' : 
                               contract.status === 'inactive' ? '#fff3cd' : '#f8d7da',
                color: contract.status === 'active' ? '#155724' : 
                       contract.status === 'inactive' ? '#856404' : '#721c24'
              }}>
                {contract.status.toUpperCase()}
              </span>
            </div>
            <div>
              <strong>Start Time:</strong><br />
              {formatDateTime(contract.startDateTime)}
            </div>
            <div>
              <strong>End Time:</strong><br />
              {formatDateTime(contract.endDateTime)}
            </div>
            {contract.revokedBy && (
              <div>
                <strong>Revoked By:</strong><br />
                {contract.revokedBy}
              </div>
            )}
          </div>

          {user && contract.status === 'inactive' && (
            <button
              onClick={handleSign}
              disabled={loading}
              style={{
                width: '100%',
                padding: '12px',
                backgroundColor: '#4caf50',
                color: 'white',
                border: 'none',
                borderRadius: '4px',
                cursor: loading ? 'not-allowed' : 'pointer',
                fontSize: '16px'
              }}
            >
              {loading ? 'Signing...' : 'Sign Contract'}
            </button>
          )}

          {!user && (
            <div style={{ 
              padding: '10px', 
              backgroundColor: '#fff3cd', 
              border: '1px solid #ffeaa7', 
              borderRadius: '4px',
              color: '#856404'
            }}>
              Please log in to sign this contract.
            </div>
          )}

          {contract.status === 'active' && (
            <div style={{ 
              padding: '10px', 
              backgroundColor: '#d4edda', 
              border: '1px solid #c3e6cb', 
              borderRadius: '4px',
              color: '#155724'
            }}>
              This contract is already active and signed by both parties.
            </div>
          )}

          {contract.status === 'revoked' && (
            <div style={{ 
              padding: '10px', 
              backgroundColor: '#f8d7da', 
              border: '1px solid #f5c6cb', 
              borderRadius: '4px',
              color: '#721c24'
            }}>
              This contract has been revoked.
            </div>
          )}
        </div>
      )}

      <div style={{ 
        backgroundColor: '#e9ecef', 
        padding: '15px', 
        borderRadius: '4px',
        fontSize: '14px',
        color: '#495057'
      }}>
        <h4>How it works:</h4>
        <ul style={{ margin: '10px 0', paddingLeft: '20px' }}>
          <li><strong>Generate QR Code:</strong> Create a new contract and get a QR code/URL to share</li>
          <li><strong>Scan QR Code:</strong> Enter the QR code or URL to view contract details</li>
          <li><strong>Sign Contract:</strong> Both parties must sign to activate the contract</li>
          <li><strong>Track Status:</strong> Monitor contract status (inactive, active, revoked)</li>
        </ul>
      </div>
    </div>
  );
};

export default QRScanner;