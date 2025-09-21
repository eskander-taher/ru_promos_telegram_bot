import { useState, useEffect } from 'react';
import Layout from '../../../components/Layout';
import { toast } from 'react-hot-toast';
import axios from 'axios';
import Cookies from 'js-cookie';
import { 
  MessageSquare, 
  ArrowUpRight, 
  ArrowDownLeft,
  Filter,
  Calendar,
  User
} from 'lucide-react';

export default function MessagesPage() {
  const [messages, setMessages] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filters, setFilters] = useState({
    type: '',
    direction: ''
  });
  const [pagination, setPagination] = useState({
    page: 1,
    limit: 20,
    total: 0,
    pages: 0
  });

  useEffect(() => {
    fetchMessages();
  }, [pagination.page, filters]);

  const fetchMessages = async () => {
    try {
      const token = Cookies.get('token');
      const params = {
        page: pagination.page,
        limit: pagination.limit
      };

      if (filters.type) params.type = filters.type;
      if (filters.direction) params.direction = filters.direction;

      const response = await axios.get('/api/messages', {
        headers: { Authorization: `Bearer ${token}` },
        params
      });
      
      if (response.data.success) {
        setMessages(response.data.data);
        setPagination(prev => ({
          ...prev,
          ...response.data.pagination
        }));
      }
    } catch (error) {
      toast.error('Failed to fetch messages');
      console.error('Messages error:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleFilterChange = (filterType, value) => {
    setFilters(prev => ({
      ...prev,
      [filterType]: value
    }));
    setPagination(prev => ({ ...prev, page: 1 }));
  };

  const getMessageTypeIcon = (type) => {
    switch (type) {
      case 'command':
        return '⌨️';
      case 'photo':
        return '📷';
      case 'sticker':
        return '😄';
      case 'document':
        return '📄';
      case 'voice':
        return '🎤';
      case 'video':
        return '🎥';
      case 'location':
        return '📍';
      case 'contact':
        return '👤';
      default:
        return '💬';
    }
  };

  if (loading) {
    return (
      <Layout>
        <div className="p-6">
          <div className="animate-pulse">
            <div className="h-8 bg-gray-200 rounded w-1/4 mb-6"></div>
            <div className="bg-white shadow rounded-lg p-6">
              <div className="space-y-4">
                {[...Array(10)].map((_, i) => (
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
          <h1 className="text-2xl font-bold text-gray-900">Messages</h1>
        </div>

        {/* Filters */}
        <div className="bg-white shadow rounded-lg mb-6">
          <div className="p-4">
            <div className="flex items-center space-x-4">
              <Filter className="h-5 w-5 text-gray-400" />
              <div className="flex space-x-4">
                <div>
                  <label className="block text-xs font-medium text-gray-700 mb-1">
                    Type
                  </label>
                  <select
                    value={filters.type}
                    onChange={(e) => handleFilterChange('type', e.target.value)}
                    className="border-gray-300 rounded-md text-sm focus:ring-blue-500 focus:border-blue-500"
                  >
                    <option value="">All Types</option>
                    <option value="text">Text</option>
                    <option value="command">Command</option>
                    <option value="photo">Photo</option>
                    <option value="sticker">Sticker</option>
                    <option value="document">Document</option>
                    <option value="voice">Voice</option>
                    <option value="video">Video</option>
                    <option value="location">Location</option>
                    <option value="contact">Contact</option>
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-medium text-gray-700 mb-1">
                    Direction
                  </label>
                  <select
                    value={filters.direction}
                    onChange={(e) => handleFilterChange('direction', e.target.value)}
                    className="border-gray-300 rounded-md text-sm focus:ring-blue-500 focus:border-blue-500"
                  >
                    <option value="">All Directions</option>
                    <option value="incoming">Incoming</option>
                    <option value="outgoing">Outgoing</option>
                  </select>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Messages List */}
        <div className="bg-white shadow overflow-hidden sm:rounded-md">
          <ul className="divide-y divide-gray-200">
            {messages.map((message) => (
              <li key={message._id}>
                <div className="px-4 py-4 sm:px-6">
                  <div className="flex items-start justify-between">
                    <div className="flex items-start space-x-3">
                      <div className="flex-shrink-0">
                        <div className={`h-8 w-8 rounded-full flex items-center justify-center ${
                          message.direction === 'incoming' 
                            ? 'bg-blue-100' 
                            : 'bg-green-100'
                        }`}>
                          {message.direction === 'incoming' ? (
                            <ArrowDownLeft className={`h-4 w-4 ${
                              message.direction === 'incoming' 
                                ? 'text-blue-600' 
                                : 'text-green-600'
                            }`} />
                          ) : (
                            <ArrowUpRight className={`h-4 w-4 ${
                              message.direction === 'incoming' 
                                ? 'text-blue-600' 
                                : 'text-green-600'
                            }`} />
                          )}
                        </div>
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center space-x-2 mb-1">
                          <p className="text-sm font-medium text-gray-900">
                            {message.clientId?.firstName} {message.clientId?.lastName}
                          </p>
                          <span className="text-xs text-gray-500">
                            @{message.clientId?.username || message.clientId?.telegramId}
                          </span>
                          <span className="text-xs text-gray-400">•</span>
                          <span className="text-xs text-gray-500">
                            {getMessageTypeIcon(message.type)} {message.type}
                          </span>
                          <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium ${
                            message.direction === 'incoming'
                              ? 'bg-blue-100 text-blue-800'
                              : 'bg-green-100 text-green-800'
                          }`}>
                            {message.direction}
                          </span>
                        </div>
                        <div className="text-sm text-gray-900 mb-2">
                          {message.content.length > 200 
                            ? `${message.content.substring(0, 200)}...`
                            : message.content
                          }
                        </div>
                        <div className="flex items-center text-xs text-gray-500">
                          <Calendar className="h-3 w-3 mr-1" />
                          {new Date(message.timestamp).toLocaleString()}
                          <span className="mx-2">•</span>
                          <span>Message ID: {message.messageId}</span>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </li>
            ))}
          </ul>
        </div>

        {/* Empty State */}
        {messages.length === 0 && !loading && (
          <div className="text-center py-12">
            <MessageSquare className="mx-auto h-12 w-12 text-gray-400" />
            <h3 className="mt-2 text-sm font-medium text-gray-900">No messages found</h3>
            <p className="mt-1 text-sm text-gray-500">
              No messages match your current filters.
            </p>
          </div>
        )}

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
                  {[...Array(Math.min(pagination.pages, 10))].map((_, i) => {
                    const page = i + 1;
                    return (
                      <button
                        key={page}
                        onClick={() => setPagination(prev => ({ ...prev, page }))}
                        className={`relative inline-flex items-center px-4 py-2 border text-sm font-medium ${
                          pagination.page === page
                            ? 'z-10 bg-indigo-50 border-indigo-500 text-indigo-600'
                            : 'bg-white border-gray-300 text-gray-500 hover:bg-gray-50'
                        }`}
                      >
                        {page}
                      </button>
                    );
                  })}
                </nav>
              </div>
            </div>
          </div>
        )}
      </div>
    </Layout>
  );
}
