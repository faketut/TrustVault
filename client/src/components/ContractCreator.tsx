import React, { useState } from 'react';
import { contractAPI } from '../services/api';
import { Contract, User, getUserId } from '../utils/types';

interface ContractCreatorProps {
  user: User;
  onContractCreated: (contract: Contract) => void;
}

const ContractCreator: React.FC<ContractCreatorProps> = ({ user, onContractCreated }) => {
  const [creating, setCreating] = useState(false);
  const [error, setError] = useState('');

  const [contractData, setContractData] = useState({
    startDateTime: '',
    endDateTime: ''
  });

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setContractData({
      ...contractData,
      [e.target.name]: e.target.value
    });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setCreating(true);
    setError('');

    try {
      // Create contract data with user's display ID as partyAId
      const contractPayload = {
        partyAId: getUserId(user),
        ...contractData
      };
      
      const response = await contractAPI.create(contractPayload);
      onContractCreated(response.data);
      
      // Reset form
      setContractData({
        startDateTime: '',
        endDateTime: ''
      });
    } catch (err: any) {
      setError(err.response?.data?.error || 'Failed to create contract');
    } finally {
      setCreating(false);
    }
  };

  return (
    <div style={{ maxWidth: '600px', margin: '0 auto', padding: '20px' }}>
      <h2>Create New Contract</h2>
      
      {error && (
        <div style={{ color: 'red', marginBottom: '20px', padding: '10px', backgroundColor: '#ffebee', borderRadius: '4px' }}>
          {error}
        </div>
      )}

      <form onSubmit={handleSubmit}>

        <div style={{ marginBottom: '20px' }}>
          <label style={{ display: 'block', marginBottom: '5px', fontWeight: 'bold' }}>Start Date & Time:</label>
          <input
            type="datetime-local"
            name="startDateTime"
            value={contractData.startDateTime}
            onChange={handleChange}
            required
            style={{ width: '100%', padding: '10px', border: '1px solid #ccc', borderRadius: '4px' }}
          />
        </div>

        <div style={{ marginBottom: '20px' }}>
          <label style={{ display: 'block', marginBottom: '5px', fontWeight: 'bold' }}>End Date & Time:</label>
          <input
            type="datetime-local"
            name="endDateTime"
            value={contractData.endDateTime}
            onChange={handleChange}
            required
            style={{ width: '100%', padding: '10px', border: '1px solid #ccc', borderRadius: '4px' }}
          />
        </div>

        <button
          type="submit"
          disabled={creating || !contractData.startDateTime || !contractData.endDateTime}
          style={{
            width: '100%',
            padding: '12px',
            backgroundColor: creating ? '#ccc' : '#1976d2',
            color: 'white',
            border: 'none',
            borderRadius: '4px',
            cursor: creating ? 'not-allowed' : 'pointer',
            fontSize: '16px'
          }}
        >
          {creating ? 'Creating Contract...' : 'Create Contract'}
        </button>
      </form>
    </div>
  );
};

export default ContractCreator;
