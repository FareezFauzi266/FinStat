import React, { useState, useEffect, useCallback } from 'react';
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

export function CategoryManagement() {
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
  const [loading, setLoading] = useState(false);
  const [showSuccessNotification, setShowSuccessNotification] = useState(false);
  const [successMessage, setSuccessMessage] = useState('');

  useEffect(() => {
    fetchCategories();
  }, []);

  const fetchCategories = async () => {
    try {
      const response = await api.get('/api/categories');
      setCategories(response.data);
    } catch (error) {
      console.error('Failed to fetch categories:', error);
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
      
      // Update the categories state with the new subcategory
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
      
      // Update the categories state by removing the subcategory
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

  // Optimized input handlers
  const handleCategoryNameChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    setCategoryForm({ name: e.target.value });
  }, []);

  const handleSubcategoryNameChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    setSubcategoryForm({ name: e.target.value });
  }, []);

  const resetCategoryForm = () => {
    setCategoryForm({ name: '' });
  };

  const resetSubcategoryForm = () => {
    setSubcategoryForm({ name: '' });
    setSelectedCategory(null);
  };

  return (
    <div className="p-6 space-y-6">
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
              onChange={handleCategoryNameChange}
              className="form-input"
              placeholder="e.g., Food & Dining"
              required
            />
            <p className="form-help">Choose a descriptive name for your category</p>
          </div>
          <div className="flex gap-3">
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
              onChange={handleSubcategoryNameChange}
              className="form-input"
              placeholder="e.g., Restaurants"
              required
            />
            <p className="form-help">Choose a specific name for this subcategory</p>
          </div>
          <div className="flex gap-3">
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
