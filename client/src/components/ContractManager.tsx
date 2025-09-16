import React, { useState, useEffect, useCallback } from 'react';
import api, { contractAPI } from '../services/api';
import { generateContractQRCodeDataUrl } from '../vendor/qrCodeGen';
import { Contract, User } from '../utils/types';
import styles from './ContractManager.module.css';

interface ContractManagerProps {
  contracts: Contract[];
  user: User;
  onContractUpdated: (contract: Contract) => void;
  onContractDeleted: (contractId: string) => void;
}

type SortField = 'contractId' | 'status' | 'startDateTime' | 'endDateTime';
type SortDirection = 'asc' | 'desc';

const ContractManager: React.FC<ContractManagerProps> = ({ 
  contracts, 
  user, 
  onContractUpdated, 
  onContractDeleted
}) => {
  const [filteredContracts, setFilteredContracts] = useState<Contract[]>(contracts);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [sortField, setSortField] = useState<SortField>('startDateTime');
  const [sortDirection, setSortDirection] = useState<SortDirection>('desc');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [selectedContract, setSelectedContract] = useState<Contract | null>(null);
  const [qrUrl, setQrUrl] = useState<string>('');
  const [showAuthorizeModal, setShowAuthorizeModal] = useState(false);
  const [lawyerIdInput, setLawyerIdInput] = useState('');
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());

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

  const toggleSelect = (id: string) => {
    setSelectedIds(prev => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id); else next.add(id);
      return next;
    });
  };

  const selectAllFiltered = () => {
    setSelectedIds(new Set(filteredContracts.map(c => c.contractId)));
  };

  const clearSelection = () => setSelectedIds(new Set());

  const deleteSelected = async () => {
    if (selectedIds.size === 0) return;
    if (!window.confirm(`Delete ${selectedIds.size} contract(s)? Only non-active can be deleted.`)) return;
    setLoading(true);
    setError('');
    try {
      const { succeeded, failed } = await contractAPI.deleteList(Array.from(selectedIds));
      if (failed.length) {
        setError(`${failed.length} failed. Some may be active or unauthorized.`);
      }
      if (succeeded.length) {
        succeeded.forEach(id => onContractDeleted(id));
      }
      setSelectedIds(prev => {
        const next = new Set(prev);
        succeeded.forEach(id => next.delete(id));
        return next;
      });
    } catch (err: any) {
      setError(err.response?.data?.error || 'Bulk delete failed');
    } finally {
      setLoading(false);
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

  const handleAuthorize = async (contract: Contract) => {
    setSelectedContract(contract);
    setLawyerIdInput('');
    setShowAuthorizeModal(true);
  };

  const submitAuthorize = async () => {
    if (!selectedContract || !lawyerIdInput.trim()) return;
    setLoading(true);
    setError('');
    try {
      await contractAPI.annotate(selectedContract.contractId, {}); // noop to ensure import
    } catch {}
    try {
      const res = await (await import('../services/api')).default.post(`/consent-contracts/${selectedContract.contractId}/authorize-lawyer`, { lawyerId: lawyerIdInput.trim() });
      // Update local authorized list if present
      const updated = { ...selectedContract, authorizedLawyers: res.data.authorizedLawyers } as Contract;
      onContractUpdated(updated);
      setShowAuthorizeModal(false);
    } catch (err: any) {
      setError(err.response?.data?.error || 'Failed to authorize lawyer');
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
            Back to Contract List
          </button>
        </div>

        <div style={{ 
          backgroundColor: '#f8f9fa', 
          padding: '20px', 
          borderRadius: '8px',
          marginBottom: '20px'
        }}>
          <h2 style={{ margin: '0 0 20px 0' }}>Contract Details</h2>
          <div style={{ display: 'grid', gridTemplateColumns: '180px 1fr', columnGap: '20px', rowGap: '10px' }}>
            <div style={{ fontWeight: 'bold' }}>Contract ID:</div>
            <div style={{ fontFamily: 'monospace' }}>{selectedContract.contractId}</div>

            <div style={{ fontWeight: 'bold' }}>Status:</div>
            <div>
              <span style={{
                padding: '4px 8px',
                borderRadius: '4px',
                backgroundColor: getStatusBackground(selectedContract.status),
                color: getStatusColor(selectedContract.status)
              }}>
                {selectedContract.status.toUpperCase()}
              </span>
            </div>

            <div style={{ fontWeight: 'bold' }}>Start Time:</div>
            <div>{formatDateTime(selectedContract.startDateTime)}</div>

            <div style={{ fontWeight: 'bold' }}>End Time:</div>
            <div>{formatDateTime(selectedContract.endDateTime)}</div>

            <div style={{ fontWeight: 'bold' }}>Revoked By:</div>
            <div>{selectedContract.revokedBy || '—'}</div>

            <div style={{ fontWeight: 'bold' }}>Authorized By:</div>
            <div>{selectedContract.authorizedBy || '—'}</div>

            <div style={{ fontWeight: 'bold' }}>Authorized Lawyers:</div>
            <div>{(selectedContract.authorizedLawyers && selectedContract.authorizedLawyers.length)
              ? selectedContract.authorizedLawyers.join(', ')
              : '—'}</div>

            <div style={{ fontWeight: 'bold' }}>Annotation:</div>
            <div>{selectedContract.annotation || '—'}</div>

            <div style={{ fontWeight: 'bold' }}>Last Updated:</div>
            <div>{selectedContract.updatedAt ? new Date(selectedContract.updatedAt as any).toLocaleString() : '—'}</div>
          </div>
          
          <div style={{ display: 'flex', gap: '10px', flexWrap: 'wrap', marginTop: '10px' }}>
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
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className={styles.container}>
      <h2 className={styles.title}>Contract Management</h2>
      
      {/* Filters and Search */}
      <div className={styles.panel}>
        <div className={styles.filters}>
          <div>
            <label style={{ display: 'block', marginBottom: '5px', fontWeight: 'bold' }}>Search:</label>
            <input
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="Search by contract ID or status..."
              className={styles.input}
            />
          </div>
          
          <div>
            <label style={{ display: 'block', marginBottom: '5px', fontWeight: 'bold' }}>Status Filter:</label>
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className={styles.input}
            >
              <option value="all">All Statuses</option>
              <option value="inactive">Inactive</option>
              <option value="active">Active</option>
              <option value="revoked">Revoked</option>
            </select>
          </div>
          <div style={{ display: 'flex', gap: '8px', alignItems: 'end' }}>
            <button onClick={selectAllFiltered} className={`${styles.btn} ${styles.btnSecondary}`}>
              Select All
            </button>
            <button onClick={clearSelection} className={`${styles.btn} ${styles.btnSecondary}`}>
              Clear
            </button>
            <button onClick={deleteSelected} disabled={loading || selectedIds.size === 0} className={`${styles.btn} ${styles.btnDanger}`}>
              Delete All ({selectedIds.size})
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

      {/* Contracts Table */}
      <div className={styles.table}>
        <div className={styles.thead}>
          <div>
            <input type="checkbox" checked={filteredContracts.length > 0 && filteredContracts.every(c => selectedIds.has(c.contractId))}
              onChange={(e) => e.target.checked ? selectAllFiltered() : clearSelection()} />
          </div>
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
          <div>Details</div>
          <div>QR code</div>
          <div>Actions</div>
        </div>

        {filteredContracts.length === 0 ? (
          <div style={{ padding: '40px', textAlign: 'center', color: '#6c757d' }}>
            No contracts found matching your criteria.
          </div>
        ) : (
          filteredContracts.map((contract, index) => (
            <div key={contract.contractId} className={`${styles.row} ${index % 2 === 1 ? styles.rowAlt : ''}`}>
              <div>
                <input type="checkbox" checked={selectedIds.has(contract.contractId)} onChange={() => toggleSelect(contract.contractId)} />
              </div>
              <div className={styles.mono}>
                {contract.contractId}
              </div>
              
              <div>
                <span className={`${styles.badge} ${contract.status === 'active' ? styles.badgeActive : contract.status === 'inactive' ? styles.badgeInactive : styles.badgeRevoked}`}>
                  {contract.status.toUpperCase()}
                </span>
              </div>
              
              <div>
                <button onClick={() => handleViewDetails(contract)} className={`${styles.btn} ${styles.btnPrimary}`}>
                  Details
                </button>
              </div>

              <div>
                <button onClick={() => {
                    const base = (api as any).defaults.baseURL as string;
                    const apiBase = base.replace(/\/api\/?$/, '');
                    const content = `${apiBase}/contracts/${contract.contractId}`;
                    const dataUrl = generateContractQRCodeDataUrl(content);
                    setQrUrl(dataUrl);
                  }} className={`${styles.btn} ${styles.btnSuccess}`}>
                  QR code
                </button>
              </div>
              <div>
                <button onClick={() => handleAuthorize(contract)} className={`${styles.btn} ${styles.btnWarning}`}>
                  Authorize
                </button>
              </div>
            </div>
          ))
        )}
      </div>

      {/* Summary */}
      <div className={styles.summary}>
        <strong>Total Contracts:</strong> {contracts.length} | 
        <strong> Filtered:</strong> {filteredContracts.length} | 
        <strong> Active:</strong> {contracts.filter(c => c.status === 'active').length} | 
        <strong> Inactive:</strong> {contracts.filter(c => c.status === 'inactive').length} | 
        <strong> Revoked:</strong> {contracts.filter(c => c.status === 'revoked').length}
      </div>

      {qrUrl && (
        <div onClick={() => setQrUrl('')} className={styles.qrModalBackdrop}>
          <div onClick={(e) => e.stopPropagation()} className={styles.qrModal}>
            <h3 style={{ marginTop: 0 }}>Contract QR Code</h3>
            <object data={qrUrl} type="image/svg+xml" style={{ width: 260, height: 260 }}>
              <img src={qrUrl} alt="QR Code" style={{ width: 260, height: 260 }} />
            </object>
            <div className={styles.actions} style={{ marginTop: 12 }}>
              <a href={qrUrl} download target="_blank" rel="noreferrer" className={`${styles.btn} ${styles.btnInfo}`}>Download SVG</a>
              <button onClick={() => setQrUrl('')} className={`${styles.btn} ${styles.btnSecondary}`}>Close</button>
            </div>
          </div>
        </div>
      )}

      {showAuthorizeModal && selectedContract && (
        <div
          onClick={() => setShowAuthorizeModal(false)}
          style={{ position: 'fixed', inset: 0, backgroundColor: 'rgba(0,0,0,0.5)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000 }}
        >
          <div onClick={(e) => e.stopPropagation()} style={{ background: 'white', padding: 20, borderRadius: 8, width: 400 }}>
            <h3 style={{ marginTop: 0 }}>Authorize Lawyer</h3>
            <p style={{ fontSize: 14, color: '#555' }}>Enter a lawyer's user ID to grant them access to view and annotate this contract.</p>
            <div style={{ marginBottom: 12 }}>
              <label style={{ display: 'block', marginBottom: 6, fontWeight: 'bold' }}>Lawyer User ID</label>
              <input value={lawyerIdInput} onChange={(e) => setLawyerIdInput(e.target.value)} placeholder="lawyer_user_id" style={{ width: '100%', padding: 8, border: '1px solid #ccc', borderRadius: 4 }} />
            </div>
            <div style={{ display: 'flex', gap: 8, justifyContent: 'flex-end' }}>
              <button onClick={() => setShowAuthorizeModal(false)} style={{ padding: '8px 12px', background: '#6c757d', color: 'white', border: 'none', borderRadius: 4 }}>Cancel</button>
              <button onClick={submitAuthorize} disabled={loading || !lawyerIdInput.trim()} style={{ padding: '8px 12px', background: '#007bff', color: 'white', border: 'none', borderRadius: 4 }}>
                {loading ? 'Authorizing...' : 'Authorize'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default ContractManager;