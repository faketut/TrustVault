import React, { useState, useEffect, useCallback } from 'react';
import { contractAPI } from '../services/api';
import { Contract, User } from '../utils/types';

interface ContractManagerProps {
  contracts: Contract[];
  user: User;
  onContractUpdated: (contract: Contract) => void;
  onContractDeleted: (contractId: string) => void;
  onGenerateQR: (contract: Contract) => void;
}

type SortField = 'contractId' | 'status' | 'startDateTime' | 'endDateTime';
type SortDirection = 'asc' | 'desc';

const ContractManager: React.FC<ContractManagerProps> = ({ 
  contracts, 
  user, 
  onContractUpdated, 
  onContractDeleted, 
  onGenerateQR 
}) => {
  const [filteredContracts, setFilteredContracts] = useState<Contract[]>(contracts);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [sortField, setSortField] = useState<SortField>('startDateTime');
  const [sortDirection, setSortDirection] = useState<SortDirection>('desc');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [selectedContract, setSelectedContract] = useState<Contract | null>(null);

  const filterAndSortContracts = useCallback(() => {
    let filtered = [...contracts];

    // Filter by search term
    if (searchTerm) {
      filtered = filtered.filter(contract =>
        contract.contractId.toLowerCase().includes(searchTerm.toLowerCase()) ||
        contract.status.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }

    // Filter by status
    if (statusFilter !== 'all') {
      filtered = filtered.filter(contract => contract.status === statusFilter);
    }

    // Sort contracts
    filtered.sort((a, b) => {
      let aValue: any = a[sortField];
      let bValue: any = b[sortField];

      if (sortField === 'startDateTime' || sortField === 'endDateTime') {
        aValue = new Date(aValue).getTime();
        bValue = new Date(bValue).getTime();
      }

      if (aValue < bValue) return sortDirection === 'asc' ? -1 : 1;
      if (aValue > bValue) return sortDirection === 'asc' ? 1 : -1;
      return 0;
    });

    setFilteredContracts(filtered);
  }, [contracts, searchTerm, statusFilter, sortField, sortDirection]);

  useEffect(() => {
    filterAndSortContracts();
  }, [filterAndSortContracts]);

  const handleSort = (field: SortField) => {
    if (sortField === field) {
      setSortDirection(sortDirection === 'asc' ? 'desc' : 'asc');
    } else {
      setSortField(field);
      setSortDirection('asc');
    }
  };

  const handleRevoke = async (contract: Contract) => {
    if (!window.confirm('Are you sure you want to revoke this contract?')) {
      return;
    }
    
    setLoading(true);
    setError('');
    try {
      await contractAPI.revoke(contract.contractId);
      // Refresh contract data
      const response = await contractAPI.getContract(contract.contractId);
      onContractUpdated(response.data);
    } catch (err: any) {
      setError(err.response?.data?.error || 'Failed to revoke contract');
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (contract: Contract) => {
    if (!window.confirm('Are you sure you want to delete this contract? This action cannot be undone.')) {
      return;
    }
    
    setLoading(true);
    setError('');
    try {
      await contractAPI.delete(contract.contractId);
      onContractDeleted(contract.contractId);
    } catch (err: any) {
      setError(err.response?.data?.error || 'Failed to delete contract');
    } finally {
      setLoading(false);
    }
  };

  const handleViewDetails = (contract: Contract) => {
    setSelectedContract(contract);
  };

  const formatDateTime = (dateString: string) => {
    return new Date(dateString).toLocaleString();
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'active': return '#4caf50';
      case 'inactive': return '#ff9800';
      case 'revoked': return '#f44336';
      default: return '#6c757d';
    }
  };

  const getStatusBackground = (status: string) => {
    switch (status) {
      case 'active': return '#e8f5e8';
      case 'inactive': return '#fff3cd';
      case 'revoked': return '#ffebee';
      default: return '#f8f9fa';
    }
  };

  if (selectedContract) {
    return (
      <div style={{ maxWidth: '800px', margin: '0 auto', padding: '20px' }}>
        <div style={{ marginBottom: '20px' }}>
          <button
            onClick={() => setSelectedContract(null)}
            style={{
              padding: '8px 16px',
              backgroundColor: '#6c757d',
              color: 'white',
              border: 'none',
              borderRadius: '4px',
              cursor: 'pointer'
            }}
          >
            ← Back to Contract List
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
                backgroundColor: getStatusBackground(selectedContract.status),
                color: getStatusColor(selectedContract.status)
              }}>
                {selectedContract.status.toUpperCase()}
              </span>
            </div>
            <div>
              <strong>Start Time:</strong><br />
              {formatDateTime(selectedContract.startDateTime)}
            </div>
            <div>
              <strong>End Time:</strong><br />
              {formatDateTime(selectedContract.endDateTime)}
            </div>
            {selectedContract.revokedBy && (
              <div>
                <strong>Revoked By:</strong><br />
                {selectedContract.revokedBy}
              </div>
            )}
          </div>

          <div style={{ display: 'flex', gap: '10px', flexWrap: 'wrap' }}>
            <button
              onClick={() => onGenerateQR(selectedContract)}
              style={{
                padding: '10px 20px',
                backgroundColor: '#28a745',
                color: 'white',
                border: 'none',
                borderRadius: '4px',
                cursor: 'pointer'
              }}
            >
              Generate QR Code
            </button>

            {selectedContract.status === 'active' && (
              <button
                onClick={() => handleRevoke(selectedContract)}
                disabled={loading}
                style={{
                  padding: '10px 20px',
                  backgroundColor: '#dc3545',
                  color: 'white',
                  border: 'none',
                  borderRadius: '4px',
                  cursor: loading ? 'not-allowed' : 'pointer'
                }}
              >
                {loading ? 'Processing...' : 'Revoke Contract'}
              </button>
            )}

            <button
              onClick={() => handleDelete(selectedContract)}
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
              {loading ? 'Processing...' : 'Delete Contract'}
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div style={{ maxWidth: '1200px', margin: '0 auto', padding: '20px' }}>
      <h2 style={{ marginBottom: '20px' }}>Contract Management</h2>
      
      {/* Filters and Search */}
      <div style={{ 
        backgroundColor: '#f8f9fa', 
        padding: '20px', 
        borderRadius: '8px',
        marginBottom: '20px'
      }}>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))', gap: '15px' }}>
          <div>
            <label style={{ display: 'block', marginBottom: '5px', fontWeight: 'bold' }}>Search:</label>
            <input
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="Search by contract ID or status..."
              style={{ 
                width: '100%', 
                padding: '8px', 
                border: '1px solid #ccc', 
                borderRadius: '4px' 
              }}
            />
          </div>
          
          <div>
            <label style={{ display: 'block', marginBottom: '5px', fontWeight: 'bold' }}>Status Filter:</label>
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              style={{ 
                width: '100%', 
                padding: '8px', 
                border: '1px solid #ccc', 
                borderRadius: '4px' 
              }}
            >
              <option value="all">All Statuses</option>
              <option value="inactive">Inactive</option>
              <option value="active">Active</option>
              <option value="revoked">Revoked</option>
            </select>
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

      {/* Contracts Table */}
      <div style={{ 
        backgroundColor: 'white', 
        border: '1px solid #dee2e6', 
        borderRadius: '8px',
        overflow: 'hidden'
      }}>
        <div style={{ 
          backgroundColor: '#f8f9fa', 
          padding: '15px', 
          borderBottom: '1px solid #dee2e6',
          display: 'grid',
          gridTemplateColumns: '1fr 100px 150px 150px 200px',
          gap: '15px',
          alignItems: 'center',
          fontWeight: 'bold'
        }}>
          <div 
            style={{ cursor: 'pointer', userSelect: 'none' }}
            onClick={() => handleSort('contractId')}
          >
            Contract ID {sortField === 'contractId' && (sortDirection === 'asc' ? '↑' : '↓')}
          </div>
          <div 
            style={{ cursor: 'pointer', userSelect: 'none' }}
            onClick={() => handleSort('status')}
          >
            Status {sortField === 'status' && (sortDirection === 'asc' ? '↑' : '↓')}
          </div>
          <div 
            style={{ cursor: 'pointer', userSelect: 'none' }}
            onClick={() => handleSort('startDateTime')}
          >
            Start Time {sortField === 'startDateTime' && (sortDirection === 'asc' ? '↑' : '↓')}
          </div>
          <div 
            style={{ cursor: 'pointer', userSelect: 'none' }}
            onClick={() => handleSort('endDateTime')}
          >
            End Time {sortField === 'endDateTime' && (sortDirection === 'asc' ? '↑' : '↓')}
          </div>
          <div>Actions</div>
        </div>

        {filteredContracts.length === 0 ? (
          <div style={{ padding: '40px', textAlign: 'center', color: '#6c757d' }}>
            No contracts found matching your criteria.
          </div>
        ) : (
          filteredContracts.map((contract, index) => (
            <div
              key={contract.contractId}
              style={{
                padding: '15px',
                borderBottom: index < filteredContracts.length - 1 ? '1px solid #dee2e6' : 'none',
                display: 'grid',
                gridTemplateColumns: '1fr 100px 150px 150px 200px',
                gap: '15px',
                alignItems: 'center',
                backgroundColor: index % 2 === 0 ? 'white' : '#f8f9fa'
              }}
            >
              <div style={{ fontFamily: 'monospace', fontSize: '12px' }}>
                {contract.contractId}
              </div>
              
              <div>
                <span style={{
                  padding: '4px 8px',
                  borderRadius: '4px',
                  backgroundColor: getStatusBackground(contract.status),
                  color: getStatusColor(contract.status),
                  fontSize: '12px',
                  fontWeight: 'bold'
                }}>
                  {contract.status.toUpperCase()}
                </span>
              </div>
              
              <div style={{ fontSize: '12px', color: '#6c757d' }}>
                {formatDateTime(contract.startDateTime)}
              </div>
              
              <div style={{ fontSize: '12px', color: '#6c757d' }}>
                {formatDateTime(contract.endDateTime)}
              </div>
              
              <div style={{ display: 'flex', gap: '5px', flexWrap: 'wrap' }}>
                <button
                  onClick={() => handleViewDetails(contract)}
                  style={{
                    padding: '4px 8px',
                    backgroundColor: '#007bff',
                    color: 'white',
                    border: 'none',
                    borderRadius: '3px',
                    cursor: 'pointer',
                    fontSize: '11px'
                  }}
                >
                  View
                </button>
                
                <button
                  onClick={() => onGenerateQR(contract)}
                  style={{
                    padding: '4px 8px',
                    backgroundColor: '#28a745',
                    color: 'white',
                    border: 'none',
                    borderRadius: '3px',
                    cursor: 'pointer',
                    fontSize: '11px'
                  }}
                >
                  QR
                </button>
                
                {contract.status === 'active' && (
                  <button
                    onClick={() => handleRevoke(contract)}
                    disabled={loading}
                    style={{
                      padding: '4px 8px',
                      backgroundColor: '#dc3545',
                      color: 'white',
                      border: 'none',
                      borderRadius: '3px',
                      cursor: loading ? 'not-allowed' : 'pointer',
                      fontSize: '11px'
                    }}
                  >
                    Revoke
                  </button>
                )}
                
                <button
                  onClick={() => handleDelete(contract)}
                  disabled={loading}
                  style={{
                    padding: '4px 8px',
                    backgroundColor: '#6c757d',
                    color: 'white',
                    border: 'none',
                    borderRadius: '3px',
                    cursor: loading ? 'not-allowed' : 'pointer',
                    fontSize: '11px'
                  }}
                >
                  Delete
                </button>
              </div>
            </div>
          ))
        )}
      </div>

      {/* Summary */}
      <div style={{ 
        marginTop: '20px', 
        padding: '15px', 
        backgroundColor: '#e9ecef', 
        borderRadius: '4px',
        fontSize: '14px'
      }}>
        <strong>Total Contracts:</strong> {contracts.length} | 
        <strong> Filtered:</strong> {filteredContracts.length} | 
        <strong> Active:</strong> {contracts.filter(c => c.status === 'active').length} | 
        <strong> Inactive:</strong> {contracts.filter(c => c.status === 'inactive').length} | 
        <strong> Revoked:</strong> {contracts.filter(c => c.status === 'revoked').length}
      </div>
    </div>
  );
};

export default ContractManager;