import React, { useState, useEffect, useCallback } from 'react';
import { api } from '../contexts/AuthContext';
import { BaseModal } from './BaseModal';
import { ConfirmationModal } from './ConfirmationModal';

interface BankAccount {
  id: number;
  name: string;
  accountNumber: string;
  createdAt: string;
}

function SuccessNotification({ message, onClose }: { message: string; onClose: () => void }) {
  useEffect(() => {
    const timer = setTimeout(() => {
      onClose();
    }, 3000);
    return () => clearTimeout(timer);
  }, [onClose]);

  return (
    <div className="notification notification-success">
      <span className="text-xl">✅</span>
      <span>{message}</span>
      <button onClick={onClose} className="text-white hover:text-secondary-200 transition-colors">
        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
        </svg>
      </button>
    </div>
  );
}

export function BankAccounts() {
  const [accounts, setAccounts] = useState<BankAccount[]>([]);
  const [showAddModal, setShowAddModal] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [showSuccessNotification, setShowSuccessNotification] = useState(false);
  const [successMessage, setSuccessMessage] = useState('');
  const [accountToDelete, setAccountToDelete] = useState<BankAccount | null>(null);
  const [formData, setFormData] = useState({
    name: '',
    accountNumber: ''
  });
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    fetchAccounts();
  }, []);

  const fetchAccounts = async () => {
    try {
      const response = await api.get('/api/bank-accounts');
      setAccounts(response.data);
    } catch (error) {
      console.error('Failed to fetch bank accounts:', error);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    
    try {
      const response = await api.post('/api/bank-accounts', formData);
      setAccounts(prev => [response.data, ...prev]);
      setFormData({ name: '', accountNumber: '' });
      setShowAddModal(false);
      
      // Show success notification
      setSuccessMessage('Bank account added successfully!');
      setShowSuccessNotification(true);
    } catch (error) {
      console.error('Failed to create bank account:', error);
      alert('Failed to create bank account. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async () => {
    if (!accountToDelete) return;
    
    try {
      await api.delete(`/api/bank-accounts/${accountToDelete.id}`);
      setAccounts(prev => prev.filter(account => account.id !== accountToDelete.id));
      setAccountToDelete(null);
      setShowDeleteModal(false);
      
      // Show success notification
      setSuccessMessage('Bank account deleted successfully!');
      setShowSuccessNotification(true);
    } catch (error) {
      console.error('Failed to delete bank account:', error);
      alert('Failed to delete bank account. Please try again.');
    }
  };

  const openDeleteModal = (account: BankAccount) => {
    setAccountToDelete(account);
    setShowDeleteModal(true);
  };

  const resetForm = () => {
    setFormData({ name: '', accountNumber: '' });
  };

  // Optimized input handlers
  const handleNameChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    setFormData(prev => ({ ...prev, name: e.target.value }));
  }, []);

  const handleAccountNumberChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    setFormData(prev => ({ ...prev, accountNumber: e.target.value }));
  }, []);

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h2 className="text-3xl font-bold text-slate-900">Bank Accounts</h2>
          <p className="text-slate-600 mt-1">Manage your financial accounts</p>
        </div>
        <button
          onClick={() => setShowAddModal(true)}
          className="btn btn-primary btn-lg hover-lift"
        >
          <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
          </svg>
          Add Account
        </button>
      </div>

      {/* Accounts Grid */}
      {accounts.length === 0 ? (
        <div className="card-elevated">
          <div className="text-center py-16">
            <div className="w-20 h-20 mx-auto mb-6 bg-gradient-to-br from-primary-100 to-primary-200 rounded-2xl flex items-center justify-center">
              <svg className="w-10 h-10 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 10h18M7 15h1m4 0h1m-7 4h12a3 3 0 003-3V8a3 3 0 00-3-3H6a3 3 0 00-3 3v8a3 3 0 003 3z" />
              </svg>
            </div>
            <h3 className="text-xl font-semibold text-slate-900 mb-2">No bank accounts yet</h3>
            <p className="text-slate-500 mb-6 max-w-md mx-auto">
              Add your first bank account to start tracking transactions and managing your finances.
            </p>
            <button
              onClick={() => setShowAddModal(true)}
              className="btn btn-primary btn-lg"
            >
              <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
              </svg>
              Add Your First Account
            </button>
          </div>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {accounts.map((account) => (
            <div key={account.id} className="card-elevated hover-lift group">
              <div className="p-6">
                <div className="flex items-start justify-between mb-4">
                  <div className="w-12 h-12 bg-gradient-to-br from-primary-500 to-primary-600 rounded-xl flex items-center justify-center shadow-glow">
                    <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 10h18M7 15h1m4 0h1m-7 4h12a3 3 0 003-3V8a3 3 0 00-3-3H6a3 3 0 00-3 3v8a3 3 0 003 3z" />
                    </svg>
                  </div>
                  <button
                    onClick={() => openDeleteModal(account)}
                    className="p-2 text-secondary-400 hover:text-red-600 hover:bg-danger-50 rounded-lg transition-all duration-200 opacity-0 group-hover:opacity-100"
                    title="Delete account"
                  >
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                    </svg>
                  </button>
                </div>
                
                <div className="space-y-3">
                  <div>
                    <h4 className="text-lg font-semibold text-slate-900 group-hover:text-blue-600 transition-colors">
                      {account.name}
                    </h4>
                    <p className="text-sm text-slate-500 font-mono">
                      {account.accountNumber}
                    </p>
                  </div>
                  
                  <div className="pt-2 border-t border-secondary-100">
                    <p className="text-xs text-secondary-400">
                      Added on {new Date(account.createdAt).toLocaleDateString('en-US', {
                        year: 'numeric',
                        month: 'long',
                        day: 'numeric'
                      })}
                    </p>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Add Account Modal */}
      <BaseModal
        isOpen={showAddModal}
        onClose={() => {
          setShowAddModal(false);
          resetForm();
        }}
        title="Add New Bank Account"
        size="md"
      >
        <form onSubmit={handleSubmit} className="space-y-6">
          <div>
            <label className="form-label">
              Account Name
            </label>
            <input
              type="text"
              value={formData.name}
              onChange={handleNameChange}
              className="form-input"
              placeholder="e.g., Chase Checking"
              required
            />
            <p className="form-help">Give your account a memorable name</p>
          </div>
          
          <div>
            <label className="form-label">
              Account Number
            </label>
            <input
              type="text"
              value={formData.accountNumber}
              onChange={handleAccountNumberChange}
              className="form-input"
              placeholder="e.g., ****1234"
              required
            />
            <p className="form-help">Enter the last 4 digits or full account number</p>
          </div>
          
          <div className="flex gap-3 pt-4">
            <button
              type="submit"
              disabled={loading}
              className="btn btn-primary flex-1 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {loading ? (
                <>
                  <div className="loading-spinner w-4 h-4 mr-2"></div>
                  Adding...
                </>
              ) : (
                'Add Account'
              )}
            </button>
            <button
              type="button"
              onClick={() => {
                setShowAddModal(false);
                resetForm();
              }}
              className="btn btn-secondary flex-1"
            >
              Cancel
            </button>
          </div>
        </form>
      </BaseModal>

      {/* Delete Confirmation Modal */}
      <ConfirmationModal
        isOpen={showDeleteModal}
        onClose={() => setShowDeleteModal(false)}
        onConfirm={handleDelete}
        title="Delete Bank Account"
        message={`Are you sure you want to delete the account "${accountToDelete?.name}"? This action cannot be undone.`}
        confirmText="Delete Account"
        cancelText="Cancel"
        type="danger"
      />

      {/* Success Notification */}
      {showSuccessNotification && (
        <SuccessNotification
          message={successMessage}
          onClose={() => setShowSuccessNotification(false)}
        />
      )}
    </div>
  );
}
