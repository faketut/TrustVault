import React, { useState, useRef, useEffect } from 'react';
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
  const [isScanning, setIsScanning] = useState(false);
  const [showConfirmation, setShowConfirmation] = useState(false);
  const [scannedContract, setScannedContract] = useState<Contract | null>(null);
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

  const handleQRCodeChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setQrCode(e.target.value);
    setError('');
    setContract(null);
  };

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

  const detectQRCode = () => {
    if (!videoRef.current || !isScanning) return;

    const canvas = document.createElement('canvas');
    const context = canvas.getContext('2d');
    
    if (!context) return;

    const video = videoRef.current;
    canvas.width = video.videoWidth;
    canvas.height = video.videoHeight;
    
    context.drawImage(video, 0, 0, canvas.width, canvas.height);
    
    // Simple QR code detection using a basic pattern matching
    // In a real implementation, you'd use a proper QR code library
    // const imageData = context.getImageData(0, 0, canvas.width, canvas.height);
    
    // For now, we'll simulate QR detection with a timeout
    // In production, you'd integrate with a proper QR code library
    setTimeout(() => {
      if (isScanning) {
        // Simulate finding a QR code - in real implementation, this would be actual QR detection
        const mockQRCode = prompt('Enter QR code content (for demo purposes):');
        if (mockQRCode) {
          handleQRCodeDetected(mockQRCode);
        }
      }
    }, 2000);
  };

  const handleQRCodeDetected = async (qrCodeContent: string) => {
    stopCameraScanning();
    
    try {
      setLoading(true);
      setError('');

      // Extract contract ID from QR code URL or use as direct ID
      let contractId = qrCodeContent.trim();
      
      // If it's a full URL, extract the contract ID
      if (qrCodeContent.includes('/contracts/')) {
        const match = qrCodeContent.match(/\/contracts\/([a-zA-Z0-9-]+)/);
        if (match) {
          contractId = match[1];
        }
      }

      const response = await contractAPI.getContract(contractId);
      const foundContract = response.data;
      
      setScannedContract(foundContract);
      setShowConfirmation(true);
      
    } catch (err: any) {
      setError(err.response?.data?.error || 'Contract not found');
    } finally {
      setLoading(false);
    }
  };

  const handleConfirmSign = async () => {
    if (!scannedContract || !user) {
      setError('Please log in to sign the contract');
      return;
    }

    setLoading(true);
    setError('');

    try {
      // Update the contract with the user's ID as partyBId
      await contractAPI.annotate(scannedContract.contractId, {
        partyBId: user.id,
        signedBy: user.id,
        signedAt: new Date().toISOString()
      });

      // Sign the contract by giving consent
      await contractAPI.giveInitialConsent(scannedContract.contractId);
      
      // Update the contract status
      const response = await contractAPI.getContract(scannedContract.contractId);
      setContract(response.data);
      
      // Notify parent component
      onContractFound(response.data);
      
      setShowConfirmation(false);
      setScannedContract(null);
      setError('');
    } catch (err: any) {
      setError(err.response?.data?.error || 'Failed to sign contract');
    } finally {
      setLoading(false);
    }
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

        {/* Manual Input */}
        <div style={{ marginBottom: '20px' }}>
          <label style={{ display: 'block', marginBottom: '5px', fontWeight: 'bold' }}>
            Or enter QR code/Contract ID manually:
          </label>
          <div style={{ display: 'flex', gap: '10px' }}>
            <input
              type="text"
              value={qrCode}
              onChange={handleQRCodeChange}
              placeholder="Enter QR code or contract ID"
              style={{ 
                flex: 1, 
                padding: '10px', 
                border: '1px solid #ccc', 
                borderRadius: '4px' 
              }}
            />
            <button
              onClick={handleScan}
              disabled={loading || isScanning}
              style={{
                padding: '10px 20px',
                backgroundColor: '#1976d2',
                color: 'white',
                border: 'none',
                borderRadius: '4px',
                cursor: (loading || isScanning) ? 'not-allowed' : 'pointer'
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
          <li><strong>Scan QR Code:</strong> Use camera or paste the URL/ID to view contract details</li>
          <li><strong>Confirm Signing:</strong> Review details and confirm to sign as Party B</li>
          <li><strong>Track Status:</strong> Monitor contract status (inactive, active, revoked)</li>
        </ul>
      </div>

      {/* Confirmation Modal */}
      {showConfirmation && scannedContract && (
        <div style={{
          position: 'fixed',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          backgroundColor: 'rgba(0,0,0,0.7)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          zIndex: 1000
        }} onClick={() => setShowConfirmation(false)}>
          <div style={{
            backgroundColor: 'white',
            padding: '30px',
            borderRadius: '8px',
            maxWidth: '500px',
            width: '90%',
            maxHeight: '90%',
            overflow: 'auto'
          }} onClick={e => e.stopPropagation()}>
            <h3 style={{ marginTop: 0, color: '#333' }}>Confirm Contract Signing</h3>
            
            <div style={{ marginBottom: '20px' }}>
              <p style={{ marginBottom: '15px', fontSize: '16px' }}>
                You are about to sign this contract as <strong>Party B</strong>:
              </p>
              
              <div style={{ 
                backgroundColor: '#f8f9fa', 
                padding: '15px', 
                borderRadius: '4px',
                marginBottom: '15px'
              }}>
                <div style={{ marginBottom: '10px' }}>
                  <strong>Contract ID:</strong> {scannedContract.contractId}
                </div>
                <div style={{ marginBottom: '10px' }}>
                  <strong>Status:</strong> 
                  <span style={{ 
                    padding: '2px 6px',
                    borderRadius: '3px',
                    backgroundColor: scannedContract.status === 'active' ? '#d4edda' : 
                                   scannedContract.status === 'inactive' ? '#fff3cd' : '#f8d7da',
                    color: scannedContract.status === 'active' ? '#155724' : 
                           scannedContract.status === 'inactive' ? '#856404' : '#721c24',
                    marginLeft: '5px'
                  }}>
                    {scannedContract.status.toUpperCase()}
                  </span>
                </div>
                <div style={{ marginBottom: '10px' }}>
                  <strong>Start Time:</strong> {formatDateTime(scannedContract.startDateTime)}
                </div>
                <div>
                  <strong>End Time:</strong> {formatDateTime(scannedContract.endDateTime)}
                </div>
              </div>

              <div style={{ 
                backgroundColor: '#e3f2fd', 
                padding: '15px', 
                borderRadius: '4px',
                border: '1px solid #bbdefb'
              }}>
                <p style={{ margin: 0, fontSize: '14px', color: '#1976d2' }}>
                  <strong>Your ID will be set as:</strong> {user?.id || 'Unknown'}
                </p>
                <p style={{ margin: '5px 0 0 0', fontSize: '12px', color: '#666' }}>
                  By signing, you agree to the terms of this consent contract.
                </p>
              </div>
            </div>

            <div style={{ display: 'flex', gap: '10px', justifyContent: 'flex-end' }}>
              <button
                onClick={() => setShowConfirmation(false)}
                disabled={loading}
                style={{
                  padding: '10px 20px',
                  backgroundColor: '#6c757d',
                  color: 'white',
                  border: 'none',
                  borderRadius: '4px',
                  cursor: loading ? 'not-allowed' : 'pointer'
                }}
              >
                Cancel
              </button>
              <button
                onClick={handleConfirmSign}
                disabled={loading}
                style={{
                  padding: '10px 20px',
                  backgroundColor: '#28a745',
                  color: 'white',
                  border: 'none',
                  borderRadius: '4px',
                  cursor: loading ? 'not-allowed' : 'pointer'
                }}
              >
                {loading ? 'Signing...' : 'Sign Contract'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default QRScanner;