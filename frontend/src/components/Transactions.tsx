import React, { useEffect, useMemo, useState } from 'react';
import { api } from '../contexts/AuthContext';
import { locationService, LocationData } from '../services/locationService';
import { BaseModal } from './BaseModal';
import { ConfirmationModal } from './ConfirmationModal';

type Category = { id: number; name: string; subcategories: { id: number; name: string; categoryId: number }[] };

type Transaction = {
  id?: number;
  account: string;
  date: string;
  name: string;
  debit: number;
  credit: number;
  categoryId?: number | null;
  subcategoryId?: number | null;
  type: 'Income' | 'Expense';
  location?: string;
  latitude?: number;
  longitude?: number;
};

type BankAccount = {
  id: number;
  name: string;
  accountNumber: string;
};

function ErrorModal({ open, onClose, title, message }: { open: boolean; onClose: () => void; title: string; message: string }) {
  return (
    <BaseModal
      isOpen={open}
      onClose={onClose}
      size="sm"
      showCloseButton={false}
    >
      <div className="text-center">
        <div className="flex-shrink-0 w-16 h-16 mx-auto flex items-center justify-center rounded-full bg-danger-50 text-red-600 mb-4">
          <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.732-.833-2.5 0L4.268 19.5c-.77.833.192 2.5 1.732 2.5z" />
          </svg>
        </div>
        <h3 className="text-lg font-semibold text-slate-900 mb-2">{title}</h3>
        <p className="text-sm text-slate-600 mb-6">{message}</p>
        <button
          onClick={onClose}
          className="btn btn-danger"
        >
          OK
        </button>
      </div>
    </BaseModal>
  );
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

function LocationStatus({ location, isGettingLocation, error }: { 
  location?: LocationData; 
  isGettingLocation: boolean; 
  error?: string; 
}) {
  if (isGettingLocation) {
    return (
      <div className="flex items-center gap-2 text-blue-600 text-sm">
        <div className="loading-spinner h-4 w-4"></div>
        <span>Getting location...</span>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex items-center gap-2 text-red-600 text-sm">
        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.732 16.5c-.77.833.192 2.5 1.732 2.5z" />
        </svg>
        <span>{error}</span>
      </div>
    );
  }

  if (location && location.latitude && location.longitude) {
    return (
      <div className="flex items-center gap-2 text-green-600 text-sm">
        <span>📍</span>
        <span>Location captured</span>
        {location.address && (
          <span className="text-slate-500 text-xs truncate max-w-48" title={location.address}>
            {location.address}
          </span>
        )}
      </div>
    );
  }

  return null;
}

function TransactionModal({ 
  open, 
  onClose, 
  onSubmit, 
  categories, 
  bankAccounts 
}: { 
  open: boolean; 
  onClose: () => void; 
  onSubmit: (transaction: Transaction) => Promise<void>; 
  categories: Category[];
  bankAccounts: BankAccount[];
}) {
  const [form, setForm] = useState<Transaction>({
    account: '',
    date: new Date().toISOString().split('T')[0],
    name: '',
    debit: 0,
    credit: 0,
    categoryId: null,
    subcategoryId: null,
    type: 'Expense',
    location: '',
    latitude: undefined,
    longitude: undefined
  });
  const [showCatModal, setShowCatModal] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showErrorModal, setShowErrorModal] = useState(false);
  const [errorTitle, setErrorTitle] = useState('');
  const [errorMessage, setErrorMessage] = useState('');
  const [isGettingLocation, setIsGettingLocation] = useState(false);
  const [locationError, setLocationError] = useState<string | undefined>();
  const [currentLocation, setCurrentLocation] = useState<LocationData | undefined>();

  const resetForm = () => {
    setForm({
      account: '',
      date: new Date().toISOString().split('T')[0],
      name: '',
      debit: 0,
      credit: 0,
      categoryId: null,
      subcategoryId: null,
      type: 'Expense',
      location: '',
      latitude: undefined,
      longitude: undefined
    });
    setCurrentLocation(undefined);
    setLocationError(undefined);
  };

  const handleGetLocation = async () => {
    setIsGettingLocation(true);
    setLocationError(undefined);
    
    try {
      const location = await locationService.getCurrentLocation();
      
      if (location.error) {
        setLocationError(location.error);
      } else {
        setCurrentLocation(location);
        setForm(prev => ({
          ...prev,
          location: location.address || `${location.latitude.toFixed(6)}, ${location.longitude.toFixed(6)}`,
          latitude: location.latitude,
          longitude: location.longitude
        }));
      }
    } catch (error) {
      setLocationError('Failed to get location. Please try again.');
    } finally {
      setIsGettingLocation(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    // Validation
    if (!form.name.trim()) {
      setErrorTitle('Validation Error');
      setErrorMessage('Transaction name is required.');
      setShowErrorModal(true);
      return;
    }
    
    if (!form.account.trim()) {
      setErrorTitle('Validation Error');
      setErrorMessage('Account is required.');
      setShowErrorModal(true);
      return;
    }
    
    if (form.debit === 0 && form.credit === 0) {
      setErrorTitle('Validation Error');
      setErrorMessage('Either debit or credit amount must be greater than zero.');
      setShowErrorModal(true);
      return;
    }
    
    if (form.debit > 0 && form.credit > 0) {
      setErrorTitle('Validation Error');
      setErrorMessage('A transaction cannot have both debit and credit amounts.');
      setShowErrorModal(true);
      return;
    }

    setIsSubmitting(true);
    try {
      await onSubmit(form);
      resetForm();
      onClose();
    } catch (error: any) {
      setErrorTitle('Transaction Error');
      setErrorMessage(error.response?.data?.error || 'Failed to create transaction. Please try again.');
      setShowErrorModal(true);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleClose = () => {
    resetForm();
    onClose();
  };

  const getCategoryName = (categoryId: number | null) => {
    if (!categoryId) return '';
    const category = categories.find(c => c.id === categoryId);
    return category?.name || '';
  };

  const getSubcategoryName = (subcategoryId: number | null) => {
    if (!subcategoryId) return '';
    for (const category of categories) {
      const subcategory = category.subcategories.find(sc => sc.id === subcategoryId);
      if (subcategory) return subcategory.name;
    }
    return '';
  };

  return (
    <>
      <BaseModal
        isOpen={open}
        onClose={handleClose}
        title="Add New Transaction"
        size="lg"
      >
        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="form-label">Account</label>
              <select
                value={form.account}
                onChange={(e) => setForm(prev => ({ ...prev, account: e.target.value }))}
                className="form-input"
                required
              >
                <option value="">Select Account</option>
                {bankAccounts.map(account => (
                  <option key={account.id} value={account.name}>
                    {account.name} ({account.accountNumber})
                  </option>
                ))}
                <option value="Cash">Cash</option>
                <option value="Credit Card">Credit Card</option>
                <option value="Other">Other</option>
              </select>
            </div>
            <div>
              <label className="form-label">Date</label>
              <input
                type="date"
                value={form.date}
                onChange={(e) => setForm(prev => ({ ...prev, date: e.target.value }))}
                className="form-input"
                required
              />
            </div>
          </div>

          <div>
            <label className="form-label">Description</label>
            <input
              type="text"
              value={form.name}
              onChange={(e) => setForm(prev => ({ ...prev, name: e.target.value }))}
              className="form-input"
              placeholder="Transaction description"
              required
            />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <label className="form-label">Type</label>
              <select
                value={form.type}
                onChange={(e) => {
                  const type = e.target.value as 'Income' | 'Expense';
                  setForm(prev => ({ 
                    ...prev, 
                    type,
                    debit: type === 'Expense' ? Math.abs(prev.debit || prev.credit) : 0,
                    credit: type === 'Income' ? Math.abs(prev.debit || prev.credit) : 0
                  }));
                }}
                className="form-input"
              >
                <option value="Expense">Expense</option>
                <option value="Income">Income</option>
              </select>
            </div>
            <div>
              <label className="form-label">
                {form.type === 'Expense' ? 'Debit Amount' : 'Credit Amount'}
              </label>
              <input
                type="number"
                step="0.01"
                min="0"
                value={form.type === 'Expense' ? form.debit : form.credit}
                onChange={(e) => {
                  const amount = parseFloat(e.target.value) || 0;
                  setForm(prev => ({ 
                    ...prev, 
                    debit: form.type === 'Expense' ? amount : 0,
                    credit: form.type === 'Income' ? amount : 0
                  }));
                }}
                className="form-input"
                placeholder="0.00"
                required
              />
            </div>
            <div>
              <label className="form-label">Category</label>
              <button
                type="button"
                onClick={() => setShowCatModal(true)}
                className="form-input text-left hover:bg-slate-50"
              >
                {form.categoryId && form.subcategoryId ? 
                  `${getCategoryName(form.categoryId)} > ${getSubcategoryName(form.subcategoryId)}` : 
                  'Select Category'
                }
              </button>
            </div>
          </div>

          <div>
            <div className="flex items-center justify-between mb-2">
              <label className="form-label">Location</label>
              <button
                type="button"
                onClick={handleGetLocation}
                disabled={isGettingLocation}
                className="btn btn-sm btn-outline disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <span>📍</span>
                <span>{isGettingLocation ? 'Getting...' : 'Auto Location'}</span>
              </button>
            </div>
            <input
              type="text"
              value={form.location || ''}
              onChange={(e) => setForm(prev => ({ ...prev, location: e.target.value }))}
              className="form-input"
              placeholder="Transaction location (or use Auto Location)"
            />
            <LocationStatus 
              location={currentLocation} 
              isGettingLocation={isGettingLocation} 
              error={locationError} 
            />
          </div>

          <div className="flex gap-3 pt-4">
            <button
              type="submit"
              disabled={isSubmitting}
              className="btn btn-primary flex-1 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isSubmitting ? 'Adding...' : 'Add Transaction'}
            </button>
            <button
              type="button"
              onClick={handleClose}
              className="btn btn-secondary flex-1"
            >
              Clear
            </button>
          </div>
        </form>
      </BaseModal>

      {/* Error Modal - Only for system errors */}
      <ErrorModal
        open={showErrorModal}
        onClose={() => setShowErrorModal(false)}
        title={errorTitle}
        message={errorMessage}
      />

      {/* Category Browser Modal */}
      <BaseModal
        isOpen={showCatModal}
        onClose={() => setShowCatModal(false)}
        title="Select Category & Subcategory"
        size="lg"
      >
        <div className="max-h-96 overflow-auto divide-y divide-secondary-200">
          {categories.map(c => (
            <div key={c.id} className="py-4">
              <div className="font-semibold text-blue-600 mb-3 text-lg">{c.name}</div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                {c.subcategories.map(sc => (
                  <button 
                    key={sc.id} 
                    className="px-4 py-3 border border-slate-200 rounded-xl text-left hover:bg-primary-50 hover:border-primary-300 transition-all duration-200 text-sm font-medium hover:shadow-soft" 
                    onClick={() => { 
                      setForm(f => ({ ...f, categoryId: c.id, subcategoryId: sc.id })); 
                      setShowCatModal(false); 
                    }}
                  >
                    {sc.name}
                  </button>
                ))}
              </div>
            </div>
          ))}
        </div>
      </BaseModal>
    </>
  );
}

export function Transactions() {
  const [categories, setCategories] = useState<Category[]>([]);
  const [transactions, setTransactions] = useState<any[]>([]);
  const [bankAccounts, setBankAccounts] = useState<BankAccount[]>([]);
  const [showAddModal, setShowAddModal] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [showClearAllModal, setShowClearAllModal] = useState(false);
  const [showSuccessNotification, setShowSuccessNotification] = useState(false);
  const [successMessage, setSuccessMessage] = useState('');
  const [transactionToDelete, setTransactionToDelete] = useState<any>(null);

  useEffect(() => {
    (async () => {
      try {
        const [catRes, txRes, bankRes] = await Promise.all([
          api.get('/api/categories'),
          api.get('/api/transactions'),
          api.get('/api/bank-accounts').catch(() => ({ data: [] }))
        ]);
        setCategories(catRes.data);
        setTransactions(txRes.data);
        setBankAccounts(bankRes.data);
      } catch (error) {
        console.error('Failed to fetch data:', error);
      }
    })();
  }, []);

  async function handleAddTransaction(form: Transaction) {
    try {
      const res = await api.post('/api/transactions', form);
      setTransactions((prev) => [res.data, ...prev]);
      
      // Show success notification
      setSuccessMessage(`${form.type === 'Expense' ? 'Expense' : 'Income'} added successfully!`);
      setShowSuccessNotification(true);
    } catch (error) {
      console.error('Failed to create transaction:', error);
      throw error; // Re-throw to handle in modal
    }
  }

  async function deleteTransaction(transactionId: number) {
    try {
      await api.delete(`/api/transactions/${transactionId}`);
      setTransactions(prev => prev.filter(t => t.id !== transactionId));
    } catch (error) {
      console.error('Failed to delete transaction:', error);
    }
  }

  async function clearAllTransactions() {
    try {
      for (const transaction of transactions) {
        await api.delete(`/api/transactions/${transaction.id}`);
      }
      setTransactions([]);
    } catch (error) {
      console.error('Failed to clear all transactions:', error);
    }
  }

  function handleDeleteClick(transaction: any) {
    setTransactionToDelete(transaction);
    setShowDeleteModal(true);
  }

  const total = (t: any) => (Number(t.debit) - Number(t.credit)).toFixed(2);
  const runningTotal = transactions.reduce((acc, t) => acc + (Number(t.debit) - Number(t.credit)), 0).toFixed(2);

  // Calculate summary stats
  const totalIncome = transactions
    .filter(t => t.type === 'Income')
    .reduce((acc, t) => acc + Number(t.credit), 0);
  
  const totalExpenses = transactions
    .filter(t => t.type === 'Expense')
    .reduce((acc, t) => acc + Number(t.debit), 0);

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h2 className="text-3xl font-bold text-slate-900">Transactions</h2>
          <p className="text-slate-600 mt-1">Track your income and expenses</p>
        </div>
        <button
          onClick={() => setShowAddModal(true)}
          className="btn btn-primary btn-lg hover-lift"
        >
          <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
          </svg>
          Add Transaction
        </button>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="card-elevated p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-slate-600">Total Balance</p>
              <p className={`text-2xl font-bold ${Number(runningTotal) >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                ${Math.abs(Number(runningTotal)).toLocaleString()}
              </p>
            </div>
            <div className="w-12 h-12 bg-gradient-to-br from-primary-500 to-primary-600 rounded-xl flex items-center justify-center">
              <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1" />
              </svg>
            </div>
          </div>
        </div>

        <div className="card-elevated p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-slate-600">Total Income</p>
              <p className="text-2xl font-bold text-green-600">
                ${totalIncome.toLocaleString()}
              </p>
            </div>
            <div className="w-12 h-12 bg-gradient-to-br from-success-500 to-success-600 rounded-xl flex items-center justify-center">
              <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" />
              </svg>
            </div>
          </div>
        </div>

        <div className="card-elevated p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-slate-600">Total Expenses</p>
              <p className="text-2xl font-bold text-red-600">
                ${totalExpenses.toLocaleString()}
              </p>
            </div>
            <div className="w-12 h-12 bg-gradient-to-br from-danger-500 to-danger-600 rounded-xl flex items-center justify-center">
              <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 17h8m0 0V9m0 8l-8-8-4 4-6-6" />
              </svg>
            </div>
          </div>
        </div>
      </div>

      {/* Transactions List */}
      <div className="card-elevated">
        <div className="p-6 border-b border-slate-200">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <h3 className="text-xl font-semibold text-slate-900">Transaction History</h3>
            {transactions.length > 0 && (
              <div className="flex items-center gap-3">
                <button
                  onClick={() => setShowClearAllModal(true)}
                  className="btn btn-danger btn-sm"
                >
                  Clear All
                </button>
              </div>
            )}
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="table">
            <thead className="table-header">
              <tr>
                <th className="table-header-cell">Date</th>
                <th className="table-header-cell">Account</th>
                <th className="table-header-cell">Description</th>
                <th className="table-header-cell">Category</th>
                <th className="table-header-cell">Amount</th>
                <th className="table-header-cell">Type</th>
                <th className="table-header-cell">Location</th>
                <th className="table-header-cell">Actions</th>
              </tr>
            </thead>
            <tbody className="table-body">
              {transactions.length === 0 ? (
                <tr>
                  <td colSpan={8} className="text-center py-12">
                    <div className="flex flex-col items-center">
                      <div className="w-16 h-16 bg-slate-100 rounded-full flex items-center justify-center mb-4">
                        <svg className="w-8 h-8 text-secondary-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1" />
                        </svg>
                      </div>
                      <h3 className="text-lg font-medium text-slate-900 mb-2">No transactions yet</h3>
                      <p className="text-slate-500 mb-4">Start by adding your first transaction</p>
                      <button
                        onClick={() => setShowAddModal(true)}
                        className="btn btn-primary"
                      >
                        Add Transaction
                      </button>
                    </div>
                  </td>
                </tr>
              ) : (
                transactions.map((transaction) => (
                  <tr key={transaction.id} className="table-row">
                    <td className="table-cell">
                      <div className="text-sm font-medium text-slate-900">
                        {new Date(transaction.date).toLocaleDateString()}
                      </div>
                    </td>
                    <td className="table-cell">
                      <div className="text-sm text-slate-900">{transaction.account}</div>
                    </td>
                    <td className="table-cell">
                      <div className="text-sm text-slate-900 max-w-xs truncate" title={transaction.name}>
                        {transaction.name}
                      </div>
                    </td>
                    <td className="table-cell">
                      <div className="text-sm text-slate-500">
                        {transaction.category?.name && transaction.subcategory?.name 
                          ? `${transaction.category.name} > ${transaction.subcategory.name}`
                          : '-'
                        }
                      </div>
                    </td>
                    <td className="table-cell">
                      <div className={`text-sm font-semibold ${Number(total(transaction)) >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                        ${Math.abs(Number(total(transaction))).toLocaleString()}
                      </div>
                    </td>
                    <td className="table-cell">
                      <span className={`status-indicator ${
                        transaction.type === 'Income' 
                          ? 'status-success' 
                          : 'status-danger'
                      }`}>
                        {transaction.type}
                      </span>
                    </td>
                    <td className="table-cell">
                      {transaction.location ? (
                        transaction.latitude && transaction.longitude ? (
                          <div className="flex items-center gap-1">
                            <span>📍</span>
                            <a
                              href={locationService.generateMapsLink(transaction.latitude, transaction.longitude)}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="text-blue-600 hover:text-primary-800 underline truncate max-w-32"
                              title={transaction.location}
                            >
                              {transaction.location.length > 20 
                                ? `${transaction.location.substring(0, 20)}...` 
                                : transaction.location
                              }
                            </a>
                          </div>
                        ) : (
                          <span className="text-sm text-slate-500">📍 {transaction.location}</span>
                        )
                      ) : (
                        <span className="text-sm text-secondary-400">-</span>
                      )}
                    </td>
                    <td className="table-cell">
                      <button
                        onClick={() => handleDeleteClick(transaction)}
                        className="text-red-600 hover:text-danger-800 transition-colors"
                      >
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                        </svg>
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Add Transaction Modal */}
      <TransactionModal
        open={showAddModal}
        onClose={() => setShowAddModal(false)}
        onSubmit={handleAddTransaction}
        categories={categories}
        bankAccounts={bankAccounts}
      />

      {/* Success Notification */}
      {showSuccessNotification && (
        <SuccessNotification
          message={successMessage}
          onClose={() => setShowSuccessNotification(false)}
        />
      )}

      {/* Delete Transaction Confirmation Modal */}
      <ConfirmationModal
        isOpen={showDeleteModal}
        onClose={() => setShowDeleteModal(false)}
        onConfirm={async () => {
          if (transactionToDelete) {
            await deleteTransaction(transactionToDelete.id);
          }
        }}
        title="Delete Transaction"
        message={`Are you sure you want to delete the transaction "${transactionToDelete?.name}"? This action cannot be undone.`}
        confirmText="Delete"
        cancelText="Cancel"
        type="danger"
      />

      {/* Clear All Transactions Confirmation Modal */}
      <ConfirmationModal
        isOpen={showClearAllModal}
        onClose={() => setShowClearAllModal(false)}
        onConfirm={clearAllTransactions}
        title="Clear All Transactions"
        message={`Are you sure you want to delete all ${transactions.length} transactions? This action cannot be undone and will permanently remove all your financial data.`}
        confirmText="Delete All"
        cancelText="Cancel"
        type="danger"
      />
    </div>
  );
}
