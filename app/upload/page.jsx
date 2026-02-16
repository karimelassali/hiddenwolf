"use client";
import { useState, useEffect } from "react";
import { supabase } from "@/lib/supabase";
import { motion, AnimatePresence } from "framer-motion";
import {
  Plus,
  Edit,
  Trash2,
  Eye,
  EyeOff,
  Search,
  Save,
  X,
  Image as ImageIcon,
  Music,
  Zap,
  Gamepad2,
  CheckCircle2,
  AlertCircle,
  Upload,
  Loader2
} from "lucide-react";
import Image from "next/image";
import { CustomAudioPlayer } from "@/components/audioPlayer";

export default function StoreManagement() {
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [filterCategory, setFilterCategory] = useState("All");
  const [selectedItems, setSelectedItems] = useState([]); // Array of IDs

  // Form State
  const [editingItem, setEditingItem] = useState(null); // null = creating new
  const [formData, setFormData] = useState({
    item: "",
    category: "Avatars",
    price: 0,
    item_url: "",
    rarity: "Common",
    is_active: true
  });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [message, setMessage] = useState(null); // { type: 'success' | 'error', text: '' }

  // Fetch Items
  const fetchItems = async () => {
    setLoading(true);
    const { data, error } = await supabase
      .from("store")
      .select("*")
      .order("id", { ascending: false });

    if (error) {
      console.error("Error fetching items:", error);
      setMessage({ type: "error", text: "Failed to load items." });
    } else {
      setItems(data || []);
    }
    setLoading(false);
  };

  useEffect(() => {
    fetchItems();
  }, []);

  // Filter Items
  const filteredItems = items.filter(item => {
    const matchesSearch = item.item.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesCategory = filterCategory === "All" || item.category === filterCategory;
    return matchesSearch && matchesCategory;
  });

  // Handle Form Change
  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: type === "checkbox" ? checked : value
    }));
  };

  // Handle Edit Click
  const handleEdit = (item) => {
    setEditingItem(item);
    setFormData({
      item: item.item,
      category: item.category,
      price: item.price,
      item_url: item.item_url,
      rarity: item.rarity,
      is_active: item.is_active !== false // Default to true if null
    });
    setMessage(null);
  };

  // Handle Reset/New
  const handleReset = () => {
    setEditingItem(null);
    setFormData({
      item: "",
      category: "Avatars",
      price: 0,
      item_url: "",
      rarity: "Common",
      is_active: true
    });
    setMessage(null);
  };

  // Handle Submit
  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsSubmitting(true);
    setMessage(null);

    try {
      if (editingItem) {
        // Update
        const { error } = await supabase
          .from("store")
          .update(formData)
          .eq("id", editingItem.id);

        if (error) throw error;
        setMessage({ type: "success", text: "Item updated successfully!" });
      } else {
        // Create — generate a UUID client-side
        const { error } = await supabase
          .from("store")
          .insert([{ id: crypto.randomUUID(), ...formData }]);

        if (error) throw error;
        setMessage({ type: "success", text: "Item created successfully!" });
        handleReset();
      }
      fetchItems();
    } catch (error) {
      console.error("Error saving item:", error);
      setMessage({ type: "error", text: `Error: ${error.message}` });
    } finally {
      setIsSubmitting(false);
    }
  };

  // Handle File Upload (via secure API route using service_role key)
  const handleFileUpload = async (event) => {
    try {
      setUploading(true);
      const file = event.target.files[0];
      if (!file) return;

      const formDataUpload = new FormData();
      formDataUpload.append("file", file);

      const res = await fetch("/api/upload", {
        method: "POST",
        body: formDataUpload,
      });

      const result = await res.json();

      if (!res.ok) {
        throw new Error(result.error || "Upload failed");
      }

      setFormData(prev => ({ ...prev, item_url: result.publicUrl }));
      setMessage({ type: "success", text: "File uploaded successfully!" });
    } catch (error) {
      console.error("Upload error:", error);
      setMessage({ type: "error", text: "Error uploading file: " + error.message });
    } finally {
      setUploading(false);
    }
  };

  // Handle Delete
  const handleDelete = async (id = null, idsToDelete = []) => {
    const targets = id ? [id] : idsToDelete;
    if (targets.length === 0) return;

    if (!confirm(`Are you sure you want to delete ${targets.length} item(s)? This action cannot be undone.`)) return;

    setIsSubmitting(true);

    // 1. Delete associated purchases first (Foreign Key Constraint Fix)
    const { error: purchaseError } = await supabase
      .from("purchases")
      .delete()
      .in("item_id", targets);

    if (purchaseError) {
      console.error("Error deleting purchases:", purchaseError);
      setMessage({ type: "error", text: "Failed to clear associated purchases." });
      setIsSubmitting(false);
      return;
    }

    // 2. Delete the items
    const { error } = await supabase
      .from("store")
      .delete()
      .in("id", targets);

    if (error) {
      console.error("Error deleting items:", error);
      setMessage({ type: "error", text: "Failed to delete items: " + error.message });
    } else {
      setMessage({ type: "success", text: `${targets.length} item(s) deleted.` });
      if (id && editingItem?.id === id) handleReset();
      setSelectedItems([]);
      fetchItems();
    }
    setIsSubmitting(false);
  };

  // Toggle Selection
  const toggleSelection = (id) => {
    setSelectedItems(prev =>
      prev.includes(id) ? prev.filter(i => i !== id) : [...prev, id]
    );
  };

  // Handle File Upload

  // Toggle Visibility
  const toggleVisibility = async (item) => {
    const newStatus = !item.is_active;
    const { error } = await supabase
      .from("store")
      .update({ is_active: newStatus })
      .eq("id", item.id);

    if (error) {
      console.error("Error updating visibility:", error);
    } else {
      // Optimistic update
      setItems(prev => prev.map(i => i.id === item.id ? { ...i, is_active: newStatus } : i));
    }
  };

  return (
    <div className="min-h-screen bg-neutral-950 text-neutral-200 font-sans selection:bg-cyan-500/20">
      {/* Background */}
      <div
        className="fixed inset-0 z-0 pointer-events-none"
        style={{
          backgroundImage: "url('/assets/images/store.avif')",
          backgroundSize: "cover",
          backgroundPosition: "center",
          filter: "grayscale(100%) brightness(0.2) blur(10px)",
        }}
      />

      <div className="relative z-10 max-w-7xl mx-auto p-6 lg:p-12">
        {/* Header */}
        <header className="mb-12 flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div>
            <h1 className="text-4xl font-black text-white tracking-tighter mb-2 uppercase flex items-center gap-3">
              <span className="text-cyan-500"><Zap className="fill-current" /></span>
              Armory Control
            </h1>
            <p className="text-neutral-400 font-medium">Manage game assets and store inventory.</p>
          </div>

          <div className="flex items-center gap-4">
            <div className="px-4 py-2 bg-yellow-500/10 border border-yellow-500/20 rounded-full text-yellow-500 text-xs font-bold uppercase tracking-wider flex items-center gap-2">
              <AlertCircle size={14} /> Admin Mode
            </div>
          </div>
        </header>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">

          {/* LEFT COLUMN: Item List */}
          <div className="lg:col-span-7 flex flex-col gap-6 h-[calc(100vh-200px)]">
            {/* Toolbar */}
            <div className="bg-neutral-900/80 backdrop-blur-xl border border-white/20 rounded-2xl p-4 flex flex-col sm:flex-row gap-4 items-center justify-between shadow-xl">
              <div className="flex items-center gap-4 w-full sm:w-auto">
                {/* Bulk Delete Button */}
                {selectedItems.length > 0 && (
                  <button
                    onClick={() => handleDelete(null, selectedItems)}
                    className="px-4 py-2 bg-red-500/20 text-red-400 border border-red-500/50 rounded-lg hover:bg-red-500 hover:text-white transition-all text-xs font-bold flex items-center gap-2 whitespace-nowrap"
                  >
                    <Trash2 size={14} /> Delete Selected ({selectedItems.length})
                  </button>
                )}
                <div className="relative w-full sm:w-64">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-neutral-400" size={16} />
                  <input
                    type="text"
                    placeholder="Search items..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="w-full bg-white/10 border border-white/20 rounded-full pl-10 pr-4 py-2 text-sm text-white placeholder-neutral-400 focus:outline-none focus:border-cyan-500 focus:ring-1 focus:ring-cyan-500/50 transition-colors"
                  />
                </div>
              </div>

              <div className="flex gap-2 w-full sm:w-auto overflow-x-auto pb-2 sm:pb-0">
                {["All", "Avatars", "Sounds", "Power"].map(cat => (
                  <button
                    key={cat}
                    onClick={() => setFilterCategory(cat)}
                    className={`px-4 py-2 rounded-full text-xs font-bold transition-all whitespace-nowrap ${filterCategory === cat
                      ? "bg-cyan-500 text-black shadow-lg shadow-cyan-500/20"
                      : "bg-white/10 text-neutral-300 hover:bg-white/20 hover:text-white"
                      }`}
                  >
                    {cat}
                  </button>
                ))}
              </div>
            </div>

            {/* List */}
            <div className="flex-1 overflow-y-auto pr-2 space-y-3 custom-scrollbar">
              <AnimatePresence>
                {loading ? (
                  <div className="text-center py-20 text-neutral-400">Loading armory...</div>
                ) : filteredItems.length === 0 ? (
                  <div className="text-center py-20 text-neutral-400 bg-neutral-900/50 rounded-2xl border border-white/10 mx-2">
                    No items found.
                  </div>
                ) : (
                  filteredItems.map(item => (
                    <motion.div
                      key={item.id}
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, scale: 0.95 }}
                      layoutId={item.id}
                      onClick={() => handleEdit(item)}
                      className={`group p-4 rounded-xl border transition-all cursor-pointer flex items-center gap-4 relative overflow-hidden ${editingItem?.id === item.id
                        ? "bg-cyan-900/30 border-cyan-500 shadow-lg shadow-cyan-500/10"
                        : "bg-neutral-900/60 border-white/10 hover:bg-neutral-800 hover:border-white/20"
                        }`}
                    >
                      {/* Status Indicator */}
                      <div className={`absolute left-0 top-0 bottom-0 w-1 transition-colors ${item.is_active ? "bg-green-500" : "bg-red-500"}`} />

                      {/* Checkbox for Selection */}
                      <div className="absolute top-2 left-3 z-10 opacity-0 group-hover:opacity-100 transition-opacity">
                        <input
                          type="checkbox"
                          checked={selectedItems.includes(item.id)}
                          onChange={(e) => { e.stopPropagation(); toggleSelection(item.id); }}
                          className="w-4 h-4 rounded border-white/50 bg-black/50 text-cyan-500 focus:ring-0 cursor-pointer"
                        />
                      </div>

                      {/* Image/Icon */}
                      <div className="w-12 h-12 rounded-lg bg-neutral-800 border border-white/10 flex items-center justify-center shrink-0 overflow-hidden">
                        {item.category === "Sounds" ? (
                          <Music size={20} className="text-neutral-300" />
                        ) : (
                          item.item_url ? (
                            <Image src={item.item_url} alt={item.item} width={48} height={48} className="w-full h-full object-cover" />
                          ) : (
                            <ImageIcon size={20} className="text-neutral-500" />
                          )
                        )}
                      </div>

                      {/* Info */}
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2">
                          <h3 className={`font-bold text-sm truncate ${editingItem?.id === item.id ? "text-cyan-400" : "text-white"}`}>
                            {item.item}
                          </h3>
                          {!item.is_active && <span className="text-[10px] bg-red-500/20 text-red-400 px-1.5 py-0.5 rounded uppercase font-bold">Hidden</span>}
                        </div>
                        <p className="text-xs text-neutral-400 font-mono mt-0.5 flex items-center gap-3">
                          <span>{item.category}</span>
                          <span className="text-yellow-500">🪙 {item.price}</span>
                        </p>
                      </div>

                      {/* Actions */}
                      <div className="flex items-center gap-2 opacity-100 sm:opacity-0 sm:group-hover:opacity-100 transition-opacity">
                        <button
                          onClick={(e) => { e.stopPropagation(); toggleVisibility(item); }}
                          className="p-2 hover:bg-white/10 rounded-lg text-neutral-400 hover:text-white transition-colors"
                          title={item.is_active ? "Hide Item" : "Show Item"}
                        >
                          {item.is_active ? <Eye size={16} /> : <EyeOff size={16} />}
                        </button>
                        <button
                          onClick={(e) => { e.stopPropagation(); handleDelete(item.id); }}
                          className="p-2 hover:bg-red-500/20 rounded-lg text-neutral-400 hover:text-red-400 transition-colors"
                          title="Delete Item"
                        >
                          <Trash2 size={16} />
                        </button>
                      </div>
                    </motion.div>
                  ))
                )}
              </AnimatePresence>
            </div>
          </div>

          {/* RIGHT COLUMN: Editor Form */}
          <div className="lg:col-span-5">
            <div className="sticky top-6 bg-neutral-900/90 backdrop-blur-xl border border-white/20 rounded-3xl p-6 sm:p-8 shadow-2xl">
              <div className="flex items-center justify-between mb-8">
                <h2 className="text-xl font-bold text-white flex items-center gap-2">
                  {editingItem ? <Edit size={20} className="text-cyan-500" /> : <Plus size={20} className="text-green-500" />}
                  {editingItem ? "Edit Item" : "New Asset"}
                </h2>
                {editingItem && (
                  <button
                    onClick={handleReset}
                    className="text-xs font-bold text-neutral-400 hover:text-white flex items-center gap-1 transition-colors"
                  >
                    <Plus size={12} /> Create New
                  </button>
                )}
              </div>

              <form onSubmit={handleSubmit} className="space-y-5">
                {/* Name */}
                <div className="space-y-2">
                  <label className="text-xs text-neutral-300 font-bold uppercase tracking-wider">Item Name</label>
                  <input
                    type="text"
                    name="item"
                    value={formData.item}
                    onChange={handleChange}
                    required
                    className="w-full bg-white/10 border border-white/20 rounded-xl px-4 py-3 text-white focus:border-cyan-500 focus:bg-white/15 focus:ring-1 focus:ring-cyan-500/50 transition-all outline-none"
                    placeholder="Ex: Gold Sword"
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  {/* Category */}
                  <div className="space-y-2">
                    <label className="text-xs text-neutral-300 font-bold uppercase tracking-wider">Category</label>
                    <select
                      name="category"
                      value={formData.category}
                      onChange={handleChange}
                      className="w-full bg-white/10 border border-white/20 rounded-xl px-4 py-3 text-white focus:border-cyan-500 outline-none appearance-none"
                    >
                      <option value="Avatars" className="bg-neutral-900">Avatars</option>
                      <option value="Sounds" className="bg-neutral-900">Sounds</option>
                      <option value="Power" className="bg-neutral-900">Power</option>
                    </select>
                  </div>

                  {/* Price */}
                  <div className="space-y-2">
                    <label className="text-xs text-neutral-300 font-bold uppercase tracking-wider">Price</label>
                    <input
                      type="number"
                      name="price"
                      value={formData.price}
                      onChange={handleChange}
                      min="0"
                      className="w-full bg-white/10 border border-white/20 rounded-xl px-4 py-3 text-white focus:border-cyan-500 outline-none"
                    />
                  </div>
                </div>

                {/* Rarity */}
                <div className="space-y-2">
                  <label className="text-xs text-neutral-300 font-bold uppercase tracking-wider">Rarity</label>
                  <select
                    name="rarity"
                    value={formData.rarity}
                    onChange={handleChange}
                    className="w-full bg-white/10 border border-white/20 rounded-xl px-4 py-3 text-white focus:border-cyan-500 outline-none appearance-none"
                  >
                    <option value="Common" className="bg-neutral-900">Common</option>
                    <option value="Rare" className="bg-neutral-900">Rare</option>
                    <option value="Epic" className="bg-neutral-900">Epic</option>
                    <option value="Legendary" className="bg-neutral-900">Legendary</option>
                  </select>
                </div>

                {/* Asset Source */}
                <div className="space-y-2">
                  <label className="text-xs text-neutral-300 font-bold uppercase tracking-wider">Asset File</label>
                  <div className="space-y-3 p-4 bg-white/5 border border-white/10 rounded-xl">
                    {/* File Input */}
                    <div className="relative flex items-center gap-3">
                      <label className={`flex items-center gap-2 px-4 py-2 rounded-lg cursor-pointer transition-colors ${uploading ? "bg-neutral-800 text-neutral-500 cursor-not-allowed" : "bg-cyan-500/10 text-cyan-400 hover:bg-cyan-500/20"}`}>
                        {uploading ? <Loader2 size={16} className="animate-spin" /> : <Upload size={16} />}
                        <span className="text-sm font-bold">{uploading ? "Uploading..." : "Choose File"}</span>
                        <input
                          type="file"
                          onChange={handleFileUpload}
                          disabled={uploading}
                          className="hidden"
                        />
                      </label>
                      <span className="text-xs text-neutral-500 truncate max-w-[150px]">
                        {formData.item_url ? "File selected" : "No file chosen"}
                      </span>
                    </div>

                    {/* URL Preview/Fallback */}
                    <div className="relative">
                      <input
                        type="text"
                        name="item_url"
                        value={formData.item_url}
                        onChange={handleChange}
                        placeholder="Or paste URL..."
                        className="w-full bg-black/20 border border-white/5 rounded-lg px-3 py-2 text-xs text-neutral-400 font-mono focus:border-cyan-500/30 outline-none"
                      />
                    </div>
                  </div>
                </div>

                {/* Visibility Toggle */}
                <div className="flex items-center gap-3 py-2 bg-white/5 rounded-xl px-4 border border-white/10">
                  <input
                    type="checkbox"
                    id="is_active"
                    name="is_active"
                    checked={formData.is_active}
                    onChange={handleChange}
                    className="w-5 h-5 rounded border-white/20 bg-black/40 text-cyan-500 focus:ring-offset-0 focus:ring-cyan-500"
                  />
                  <label htmlFor="is_active" className="text-sm font-medium text-neutral-200 select-none cursor-pointer flex-1">
                    Visible in Store
                  </label>
                </div>

                {/* Message */}
                <AnimatePresence>
                  {message && (
                    <motion.div
                      initial={{ opacity: 0, height: 0 }}
                      animate={{ opacity: 1, height: "auto" }}
                      exit={{ opacity: 0, height: 0 }}
                      className={`p-3 rounded-lg text-sm font-medium flex items-center gap-2 ${message.type === 'success' ? "bg-green-500/10 text-green-400 border border-green-500/20" : "bg-red-500/10 text-red-400 border border-red-500/20"
                        }`}
                    >
                      {message.type === 'success' ? <CheckCircle2 size={16} /> : <AlertCircle size={16} />}
                      {message.text}
                    </motion.div>
                  )}
                </AnimatePresence>

                {/* Buttons */}
                <div className="grid grid-cols-2 gap-4 pt-4">
                  {editingItem && (
                    <button
                      type="button"
                      onClick={handleReset}
                      className="py-3 rounded-xl border border-white/20 text-neutral-300 font-bold hover:bg-white/10 transition-colors"
                    >
                      Cancel
                    </button>
                  )}
                  <button
                    type="submit"
                    disabled={isSubmitting}
                    className={`py-3 rounded-xl font-bold text-black shadow-lg shadow-cyan-500/20 transition-all ${editingItem ? "col-span-1 bg-cyan-500 hover:bg-cyan-400" : "col-span-2 bg-gradient-to-r from-cyan-500 to-blue-600 hover:brightness-110"
                      }`}
                  >
                    {isSubmitting ? "Saving..." : (editingItem ? "Update Item" : "Create Item")}
                  </button>
                </div>
              </form>

              {/* Preview */}
              <div className="mt-8 pt-8 border-t border-white/10">
                <h3 className="text-xs text-neutral-500 font-bold uppercase tracking-wider mb-4">Preview</h3>
                <div className="bg-neutral-900 border border-white/10 rounded-2xl p-4 flex gap-4 items-center shadow-inner">
                  <div className="w-16 h-16 rounded-xl bg-neutral-800 border border-white/10 overflow-hidden flex items-center justify-center">
                    {formData.category === "Sounds" ? (
                      <Music className="text-neutral-500" />
                    ) : (
                      formData.item_url ? <Image src={formData.item_url} alt="Preview" width={64} height={64} className="w-full h-full object-cover" /> : <ImageIcon className="text-neutral-600" />
                    )}
                  </div>
                  <div>
                    <div className="font-bold text-white text-lg">{formData.item || "Item Name"}</div>
                    <div className="text-yellow-500 text-sm font-bold">🪙 {formData.price}</div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
