'use client';
import { useState, useEffect } from 'react';
import { useClientOnly } from '../../hooks/useClientOnly';
import styles from './FixDimensions.module.css';

export default function FixDimensions() {
  const isClient = useClientOnly();
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(false);
  const [editing, setEditing] = useState(null);
  const [message, setMessage] = useState('');
  const [searchQuery, setSearchQuery] = useState('');
  const [searchType, setSearchType] = useState('name'); // 'name' or 'barcode'
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [itemsPerPage] = useState(20);

  // Load products with pagination
  const loadProducts = async (page = 1, search = '', type = 'name') => {
    setLoading(true);
    try {
      let url = `/api/barcodes/search?page=${page}&limit=${itemsPerPage}`;
      
      if (search.trim()) {
        if (type === 'barcode') {
          url += `&barcode=${encodeURIComponent(search.trim())}`;
        } else {
          url += `&q=${encodeURIComponent(search.trim())}`;
        }
      }
      
      const response = await fetch(url);
      if (response.ok) {
        const data = await response.json();
        setProducts(data.results || []);
        setTotalPages(Math.ceil((data.total || data.results.length) / itemsPerPage));
        setCurrentPage(page);
      } else {
        setMessage('خطا در بارگذاری محصولات');
      }
    } catch (error) {
      setMessage('خطا در اتصال به سرور');
    } finally {
      setLoading(false);
    }
  };

  // Search products
  const handleSearch = () => {
    if (searchQuery.trim()) {
      setCurrentPage(1);
      loadProducts(1, searchQuery, searchType);
    } else {
      loadProducts(1, '', 'name');
    }
  };

  // Clear search
  const clearSearch = () => {
    setSearchQuery('');
    setSearchType('name');
    setCurrentPage(1);
    loadProducts(1, '', 'name');
  };

  // Load all products (no search)
  const loadAllProducts = () => {
    setSearchQuery('');
    setSearchType('name');
    setCurrentPage(1);
    loadProducts(1, '', 'name');
  };

  // Fix a product's dimensions and model
  const fixDimensions = async (barcode, correctedName, correctedModel) => {
    try {
      const response = await fetch('/api/barcodes/fix-dimensions', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ barcode, correctedName, correctedModel })
      });

      if (response.ok) {
        const data = await response.json();
        setMessage(`✅ ${data.message}`);
        setEditing(null);
        // Reload current page
        loadProducts(currentPage, searchQuery, searchType);
      } else {
        const error = await response.json();
        setMessage(`❌ ${error.error}`);
      }
    } catch (error) {
      setMessage('خطا در اتصال به سرور');
    }
  };

  // Start editing a product
  const startEdit = (product) => {
    setEditing({
      barcode: product.code,
      currentName: product.name,
      correctedName: product.name,
      currentModel: product.model,
      correctedModel: product.model
    });
  };

  // Cancel editing
  const cancelEdit = () => {
    setEditing(null);
    setMessage('');
  };

  // Save the correction
  const saveCorrection = () => {
    const nameChanged = editing.correctedName.trim() !== editing.currentName;
    const modelChanged = editing.correctedModel.trim() !== editing.currentModel;
    
    if (!nameChanged && !modelChanged) {
      setMessage('هیچ تغییری اعمال نشده است');
      return;
    }
    
    fixDimensions(editing.barcode, editing.correctedName.trim(), editing.correctedModel.trim());
  };

  // Handle page change
  const handlePageChange = (page) => {
    setCurrentPage(page);
    loadProducts(page, searchQuery, searchType);
  };

  // Handle enter key in search
  const handleKeyPress = (e) => {
    if (e.key === 'Enter') {
      handleSearch();
    }
  };

  useEffect(() => {
    // Prevent hydration mismatch by loading after component mounts
    if (isClient) {
      loadProducts(1, '', 'name');
    }
  }, [isClient]);

  // Don't render until client-side
  if (!isClient) {
    return (
      <div className={styles.container}>
        <div className={styles.loadingState}>
          <p>در حال بارگذاری...</p>
        </div>
      </div>
    );
  }

  return (
    <div className={styles.container}>
      <h1 className={styles.title}>مدیریت محصولات</h1>
      
      {message && (
        <div className={styles.message}>
          {message}
          <button onClick={() => setMessage('')} className={styles.closeMessage}>✕</button>
        </div>
      )}

      {/* Search Controls */}
      <div className={styles.searchControls}>
        <div className={styles.searchInputs}>
          <select 
            value={searchType} 
            onChange={(e) => setSearchType(e.target.value)}
            className={styles.searchTypeSelect}
          >
            <option value="name">جستجو با نام</option>
            <option value="barcode">جستجو با بارکد</option>
          </select>
          
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            onKeyPress={handleKeyPress}
            placeholder={searchType === 'barcode' ? 'بارکد ۱۳ رقمی' : 'نام محصول...'}
            className={styles.searchInput}
          />
          
          <button onClick={handleSearch} disabled={loading} className={styles.searchBtn}>
            جستجو
          </button>
        </div>
        
        <div className={styles.searchActions}>
          <button onClick={clearSearch} className={styles.clearBtn}>
            پاک کردن
          </button>
          <button onClick={loadAllProducts} className={styles.loadAllBtn}>
            نمایش همه
          </button>
        </div>
      </div>

      {/* Controls */}
      <div className={styles.controls}>
        <button onClick={() => loadProducts(currentPage, searchQuery, searchType)} disabled={loading} className={styles.refreshBtn}>
          {loading ? 'در حال بارگذاری...' : 'تازه‌سازی'}
        </button>
        <p className={styles.info}>
          {searchQuery ? `نتایج جستجو برای: "${searchQuery}"` : 'همه محصولات (محصولات با نام در اولویت)'}
        </p>
      </div>

      {/* Products List */}
      {products.length === 0 && !loading ? (
        <div className={styles.noProducts}>
          <p>📦 هیچ محصولی یافت نشد!</p>
        </div>
      ) : (
        <>
          <div className={styles.productsList}>
            {products.map((product) => (
              <div key={product.code} className={styles.productCard}>
                <div className={styles.productHeader}>
                  <span className={styles.barcode}>{product.code}</span>
                  {product.name && product.name.match(/\d{1,2}[×xX]\d{1,2}/) && (
                    <span className={styles.dimensions}>
                      {product.name.match(/\d{1,2}[×xX]\d{1,2}/)[0]}
                    </span>
                  )}
                </div>
                
                                  <div className={styles.productContent}>
                    <p className={styles.productName}>
                      {product.name || 'بدون نام'}
                      {!product.name && <span className={styles.noNameBadge}>بدون نام</span>}
                    </p>
                    <p className={styles.model}>{product.model || 'بدون مدل'}</p>
                    <p className={styles.boxNum}>
                      {product.box_num ? `هر کارتن: ${product.box_num} عدد` : 'تعداد در کارتن: نامشخص'}
                    </p>
                  
                  {editing?.barcode === product.code ? (
                    <div className={styles.editForm}>
                      <div className={styles.editInputs}>
                        <input
                          type="text"
                          value={editing.correctedName}
                          onChange={(e) => setEditing({
                            ...editing,
                            correctedName: e.target.value
                          })}
                          className={styles.editInput}
                          placeholder="نام صحیح محصول"
                        />
                        <input
                          type="text"
                          value={editing.correctedModel}
                          onChange={(e) => setEditing({
                            ...editing,
                            correctedModel: e.target.value
                          })}
                          className={styles.editInput}
                          placeholder="مدل صحیح محصول"
                        />
                      </div>
                      <div className={styles.editButtons}>
                        <button onClick={saveCorrection} className={styles.saveBtn}>
                          ذخیره
                        </button>
                        <button onClick={cancelEdit} className={styles.cancelBtn}>
                          لغو
                        </button>
                      </div>
                    </div>
                  ) : (
                    <button onClick={() => startEdit(product)} className={styles.editBtn}>
                      ویرایش
                    </button>
                  )}
                </div>
              </div>
            ))}
          </div>

          {/* Pagination */}
          {totalPages > 1 && (
            <div className={styles.pagination}>
              <button 
                onClick={() => handlePageChange(currentPage - 1)} 
                disabled={currentPage === 1}
                className={styles.pageBtn}
              >
                قبلی
              </button>
              
              <span className={styles.pageInfo}>
                صفحه {currentPage} از {totalPages}
              </span>
              
              <button 
                onClick={() => handlePageChange(currentPage + 1)} 
                disabled={currentPage === totalPages}
                className={styles.pageBtn}
              >
                بعدی
              </button>
            </div>
          )}
        </>
      )}
    </div>
  );
}
