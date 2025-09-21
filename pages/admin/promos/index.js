import { useState, useEffect } from 'react';
import Link from 'next/link';
import Layout from '../../../components/Layout';
import { toast } from 'react-hot-toast';
import axios from 'axios';
import Cookies from 'js-cookie';
import { 
  Plus, 
  Search, 
  Edit, 
  Trash2, 
  Calendar,
  DollarSign,
  MapPin,
  Store
} from 'lucide-react';

export default function PromosPage() {
  const [promos, setPromos] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [pagination, setPagination] = useState({
    page: 1,
    limit: 10,
    total: 0,
    pages: 0
  });

  useEffect(() => {
    fetchPromos();
  }, [pagination.page, search]);

  const fetchPromos = async () => {
    try {
      const token = Cookies.get('token');
      const response = await axios.get('/api/promos', {
        headers: { Authorization: `Bearer ${token}` },
        params: {
          page: pagination.page,
          limit: pagination.limit,
          search
        }
      });
      
      if (response.data.success) {
        setPromos(response.data.data);
        setPagination(prev => ({
          ...prev,
          ...response.data.pagination
        }));
      }
    } catch (error) {
      toast.error('Failed to fetch promos');
      console.error('Promos error:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (id) => {
    if (!confirm('Are you sure you want to delete this promo?')) return;

    try {
      const token = Cookies.get('token');
      await axios.delete(`/api/promos/${id}`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      
      toast.success('Promo deleted successfully');
      fetchPromos();
    } catch (error) {
      toast.error('Failed to delete promo');
      console.error('Delete error:', error);
    }
  };

  const handleSearch = (e) => {
    e.preventDefault();
    setPagination(prev => ({ ...prev, page: 1 }));
    fetchPromos();
  };

  if (loading) {
    return (
      <Layout>
        <div className="p-6">
          <div className="animate-pulse">
            <div className="h-8 bg-gray-200 rounded w-1/4 mb-6"></div>
            <div className="bg-white shadow rounded-lg p-6">
              <div className="space-y-4">
                {[...Array(5)].map((_, i) => (
                  <div key={i} className="h-16 bg-gray-200 rounded"></div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </Layout>
    );
  }

  return (
    <Layout>
      <div className="p-6">
        <div className="flex justify-between items-center mb-6">
          <h1 className="text-2xl font-bold text-gray-900">Promos</h1>
          <Link
            href="/admin/promos/new"
            className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-md flex items-center"
          >
            <Plus className="h-4 w-4 mr-2" />
            Add Promo
          </Link>
        </div>

        {/* Search */}
        <div className="bg-white shadow rounded-lg mb-6">
          <form onSubmit={handleSearch} className="p-4">
            <div className="flex gap-4">
              <div className="flex-1 relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <Search className="h-5 w-5 text-gray-400" />
                </div>
                <input
                  type="text"
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  placeholder="Search by code or store..."
                  className="block w-full pl-10 pr-3 py-2 border border-gray-300 rounded-md leading-5 bg-white placeholder-gray-500 focus:outline-none focus:placeholder-gray-400 focus:ring-1 focus:ring-blue-500 focus:border-blue-500"
                />
              </div>
              <button
                type="submit"
                className="bg-gray-100 hover:bg-gray-200 px-4 py-2 rounded-md text-gray-700"
              >
                Search
              </button>
            </div>
          </form>
        </div>

        {/* Promos List */}
        <div className="bg-white shadow overflow-hidden sm:rounded-md">
          <ul className="divide-y divide-gray-200">
            {promos.map((promo) => (
              <li key={promo._id}>
                <div className="px-4 py-4 sm:px-6">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center">
                      <div className="flex-shrink-0">
                        <div className={`h-10 w-10 rounded-full flex items-center justify-center ${
                          promo.isActive && !promo.isExpired ? 'bg-green-100' : 'bg-red-100'
                        }`}>
                          <span className={`text-sm font-medium ${
                            promo.isActive && !promo.isExpired ? 'text-green-800' : 'text-red-800'
                          }`}>
                            {promo.code.charAt(0)}
                          </span>
                        </div>
                      </div>
                      <div className="ml-4">
                        <div className="flex items-center">
                          <p className="text-sm font-medium text-indigo-600 truncate">
                            {promo.code}
                          </p>
                          {promo.isExpired && (
                            <span className="ml-2 inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-red-100 text-red-800">
                              Expired
                            </span>
                          )}
                          {!promo.isActive && (
                            <span className="ml-2 inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-gray-100 text-gray-800">
                              Inactive
                            </span>
                          )}
                        </div>
                        <div className="mt-2 flex items-center text-sm text-gray-500">
                          <Store className="flex-shrink-0 mr-1.5 h-4 w-4" />
                          <p className="truncate">{promo.store}</p>
                        </div>
                        <div className="mt-1 text-sm text-gray-600">
                          🎁 {promo.discount}
                        </div>
                      </div>
                    </div>
                    <div className="flex items-center space-x-4">
                      <div className="text-right">
                        <div className="flex items-center text-sm text-gray-500 mb-1">
                          <DollarSign className="h-4 w-4 mr-1" />
                          <span>Min: {promo.minPrice}₽</span>
                        </div>
                        <div className="flex items-center text-sm text-gray-500 mb-1">
                          <MapPin className="h-4 w-4 mr-1" />
                          <span>{promo.locations.length} locations</span>
                        </div>
                        <div className="flex items-center text-sm text-gray-500">
                          <Calendar className="h-4 w-4 mr-1" />
                          <span>{new Date(promo.expiresAt).toLocaleDateString()}</span>
                        </div>
                      </div>
                      <div className="flex items-center space-x-2">
                        <Link
                          href={`/admin/promos/${promo._id}`}
                          className="text-indigo-600 hover:text-indigo-900"
                        >
                          <Edit className="h-4 w-4" />
                        </Link>
                        <button
                          onClick={() => handleDelete(promo._id)}
                          className="text-red-600 hover:text-red-900"
                        >
                          <Trash2 className="h-4 w-4" />
                        </button>
                      </div>
                    </div>
                  </div>
                  {promo.locations.length > 0 && (
                    <div className="mt-2 text-sm text-gray-500">
                      <span className="font-medium">Locations:</span> {promo.locations.join(', ')}
                    </div>
                  )}
                </div>
              </li>
            ))}
          </ul>
        </div>

        {/* Pagination */}
        {pagination.pages > 1 && (
          <div className="bg-white px-4 py-3 flex items-center justify-between border-t border-gray-200 sm:px-6 mt-6 rounded-lg shadow">
            <div className="flex-1 flex justify-between sm:hidden">
              <button
                onClick={() => setPagination(prev => ({ ...prev, page: prev.page - 1 }))}
                disabled={pagination.page === 1}
                className="relative inline-flex items-center px-4 py-2 border border-gray-300 text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 disabled:opacity-50"
              >
                Previous
              </button>
              <button
                onClick={() => setPagination(prev => ({ ...prev, page: prev.page + 1 }))}
                disabled={pagination.page === pagination.pages}
                className="ml-3 relative inline-flex items-center px-4 py-2 border border-gray-300 text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 disabled:opacity-50"
              >
                Next
              </button>
            </div>
            <div className="hidden sm:flex-1 sm:flex sm:items-center sm:justify-between">
              <div>
                <p className="text-sm text-gray-700">
                  Showing <span className="font-medium">{((pagination.page - 1) * pagination.limit) + 1}</span> to{' '}
                  <span className="font-medium">{Math.min(pagination.page * pagination.limit, pagination.total)}</span> of{' '}
                  <span className="font-medium">{pagination.total}</span> results
                </p>
              </div>
              <div>
                <nav className="relative z-0 inline-flex rounded-md shadow-sm -space-x-px">
                  {[...Array(pagination.pages)].map((_, i) => (
                    <button
                      key={i}
                      onClick={() => setPagination(prev => ({ ...prev, page: i + 1 }))}
                      className={`relative inline-flex items-center px-4 py-2 border text-sm font-medium ${
                        pagination.page === i + 1
                          ? 'z-10 bg-indigo-50 border-indigo-500 text-indigo-600'
                          : 'bg-white border-gray-300 text-gray-500 hover:bg-gray-50'
                      }`}
                    >
                      {i + 1}
                    </button>
                  ))}
                </nav>
              </div>
            </div>
          </div>
        )}
      </div>
    </Layout>
  );
}
