'use client';

import { useState } from "react";
import { supabase } from "@/lib/supabase";
import { Button } from "@/components/ui/button";
import { v4 as uuidv4 } from "uuid";



export default function UploadStoreItem() {
  const [itemName, setItemName] = useState('');
  const [price, setPrice] = useState('');
  const [category, setCategory] = useState('');
  const [source, setSource] = useState('');
  const [imageFile, setImageFile] = useState(null);
  const [loading, setLoading] = useState(false);

  const handleSubmit = async () => {
    if (!itemName || !price || !category || !imageFile) {
      alert("Please fill all fields and select an image");
      return;
    }

    setLoading(true);
    const fileExt = imageFile.name.split('.').pop();
    const fileName = `${Date.now()}.${fileExt}`;
    const filePath = `${fileName}`;

    // ✅ رفع الصورة إلى supabase storage
    const { error: uploadError } = await supabase.storage
      .from("store")
      .upload(filePath, imageFile);

    if (uploadError) {
      alert("Failed to upload image");
      console.error(uploadError);
      setLoading(false);
      return;
    }

    const publicURL = supabase.storage
      .from("store")
      .getPublicUrl(filePath).data.publicUrl;

    // ✅ إدخال البيانات إلى قاعدة البيانات
    const { error: insertError } = await supabase
      .from("store")
      .insert([{
        id:uuidv4(),
        item: itemName,
        price: parseInt(price),
        category,
        item_url: publicURL,
      }]);

    if (insertError) {
      alert("Failed to insert item to database");
      console.error(insertError);
    } else {
      alert("Item added successfully!");
      setItemName('');
      setPrice('');
      setCategory('');
      setSource('');
      setImageFile(null);
    }

    setLoading(false);
  };

  return (
    <div className="w-full h-full mx-auto p-6 rounded-md text-white bg-slate-900 shadow-md space-y-4">
      <div className="flex items-center space-x-2">
        <label className="text-sm font-medium text-gray-700 dark:text-white" htmlFor="itemName">Item Name</label>
      </div>
      <input value={itemName} onChange={e => setItemName(e.target.value)} className="w-full px-4 py-2 border rounded-md" id="itemName" />

      <div className="flex items-center space-x-2">
        <label className="text-sm font-medium text-gray-700 dark:text-white" htmlFor="price">Price</label>
      </div>
      <input type="number" value={price} onChange={e => setPrice(e.target.value)} className="w-full px-4 py-2 border rounded-md" id="price" />

      <div className="flex items-center space-x-2">
        <label className="text-sm font-medium text-gray-700 dark:text-white" htmlFor="category">Category</label>
      </div>
      <select value={category} onChange={e => setCategory(e.target.value)} className="w-full px-4 py-2 border rounded-md" id="category">
        <option value="Avatars">Avatars</option>
        <option value="Sounds">Sounds</option>
        <option value="Powers">Powers</option>
      </select>

      <div className="flex items-center space-x-2">
        <label className="text-sm font-medium text-gray-700 dark:text-white" htmlFor="source">Source</label>
      </div>
      <input value={source} onChange={e => setSource(e.target.value)} className="w-full px-4 py-2 border rounded-md" id="source" />

      <div className="flex items-center space-x-2">
        <label className="text-sm font-medium text-gray-700 dark:text-white" htmlFor="image">Upload Image</label>
      </div>
      <input type="file" accept="image/*" onChange={e => setImageFile(e.target.files[0])} className="w-full px-4 py-2 border rounded-md" id="image" />

      <Button onClick={handleSubmit} disabled={loading} className="w-full">
        {loading ? "Uploading..." : "Upload Item"}
      </Button>
    </div>
  );
}
