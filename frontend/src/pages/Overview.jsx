import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { 
  BookOpen, 
  MessageSquare, 
  FlaskConical, 
  TrendingUp,
  ArrowRight,
  Sparkles
} from 'lucide-react';
import useAuthStore from '../store/authStore';

export default function Overview() {
  const { user } = useAuthStore();

  const quickActions = [
    {
      title: 'Create Learning Plan',
      description: 'Start a new personalized learning journey',
      icon: BookOpen,
      link: '/dashboard/learning',
      color: 'bg-blue-500',
    },
    {
      title: 'Chat with AI Mentor',
      description: 'Get instant help and guidance',
      icon: MessageSquare,
      link: '/dashboard/mentor',
      color: 'bg-purple-500',
    },
    {
      title: 'Try a Simulation',
      description: 'Practice with real-world scenarios',
      icon: FlaskConical,
      link: '/dashboard/simulation',
      color: 'bg-green-500',
    },
    {
      title: 'View Analytics',
      description: 'Track your progress and performance',
      icon: TrendingUp,
      link: '/dashboard/monitoring',
      color: 'bg-orange-500',
    },
  ];

  return (
    <div className="max-w-7xl mx-auto">
      {/* Welcome Section */}
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900 mb-2">
          Welcome back, {user?.full_name?.split(' ')[0] || 'there'}! 👋
        </h1>
        <p className="text-gray-600">
          Ready to continue your adaptive learning journey?
        </p>
      </div>

      {/* Feature Banner */}
      <div className="card mb-8 bg-gradient-to-r from-primary-500 to-primary-600 text-white">
        <div className="flex items-center justify-between">
          <div>
            <div className="flex items-center gap-2 mb-2">
              <Sparkles className="w-5 h-5" />
              <h2 className="text-xl font-bold">AI-Powered Adaptive Learning</h2>
            </div>
            <p className="text-primary-50 mb-4">
              Our system adapts to your learning style, tracks your progress, and provides 
              personalized recommendations to help you achieve your goals faster.
            </p>
            <Link to="/dashboard/learning" className="btn bg-white text-primary-600 hover:bg-primary-50">
              Get Started
              <ArrowRight className="w-4 h-4 ml-2 inline" />
            </Link>
          </div>
        </div>
      </div>

      {/* Quick Actions Grid */}
      <div className="mb-8">
        <h2 className="text-xl font-bold text-gray-900 mb-4">Quick Actions</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          {quickActions.map((action) => (
            <Link
              key={action.title}
              to={action.link}
              className="card hover:shadow-lg transition-shadow cursor-pointer group"
            >
              <div className={`w-12 h-12 ${action.color} rounded-lg flex items-center justify-center mb-4 group-hover:scale-110 transition-transform`}>
                <action.icon className="w-6 h-6 text-white" />
              </div>
              <h3 className="font-semibold text-gray-900 mb-1">{action.title}</h3>
              <p className="text-sm text-gray-600">{action.description}</p>
            </Link>
          ))}
        </div>
      </div>

      {/* Stats Overview */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="card">
          <div className="flex items-center justify-between mb-2">
            <h3 className="text-sm font-medium text-gray-600">Learning Paths</h3>
            <BookOpen className="w-5 h-5 text-gray-400" />
          </div>
          <p className="text-3xl font-bold text-gray-900">0</p>
          <p className="text-sm text-gray-500 mt-1">Active plans</p>
        </div>

        <div className="card">
          <div className="flex items-center justify-between mb-2">
            <h3 className="text-sm font-medium text-gray-600">Simulations</h3>
            <FlaskConical className="w-5 h-5 text-gray-400" />
          </div>
          <p className="text-3xl font-bold text-gray-900">0</p>
          <p className="text-sm text-gray-500 mt-1">Completed</p>
        </div>

        <div className="card">
          <div className="flex items-center justify-between mb-2">
            <h3 className="text-sm font-medium text-gray-600">Study Time</h3>
            <TrendingUp className="w-5 h-5 text-gray-400" />
          </div>
          <p className="text-3xl font-bold text-gray-900">0h</p>
          <p className="text-sm text-gray-500 mt-1">This week</p>
        </div>
      </div>
    </div>
  );
}
