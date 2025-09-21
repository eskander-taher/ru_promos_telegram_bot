import { useState } from 'react';
import { useRouter } from 'next/router';
import Layout from '../../../components/Layout';
import { useForm } from 'react-hook-form';
import { toast } from 'react-hot-toast';
import axios from 'axios';
import Cookies from 'js-cookie';
import { ArrowLeft } from 'lucide-react';
import Link from 'next/link';

export default function NewPromoPage() {
  const [loading, setLoading] = useState(false);
  const [locations, setLocations] = useState(['']);
  const router = useRouter();
  const { register, handleSubmit, formState: { errors }, setValue } = useForm();

  const addLocation = () => {
    setLocations([...locations, '']);
  };

  const removeLocation = (index) => {
    if (locations.length > 1) {
      const newLocations = locations.filter((_, i) => i !== index);
      setLocations(newLocations);
    }
  };

  const updateLocation = (index, value) => {
    const newLocations = [...locations];
    newLocations[index] = value;
    setLocations(newLocations);
  };

  const onSubmit = async (data) => {
    setLoading(true);
    try {
      const token = Cookies.get('token');
      const promoData = {
        ...data,
        locations: locations.filter(loc => loc.trim() !== '')
      };

      const response = await axios.post('/api/promos', promoData, {
        headers: { Authorization: `Bearer ${token}` }
      });
      
      if (response.data.success) {
        toast.success('Promo created successfully!');
        router.push('/admin/promos');
      }
    } catch (error) {
      const message = error.response?.data?.error || 'Failed to create promo';
      toast.error(message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <Layout>
      <div className="p-6">
        <div className="flex items-center mb-6">
          <Link
            href="/admin/promos"
            className="mr-4 text-gray-600 hover:text-gray-900"
          >
            <ArrowLeft className="h-5 w-5" />
          </Link>
          <h1 className="text-2xl font-bold text-gray-900">Add New Promo</h1>
        </div>

        <div className="bg-white shadow rounded-lg">
          <form onSubmit={handleSubmit(onSubmit)} className="p-6 space-y-6">
            {/* Promo Code */}
            <div>
              <label htmlFor="code" className="block text-sm font-medium text-gray-700">
                Promo Code *
              </label>
              <input
                {...register('code', { 
                  required: 'Promo code is required',
                  minLength: { value: 3, message: 'Code must be at least 3 characters' }
                })}
                type="text"
                className="mt-1 block w-full border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                placeholder="Enter promo code"
                style={{ textTransform: 'uppercase' }}
                onChange={(e) => {
                  e.target.value = e.target.value.toUpperCase();
                }}
              />
              {errors.code && (
                <p className="mt-1 text-sm text-red-600">{errors.code.message}</p>
              )}
            </div>

            {/* Store */}
            <div>
              <label htmlFor="store" className="block text-sm font-medium text-gray-700">
                Store *
              </label>
              <select
                {...register('store', { required: 'Store is required' })}
                className="mt-1 block w-full border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
              >
                <option value="">Select a store</option>
                <option value="Вайлдберриз">🛒 Вайлдберриз</option>
                <option value="Озон">🛍️ Озон</option>
                <option value="М.Видео">📱 М.Видео</option>
                <option value="ДНС">💻 ДНС</option>
                <option value="Пятёрочка">🛍️ Пятёрочка</option>
              </select>
              {errors.store && (
                <p className="mt-1 text-sm text-red-600">{errors.store.message}</p>
              )}
            </div>

            {/* Min Price */}
            <div>
              <label htmlFor="minPrice" className="block text-sm font-medium text-gray-700">
                Minimum Price (₽) *
              </label>
              <input
                {...register('minPrice', { 
                  required: 'Minimum price is required',
                  min: { value: 0, message: 'Price must be 0 or greater' },
                  valueAsNumber: true
                })}
                type="number"
                min="0"
                step="0.01"
                className="mt-1 block w-full border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                placeholder="0.00"
              />
              {errors.minPrice && (
                <p className="mt-1 text-sm text-red-600">{errors.minPrice.message}</p>
              )}
            </div>

            {/* Expires At */}
            <div>
              <label htmlFor="expiresAt" className="block text-sm font-medium text-gray-700">
                Expires At *
              </label>
              <input
                {...register('expiresAt', { required: 'Expiration date is required' })}
                type="datetime-local"
                className="mt-1 block w-full border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
              />
              {errors.expiresAt && (
                <p className="mt-1 text-sm text-red-600">{errors.expiresAt.message}</p>
              )}
            </div>

            {/* Locations */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Locations *
              </label>
              {locations.map((location, index) => (
                <div key={index} className="flex items-center mb-2">
                  <input
                    type="text"
                    value={location}
                    onChange={(e) => updateLocation(index, e.target.value)}
                    className="flex-1 border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                    placeholder="Enter location"
                  />
                  {locations.length > 1 && (
                    <button
                      type="button"
                      onClick={() => removeLocation(index)}
                      className="ml-2 text-red-600 hover:text-red-800"
                    >
                      Remove
                    </button>
                  )}
                </div>
              ))}
              <button
                type="button"
                onClick={addLocation}
                className="text-blue-600 hover:text-blue-800 text-sm"
              >
                + Add Location
              </button>
            </div>

            {/* Submit Buttons */}
            <div className="flex justify-end space-x-3 pt-6 border-t border-gray-200">
              <Link
                href="/admin/promos"
                className="bg-white py-2 px-4 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
              >
                Cancel
              </Link>
              <button
                type="submit"
                disabled={loading}
                className="bg-blue-600 py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {loading ? 'Creating...' : 'Create Promo'}
              </button>
            </div>
          </form>
        </div>
      </div>
    </Layout>
  );
}
