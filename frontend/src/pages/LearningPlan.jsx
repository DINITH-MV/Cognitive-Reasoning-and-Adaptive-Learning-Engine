import { useState } from 'react';
import { BookOpen, Target, Clock, Award, Loader } from 'lucide-react';
import { learningAPI } from '../api/client';
import ReactMarkdown from 'react-markdown';

export default function LearningPlan() {
  const [formData, setFormData] = useState({
    goal: '',
    skill_level: 'beginner',
    time_available_hours: 10,
    target_outcome: 'skill mastery',
  });
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState(null);
  const [error, setError] = useState('');

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      const response = await learningAPI.createPlan(formData);
      setResult(response.data);
    } catch (err) {
      setError(err.response?.data?.detail || 'Failed to create learning plan');
    } finally {
      setLoading(false);
    }
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: name === 'time_available_hours' ? parseInt(value) : value,
    }));
  };

  return (
    <div className="max-w-4xl mx-auto">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900 mb-2">Learning Plan</h1>
        <p className="text-gray-600">
          Create a personalized learning path tailored to your goals and schedule
        </p>
      </div>

      {!result ? (
        <div className="card">
          <form onSubmit={handleSubmit} className="space-y-6">
            {error && (
              <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg">
                {error}
              </div>
            )}

            {/* Goal */}
            <div>
              <label className="flex items-center gap-2 text-sm font-medium text-gray-700 mb-2">
                <Target className="w-4 h-4" />
                Learning Goal
              </label>
              <textarea
                name="goal"
                value={formData.goal}
                onChange={handleChange}
                className="input"
                rows={3}
                placeholder="What do you want to learn? Be specific..."
                required
              />
              <p className="mt-1 text-xs text-gray-500">
                Example: "Learn Python programming for data analysis"
              </p>
            </div>

            {/* Skill Level */}
            <div>
              <label className="flex items-center gap-2 text-sm font-medium text-gray-700 mb-2">
                <Award className="w-4 h-4" />
                Current Skill Level
              </label>
              <select
                name="skill_level"
                value={formData.skill_level}
                onChange={handleChange}
                className="input"
              >
                <option value="beginner">Beginner - Just starting out</option>
                <option value="intermediate">Intermediate - Some experience</option>
                <option value="advanced">Advanced - Strong foundation</option>
                <option value="expert">Expert - Deep expertise</option>
              </select>
            </div>

            {/* Time Available */}
            <div>
              <label className="flex items-center gap-2 text-sm font-medium text-gray-700 mb-2">
                <Clock className="w-4 h-4" />
                Weekly Time Available: {formData.time_available_hours} hours
              </label>
              <input
                type="range"
                name="time_available_hours"
                value={formData.time_available_hours}
                onChange={handleChange}
                min="1"
                max="40"
                className="w-full"
              />
              <div className="flex justify-between text-xs text-gray-500 mt-1">
                <span>1 hour</span>
                <span>40 hours</span>
              </div>
            </div>

            {/* Target Outcome */}
            <div>
              <label className="flex items-center gap-2 text-sm font-medium text-gray-700 mb-2">
                <BookOpen className="w-4 h-4" />
                Target Outcome
              </label>
              <input
                type="text"
                name="target_outcome"
                value={formData.target_outcome}
                onChange={handleChange}
                className="input"
                placeholder="skill mastery, certification, job readiness..."
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
                  Creating Your Plan...
                </>
              ) : (
                'Create Learning Plan'
              )}
            </button>
          </form>
        </div>
      ) : (
        <div className="space-y-6">
          <div className="card bg-green-50 border-green-200">
            <h2 className="text-xl font-bold text-green-900 mb-2">
              🎉 Your Learning Plan is Ready!
            </h2>
            <p className="text-green-700">
              We've created a personalized learning path based on your goals.
            </p>
          </div>

          <div className="card">
            <h3 className="text-lg font-bold text-gray-900 mb-4">📋 Learning Plan Details</h3>
            <div className="space-y-6">
              {/* Learning Path Overview */}
              {result.learning_path?.plan?.learning_path && (
                <div>
                  <h4 className="text-xl font-bold text-gray-900 mb-2">
                    {result.learning_path.plan.learning_path.title}
                  </h4>
                  <div className="grid grid-cols-2 gap-4 mt-3 text-sm bg-gray-50 p-4 rounded">
                    <div>
                      <span className="text-gray-600">Goal:</span>
                      <p className="font-medium text-gray-900">{result.learning_path.plan.learning_path.goal}</p>
                    </div>
                    <div>
                      <span className="text-gray-600">Difficulty:</span>
                      <p className="font-medium text-gray-900 capitalize">{result.learning_path.plan.learning_path.difficulty}</p>
                    </div>
                    <div>
                      <span className="text-gray-600">Estimated Duration:</span>
                      <p className="font-medium text-gray-900">{result.learning_path.plan.learning_path.estimated_weeks} weeks</p>
                    </div>
                    <div>
                      <span className="text-gray-600">Learning Path ID:</span>
                      <p className="font-mono text-xs text-gray-900">{result.learning_path.learning_path_id}</p>
                    </div>
                  </div>
                </div>
              )}

              {/* Learning Objectives */}
              {result.learning_path?.plan?.learning_path?.learning_objectives && (
                <div>
                  <h5 className="font-semibold text-gray-900 mb-2">🎯 Learning Objectives:</h5>
                  <ul className="list-disc pl-5 space-y-1 text-gray-700">
                    {result.learning_path.plan.learning_path.learning_objectives.map((obj, idx) => (
                      <li key={idx}>{obj}</li>
                    ))}
                  </ul>
                </div>
              )}

              {/* Reasoning / Rationale */}
              {result.learning_path?.plan?.rationale && (
                <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                  <h5 className="font-semibold text-blue-900 mb-2">💡 AI Reasoning:</h5>
                  <p className="text-sm text-blue-800">{result.learning_path.plan.rationale}</p>
                </div>
              )}

              {/* Milestones */}
              {result.learning_path?.plan?.milestones && result.learning_path.plan.milestones.length > 0 && (
                <div>
                  <h5 className="font-semibold text-gray-900 mb-3">🗺️ Learning Milestones:</h5>
                  <div className="space-y-3">
                    {result.learning_path.plan.milestones.map((milestone, idx) => (
                      <div key={idx} className="border-l-4 border-primary-500 pl-4 py-3 bg-gray-50 rounded hover:bg-gray-100 transition-colors">
                        <div className="flex justify-between items-start">
                          <div className="flex-1">
                            <h6 className="font-medium text-gray-900 text-base">
                              {milestone.order || idx + 1}. {milestone.title}
                            </h6>
                            <p className="text-sm text-gray-600 mt-1">{milestone.description}</p>
                            
                            {/* Rationale for this milestone */}
                            {milestone.rationale && (
                              <p className="text-xs text-blue-700 italic mt-2 bg-blue-50 p-2 rounded">
                                💭 {milestone.rationale}
                              </p>
                            )}
                            
                            {/* Skills targeted */}
                            {milestone.skills_targeted && milestone.skills_targeted.length > 0 && (
                              <div className="flex flex-wrap gap-1 mt-2">
                                {milestone.skills_targeted.map((skill, skillIdx) => (
                                  <span key={skillIdx} className="text-xs bg-primary-100 text-primary-800 px-2 py-1 rounded">
                                    {skill}
                                  </span>
                                ))}
                              </div>
                            )}
                          </div>
                          <div className="ml-4 text-right text-sm shrink-0">
                            <div className="text-gray-600 font-medium">
                              ⏱️ {milestone.estimated_hours}h
                            </div>
                            <div className="text-xs text-gray-500 capitalize mt-1 bg-white px-2 py-1 rounded">
                              {milestone.content_type}
                            </div>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Next Action */}
          {(result.learning_path?.next_action || result.learning_path?.plan?.next_action) && (
            <div className="card bg-primary-50 border-primary-200">
              <h3 className="text-lg font-bold text-primary-900 mb-2">🎯 Your Next Step</h3>
              <div className="space-y-2">
                {(() => {
                  const nextAction = result.learning_path.next_action || result.learning_path.plan.next_action;
                  return (
                    <>
                      <p className="font-medium text-primary-900 text-lg">{nextAction.title}</p>
                      {nextAction.rationale && (
                        <div className="bg-white p-3 rounded">
                          <p className="text-sm text-gray-700"><strong>Why this step:</strong> {nextAction.rationale}</p>
                        </div>
                      )}
                      <div className="text-xs text-primary-600 mt-2 flex gap-4">
                        <span>Type: <span className="font-medium capitalize">{nextAction.type}</span></span>
                        {nextAction.estimated_time && (
                          <span>Time: <span className="font-medium">{nextAction.estimated_time}</span></span>
                        )}
                      </div>
                    </>
                  );
                })()}
              </div>
            </div>
          )}

          {/* First Content Preview */}
          {result.first_content && (
            <div className="card">
              <h3 className="text-lg font-bold text-gray-900 mb-4">📚 First Content Generated</h3>
              <div className="space-y-4">
                {result.first_content.title && (
                  <h4 className="text-lg font-semibold text-gray-800">{result.first_content.title}</h4>
                )}
                {result.first_content.content && (
                  <div className="prose max-w-none">
                    {typeof result.first_content.content === 'string' ? (
                      <ReactMarkdown>{result.first_content.content}</ReactMarkdown>
                    ) : (
                      <div className="bg-gray-50 p-4 rounded">
                        <pre className="text-sm overflow-auto whitespace-pre-wrap">
                          {JSON.stringify(result.first_content.content, null, 2)}
                        </pre>
                      </div>
                    )}
                  </div>
                )}
              </div>
            </div>
          )}

          {/* AI Performance Metrics */}
          {result.learning_path?.usage && (
            <div className="card bg-gray-50">
              <h3 className="text-sm font-semibold text-gray-700 mb-2">🤖 AI Processing Details</h3>
              <div className="grid grid-cols-3 gap-4 text-xs">
                <div>
                  <span className="text-gray-600">Prompt Tokens:</span>
                  <p className="font-mono text-gray-900">{result.learning_path.usage.prompt_tokens}</p>
                </div>
                <div>
                  <span className="text-gray-600">Completion Tokens:</span>
                  <p className="font-mono text-gray-900">{result.learning_path.usage.completion_tokens}</p>
                </div>
                <div>
                  <span className="text-gray-600">Total Tokens:</span>
                  <p className="font-mono text-gray-900">{result.learning_path.usage.total_tokens}</p>
                </div>
              </div>
            </div>
          )}

          <button
            onClick={() => setResult(null)}
            className="btn btn-secondary"
          >
            Create Another Plan
          </button>
        </div>
      )}
    </div>
  );
}
