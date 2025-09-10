import React, { useState, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { api } from '../contexts/AuthContext';
import { BaseModal } from './BaseModal';
import { ConfirmationModal } from './ConfirmationModal';

interface Category {
  id: number;
  name: string;
  subcategories: Subcategory[];
}

interface Subcategory {
  id: number;
  name: string;
  categoryId: number;
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

export function Settings() {
  const { user } = useAuth();
  const [activeTab, setActiveTab] = useState('profile');
  const [showPasswordModal, setShowPasswordModal] = useState(false);
  const [showSuccessNotification, setShowSuccessNotification] = useState(false);
  const [successMessage, setSuccessMessage] = useState('');
  const [passwordData, setPasswordData] = useState({
    currentPassword: '',
    newPassword: '',
    confirmPassword: ''
  });
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState('');

  // Category management state
  const [categories, setCategories] = useState<Category[]>([]);
  const [showCategoryModal, setShowCategoryModal] = useState(false);
  const [showSubcategoryModal, setShowSubcategoryModal] = useState(false);
  const [showDeleteCategoryModal, setShowDeleteCategoryModal] = useState(false);
  const [showDeleteSubcategoryModal, setShowDeleteSubcategoryModal] = useState(false);
  const [selectedCategory, setSelectedCategory] = useState<Category | null>(null);
  const [categoryToDelete, setCategoryToDelete] = useState<Category | null>(null);
  const [subcategoryToDelete, setSubcategoryToDelete] = useState<Subcategory | null>(null);
  const [categoryForm, setCategoryForm] = useState({ name: '' });
  const [subcategoryForm, setSubcategoryForm] = useState({ name: '' });

  const tabs = [
    { 
      id: 'profile', 
      label: 'Profile', 
      icon: (
        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
        </svg>
      )
    },
    { 
      id: 'categories', 
      label: 'Categories', 
      icon: (
        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
        </svg>
      )
    }
  ];

  useEffect(() => {
    if (activeTab === 'categories') {
      fetchCategories();
    }
  }, [activeTab]);

  const fetchCategories = async () => {
    try {
      const response = await api.get('/api/categories');
      setCategories(response.data);
    } catch (error) {
      console.error('Failed to fetch categories:', error);
    }
  };

  const handlePasswordChange = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (passwordData.newPassword !== passwordData.confirmPassword) {
      setMessage('New passwords do not match');
      return;
    }

    if (passwordData.newPassword.length < 6) {
      setMessage('New password must be at least 6 characters long');
      return;
    }

    setLoading(true);
    setMessage('');

    try {
      await api.put('/api/auth/change-password', {
        currentPassword: passwordData.currentPassword,
        newPassword: passwordData.newPassword
      });
      
      setMessage('Password changed successfully!');
      setPasswordData({ currentPassword: '', newPassword: '', confirmPassword: '' });
      setShowPasswordModal(false);
      
      // Show success notification
      setSuccessMessage('Password changed successfully!');
      setShowSuccessNotification(true);
    } catch (error: any) {
      setMessage(error.response?.data?.error || 'Failed to change password');
    } finally {
      setLoading(false);
    }
  };

  const handleCreateCategory = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    
    try {
      const response = await api.post('/api/categories', categoryForm);
      setCategories(prev => [...prev, response.data]);
      setCategoryForm({ name: '' });
      setShowCategoryModal(false);
      
      // Show success notification
      setSuccessMessage('Category added successfully!');
      setShowSuccessNotification(true);
    } catch (error) {
      console.error('Failed to create category:', error);
      alert('Failed to create category. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleCreateSubcategory = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedCategory) return;
    
    setLoading(true);
    
    try {
      const response = await api.post('/api/subcategories', {
        name: subcategoryForm.name,
        categoryId: selectedCategory.id
      });
      
      setCategories(prev => prev.map(cat => 
        cat.id === selectedCategory.id 
          ? { ...cat, subcategories: [...cat.subcategories, response.data] }
          : cat
      ));
      
      setSubcategoryForm({ name: '' });
      setShowSubcategoryModal(false);
      setSelectedCategory(null);
      
      // Show success notification
      setSuccessMessage('Subcategory added successfully!');
      setShowSuccessNotification(true);
    } catch (error) {
      console.error('Failed to create subcategory:', error);
      alert('Failed to create subcategory. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteCategory = async () => {
    if (!categoryToDelete) return;
    
    try {
      await api.delete(`/api/categories/${categoryToDelete.id}`);
      setCategories(prev => prev.filter(cat => cat.id !== categoryToDelete.id));
      setCategoryToDelete(null);
      setShowDeleteCategoryModal(false);
      
      // Show success notification
      setSuccessMessage('Category deleted successfully!');
      setShowSuccessNotification(true);
    } catch (error) {
      console.error('Failed to delete category:', error);
      alert('Failed to delete category. Please try again.');
    }
  };

  const handleDeleteSubcategory = async () => {
    if (!subcategoryToDelete) return;
    
    try {
      await api.delete(`/api/subcategories/${subcategoryToDelete.id}`);
      
      setCategories(prev => prev.map(cat => ({
        ...cat,
        subcategories: cat.subcategories.filter(sub => sub.id !== subcategoryToDelete.id)
      })));
      
      setSubcategoryToDelete(null);
      setShowDeleteSubcategoryModal(false);
      
      // Show success notification
      setSuccessMessage('Subcategory deleted successfully!');
      setShowSuccessNotification(true);
    } catch (error) {
      console.error('Failed to delete subcategory:', error);
      alert('Failed to delete subcategory. Please try again.');
    }
  };

  const openDeleteCategoryModal = (category: Category) => {
    setCategoryToDelete(category);
    setShowDeleteCategoryModal(true);
  };

  const openDeleteSubcategoryModal = (subcategory: Subcategory) => {
    setSubcategoryToDelete(subcategory);
    setShowDeleteSubcategoryModal(true);
  };

  const resetPasswordForm = () => {
    setPasswordData({ currentPassword: '', newPassword: '', confirmPassword: '' });
    setMessage('');
  };

  const resetCategoryForm = () => {
    setCategoryForm({ name: '' });
  };

  const resetSubcategoryForm = () => {
    setSubcategoryForm({ name: '' });
    setSelectedCategory(null);
  };

  const renderProfileTab = () => (
    <div className="space-y-6">
      <div>
        <h2 className="text-3xl font-bold text-slate-900 mb-2">Profile Management</h2>
        <p className="text-slate-600">Manage your account information and security settings</p>
      </div>

      {/* User Information */}
      <div className="card-elevated p-6">
        <h3 className="text-xl font-semibold text-slate-900 mb-6">Account Information</h3>
        <div className="space-y-6">
          <div className="flex items-center space-x-4">
            <div className="w-16 h-16 bg-gradient-to-br from-primary-500 to-primary-600 rounded-2xl flex items-center justify-center shadow-glow">
              <svg className="w-8 h-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
              </svg>
            </div>
            <div>
              <h4 className="text-xl font-semibold text-slate-900">{user?.fullName}</h4>
              <p className="text-slate-600">{user?.email}</p>
            </div>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 pt-6 border-t border-slate-200">
            <div>
              <label className="form-label">Full Name</label>
              <p className="text-lg text-slate-900 font-medium">{user?.fullName}</p>
            </div>
            <div>
              <label className="form-label">Email Address</label>
              <p className="text-lg text-slate-900 font-medium">{user?.email}</p>
              <p className="text-sm text-slate-500">Email cannot be changed</p>
            </div>
            <div>
              <label className="form-label">Member Since</label>
              <p className="text-lg text-slate-900 font-medium">
                {user?.createdAt ? new Date(user.createdAt).toLocaleDateString('en-US', {
                  year: 'numeric',
                  month: 'long',
                  day: 'numeric'
                }) : 'N/A'}
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Password Change Section */}
      <div className="card-elevated p-6">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <h3 className="text-xl font-semibold text-slate-900">Change Password</h3>
            <p className="text-slate-600 mt-1">Update your account password for better security</p>
          </div>
          <button
            onClick={() => setShowPasswordModal(true)}
            className="btn btn-primary"
          >
            <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
            </svg>
            Change Password
          </button>
        </div>
      </div>
    </div>
  );

  const renderCategoriesTab = () => (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h2 className="text-3xl font-bold text-slate-900">Category Management</h2>
          <p className="text-slate-600 mt-1">Organize your transactions with categories and subcategories</p>
        </div>
        <button
          onClick={() => setShowCategoryModal(true)}
          className="btn btn-primary btn-lg hover-lift"
        >
          <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
          </svg>
          Add Category
        </button>
      </div>

      {/* Categories List */}
      <div className="card-elevated">
        <div className="p-6">
          <h3 className="text-xl font-semibold text-slate-900 mb-6">Categories & Subcategories</h3>
          {categories.length === 0 ? (
            <div className="text-center py-12">
              <div className="w-16 h-16 mx-auto mb-4 bg-gradient-to-br from-primary-100 to-primary-200 rounded-2xl flex items-center justify-center">
                <svg className="w-8 h-8 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
                </svg>
              </div>
              <h3 className="text-lg font-semibold text-slate-900 mb-2">No categories yet</h3>
              <p className="text-slate-500 mb-6">Create categories to organize your transactions</p>
              <button
                onClick={() => setShowCategoryModal(true)}
                className="btn btn-primary"
              >
                <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
                </svg>
                Add Your First Category
              </button>
            </div>
          ) : (
            <div className="space-y-4">
              {categories.map((category) => (
                <div key={category.id} className="border border-slate-200 rounded-2xl p-6 hover:bg-slate-50 transition-colors group">
                  <div className="flex items-center justify-between mb-4">
                    <h4 className="text-lg font-semibold text-slate-900 group-hover:text-blue-600 transition-colors">
                      {category.name}
                    </h4>
                    <div className="flex gap-2">
                      <button
                        onClick={() => {
                          setSelectedCategory(category);
                          setShowSubcategoryModal(true);
                        }}
                        className="btn btn-success btn-sm"
                      >
                        <svg className="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
                        </svg>
                        Add Subcategory
                      </button>
                      <button
                        onClick={() => openDeleteCategoryModal(category)}
                        className="btn btn-danger btn-sm"
                      >
                        <svg className="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                        </svg>
                        Delete
                      </button>
                    </div>
                  </div>
                  
                  {category.subcategories.length > 0 ? (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
                      {category.subcategories.map((subcategory) => (
                        <div key={subcategory.id} className="flex items-center justify-between p-3 bg-slate-50 rounded-xl border border-secondary-100 group/sub">
                          <span className="text-sm font-medium text-slate-700">{subcategory.name}</span>
                          <button
                            onClick={() => openDeleteSubcategoryModal(subcategory)}
                            className="text-red-600 hover:text-danger-800 text-xs transition-colors opacity-0 group-hover/sub:opacity-100"
                          >
                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                            </svg>
                          </button>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <p className="text-slate-500 text-sm italic">No subcategories yet</p>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );

  return (
    <div className="p-6 space-y-6">
      {/* Tab Navigation */}
      <div className="border-b border-slate-200">
        <nav className="-mb-px flex space-x-8">
          {tabs.map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`py-3 px-1 border-b-2 font-medium text-sm transition-colors flex items-center ${
                activeTab === tab.id
                  ? 'border-primary-500 text-blue-600'
                  : 'border-transparent text-slate-500 hover:text-slate-700 hover:border-secondary-300'
              }`}
            >
              <span className="w-5 h-5 flex items-center justify-center mr-3">{tab.icon}</span>
              {tab.label}
            </button>
          ))}
        </nav>
      </div>

      {/* Tab Content */}
      <div className="animate-fade-in">
        {activeTab === 'profile' && renderProfileTab()}
        {activeTab === 'categories' && renderCategoriesTab()}
      </div>

      {/* Password Change Modal */}
      <BaseModal
        isOpen={showPasswordModal}
        onClose={() => {
          setShowPasswordModal(false);
          resetPasswordForm();
        }}
        title="Change Password"
        size="md"
      >
        <form onSubmit={handlePasswordChange} className="space-y-6">
          <div>
            <label className="form-label">
              Current Password
            </label>
            <input
              type="password"
              value={passwordData.currentPassword}
              onChange={(e) => setPasswordData({ ...passwordData, currentPassword: e.target.value })}
              className="form-input"
              required
            />
          </div>
          <div>
            <label className="form-label">
              New Password
            </label>
            <input
              type="password"
              value={passwordData.newPassword}
              onChange={(e) => setPasswordData({ ...passwordData, newPassword: e.target.value })}
              className="form-input"
              required
              minLength={6}
            />
            <p className="form-help">Password must be at least 6 characters long</p>
          </div>
          <div>
            <label className="form-label">
              Confirm New Password
            </label>
            <input
              type="password"
              value={passwordData.confirmPassword}
              onChange={(e) => setPasswordData({ ...passwordData, confirmPassword: e.target.value })}
              className="form-input"
              required
              minLength={6}
            />
          </div>
          
          {message && (
            <div className={`p-4 rounded-xl text-sm font-medium ${
              message.includes('successfully') 
                ? 'bg-success-50 text-success-700 border border-success-200' 
                : 'bg-danger-50 text-danger-700 border border-danger-200'
            }`}>
              {message}
            </div>
          )}

          <div className="flex gap-3 pt-4">
            <button
              type="submit"
              disabled={loading}
              className="btn btn-success flex-1 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {loading ? (
                <>
                  <div className="loading-spinner w-4 h-4 mr-2"></div>
                  Changing...
                </>
              ) : (
                'Change Password'
              )}
            </button>
            <button
              type="button"
              onClick={() => {
                setShowPasswordModal(false);
                resetPasswordForm();
              }}
              className="btn btn-secondary flex-1"
            >
              Cancel
            </button>
          </div>
        </form>
      </BaseModal>

      {/* Add Category Modal */}
      <BaseModal
        isOpen={showCategoryModal}
        onClose={() => {
          setShowCategoryModal(false);
          resetCategoryForm();
        }}
        title="Add New Category"
        size="md"
      >
        <form onSubmit={handleCreateCategory} className="space-y-6">
          <div>
            <label className="form-label">
              Category Name
            </label>
            <input
              type="text"
              value={categoryForm.name}
              onChange={(e) => setCategoryForm({ name: e.target.value })}
              className="form-input"
              placeholder="e.g., Food & Dining"
              required
            />
            <p className="form-help">Choose a descriptive name for your category</p>
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
                'Add Category'
              )}
            </button>
            <button
              type="button"
              onClick={() => {
                setShowCategoryModal(false);
                resetCategoryForm();
              }}
              className="btn btn-secondary flex-1"
            >
              Cancel
            </button>
          </div>
        </form>
      </BaseModal>

      {/* Add Subcategory Modal */}
      <BaseModal
        isOpen={showSubcategoryModal}
        onClose={() => {
          setShowSubcategoryModal(false);
          resetSubcategoryForm();
        }}
        title={`Add Subcategory to "${selectedCategory?.name}"`}
        size="md"
      >
        <form onSubmit={handleCreateSubcategory} className="space-y-6">
          <div>
            <label className="form-label">
              Subcategory Name
            </label>
            <input
              type="text"
              value={subcategoryForm.name}
              onChange={(e) => setSubcategoryForm({ name: e.target.value })}
              className="form-input"
              placeholder="e.g., Restaurants"
              required
            />
            <p className="form-help">Choose a specific name for this subcategory</p>
          </div>
          <div className="flex gap-3 pt-4">
            <button
              type="submit"
              disabled={loading}
              className="btn btn-success flex-1 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {loading ? (
                <>
                  <div className="loading-spinner w-4 h-4 mr-2"></div>
                  Adding...
                </>
              ) : (
                'Add Subcategory'
              )}
            </button>
            <button
              type="button"
              onClick={() => {
                setShowSubcategoryModal(false);
                resetSubcategoryForm();
              }}
              className="btn btn-secondary flex-1"
            >
              Cancel
            </button>
          </div>
        </form>
      </BaseModal>

      {/* Delete Category Confirmation Modal */}
      <ConfirmationModal
        isOpen={showDeleteCategoryModal}
        onClose={() => setShowDeleteCategoryModal(false)}
        onConfirm={handleDeleteCategory}
        title="Delete Category"
        message={`Are you sure you want to delete the category "${categoryToDelete?.name}"? This will also delete all its subcategories.`}
        confirmText="Delete Category"
        cancelText="Cancel"
        type="danger"
      />

      {/* Delete Subcategory Confirmation Modal */}
      <ConfirmationModal
        isOpen={showDeleteSubcategoryModal}
        onClose={() => setShowDeleteSubcategoryModal(false)}
        onConfirm={handleDeleteSubcategory}
        title="Delete Subcategory"
        message={`Are you sure you want to delete the subcategory "${subcategoryToDelete?.name}"?`}
        confirmText="Delete Subcategory"
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
