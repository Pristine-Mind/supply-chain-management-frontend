import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import axios from "axios";
import {
  useForm,
  Controller,
  useFieldArray
} from "react-hook-form";
import { yupResolver } from "@hookform/resolvers/yup";
import * as yup from "yup";

const schema = yup
  .object({
    name: yup.string().required("Name is required"),
    description: yup.string().required("Description is required"),
    price: yup
      .number()
      .typeError("Price must be a number")
      .positive("Price must be > 0")
      .required("Price is required"),
    stock: yup
      .number()
      .typeError("Stock must be an integer")
      .integer("Stock must be an integer")
      .min(0, "Stock must be ≥ 0")
      .required("Stock is required"),
    category: yup.string().required("Category required"),
    unit: yup.string().required("Unit required"),
    location: yup
      .number()
      .typeError("Location required")
      .required("Location is required"),
    images: yup
      .array()
      .of(
        yup.object({
          file: yup
            .mixed()
            .test(
              "fileRequired",
              "Image file is required",
              (v) => v instanceof File
            ),
          alt_text: yup.string().required("Alt text needed"),
          order: yup
            .number()
            .typeError("Order must be a number")
            .integer()
            .min(0)
            .required("Order is required")
        })
      )
      .min(1, "At least one image is required")
  })
  .required();

type FormValues = yup.InferType<typeof schema>;

interface City {
  id: number;
  name: string;
}

