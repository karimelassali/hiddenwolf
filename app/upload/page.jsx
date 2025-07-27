'use client';

import { useState } from "react";
import { supabase } from "@/lib/supabase";
import { Button } from "@/components/ui/button";
import { v4 as uuidv4 } from "uuid";

export default function UploadStoreItem() {
  const [itemName, setItemName] = useState('');
  const [price, setPrice] = useState('');
  const [category, setCategory] = useState('');
  const [rarity, setRarity] = useState('');
  const [source, setSource] = useState('');
  const [imageFile, setImageFile] = useState(null);
  const [loading, setLoading] = useState(false);

  const handleSubmit = async () => {
    // 👇 ضع قيم افتراضية لو ما تم اختيارهم
    const finalCategory = category || 'Avatars';
    const finalRarity = rarity || 'common';

    if (!itemName || !price || !imageFile) {
      alert("Please fill all fields and select an image");
      return;
    }

    setLoading(true);
    const fileExt = imageFile.name.split('.').pop();
    const fileName = `${Date.now()}.${fileExt}`;
    const filePath = `${fileName}`;

    const { error: uploadError } = await supabase.storage
      .from("store")
      .upload(filePath, imageFile);

    if (uploadError) {
      alert("Failed to upload image");
      console.error(uploadError);
      setLoading(false);
      return;
    }

    const publicURL = supabase
      .storage
      .from("store")
      .getPublicUrl(filePath).data.publicUrl;

    const { error: insertError } = await supabase
      .from("store")
      .insert([{
        id: uuidv4(),
        item: itemName,
        price: parseInt(price),
        category: finalCategory,
        rarity: finalRarity,
        item_url: publicURL,
        rarity: rarity || 'common',
      }]);

    if (insertError) {
      alert("Failed to insert item to database");
      console.error(insertError);
    } else {
      alert("Item added successfully!");
      // ✅ إعادة تعيين الحقول
      setItemName('');
      setPrice('');
      setCategory('');
      setRarity('');
      setSource('');
      setImageFile(null);
    }

    setLoading(false);
  };

  return (
    <div className="w-full h-full mx-auto p-6 rounded-md text-white bg-slate-900 shadow-md space-y-4">
      <div>
        <label className="text-sm font-medium">Item Name</label>
        <input value={itemName} onChange={e => setItemName(e.target.value)} className="w-full px-4 py-2 border rounded-md mt-1" />
      </div>

      <div>
        <label className="text-sm font-medium">Price</label>
        <input type="number" value={price} onChange={e => setPrice(e.target.value)} className="w-full px-4 py-2 border rounded-md mt-1" />
      </div>

      <div>
        <label className="text-sm font-medium">Category</label>
        <select value={category} onChange={e => setCategory(e.target.value)} className="w-full px-4 py-2 border rounded-md mt-1">
          <option value="">-- Select Category --</option>
          <option value="Avatars">Avatars</option>
          <option value="Sounds">Sounds</option>
          <option value="Powers">Powers</option>
        </select>
      </div>

      <div>
        <label className="text-sm font-medium">Rarity</label>
        <select value={rarity} onChange={e => setRarity(e.target.value)} className="w-full px-4 py-2 border rounded-md mt-1">
          <option value="">-- Select Rarity --</option>
          <option value="common">Common</option>
          <option value="rare">Rare</option>
          <option value="epic">Epic</option>
          <option value="legendary">Legendary</option>
        </select>
      </div>

      <div>
        <label className="text-sm font-medium">Source</label>
        <input value={source} onChange={e => setSource(e.target.value)} className="w-full px-4 py-2 border rounded-md mt-1" />
      </div>

      <div>
        <label className="text-sm font-medium">Upload Image</label>
        <input type="file" onChange={e => setImageFile(e.target.files[0])} className="w-full px-4 py-2 border rounded-md mt-1" />
      </div>

      <Button onClick={handleSubmit} disabled={loading} className="w-full mt-4">
        {loading ? "Uploading..." : "Upload Item"}
      </Button>
    </div>
  );
}
