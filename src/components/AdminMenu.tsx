import React, { useState } from 'react';
import { MenuItem, Category } from '../types';
import { Plus, Edit2, Trash2, Eye, EyeOff, Save, X, Search, Image, Loader2 } from 'lucide-react';

interface AdminMenuProps {
  menuItems: MenuItem[];
  categories: Category[];
  onAddMenuItem: (item: MenuItem) => void;
  onUpdateMenuItem: (id: string, item: Partial<MenuItem>) => void;
  onDeleteMenuItem: (id: string) => void;
  permissions: string[];
}

export const AdminMenu: React.FC<AdminMenuProps> = ({
  menuItems,
  categories,
  onAddMenuItem,
  onUpdateMenuItem,
  onDeleteMenuItem,
  permissions
}) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [editingItem, setEditingItem] = useState<MenuItem | null>(null);
  const [isAdding, setIsAdding] = useState(false);

  // Form Fields
  const [nameBn, setNameBn] = useState('');
  const [nameEn, setNameEn] = useState('');
  const [descBn, setDescBn] = useState('');
  const [descEn, setDescEn] = useState('');
  const [price, setPrice] = useState<number>(0);
  const [discPrice, setDiscPrice] = useState<string>('');
  const [imgUrl, setImgUrl] = useState('');
  const [categorySelect, setCategorySelect] = useState('');
  const [isAvail, setIsAvail] = useState(true);
  const [isMostOrder, setIsMostOrder] = useState(false);

  // Check Permissions
  const canManage = permissions.includes('manage_menu') || permissions.includes('all');

  const startAdd = () => {
    setNameBn('');
    setNameEn('');
    setDescBn('');
    setDescEn('');
    setPrice(0);
    setDiscPrice('');
    setImgUrl('');
    setCategorySelect(categories[0]?.id || '');
    setIsAvail(true);
    setIsMostOrder(false);
    setIsAdding(true);
    setEditingItem(null);
  };

  const startEdit = (item: MenuItem) => {
    setEditingItem(item);
    setNameBn(item.nameBn);
    setNameEn(item.nameEn);
    setDescBn(item.descriptionBn || '');
    setDescEn(item.descriptionEn || '');
    setPrice(item.regularPrice);
    setDiscPrice(item.discountedPrice !== undefined ? String(item.discountedPrice) : '');
    setImgUrl(item.image);
    setCategorySelect(item.categoryId);
    setIsAvail(item.isAvailable);
    setIsMostOrder(!!item.isMostlyOrdered);
    setIsAdding(false);
  };

  const cancelForm = () => {
    setIsAdding(false);
    setEditingItem(null);
  };

  const [isSaving, setIsSaving] = useState(false);

  const saveForm = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!canManage) {
      alert('You do not have permissions to manage the menu catalog.');
      return;
    }

    const itemData: any = {
      nameBn,
      nameEn,
      descriptionBn: descBn,
      descriptionEn: descEn,
      regularPrice: Number(price),
      discountedPrice: discPrice !== '' ? Number(discPrice) : undefined,
      image: imgUrl || 'https://images.unsplash.com/photo-1546069901-ba9599a7e63c?w=600&auto=format&fit=crop&q=80',
      categoryId: categorySelect || (categories && categories.length > 0 ? categories[0].id : ''),
      isAvailable: isAvail,
      isMostlyOrdered: isMostOrder,
    };

    setIsSaving(true);
    try {
      if (isAdding) {
        const generatedId = 'food-' + Math.random().toString(36).substr(2, 9);
        await onAddMenuItem({
          id: generatedId,
          ...itemData,
          createdAt: new Date().toISOString(),
          isDeleted: false
        });
        setIsAdding(false);
      } else if (editingItem) {
        await onUpdateMenuItem(editingItem.id, itemData);
        setEditingItem(null);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setIsSaving(false);
    }
  };

  const activeCatalog = menuItems.filter(item => 
    !item.isDeleted && 
    (item.nameBn.toLowerCase().includes(searchTerm.toLowerCase()) || 
     item.nameEn.toLowerCase().includes(searchTerm.toLowerCase()))
  );

  return (
    <div className="space-y-6 text-left">
      
      {/* Search and control triggers */}
      {!isAdding && !editingItem && (
        <div className="flex flex-col sm:flex-row gap-4 items-stretch sm:items-center justify-between">
          <div className="relative flex-1 max-w-sm">
            <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
            <input
              type="text"
              placeholder="Search recipes on catalog..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-2 bg-white rounded-xl border border-gray-150 text-xs text-gray-900 focus:outline-none focus:ring-2 focus:ring-amber-500/20"
            />
          </div>
          {canManage && (
            <button
              onClick={startAdd}
              className="px-4 py-2 bg-amber-500 hover:bg-amber-600 font-bold text-white text-xs rounded-xl flex items-center gap-1.5 cursor-pointer shadow-sm shadow-amber-500/10 active:scale-98 transition-transform"
            >
              <Plus className="w-4 h-4" />
              <span>Add New Dish</span>
            </button>
          )}
        </div>
      )}

      {/* Editor Modal Overlay Frame */}
      {(isAdding || editingItem) && (
        <div className="bg-white rounded-3xl border border-gray-150 p-6 shadow-sm max-w-2xl mx-auto space-y-6">
          <div className="flex justify-between border-b border-gray-100 pb-3">
            <h4 className="font-sans font-bold text-base text-gray-950">
              {isAdding ? '⭐ Create New Gourmet Recipe' : '✏️ Edit Listed Recipe'}
            </h4>
            <button onClick={cancelForm} className="text-gray-400 hover:text-gray-700 cursor-pointer">
              <X className="w-5 h-5" />
            </button>
          </div>

          <form onSubmit={saveForm} className="space-y-4 text-xs">
            <div className="grid sm:grid-cols-2 gap-4">
              
              {/* Bangla Name */}
              <div className="space-y-1.5">
                <label className="font-bold text-gray-750">খাবারের নাম (বাংলায়) *</label>
                <input
                  type="text"
                  required
                  placeholder="যেমন: ঘরোয়া বিফ কাচ্চি"
                  value={nameBn}
                  onChange={(e) => setNameBn(e.target.value)}
                  className="w-full p-2.5 bg-white rounded-xl border border-gray-200 focus:ring-2 focus:ring-amber-100 focus:outline-none"
                />
              </div>

              {/* English Name */}
              <div className="space-y-1.5">
                <label className="font-bold text-gray-750">Food Name (English) *</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Basmati Beef Kacchi"
                  value={nameEn}
                  onChange={(e) => setNameEn(e.target.value)}
                  className="w-full p-2.5 bg-white rounded-xl border border-gray-200 focus:ring-2 focus:ring-amber-100 focus:outline-none"
                />
              </div>

            </div>

            <div className="grid sm:grid-cols-2 gap-4">
              
              {/* Bangla description */}
              <div className="space-y-1.5">
                <label className="font-bold text-gray-750">খাবারের বিবরণ (বাংলায়)</label>
                <textarea
                  placeholder="উপাদান ও রান্নার ধরণ..."
                  rows={3}
                  value={descBn}
                  onChange={(e) => setDescBn(e.target.value)}
                  className="w-full p-2.5 bg-white rounded-xl border border-gray-200 focus:ring-2 focus:ring-amber-100 focus:outline-none"
                />
              </div>

              {/* English description */}
              <div className="space-y-1.5">
                <label className="font-bold text-gray-750">Description (English)</label>
                <textarea
                  placeholder="Ingredients highlights..."
                  rows={3}
                  value={descEn}
                  onChange={(e) => setDescEn(e.target.value)}
                  className="w-full p-2.5 bg-white rounded-xl border border-gray-200 focus:ring-2 focus:ring-amber-100 focus:outline-none"
                />
              </div>

            </div>

            <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
              
              {/* Regular price */}
              <div className="space-y-1.5">
                <label className="font-bold text-gray-750">Regular Price (BDT) *</label>
                <input
                  type="number"
                  required
                  min={0}
                  value={price || ''}
                  onChange={(e) => setPrice(Number(e.target.value))}
                  className="w-full p-2.5 bg-white rounded-xl border border-gray-200 focus:ring-2 focus:ring-amber-100 focus:outline-none"
                />
              </div>

              {/* Discount price */}
              <div className="space-y-1.5">
                <label className="font-bold text-gray-750">Discount Price (Optional)</label>
                <input
                  type="number"
                  min={0}
                  placeholder="Discounted price"
                  value={discPrice}
                  onChange={(e) => setDiscPrice(e.target.value)}
                  className="w-full p-2.5 bg-white rounded-xl border border-gray-200 focus:ring-2 focus:ring-amber-100 focus:outline-none"
                />
              </div>

              {/* Select Category */}
              <div className="col-span-2 sm:col-span-1 space-y-1.5">
                <label className="font-bold text-gray-750">Food Category *</label>
                <select
                  value={categorySelect}
                  onChange={(e) => setCategorySelect(e.target.value)}
                  className="w-full p-2.5 bg-white rounded-xl border border-gray-200 focus:ring-2 focus:ring-amber-100 focus:outline-none"
                >
                  {categories.map((c) => (
                    <option key={c.id} value={c.id}>{c.nameEn}</option>
                  ))}
                </select>
              </div>

            </div>

            <div className="grid sm:grid-cols-3 gap-4">
              
              {/* Photo Image url */}
              <div className="col-span-1 space-y-1.5">
                <label className="font-bold text-gray-750">Image URL</label>
                <input
                  type="url"
                  placeholder="https://images.unsplash.com/photo-..."
                  value={imgUrl}
                  onChange={(e) => setImgUrl(e.target.value)}
                  className="w-full p-2.5 bg-white rounded-xl border border-gray-200 focus:ring-2 focus:ring-amber-100 focus:outline-none"
                />
              </div>

              {/* Toggle is available */}
              <div className="flex items-center gap-2 pt-6">
                <input
                  type="checkbox"
                  id="isAvailableCheck"
                  checked={isAvail}
                  onChange={(e) => setIsAvail(e.target.checked)}
                  className="w-4 h-4 rounded text-amber-500 focus:ring-amber-300"
                />
                <label htmlFor="isAvailableCheck" className="font-bold text-gray-750 select-none cursor-pointer">
                  In Stock / Available Now
                </label>
              </div>

              {/* Toggle is mostly ordered */}
              <div className="flex items-center gap-2 pt-6">
                <input
                  type="checkbox"
                  id="isMostlyOrderedCheck"
                  checked={isMostOrder}
                  onChange={(e) => setIsMostOrder(e.target.checked)}
                  className="w-4 h-4 rounded text-amber-500 focus:ring-amber-300"
                />
                <label htmlFor="isMostlyOrderedCheck" className="font-bold text-gray-750 select-none cursor-pointer">
                  Featured (Bento Grid)
                </label>
              </div>

            </div>

            <div className="flex items-center justify-end gap-2 pt-4 border-t border-gray-100">
              <button
                type="button"
                onClick={cancelForm}
                className="px-4 py-2.5 text-gray-500 hover:bg-gray-100 rounded-xl cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={isSaving}
                className={`px-5 py-2.5 font-bold rounded-xl flex items-center gap-1.5 cursor-pointer shadow-sm transition-opacity ${
                  isSaving 
                  ? 'bg-amber-400 text-white cursor-not-allowed opacity-80' 
                  : 'bg-amber-500 hover:bg-amber-600 text-white shadow-amber-500/10'
                }`}
              >
                {isSaving ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    <span>Saving...</span>
                  </>
                ) : (
                  <>
                    <Save className="w-4 h-4" />
                    <span>Save Recipe</span>
                  </>
                )}
              </button>
            </div>

          </form>
        </div>
      )}

      {/* Catalog Table list */}
      {!isAdding && !editingItem && (
        <div className="bg-white rounded-3xl border border-gray-150 overflow-hidden shadow-sm">
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse font-sans">
              <thead>
                <tr className="bg-gray-50 text-[10px] sm:text-xs uppercase font-extrabold text-gray-500 border-b border-gray-100">
                  <th className="p-4">Dish</th>
                  <th className="p-4">Category</th>
                  <th className="p-4">Prices (BDT)</th>
                  <th className="p-4 text-center">Status</th>
                  <th className="p-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100 text-xs text-gray-700">
                {activeCatalog.length === 0 ? (
                  <tr>
                    <td colSpan={5} className="p-8 text-center text-gray-400">
                      No matching dishes found in catalog list.
                    </td>
                  </tr>
                ) : (
                  activeCatalog.map((item) => {
                    const cat = categories.find(c => c.id === item.categoryId);
                    return (
                      <tr key={item.id} className="hover:bg-gray-50/20">
                        
                        {/* Title and image combo */}
                        <td className="p-4 flex items-center gap-3">
                          <div className="w-10 h-10 rounded-xl bg-gray-100 overflow-hidden shrink-0 border">
                            {item.image ? (
                              <img src={item.image} alt={item.nameEn} className="w-full h-full object-cover" />
                            ) : (
                              <Image className="w-full h-full p-2 text-gray-400 bg-gray-50" />
                            )}
                          </div>
                          <div>
                            <div className="flex items-center gap-1.5">
                              <p className="font-bold text-gray-900 leading-snug">{item.nameEn}</p>
                              {item.isMostlyOrdered && (
                                <span className="text-[8px] bg-amber-500 text-white font-extrabold px-1.5 py-0.5 rounded-full uppercase" title="Featured in Bento Grid">
                                  Bento Featured
                                </span>
                              )}
                            </div>
                            <p className="text-[10px] text-gray-400 leading-snug">{item.nameBn}</p>
                          </div>
                        </td>

                        {/* Category Name */}
                        <td className="p-4">
                          <span className="bg-gray-100 text-gray-700 px-2.5 py-1 rounded-full text-[10px] font-bold">
                            {cat ? cat.nameEn : 'Unassigned'}
                          </span>
                        </td>

                        {/* Prices */}
                        <td className="p-4">
                          <div className="font-semibold text-gray-900">
                            ৳{item.discountedPrice !== undefined ? item.discountedPrice : item.regularPrice}
                          </div>
                          {item.discountedPrice !== undefined && (
                            <span className="text-[9px] text-gray-400 line-through">Reg: ৳{item.regularPrice}</span>
                          )}
                        </td>

                        {/* Status availability */}
                        <td className="p-4 text-center">
                          <button
                            onClick={() => canManage && onUpdateMenuItem(item.id, { isAvailable: !item.isAvailable })}
                            disabled={!canManage}
                            className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[9px] font-extrabold uppercase border cursor-pointer ${
                              item.isAvailable
                                ? 'bg-emerald-50 border-emerald-100 text-emerald-800'
                                : 'bg-gray-50 border-gray-100 text-gray-400 hover:border-gray-300'
                            }`}
                          >
                            {item.isAvailable ? (
                              <>
                                <Eye className="w-3 h-3" />
                                <span>Active</span>
                              </>
                            ) : (
                              <>
                                <EyeOff className="w-3 h-3 text-gray-450" />
                                <span>Sold Out</span>
                              </>
                            )}
                          </button>
                        </td>

                        {/* Table Actions */}
                        <td className="p-4 text-right">
                          <div className="flex items-center justify-end gap-1.5">
                            <button
                              onClick={() => startEdit(item)}
                              className="p-2 bg-gray-50 hover:bg-gray-100 text-gray-600 rounded-lg transition-colors cursor-pointer"
                              title="Edit"
                            >
                              <Edit2 className="w-3.5 h-3.5" />
                            </button>
                            {canManage && (
                              <button
                                onClick={() => {
                                  if (confirm(`Are you sure you want to delete "${item.nameEn}" from the catalog?`)) {
                                    onDeleteMenuItem(item.id);
                                  }
                                }}
                                className="p-2 bg-rose-50 hover:bg-rose-100 text-rose-600 rounded-lg transition-colors cursor-pointer"
                                title="Delete"
                              >
                                <Trash2 className="w-3.5 h-3.5" />
                              </button>
                            )}
                          </div>
                        </td>

                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

    </div>
  );
};
