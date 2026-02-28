import { useState, useEffect, useRef } from 'react';
import { Brain, Zap, MessageSquare, CheckCircle, Loader, ChevronRight } from 'lucide-react';

const AGENT_COLORS = {
  planner: 'bg-blue-500',
  content_generator: 'bg-green-500',
  simulation: 'bg-purple-500',
  evaluator: 'bg-orange-500',
  mentor: 'bg-pink-500',
  memory: 'bg-indigo-500',
  orchestrator: 'bg-gray-700',
};

const AGENT_ICONS = {
  planner: '📋',
  content_generator: '📝',
  simulation: '🎮',
  evaluator: '📊',
  mentor: '🧑‍🏫',
  memory: '🧠',
  orchestrator: '🔄',
};

export default function ReasoningVisualization({ sessionId, onComplete }) {
  const [steps, setSteps] = useState([]);
  const [currentAgent, setCurrentAgent] = useState(null);
  const [isConnected, setIsConnected] = useState(false);
  const wsRef = useRef(null);
  const stepsEndRef = useRef(null);

  useEffect(() => {
    if (!sessionId) return;

    // Connect to WebSocket
    const protocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
    const wsUrl = `${protocol}//${window.location.hostname}:8000/api/v1/ws/reasoning/${sessionId}`;
    
    const ws = new WebSocket(wsUrl);
    wsRef.current = ws;

    ws.onopen = () => {
      setIsConnected(true);
      console.log('Reasoning WebSocket connected');
    };

    ws.onmessage = (event) => {
      const data = JSON.parse(event.data);
      
      if (data.type === 'connected') {
        console.log('Reasoning stream connected:', data.session_id);
      } else if (data.type === 'reasoning_step') {
        setSteps((prev) => [...prev, data]);
        setCurrentAgent(data.agent);

        // Auto-scroll to bottom
        setTimeout(() => {
          stepsEndRef.current?.scrollIntoView({ behavior: 'smooth' });
        }, 100);

        // Check if workflow completed
        if (data.step_type === 'completed') {
          setTimeout(() => {
            onComplete?.(data.metadata);
          }, 1000);
        }
      }
    };

    ws.onerror = (error) => {
      console.error('Reasoning WebSocket error:', error);
      setIsConnected(false);
    };

    ws.onclose = () => {
      setIsConnected(false);
      console.log('Reasoning WebSocket closed');
    };

    // Send periodic pings to keep connection alive
    const pingInterval = setInterval(() => {
      if (ws.readyState === WebSocket.OPEN) {
        ws.send('ping');
      }
    }, 30000);

    return () => {
      clearInterval(pingInterval);
      ws.close();
    };
  }, [sessionId, onComplete]);

  if (!sessionId) {
    return null;
  }

  return (
    <div className="card bg-gradient-to-br from-purple-50 to-blue-50 border-2 border-purple-200">
      {/* Header */}
      <div className="flex items-center justify-between mb-4 pb-3 border-b border-purple-200">
        <div className="flex items-center gap-2">
          <Brain className="w-6 h-6 text-purple-600 animate-pulse" />
          <h3 className="text-lg font-semibold text-gray-900">
            Agent Reasoning
          </h3>
        </div>
        <div className="flex items-center gap-2">
          <div
            className={`w-2 h-2 rounded-full ${
              isConnected ? 'bg-green-500 animate-pulse' : 'bg-gray-300'
            }`}
          />
          <span className="text-sm text-gray-600">
            {isConnected ? 'Live' : 'Connecting...'}
          </span>
        </div>
      </div>

      {/* Current Agent */}
      {currentAgent && (
        <div className="mb-4 p-3 bg-white rounded-lg border border-purple-200 shadow-sm">
          <div className="flex items-center gap-3">
            <div
              className={`w-10 h-10 rounded-full ${
                AGENT_COLORS[currentAgent] || 'bg-gray-500'
              } flex items-center justify-center text-xl shadow-lg animate-bounce`}
            >
              {AGENT_ICONS[currentAgent] || '🤖'}
            </div>
            <div className="flex-1">
              <div className="text-xs text-gray-500 uppercase tracking-wide">
                Currently Active
              </div>
              <div className="font-semibold text-gray-900 capitalize">
                {currentAgent.replace('_', ' ')} Agent
              </div>
            </div>
            <Loader className="w-5 h-5 text-purple-600 animate-spin" />
          </div>
        </div>
      )}

      {/* Reasoning Steps */}
      <div className="max-h-96 overflow-y-auto space-y-2 pr-2">
        {steps.length === 0 ? (
          <div className="text-center py-8 text-gray-500">
            <Zap className="w-12 h-12 mx-auto mb-2 text-purple-300" />
            <p>Waiting for agent reasoning...</p>
          </div>
        ) : (
          steps.map((step, index) => (
            <ReasoningStep key={index} step={step} />
          ))
        )}
        <div ref={stepsEndRef} />
      </div>

      {/* Progress Bar */}
      {steps.length > 0 && (
        <div className="mt-4 pt-3 border-t border-purple-200">
          <div className="flex items-center justify-between text-sm text-gray-600 mb-2">
            <span>Processing</span>
            <span>{steps.length} steps</span>
          </div>
          <div className="h-2 bg-purple-100 rounded-full overflow-hidden">
            <div
              className="h-full bg-gradient-to-r from-purple-500 to-blue-500 transition-all duration-500"
              style={{
                width: `${Math.min(
                  (steps.length / (steps.length + 1)) * 100,
                  100
                )}%`,
              }}
            />
          </div>
        </div>
      )}
    </div>
  );
}

function ReasoningStep({ step }) {
  const getStepIcon = () => {
    switch (step.step_type) {
      case 'thinking':
        return <Brain className="w-4 h-4" />;
      case 'executing':
        return <Zap className="w-4 h-4" />;
      case 'communicating':
        return <MessageSquare className="w-4 h-4" />;
      case 'completed':
        return <CheckCircle className="w-4 h-4" />;
      default:
        return <ChevronRight className="w-4 h-4" />;
    }
  };

  const getStepColor = () => {
    switch (step.step_type) {
      case 'thinking':
        return 'bg-blue-50 border-blue-200 text-blue-700';
      case 'executing':
        return 'bg-purple-50 border-purple-200 text-purple-700';
      case 'communicating':
        return 'bg-green-50 border-green-200 text-green-700';
      case 'completed':
        return 'bg-emerald-50 border-emerald-200 text-emerald-700';
      default:
        return 'bg-gray-50 border-gray-200 text-gray-700';
    }
  };

  return (
    <div
      className={`p-3 rounded-lg border ${getStepColor()} transition-all duration-300 animate-fadeIn`}
    >
      <div className="flex items-start gap-3">
        <div
          className={`mt-0.5 p-1 rounded ${
            AGENT_COLORS[step.agent] || 'bg-gray-500'
          } text-white flex-shrink-0`}
        >
          {getStepIcon()}
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex items-baseline gap-2 mb-1">
            <span className="font-medium capitalize text-sm">
              {step.agent.replace('_', ' ')}
            </span>
            <span className="text-xs opacity-60">
              {step.step_type}
            </span>
          </div>
          <p className="text-sm leading-relaxed">{step.content}</p>
          
          {/* Metadata */}
          {step.metadata && Object.keys(step.metadata).length > 0 && (
            <div className="mt-2 pt-2 border-t border-current opacity-40 text-xs">
              {step.metadata.progress && (
                <div>Progress: {step.metadata.progress}%</div>
              )}
              {step.metadata.tokens && (
                <div>Tokens: {step.metadata.tokens}</div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
