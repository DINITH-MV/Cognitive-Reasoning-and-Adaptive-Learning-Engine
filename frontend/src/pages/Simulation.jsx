import { useState } from 'react';
import { FlaskConical, Play, Loader, CheckCircle, XCircle } from 'lucide-react';
import { simulationAPI } from '../api/client';
import ReactMarkdown from 'react-markdown';

export default function Simulation() {
    const [formData, setFormData] = useState({
        topic: '',
        category: 'business',
        difficulty: 'intermediate',
    });
    const [session, setSession] = useState(null);
    const [decision, setDecision] = useState('');
    const [reasoning, setReasoning] = useState('');
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');

    const handleStartSimulation = async (e) => {
        e.preventDefault();
        setError('');
        setLoading(true);

        try {
            const response = await simulationAPI.start(formData);
            setSession(response.data);
        } catch (err) {
            setError(err.response?.data?.detail || 'Failed to start simulation');
        } finally {
            setLoading(false);
        }
    };

    const handleMakeDecision = async (e) => {
        e.preventDefault();
        if (!decision.trim()) return;

        setError('');
        setLoading(true);

        try {
            const response = await simulationAPI.makeDecision({
                session_id: session.session_id,
                decision: decision.trim(),
                reasoning: reasoning.trim(),
            });

            setSession(response.data);
            setDecision('');
            setReasoning('');
        } catch (err) {
            setError(err.response?.data?.detail || 'Failed to process decision');
        } finally {
            setLoading(false);
        }
    };

    const handleReset = () => {
        setSession(null);
        setDecision('');
        setReasoning('');
        setError('');
    };

    return (
        <div className="max-w-4xl mx-auto">
            <div className="mb-8">
                <h1 className="text-3xl font-bold text-gray-900 mb-2">Simulations</h1>
                <p className="text-gray-600 mb-4">
                    Practice with real-world scenarios and develop your decision-making skills
                </p>
                {!session && (
                    <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                        <div className="flex items-start gap-3">
                            <FlaskConical className="w-5 h-5 text-blue-600 mt-0.5 flex-shrink-0" />
                            <div className="text-sm text-blue-900">
                                <p className="font-medium mb-1">How Simulations Work:</p>
                                <p className="text-blue-800">
                                    You'll face realistic scenarios with multiple decision points. Each choice affects the outcome and reveals your cognitive patterns. 
                                    The AI adapts based on your decisions, creating a unique learning experience.
                                </p>
                            </div>
                        </div>
                    </div>
                )}
            </div>

            {!session ? (
                <div className="card">
                    <form onSubmit={handleStartSimulation} className="space-y-6">
                        {error && (
                            <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg">
                                {error}
                            </div>
                        )}

                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-2">
                                Topic/Scenario
                            </label>
                            <input
                                type="text"
                                value={formData.topic}
                                onChange={(e) =>
                                    setFormData((prev) => ({ ...prev, topic: e.target.value }))
                                }
                                className="input"
                                placeholder="e.g., Product launch decision, Crisis management..."
                                required
                            />
                            <div className="mt-2 flex flex-wrap gap-2">
                                <button
                                    type="button"
                                    onClick={() => setFormData(prev => ({ 
                                        ...prev, 
                                        topic: 'Startup Product Launch Crisis',
                                        category: 'business',
                                        difficulty: 'intermediate'
                                    }))}
                                    className="text-xs bg-gray-100 hover:bg-gray-200 text-gray-700 px-3 py-1 rounded-full transition-colors"
                                >
                                    💼 Product Launch Crisis
                                </button>
                                <button
                                    type="button"
                                    onClick={() => setFormData(prev => ({ 
                                        ...prev, 
                                        topic: 'Critical system outage during peak hours',
                                        category: 'technical',
                                        difficulty: 'advanced'
                                    }))}
                                    className="text-xs bg-gray-100 hover:bg-gray-200 text-gray-700 px-3 py-1 rounded-full transition-colors"
                                >
                                    🔧 System Outage
                                </button>
                                <button
                                    type="button"
                                    onClick={() => setFormData(prev => ({ 
                                        ...prev, 
                                        topic: 'Team conflict resolution with tight deadline',
                                        category: 'leadership',
                                        difficulty: 'intermediate'
                                    }))}
                                    className="text-xs bg-gray-100 hover:bg-gray-200 text-gray-700 px-3 py-1 rounded-full transition-colors"
                                >
                                    👥 Team Conflict
                                </button>
                            </div>
                        </div>

                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-2">
                                Category
                            </label>
                            <select
                                value={formData.category}
                                onChange={(e) =>
                                    setFormData((prev) => ({ ...prev, category: e.target.value }))
                                }
                                className="input"
                            >
                                <option value="business">Business</option>
                                <option value="technical">Technical</option>
                                <option value="leadership">Leadership</option>
                                <option value="crisis_management">Crisis Management</option>
                                <option value="financial">Financial</option>
                                <option value="strategic">Strategic</option>
                                <option value="ethical">Ethical</option>
                            </select>
                        </div>

                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-2">
                                Difficulty
                            </label>
                            <select
                                value={formData.difficulty}
                                onChange={(e) =>
                                    setFormData((prev) => ({ ...prev, difficulty: e.target.value }))
                                }
                                className="input"
                            >
                                <option value="beginner">Beginner</option>
                                <option value="intermediate">Intermediate</option>
                                <option value="advanced">Advanced</option>
                                <option value="expert">Expert</option>
                            </select>
                        </div>

                        <button
                            type="submit"
                            disabled={loading}
                            className="btn btn-primary w-full"
                        >
                            {loading ? (
                                <>
                                    <Loader className="w-5 h-5 animate-spin mr-2 inline" />
                                    Starting Simulation...
                                </>
                            ) : (
                                <>
                                    <Play className="w-5 h-5 mr-2 inline" />
                                    Start Simulation
                                </>
                            )}
                        </button>
                    </form>
                </div>
            ) : (
                <div className="space-y-6">
                    {/* Scenario */}
                    {session.scenario && (
                        <div className="card">
                            <div className="flex items-center gap-2 mb-6">
                                <FlaskConical className="w-6 h-6 text-primary-600" />
                                <h2 className="text-2xl font-bold text-gray-900">
                                    {typeof session.scenario === 'object' && session.scenario.scenario
                                        ? session.scenario.scenario.title
                                        : 'Simulation Scenario'}
                                </h2>
                                {session.turn && (
                                    <span className="ml-auto text-sm font-medium text-gray-500 bg-gray-100 px-3 py-1 rounded-full">
                                        Turn {session.turn}
                                    </span>
                                )}
                            </div>

                            {typeof session.scenario === 'object' && session.scenario.scenario ? (
                                <div className="space-y-6">
                                    {/* Context */}
                                    <div>
                                        <h3 className="text-lg font-semibold text-gray-900 mb-2">
                                            Situation
                                        </h3>
                                        <p className="text-gray-700 leading-relaxed">
                                            {session.scenario.scenario.context}
                                        </p>
                                    </div>

                                    {/* Stakeholders */}
                                    {session.scenario.scenario.stakeholders && (
                                        <div>
                                            <h3 className="text-lg font-semibold text-gray-900 mb-2">
                                                Key Stakeholders
                                            </h3>
                                            <div className="flex flex-wrap gap-2">
                                                {session.scenario.scenario.stakeholders.map((stakeholder, idx) => (
                                                    <span
                                                        key={idx}
                                                        className="bg-blue-100 text-blue-800 px-3 py-1 rounded-full text-sm"
                                                    >
                                                        {stakeholder}
                                                    </span>
                                                ))}
                                            </div>
                                        </div>
                                    )}

                                    {/* Constraints & Objectives Grid */}
                                    <div className="grid md:grid-cols-2 gap-6">
                                        {/* Constraints */}
                                        {session.scenario.scenario.constraints && (
                                            <div>
                                                <h3 className="text-lg font-semibold text-gray-900 mb-2">
                                                    Constraints
                                                </h3>
                                                <ul className="space-y-2">
                                                    {session.scenario.scenario.constraints.map((constraint, idx) => (
                                                        <li key={idx} className="flex items-start">
                                                            <span className="text-red-500 mr-2">⚠</span>
                                                            <span className="text-gray-700 text-sm">{constraint}</span>
                                                        </li>
                                                    ))}
                                                </ul>
                                            </div>
                                        )}

                                        {/* Objectives */}
                                        {session.scenario.scenario.objectives && (
                                            <div>
                                                <h3 className="text-lg font-semibold text-gray-900 mb-2">
                                                    Objectives
                                                </h3>
                                                <ul className="space-y-2">
                                                    {session.scenario.scenario.objectives.map((objective, idx) => (
                                                        <li key={idx} className="flex items-start">
                                                            <span className="text-green-500 mr-2">✓</span>
                                                            <span className="text-gray-700 text-sm">{objective}</span>
                                                        </li>
                                                    ))}
                                                </ul>
                                            </div>
                                        )}
                                    </div>

                                    {/* Initial State */}
                                    {session.scenario.scenario.initial_state && (
                                        <div>
                                            <h3 className="text-lg font-semibold text-gray-900 mb-3">
                                                Current State
                                            </h3>
                                            <div className="grid md:grid-cols-3 gap-4">
                                                {/* Resources */}
                                                {session.scenario.scenario.initial_state.resources && (
                                                    <div className="bg-gray-50 p-4 rounded-lg">
                                                        <h4 className="font-medium text-gray-900 mb-2">Resources</h4>
                                                        <div className="space-y-1 text-sm">
                                                            {Object.entries(session.scenario.scenario.initial_state.resources).map(([key, value]) => (
                                                                <div key={key} className="flex justify-between">
                                                                    <span className="text-gray-600 capitalize">{key.replace(/_/g, ' ')}:</span>
                                                                    <span className="font-medium text-gray-900">
                                                                        {typeof value === 'object' ? JSON.stringify(value) : value}
                                                                    </span>
                                                                </div>
                                                            ))}
                                                        </div>
                                                    </div>
                                                )}

                                                {/* Relationships */}
                                                {session.scenario.scenario.initial_state.relationships && (
                                                    <div className="bg-gray-50 p-4 rounded-lg">
                                                        <h4 className="font-medium text-gray-900 mb-2">Relationships</h4>
                                                        <div className="space-y-1 text-sm">
                                                            {Object.entries(session.scenario.scenario.initial_state.relationships).map(([key, value]) => (
                                                                <div key={key} className="flex justify-between">
                                                                    <span className="text-gray-600 capitalize">{key.replace(/_/g, ' ')}:</span>
                                                                    <span className={`font-medium ${
                                                                        value === 'high' ? 'text-green-600' :
                                                                        value === 'medium' ? 'text-yellow-600' :
                                                                        'text-red-600'
                                                                    }`}>
                                                                        {value}
                                                                    </span>
                                                                </div>
                                                            ))}
                                                        </div>
                                                    </div>
                                                )}

                                                {/* Metrics */}
                                                {session.scenario.scenario.initial_state.metrics && (
                                                    <div className="bg-gray-50 p-4 rounded-lg">
                                                        <h4 className="font-medium text-gray-900 mb-2">Metrics</h4>
                                                        <div className="space-y-1 text-sm">
                                                            {Object.entries(session.scenario.scenario.initial_state.metrics).map(([key, value]) => (
                                                                <div key={key} className="flex justify-between">
                                                                    <span className="text-gray-600 capitalize">{key.replace(/_/g, ' ')}:</span>
                                                                    <span className="font-medium text-gray-900">{value}</span>
                                                                </div>
                                                            ))}
                                                        </div>
                                                    </div>
                                                )}
                                            </div>
                                        </div>
                                    )}

                                    {/* Decision Point */}
                                    {session.scenario.decision_point && (
                                        <div className="border-t pt-6">
                                            <h3 className="text-lg font-semibold text-gray-900 mb-3">
                                                Decision Point
                                            </h3>
                                            <p className="text-gray-700 mb-4">
                                                {session.scenario.decision_point.situation}
                                            </p>

                                            {/* Options */}
                                            {session.scenario.decision_point.options && (
                                                <div className="space-y-3">
                                                    <h4 className="font-medium text-gray-900">Available Options:</h4>
                                                    <div className="grid gap-3">
                                                        {session.scenario.decision_point.options.map((option, idx) => (
                                                            <div
                                                                key={option.id || idx}
                                                                className={`border-2 rounded-lg p-4 cursor-pointer transition-all hover:shadow-md ${
                                                                    decision === option.id
                                                                        ? 'border-primary-500 bg-primary-50'
                                                                        : 'border-gray-200 hover:border-primary-300'
                                                                }`}
                                                                onClick={() => setDecision(option.description)}
                                                            >
                                                                <div className="flex items-start justify-between mb-2">
                                                                    <span className="font-bold text-gray-900 text-lg">
                                                                        Option {option.id}
                                                                    </span>
                                                                    <div className="flex gap-2">
                                                                        <span className={`text-xs px-2 py-1 rounded-full font-medium ${
                                                                            option.risk_level === 'low' ? 'bg-green-100 text-green-800' :
                                                                            option.risk_level === 'medium' ? 'bg-yellow-100 text-yellow-800' :
                                                                            'bg-red-100 text-red-800'
                                                                        }`}>
                                                                            {option.risk_level} risk
                                                                        </span>
                                                                        <span className="text-xs px-2 py-1 rounded-full bg-blue-100 text-blue-800 font-medium">
                                                                            {option.type}
                                                                        </span>
                                                                    </div>
                                                                </div>
                                                                <p className="text-gray-700">{option.description}</p>
                                                            </div>
                                                        ))}
                                                    </div>
                                                </div>
                                            )}
                                        </div>
                                    )}
                                </div>
                            ) : (
                                <div className="prose max-w-none">
                                    <ReactMarkdown>
                                        {typeof session.scenario === 'string'
                                            ? session.scenario
                                            : JSON.stringify(session.scenario, null, 2)}
                                    </ReactMarkdown>
                                </div>
                            )}
                        </div>
                    )}

                    {/* Outcome */}
                    {session.outcome && (
                        <div
                            className={`card ${
                                session.outcome.outcome?.score_impact > 0
                                    ? 'bg-green-50 border-green-200'
                                    : session.outcome.outcome?.score_impact < 0
                                    ? 'bg-red-50 border-red-200'
                                    : 'bg-yellow-50 border-yellow-200'
                            }`}
                        >
                            <div className="flex items-center justify-between mb-4">
                                <div className="flex items-center gap-2">
                                    {session.outcome.outcome?.score_impact > 0 ? (
                                        <CheckCircle className="w-6 h-6 text-green-600" />
                                    ) : session.outcome.outcome?.score_impact < 0 ? (
                                        <XCircle className="w-6 h-6 text-red-600" />
                                    ) : (
                                        <XCircle className="w-6 h-6 text-yellow-600" />
                                    )}
                                    <h2 className="text-xl font-bold text-gray-900">Decision Outcome</h2>
                                </div>
                                {session.outcome.outcome?.score_impact !== undefined && (
                                    <span className={`text-lg font-bold ${
                                        session.outcome.outcome.score_impact > 0 ? 'text-green-600' :
                                        session.outcome.outcome.score_impact < 0 ? 'text-red-600' :
                                        'text-gray-600'
                                    }`}>
                                        {session.outcome.outcome.score_impact > 0 ? '+' : ''}
                                        {session.outcome.outcome.score_impact} pts
                                    </span>
                                )}
                            </div>

                            {typeof session.outcome === 'object' && session.outcome.outcome ? (
                                <div className="space-y-4">
                                    {/* Narrative */}
                                    {session.outcome.outcome.narrative && (
                                        <div>
                                            <h3 className="font-semibold text-gray-900 mb-2">What Happened:</h3>
                                            <p className="text-gray-700 leading-relaxed">
                                                {session.outcome.outcome.narrative}
                                            </p>
                                        </div>
                                    )}

                                    {/* Immediate Effects */}
                                    {session.outcome.outcome.immediate_effects && session.outcome.outcome.immediate_effects.length > 0 && (
                                        <div>
                                            <h3 className="font-semibold text-gray-900 mb-2">Immediate Effects:</h3>
                                            <ul className="space-y-1">
                                                {session.outcome.outcome.immediate_effects.map((effect, idx) => (
                                                    <li key={idx} className="flex items-start">
                                                        <span className="text-blue-500 mr-2">•</span>
                                                        <span className="text-gray-700">{effect}</span>
                                                    </li>
                                                ))}
                                            </ul>
                                        </div>
                                    )}

                                    {/* Cognitive Indicators */}
                                    {session.outcome.cognitive_indicators && (
                                        <div className="border-t pt-4">
                                            <h3 className="font-semibold text-gray-900 mb-3">Decision Analysis:</h3>
                                            <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                                                {Object.entries(session.outcome.cognitive_indicators).map(([key, value]) => (
                                                    <div key={key} className="bg-white p-3 rounded-lg border">
                                                        <div className="text-xs text-gray-600 mb-1 capitalize">
                                                            {key.replace(/_/g, ' ')}
                                                        </div>
                                                        <div className="font-medium text-gray-900 capitalize">{value}</div>
                                                    </div>
                                                ))}
                                            </div>
                                        </div>
                                    )}
                                </div>
                            ) : (
                                <div className="prose max-w-none">
                                    <ReactMarkdown>
                                        {typeof session.outcome === 'string'
                                            ? session.outcome
                                            : JSON.stringify(session.outcome, null, 2)}
                                    </ReactMarkdown>
                                </div>
                            )}
                        </div>
                    )}

                    {/* Decision Form */}
                    {session.session_status !== 'completed' && (
                        <div className="card">
                            <h2 className="text-xl font-bold text-gray-900 mb-4">
                                Make Your Decision
                            </h2>
                            <form onSubmit={handleMakeDecision} className="space-y-4">
                                {error && (
                                    <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg">
                                        {error}
                                    </div>
                                )}

                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-2">
                                        Your Decision
                                        {decision && <span className="ml-2 text-primary-600 text-xs">(Click an option above or write custom)</span>}
                                    </label>
                                    <textarea
                                        value={decision}
                                        onChange={(e) => setDecision(e.target.value)}
                                        className="input"
                                        rows={4}
                                        placeholder="Click an option above or describe your own decision..."
                                        required
                                    />
                                </div>

                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-2">
                                        Your Reasoning
                                    </label>
                                    <textarea
                                        value={reasoning}
                                        onChange={(e) => setReasoning(e.target.value)}
                                        className="input"
                                        rows={3}
                                        placeholder="Explain why you chose this approach... What factors did you consider?"
                                    />
                                </div>

                                <button
                                    type="submit"
                                    disabled={loading || !decision.trim()}
                                    className="btn btn-primary w-full"
                                >
                                    {loading ? (
                                        <>
                                            <Loader className="w-5 h-5 animate-spin mr-2 inline" />
                                            Processing Decision...
                                        </>
                                    ) : (
                                        'Submit Decision'
                                    )}
                                </button>
                            </form>
                        </div>
                    )}

                    {/* Actions */}
                    {session.session_status === 'completed' && (
                        <div className="card bg-gradient-to-br from-primary-50 to-blue-50 border-primary-200">
                            <div className="flex items-center gap-3 mb-4">
                                <CheckCircle className="w-8 h-8 text-primary-600" />
                                <div>
                                    <h2 className="text-2xl font-bold text-gray-900">Simulation Complete!</h2>
                                    <p className="text-gray-600">You've completed this scenario</p>
                                </div>
                            </div>
                            {session.score !== undefined && (
                                <div className="bg-white p-4 rounded-lg mb-4">
                                    <div className="text-center">
                                        <div className="text-4xl font-bold text-primary-600 mb-1">
                                            {session.score}
                                        </div>
                                        <div className="text-sm text-gray-600">Final Score</div>
                                    </div>
                                </div>
                            )}
                        </div>
                    )}

                    <div className="flex gap-4">
                        <button onClick={handleReset} className="btn btn-secondary flex-1">
                            {session.session_status === 'completed'
                                ? 'Start New Simulation'
                                : 'Exit Simulation'}
                        </button>
                    </div>
                </div>
            )}
        </div>
    );
}