const MarketplaceUserProduct: React.FC = () => {
  const navigate = useNavigate();
  const token = localStorage.getItem("token");
  const [cities, setCities] = useState<City[]>([]);
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [showSuccess, setShowSuccess] = useState(false);
  const [previews, setPreviews] = useState<string[]>([]);

  const {
    control,
    register,
    handleSubmit,
    formState: { errors },
    setValue
  } = useForm<FormValues>({
    resolver: yupResolver(schema),
    defaultValues: {
      name: "",
      description: "",
      price: 0,
      stock: 0,
      category: "FR",
      unit: "KG",
      location: undefined,
      images: [{ file: null, alt_text: "", order: 0 }]
    }
  });

  const { fields, append, remove } = useFieldArray({
    control,
    name: "images"
  });

  useEffect(() => {
    axios
      .get(`${import.meta.env.VITE_REACT_APP_API_URL}/api/v1/cities/`, {
        headers: { Authorization: `Token ${token}` }
      })
      .then((res) => setCities(res.data))
      .catch(console.error);
  }, [token]);

  const updateImageFile = (idx: number, file: File | null) => {
    if (file) {
      setValue(`images.${idx}.file`, file, { shouldValidate: true });
      setPreviews((prev) => {
        const next = [...prev];
        next[idx] = URL.createObjectURL(file);
        return next;
      });
    }
  };

  const onSubmit = async (data: FormValues) => {
    setSubmitError(null);
    const formData = new FormData();
    
    // Append basic fields
    formData.append('name', data.name);
    formData.append('description', data.description);
    formData.append('price', data.price.toString());
    formData.append('stock', data.stock.toString());
    formData.append('category', data.category);
    formData.append('unit', data.unit);
    formData.append('location', data.location.toString());

    // Append each image file with the key 'images' (Django expects this in request.FILES.getlist('images'))
    data.images.forEach((img) => {
      if (img.file) {
        formData.append('images', img.file as Blob);
      }
    });

    try {
      const res = await fetch(
        `${import.meta.env.VITE_REACT_APP_API_URL}/api/v1/marketplace-user-products/`,
        {
          method: "POST",
          headers: { 
            'Authorization': `Token ${token}`,
            // Let the browser set the Content-Type with boundary for FormData
          },
          body: formData
        }
      );
      
      if (!res.ok) {
        const errorData = await res.json().catch(() => ({}));
        throw errorData;
      }
      
      setShowSuccess(true);
    } catch (err: any) {
      console.error('Error submitting form:', err);
      setSubmitError(err.detail || 'An error occurred while submitting the form');
    }
  };

  return (
    <div className="flex w-full p-6 gap-6">
      <div className="flex-none w-1/4 bg-gradient-to-b from-green-100 to-green-50 rounded-lg shadow-md p-6 flex items-center justify-center">
        <div className="text-center">
          <h3 className="text-2xl font-semibold text-green-800 mb-2">Sell with Confidence</h3>
          <p className="text-base text-gray-600">Reach thousands of potential buyers</p>
        </div>
      </div>

      <div className="flex-grow w-auto bg-white rounded-lg shadow border border-orange-500 p-10 mx-0">
        <h2 className="text-3xl font-bold mb-8">Add New Product</h2>
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
          <div>
            <label className="block mb-2 text-lg font-medium">Name</label>
            <input {...register("name")} className="w-full border p-3 rounded-lg text-base" />
            {errors.name && <p className="text-red-500 mt-1">{errors.name.message}</p>}
          </div>

          <div>
            <label className="block mb-2 text-lg font-medium">Description</label>
            <textarea {...register("description")} className="w-full border p-3 rounded-lg text-base" rows={4} />
            {errors.description && <p className="text-red-500 mt-1">{errors.description.message}</p>}
          </div>

          <div className="grid grid-cols-2 gap-6">
            <div>
              <label className="block mb-2 text-lg font-medium">Price</label>
              <input type="number" step="0.01" {...register("price")} className="w-full border p-3 rounded-lg text-base" />
              {errors.price && <p className="text-red-500 mt-1">{errors.price.message}</p>}
            </div>
            <div>
              <label className="block mb-2 text-lg font-medium">Stock</label>
              <input type="number" {...register("stock")} className="w-full border p-3 rounded-lg text-base" />
              {errors.stock && <p className="text-red-500 mt-1">{errors.stock.message}</p>}
            </div>
          </div>

          <div className="grid grid-cols-3 gap-6">
            <div>
              <label className="block mb-2 text-lg font-medium">Category</label>
              <select {...register("category")} className="w-full bg-gray-100 border border-gray-300 p-3 rounded-lg text-base h-12">
                <option value="">Select a category</option>
                <option value="FA">Fashion & Apparel</option>
                <option value="EG">Electronics & Gadgets</option>
                <option value="GE">Groceries & Essentials</option>
                <option value="HB">Health & Beauty</option>
                <option value="HL">Home & Living</option>
                <option value="TT">Travel & Tourism</option>
                <option value="IS">Industrial Supplies</option>
                <option value="OT">Other</option>
              </select>
              {errors.category && <p className="text-red-500 mt-1">{errors.category.message}</p>}
            </div>
            <div>
              <label className="block mb-2 text-lg font-medium">Unit</label>
              <select {...register("unit")} className="w-full bg-gray-100 border border-gray-300 p-3 rounded-lg text-base h-12">
                <option value="">Select a unit</option>
                <option value="KG">Kilogram</option>
                <option value="LT">Liter</option>
              </select>
              {errors.unit && <p className="text-red-500 mt-1">{errors.unit.message}</p>}
            </div>
            <div>
              <label className="block mb-2 text-lg font-medium">Location</label>
              <select {...register("location")} className="w-full bg-gray-100 border border-gray-300 p-3 rounded-lg text-base h-12">
                <option value="">Select location</option>
                {cities.map((city) => (
                  <option key={city.id} value={city.id}>{city.name}</option>
                ))}
              </select>
              {errors.location && <p className="text-red-500 mt-1">{errors.location.message}</p>}
            </div>
          </div>

          <div>
            <h3 className="text-xl font-semibold mb-4">Images</h3>
            {fields.map((fld, idx) => (
              <div key={fld.id} className="border p-4 mb-4 rounded-xl space-y-3">
                <input 
                  type="file" 
                  accept="image/*" 
                  onChange={(e) => updateImageFile(idx, e.target.files?.[0] || null)} 
                  className="block w-full text-sm text-gray-500
                    file:mr-4 file:py-2 file:px-4
                    file:rounded-full file:border-0
                    file:text-sm file:font-semibold
                    file:bg-blue-50 file:text-blue-700
                    hover:file:bg-blue-100"
                />
                {errors.images?.[idx]?.file && <p className="text-red-500">{errors.images[idx].file!.message}</p>}
                {previews[idx] && <img src={previews[idx]} alt="preview" className="w-32 h-32 object-cover rounded-lg mb-2"/>}
                <input {...register(`images.${idx}.alt_text` as const)} placeholder="Alt text" className="w-full border p-3 rounded-lg" />
                {errors.images?.[idx]?.alt_text && <p className="text-red-500">{errors.images[idx].alt_text!.message}</p>}
                <input type="number" {...register(`images.${idx}.order` as const, { valueAsNumber: true })} placeholder="Order" className="w-full border p-3 rounded-lg" />
                {errors.images?.[idx]?.order && <p className="text-red-500">{errors.images[idx].order!.message}</p>}
                <button type="button" onClick={() => remove(idx)} className="bg-red-600 text-white px-4 py-2 rounded-lg">
                  Remove Image
                </button>
              </div>
            ))}
            <button type="button" onClick={() => append({ file: null, alt_text: "", order: fields.length })} className="bg-blue-600 text-white px-4 py-2 rounded-lg">
              + Add Another Image
            </button>
          </div>

          <button type="submit" className="w-full bg-orange-600 text-white py-4 rounded-xl text-lg">
            Submit Product
          </button>

          {submitError && <p className="text-red-600 mt-2">Error: {submitError}</p>}
        </form>
      </div>

      <div className="flex-none w-1/4 bg-gradient-to-b from-orange-50 to-orange-100 rounded-lg shadow-md p-6 flex items-center justify-center">
        <div className="text-center">
          <h3 className="text-2xl font-semibold text-orange-800 mb-2">Tips for Sellers</h3>
          <ul className="text-base text-gray-600 space-y-2 text-left">
            <li>• Use clear, well-lit photos</li>
            <li>• Be honest about condition</li>
            <li>• Set a fair price</li>
            <li>• Respond quickly to inquiries</li>
          </ul>
        </div>
      </div>

      {showSuccess && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center">
          <div className="bg-white p-6 rounded-xl shadow-lg text-center">
            <h4 className="text-green-600 font-bold mb-4">Product added successfully!</h4>
            <button onClick={() => { setShowSuccess(false); navigate("/home"); }} className="bg-blue-600 text-white px-6 py-3 rounded-lg text-lg">
              OK
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default MarketplaceUserProduct;
