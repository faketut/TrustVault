import React, { useState, useRef, useEffect } from 'react';
import { contractAPI } from '../services/api';
import { Contract, User } from '../utils/types';

interface QRScannerProps {
  onContractFound: (contract: Contract) => void;
  user?: User;
}

const QRScanner: React.FC<QRScannerProps> = ({ onContractFound, user }) => {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [contract, setContract] = useState<Contract | null>(null);
  const [isScanning, setIsScanning] = useState(false);
  // Deprecated confirmation modal and interim scanned state removed
  const videoRef = useRef<HTMLVideoElement>(null);
  const streamRef = useRef<MediaStream | null>(null);

  // Cleanup camera stream on unmount
  useEffect(() => {
    return () => {
      if (streamRef.current) {
        streamRef.current.getTracks().forEach(track => track.stop());
      }
    };
  }, []);

  // Manual input removed

  const startCameraScanning = async () => {
    try {
      setError('');
      setIsScanning(true);
      
      const stream = await navigator.mediaDevices.getUserMedia({ 
        video: { 
          facingMode: 'environment' // Use back camera if available
        } 
      });
      
      streamRef.current = stream;
      
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        videoRef.current.play();
      }
      
      // Start QR code detection
      detectQRCode();
      
    } catch (err: any) {
      setError('Camera access denied or not available. Please allow camera access and try again.');
      setIsScanning(false);
    }
  };

  const stopCameraScanning = () => {
    if (streamRef.current) {
      streamRef.current.getTracks().forEach(track => track.stop());
      streamRef.current = null;
    }
    setIsScanning(false);
  };

  const detectQRCode = () => {};

  // Deprecated auto-detect and confirmation signing flow removed

  // Manual input removed

  const handleSign = async () => {
    if (!contract || !user) {
      setError('Please log in to sign the contract');
      return;
    }

    setLoading(true);
    setError('');

    try {
      // Sign the contract by giving consent (single-step)
      await contractAPI.giveConsent(contract.contractId);
      
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

  // QR Generation removed per latest requirements

  const formatDateTime = (dateString: string) => {
    return new Date(dateString).toLocaleString();
  };

  return (
    <div style={{ maxWidth: '800px', margin: '0 auto', padding: '20px' }}>
      <style>
        {`
          @keyframes pulse {
            0% { opacity: 1; }
            50% { opacity: 0.5; }
            100% { opacity: 1; }
          }
        `}
      </style>
      <h2>Contract QR Code Scanner</h2>
      
      

      {/* QR Code Scanner Section */}
      <div style={{ 
        backgroundColor: '#f8f9fa', 
        padding: '20px', 
        borderRadius: '8px', 
        marginBottom: '20px' 
      }}>
        <h3>Scan QR Code to Sign Contract</h3>
        <p style={{ color: '#666', marginBottom: '15px' }}>
          Use your camera to scan a QR code or manually enter a contract ID.
        </p>
        
        {/* Camera Scanner */}
        <div style={{ marginBottom: '20px' }}>
          <div style={{ display: 'flex', gap: '10px', marginBottom: '15px' }}>
            <button
              onClick={isScanning ? stopCameraScanning : startCameraScanning}
              disabled={loading}
              style={{
                padding: '10px 20px',
                backgroundColor: isScanning ? '#dc3545' : '#28a745',
                color: 'white',
                border: 'none',
                borderRadius: '4px',
                cursor: loading ? 'not-allowed' : 'pointer'
              }}
            >
              {isScanning ? 'Stop Camera' : 'Start Camera Scan'}
            </button>
          </div>
          
          {isScanning && (
            <div style={{ 
              position: 'relative',
              maxWidth: '400px',
              margin: '0 auto',
              border: '2px solid #007bff',
              borderRadius: '8px',
              overflow: 'hidden'
            }}>
              <video
                ref={videoRef}
                style={{ 
                  width: '100%', 
                  height: 'auto',
                  display: 'block'
                }}
                playsInline
                muted
              />
              <div style={{
                position: 'absolute',
                top: '50%',
                left: '50%',
                transform: 'translate(-50%, -50%)',
                width: '200px',
                height: '200px',
                border: '2px solid #fff',
                borderRadius: '8px',
                pointerEvents: 'none'
              }}>
                <div style={{
                  position: 'absolute',
                  top: '0',
                  left: '0',
                  right: '0',
                  bottom: '0',
                  border: '2px solid #007bff',
                  borderRadius: '6px',
                  animation: 'pulse 2s infinite'
                }} />
              </div>
              <div style={{
                position: 'absolute',
                bottom: '10px',
                left: '50%',
                transform: 'translateX(-50%)',
                color: 'white',
                backgroundColor: 'rgba(0,0,0,0.7)',
                padding: '5px 10px',
                borderRadius: '4px',
                fontSize: '14px'
              }}>
                Point camera at QR code
              </div>
            </div>
          )}
        </div>

        {/* Manual input removed */}
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
          <li><strong>Scan QR Code:</strong> Use camera or paste the URL/ID to view contract details</li>
          <li><strong>Confirm Signing:</strong> Review details and confirm to sign as Party B</li>
          <li><strong>Track Status:</strong> Monitor contract status (inactive, active, revoked)</li>
        </ul>
      </div>

      {/* Deprecated confirmation modal removed */}
    </div>
  );
};

export default QRScanner;