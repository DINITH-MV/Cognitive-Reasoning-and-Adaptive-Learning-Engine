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
                <p className="text-gray-600">
                    Practice with real-world scenarios and develop your decision-making skills
                </p>
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
                                <option value="communication">Communication</option>
                                <option value="problem-solving">Problem Solving</option>
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
                            <div className="flex items-center gap-2 mb-4">
                                <FlaskConical className="w-6 h-6 text-primary-600" />
                                <h2 className="text-xl font-bold text-gray-900">Scenario</h2>
                                {session.turn && (
                                    <span className="ml-auto text-sm text-gray-500">
                                        Turn {session.turn}
                                    </span>
                                )}
                            </div>
                            <div className="prose max-w-none">
                                <ReactMarkdown>
                                    {typeof session.scenario === 'string'
                                        ? session.scenario
                                        : JSON.stringify(session.scenario, null, 2)}
                                </ReactMarkdown>
                            </div>
                        </div>
                    )}

                    {/* Outcome */}
                    {session.outcome && (
                        <div
                            className={`card ${session.outcome.success
                                    ? 'bg-green-50 border-green-200'
                                    : 'bg-yellow-50 border-yellow-200'
                                }`}
                        >
                            <div className="flex items-center gap-2 mb-4">
                                {session.outcome.success ? (
                                    <CheckCircle className="w-6 h-6 text-green-600" />
                                ) : (
                                    <XCircle className="w-6 h-6 text-yellow-600" />
                                )}
                                <h2 className="text-xl font-bold text-gray-900">Outcome</h2>
                            </div>
                            <div className="prose max-w-none">
                                <ReactMarkdown>
                                    {typeof session.outcome === 'string'
                                        ? session.outcome
                                        : JSON.stringify(session.outcome, null, 2)}
                                </ReactMarkdown>
                            </div>
                        </div>
                    )}

                    {/* Decision Form */}
                    {session.session_status !== 'completed' && (
                        <div className="card">
                            <h2 className="text-xl font-bold text-gray-900 mb-4">
                                Your Decision
                            </h2>
                            <form onSubmit={handleMakeDecision} className="space-y-4">
                                {error && (
                                    <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg">
                                        {error}
                                    </div>
                                )}

                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-2">
                                        What do you decide to do?
                                    </label>
                                    <textarea
                                        value={decision}
                                        onChange={(e) => setDecision(e.target.value)}
                                        className="input"
                                        rows={3}
                                        placeholder="Describe your decision..."
                                        required
                                    />
                                </div>

                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-2">
                                        Reasoning (Optional)
                                    </label>
                                    <textarea
                                        value={reasoning}
                                        onChange={(e) => setReasoning(e.target.value)}
                                        className="input"
                                        rows={2}
                                        placeholder="Explain your reasoning..."
                                    />
                                </div>

                                <button
                                    type="submit"
                                    disabled={loading}
                                    className="btn btn-primary w-full"
                                >
                                    {loading ? (
                                        <>
                                            <Loader className="w-5 h-5 animate-spin mr-2 inline" />
                                            Processing...
                                        </>
                                    ) : (
                                        'Submit Decision'
                                    )}
                                </button>
                            </form>
                        </div>
                    )}

                    {/* Actions */}
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
