import React, { useState, useEffect } from 'react';
import { X, Upload, Film, Image as ImageIcon, Layers, Search, Check } from 'lucide-react';
import { shoppableVideosApi } from '../api/shoppableVideosApi';
import { marketplaceApi } from '../api/marketplaceApi';
import { toast } from 'react-toastify';
import { ShoppableCategory } from '../types/shoppableVideo';

interface ShoppableUploadModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
}

const ShoppableUploadModal: React.FC<ShoppableUploadModalProps> = ({ isOpen, onClose, onSuccess }) => {
  const [step, setStep] = useState(1);
  const [contentType, setContentType] = useState<'VIDEO' | 'IMAGE' | 'COLLECTION'>('VIDEO');
  const [mediaFile, setMediaFile] = useState<File | null>(null);
  const [mediaPreview, setMediaPreview] = useState<string | null>(null);
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [tags, setTags] = useState('');
  const [selectedProductId, setSelectedProductId] = useState<number | null>(null);
  const [selectedCategory, setSelectedCategory] = useState<number | null>(null);
  const [categories, setCategories] = useState<ShoppableCategory[]>([]);
  
  const [productQuery, setProductQuery] = useState('');
  const [products, setProducts] = useState<any[]>([]);
  const [loadingProducts, setLoadingProducts] = useState(false);
  const [uploading, setUploading] = useState(false);

  useEffect(() => {
    if (isOpen) {
      shoppableVideosApi.getCategories().then(setCategories).catch(console.error);
    }
  }, [isOpen]);

  useEffect(() => {
    if (productQuery.length > 2) {
      setLoadingProducts(true);
      marketplaceApi.getProducts({ q: productQuery })
        .then(res => setProducts(res.results || []))
        .catch(console.error)
        .finally(() => setLoadingProducts(false));
    } else {
      setProducts([]);
    }
  }, [productQuery]);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setMediaFile(file);
      setMediaPreview(URL.createObjectURL(file));
    }
  };

  const handleSubmit = async () => {
    if (!mediaFile || !selectedProductId || !selectedCategory) {
      toast.error('Please fill all required fields');
      return;
    }

    setUploading(true);
    const formData = new FormData();
    formData.append('content_type', contentType);
    formData.append('product_id', String(selectedProductId));
    formData.append('category', String(selectedCategory));
    formData.append('title', title);
    formData.append('description', description);
    formData.append('tags', JSON.stringify(tags.split(',').map(t => t.trim())));
    
    if (contentType === 'VIDEO') {
      formData.append('video_file', mediaFile);
    } else {
      formData.append('image_file', mediaFile);
    }

    try {
      await shoppableVideosApi.uploadContent(formData);
      toast.success('Content uploaded successfully!');
      onSuccess();
      onClose();
    } catch (err) {
      console.error('Upload failed', err);
      toast.error('Failed to upload content');
    } finally {
      setUploading(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[100] bg-black/60 backdrop-blur-md flex items-center justify-center p-4">
      <div className="bg-white rounded-[32px] w-full max-w-2xl max-h-[90vh] overflow-hidden flex flex-col shadow-2xl animate-in fade-in zoom-in-95 duration-300">
        {/* Header */}
        <div className="p-6 border-b border-neutral-100 flex justify-between items-center bg-white sticky top-0 z-10">
          <div>
            <h2 className="text-2xl font-black text-neutral-900 tracking-tight">Post New Content</h2>
            <p className="text-neutral-500 text-sm font-medium">Step {step} of 3</p>
          </div>
          <button onClick={onClose} className="p-2 hover:bg-neutral-100 rounded-full transition-colors text-neutral-400">
            <X size={24} />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto p-8">
          {step === 1 && (
            <div className="space-y-8 animate-in slide-in-from-right-4 duration-300">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                {[
                  { id: 'VIDEO', label: 'Short Video', icon: Film, desc: 'TikTok-style 9:16 video' },
                  { id: 'IMAGE', label: 'Photo Post', icon: ImageIcon, desc: 'High-res product shot' },
                  { id: 'COLLECTION', label: 'Collection', icon: Layers, desc: 'Swipeable image carousel' }
                ].map((type) => (
                  <button
                    key={type.id}
                    onClick={() => setContentType(type.id as any)}
                    className={`p-6 rounded-3xl border-2 text-left transition-all group ${
                      contentType === type.id 
                        ? 'border-primary-600 bg-primary-50/50 ring-4 ring-primary-600/10' 
                        : 'border-neutral-100 hover:border-primary-300'
                    }`}
                  >
                    <type.icon className={`w-8 h-8 mb-4 transition-colors ${contentType === type.id ? 'text-primary-600' : 'text-neutral-400 group-hover:text-primary-400'}`} />
                    <p className={`font-bold text-sm mb-1 ${contentType === type.id ? 'text-primary-900' : 'text-neutral-600'}`}>{type.label}</p>
                    <p className="text-[10px] text-neutral-400 font-medium leading-tight">{type.desc}</p>
                  </button>
                ))}
              </div>

              <div className="space-y-4">
                <label className="text-[11px] font-black text-neutral-400 uppercase tracking-widest px-1">Select Media</label>
                <div 
                  onClick={() => document.getElementById('media-upload')?.click()}
                  className="border-2 border-dashed border-neutral-200 rounded-[32px] p-12 flex flex-col items-center justify-center cursor-pointer hover:border-primary-400 hover:bg-neutral-50 transition-all group"
                >
                  {mediaPreview ? (
                    contentType === 'VIDEO' ? (
                      <video src={mediaPreview} className="max-h-64 rounded-2xl shadow-xl" />
                    ) : (
                      <img src={mediaPreview} className="max-h-64 rounded-2xl shadow-xl object-cover" alt="Preview" />
                    )
                  ) : (
                    <>
                      <div className="w-16 h-16 bg-neutral-100 rounded-full flex items-center justify-center mb-4 group-hover:bg-primary-50 transition-colors">
                        <Upload className="text-neutral-400 group-hover:text-primary-600" size={32} />
                      </div>
                      <p className="text-neutral-900 font-bold">Click to upload {contentType.toLowerCase()}</p>
                      <p className="text-neutral-400 text-xs mt-1">MP4, JPG or PNG up to 50MB</p>
                    </>
                  )}
                  <input id="media-upload" type="file" className="hidden" accept={contentType === 'VIDEO' ? 'video/*' : 'image/*'} onChange={handleFileChange} />
                </div>
              </div>
            </div>
          )}

          {step === 2 && (
            <div className="space-y-8 animate-in slide-in-from-right-4 duration-300">
              <div className="space-y-4">
                <label className="text-[11px] font-black text-neutral-400 uppercase tracking-widest px-1">Link Product</label>
                <div className="relative">
                  <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-neutral-400" size={18} />
                  <input 
                    value={productQuery}
                    onChange={(e) => setProductQuery(e.target.value)}
                    placeholder="Search your marketplace products..."
                    className="w-full bg-neutral-100 border-none rounded-2xl pl-12 pr-4 py-4 text-sm focus:ring-4 focus:ring-primary-600/10 focus:bg-white transition-all outline-none font-medium"
                  />
                </div>
                
                <div className="space-y-2 max-h-64 overflow-y-auto no-scrollbar">
                  {loadingProducts ? (
                    <div className="text-center py-4 text-neutral-400 text-sm">Searching...</div>
                  ) : (
                    products.map(p => (
                      <div 
                        key={p.id} 
                        onClick={() => setSelectedProductId(p.id)}
                        className={`flex items-center gap-4 p-3 rounded-2xl cursor-pointer transition-all ${
                          selectedProductId === p.id ? 'bg-primary-600 text-white shadow-lg shadow-primary-600/20' : 'hover:bg-neutral-50 border border-neutral-100'
                        }`}
                      >
                        <img src={p.images?.[0]?.image || '/product-placeholder.png'} className="w-12 h-12 rounded-xl object-cover" alt="" />
                        <div className="flex-1 min-w-0">
                          <p className={`font-bold text-sm truncate ${selectedProductId === p.id ? 'text-white' : 'text-neutral-900'}`}>{p.name}</p>
                          <p className={`text-xs ${selectedProductId === p.id ? 'text-primary-100' : 'text-neutral-400'}`}>Rs. {p.discounted_price || p.listed_price}</p>
                        </div>
                        {selectedProductId === p.id && <Check size={20} />}
                      </div>
                    ))
                  )}
                </div>
              </div>

              <div className="space-y-4">
                <label className="text-[11px] font-black text-neutral-400 uppercase tracking-widest px-1">Style Category</label>
                <div className="flex flex-wrap gap-2">
                  {categories.map(cat => (
                    <button
                      key={cat.id}
                      onClick={() => setSelectedCategory(cat.id)}
                      className={`px-4 py-2.5 rounded-xl text-xs font-bold transition-all ${
                        selectedCategory === cat.id 
                          ? 'bg-primary-600 text-white shadow-lg shadow-primary-600/20' 
                          : 'bg-neutral-100 text-neutral-600 hover:bg-neutral-200'
                      }`}
                    >
                      {cat.name}
                    </button>
                  ))}
                </div>
              </div>
            </div>
          )}

          {step === 3 && (
            <div className="space-y-6 animate-in slide-in-from-right-4 duration-300">
              <div className="space-y-2">
                <label className="text-[11px] font-black text-neutral-400 uppercase tracking-widest px-1">Details</label>
                <input 
                  value={title}
                  onChange={e => setTitle(e.target.value)}
                  placeholder="Catchy title for your post"
                  className="w-full bg-neutral-100 border-none rounded-2xl px-6 py-4 text-sm focus:ring-4 focus:ring-primary-600/10 focus:bg-white transition-all outline-none font-bold placeholder:text-neutral-400"
                />
                <textarea 
                  value={description}
                  onChange={e => setDescription(e.target.value)}
                  placeholder="Tell your fans about this product..."
                  className="w-full bg-neutral-100 border-none rounded-2xl px-6 py-4 text-sm focus:ring-4 focus:ring-primary-600/10 focus:bg-white transition-all outline-none resize-none h-32 placeholder:text-neutral-400"
                />
              </div>

              <div className="space-y-2">
                <label className="text-[11px] font-black text-neutral-400 uppercase tracking-widest px-1">Tags (Comma separated)</label>
                <input 
                  value={tags}
                  onChange={e => setTags(e.target.value)}
                  placeholder="tech, gadgets, nepal..."
                  className="w-full bg-neutral-100 border-none rounded-2xl px-6 py-4 text-sm focus:ring-4 focus:ring-primary-600/10 focus:bg-white transition-all outline-none font-medium placeholder:text-neutral-400"
                />
              </div>

              <div className="bg-primary-50 rounded-3xl p-6 border border-primary-100 flex items-center gap-4">
                <div className="w-12 h-12 bg-white rounded-2xl flex items-center justify-center text-primary-600 shadow-sm shrink-0">
                  <Check size={24} />
                </div>
                <div>
                  <p className="text-primary-900 font-bold text-sm">Ready to go!</p>
                  <p className="text-primary-600 text-xs">Your post will be featured in the "For You" feed.</p>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="p-6 border-t border-neutral-100 bg-white flex gap-4">
          {step > 1 && (
            <button 
              onClick={() => setStep(s => s - 1)}
              className="flex-1 border-2 border-neutral-100 text-neutral-600 font-bold py-4 rounded-2xl hover:bg-neutral-50 transition-all active:scale-95"
            >
              Back
            </button>
          )}
          <button 
            disabled={uploading}
            onClick={() => {
              if (step < 3) setStep(s => s + 1);
              else handleSubmit();
            }}
            className="flex-[2] bg-primary-600 hover:bg-primary-700 text-white font-bold py-4 rounded-2xl transition-all active:scale-95 shadow-xl shadow-primary-600/20 disabled:opacity-50"
          >
            {uploading ? 'Processing...' : step === 3 ? 'Publish Now' : 'Continue'}
          </button>
        </div>
      </div>
    </div>
  );
};

export default ShoppableUploadModal;
