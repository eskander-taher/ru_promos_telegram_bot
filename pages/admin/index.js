import { useState, useEffect } from 'react';
import Layout from '../../components/Layout';
import { toast } from 'react-hot-toast';
import axios from 'axios';
import Cookies from 'js-cookie';
import { 
  Users, 
  Tag, 
  MessageSquare, 
  Activity,
  TrendingUp,
  Calendar
} from 'lucide-react';

export default function AdminDashboard() {
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchStats();
  }, []);

  const fetchStats = async () => {
    try {
      const token = Cookies.get('token');
      const response = await axios.get('/api/dashboard/stats', {
        headers: { Authorization: `Bearer ${token}` }
      });
      
      if (response.data.success) {
        setStats(response.data.data);
      }
    } catch (error) {
      toast.error('Failed to fetch dashboard stats');
      console.error('Stats error:', error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <Layout>
        <div className="p-6">
          <div className="animate-pulse">
            <div className="h-8 bg-gray-200 rounded w-1/4 mb-6"></div>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
              {[...Array(4)].map((_, i) => (
                <div key={i} className="bg-white p-6 rounded-lg shadow">
                  <div className="h-4 bg-gray-200 rounded w-3/4 mb-2"></div>
                  <div className="h-8 bg-gray-200 rounded w-1/2"></div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </Layout>
    );
  }

  const statCards = [
    {
      title: 'Total Clients',
      value: stats?.counts?.totalClients || 0,
      icon: Users,
      color: 'bg-blue-500'
    },
    {
      title: 'Active Promos',
      value: stats?.counts?.activePromos || 0,
      icon: Tag,
      color: 'bg-green-500'
    },
    {
      title: 'Total Messages',
      value: stats?.counts?.totalMessages || 0,
      icon: MessageSquare,
      color: 'bg-purple-500'
    },
    {
      title: 'Active Clients',
      value: stats?.counts?.activeClients || 0,
      icon: Activity,
      color: 'bg-orange-500'
    }
  ];

  return (
    <Layout>
      <div className="p-6">
        <h1 className="text-2xl font-bold text-gray-900 mb-6">Dashboard</h1>
        
        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          {statCards.map((card, index) => {
            const Icon = card.icon;
            return (
              <div key={index} className="bg-white overflow-hidden shadow rounded-lg">
                <div className="p-5">
                  <div className="flex items-center">
                    <div className="flex-shrink-0">
                      <div className={`${card.color} p-3 rounded-md`}>
                        <Icon className="h-6 w-6 text-white" />
                      </div>
                    </div>
                    <div className="ml-5 w-0 flex-1">
                      <dl>
                        <dt className="text-sm font-medium text-gray-500 truncate">
                          {card.title}
                        </dt>
                        <dd className="text-lg font-medium text-gray-900">
                          {card.value}
                        </dd>
                      </dl>
                    </div>
                  </div>
                </div>
              </div>
            );
          })}
        </div>

        {/* Recent Activity */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Recent Clients */}
          <div className="bg-white shadow rounded-lg">
            <div className="px-4 py-5 sm:p-6">
              <h3 className="text-lg leading-6 font-medium text-gray-900 mb-4">
                Recent Clients
              </h3>
              <div className="flow-root">
                <ul className="-my-5 divide-y divide-gray-200">
                  {stats?.recentActivity?.clients?.map((client) => (
                    <li key={client._id} className="py-4">
                      <div className="flex items-center space-x-4">
                        <div className="flex-shrink-0">
                          <div className="h-8 w-8 bg-gray-200 rounded-full flex items-center justify-center">
                            <span className="text-sm font-medium text-gray-700">
                              {client.firstName?.charAt(0)}
                            </span>
                          </div>
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-medium text-gray-900 truncate">
                            {client.firstName} {client.lastName}
                          </p>
                          <p className="text-sm text-gray-500 truncate">
                            @{client.username || client.telegramId}
                          </p>
                        </div>
                        <div className="flex-shrink-0 text-sm text-gray-500">
                          {new Date(client.createdAt).toLocaleDateString()}
                        </div>
                      </div>
                    </li>
                  ))}
                </ul>
              </div>
            </div>
          </div>

          {/* Recent Messages */}
          <div className="bg-white shadow rounded-lg">
            <div className="px-4 py-5 sm:p-6">
              <h3 className="text-lg leading-6 font-medium text-gray-900 mb-4">
                Recent Messages
              </h3>
              <div className="flow-root">
                <ul className="-my-5 divide-y divide-gray-200">
                  {stats?.recentActivity?.messages?.slice(0, 5).map((message) => (
                    <li key={message._id} className="py-4">
                      <div className="flex items-start space-x-4">
                        <div className="flex-shrink-0">
                          <div className={`h-2 w-2 rounded-full mt-2 ${
                            message.direction === 'incoming' ? 'bg-blue-400' : 'bg-green-400'
                          }`}></div>
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-medium text-gray-900">
                            {message.clientId?.firstName} {message.clientId?.lastName}
                          </p>
                          <p className="text-sm text-gray-500 truncate">
                            {message.content}
                          </p>
                          <p className="text-xs text-gray-400">
                            {message.type} • {new Date(message.timestamp).toLocaleString()}
                          </p>
                        </div>
                      </div>
                    </li>
                  ))}
                </ul>
              </div>
            </div>
          </div>
        </div>

        {/* Message Stats */}
        {stats?.charts?.messageStats && (
          <div className="mt-6 bg-white shadow rounded-lg">
            <div className="px-4 py-5 sm:p-6">
              <h3 className="text-lg leading-6 font-medium text-gray-900 mb-4">
                Message Types
              </h3>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                {stats.charts.messageStats.map((stat) => (
                  <div key={stat._id} className="text-center">
                    <div className="text-2xl font-bold text-gray-900">
                      {stat.count}
                    </div>
                    <div className="text-sm text-gray-500 capitalize">
                      {stat._id}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}
      </div>
    </Layout>
  );
}
