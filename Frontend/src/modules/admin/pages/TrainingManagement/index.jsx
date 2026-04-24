import React, { useState, useEffect } from 'react';
import { 
  FiPlus, FiTrash2, FiEdit2, FiPlayCircle, FiList, 
  FiChevronDown, FiChevronUp, FiSave, FiX, FiCheck
} from 'react-icons/fi';
import { toast } from 'react-hot-toast';
import * as trainingService from '../../services/trainingService';
import LogoLoader from '../../../../components/common/LogoLoader';

const TrainingManagement = () => {
  const [loading, setLoading] = useState(true);
  const [trainings, setTrainings] = useState([]);
  const [showModal, setShowModal] = useState(false);
  const [editingId, setEditingId] = useState(null);
  
  // Form State
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    videoUrl: '',
    videoDuration: 30,
    minimumScore: 3,
    isActive: true,
    questions: [
      {
        question: '',
        options: ['', '', '', ''],
        correctOptionIndex: 0
      }
    ]
  });

  useEffect(() => {
    fetchTrainings();
  }, []);

  const fetchTrainings = async () => {
    try {
      setLoading(true);
      const res = await trainingService.getAllTrainings();
      if (res.success) {
        setTrainings(res.data);
      }
    } catch (error) {
      toast.error('Failed to load trainings');
    } finally {
      setLoading(false);
    }
  };

  const resetForm = () => {
    setFormData({
      title: '',
      description: '',
      videoUrl: '',
      videoDuration: 30,
      minimumScore: 3,
      isActive: true,
      questions: [
        {
          question: '',
          options: ['', '', '', ''],
          correctOptionIndex: 0
        }
      ]
    });
    setEditingId(null);
  };

  const handleOpenModal = (training = null) => {
    if (training) {
      setFormData({
        title: training.title,
        description: training.description,
        videoUrl: training.videoUrl,
        videoDuration: training.videoDuration,
        minimumScore: training.minimumScore,
        isActive: training.isActive,
        questions: training.questions
      });
      setEditingId(training._id);
    } else {
      resetForm();
    }
    setShowModal(true);
  };

  const handleAddQuestion = () => {
    setFormData({
      ...formData,
      questions: [
        ...formData.questions,
        {
          question: '',
          options: ['', '', '', ''],
          correctOptionIndex: 0
        }
      ]
    });
  };

  const handleRemoveQuestion = (index) => {
    const newQuestions = formData.questions.filter((_, i) => i !== index);
    setFormData({ ...formData, questions: newQuestions });
  };

  const handleQuestionChange = (index, field, value) => {
    const newQuestions = [...formData.questions];
    newQuestions[index][field] = value;
    setFormData({ ...formData, questions: newQuestions });
  };

  const handleOptionChange = (qIndex, optIndex, value) => {
    const newQuestions = [...formData.questions];
    newQuestions[qIndex].options[optIndex] = value;
    setFormData({ ...formData, questions: newQuestions });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      if (editingId) {
        await trainingService.updateTraining(editingId, formData);
        toast.success('Training updated successfully');
      } else {
        await trainingService.createTraining(formData);
        toast.success('Training created successfully');
      }
      setShowModal(false);
      fetchTrainings();
    } catch (error) {
      toast.error('Operation failed');
    }
  };

  const handleDelete = async (id) => {
    if (window.confirm('Are you sure you want to delete this training?')) {
      try {
        await trainingService.deleteTraining(id);
        toast.success('Training deleted');
        fetchTrainings();
      } catch (error) {
        toast.error('Delete failed');
      }
    }
  };

  if (loading) return <LogoLoader />;

  return (
    <div className="p-6">
      <div className="flex justify-between items-center mb-8">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Training Management</h1>
          <p className="text-slate-500">Manage vendor onboarding videos and MCQs</p>
        </div>
        <button
          onClick={() => handleOpenModal()}
          className="flex items-center gap-2 bg-primary-600 text-white px-4 py-2 rounded-lg font-semibold hover:bg-primary-700 transition-colors shadow-sm"
        >
          <FiPlus /> Add New Training
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {trainings.map((training) => (
          <div key={training._id} className="bg-white rounded-2xl shadow-sm border border-slate-100 overflow-hidden hover:shadow-md transition-shadow">
            <div className="aspect-video bg-slate-100 relative group">
              <div className="absolute inset-0 flex items-center justify-center">
                <FiPlayCircle className="text-4xl text-primary-500 opacity-50 group-hover:opacity-100 transition-opacity" />
              </div>
              <div className="absolute top-2 right-2 flex gap-2">
                <button 
                  onClick={() => handleOpenModal(training)}
                  className="p-2 bg-white/90 rounded-lg text-blue-600 hover:bg-blue-50 shadow-sm"
                >
                  <FiEdit2 size={16} />
                </button>
                <button 
                  onClick={() => handleDelete(training._id)}
                  className="p-2 bg-white/90 rounded-lg text-red-600 hover:bg-red-50 shadow-sm"
                >
                  <FiTrash2 size={16} />
                </button>
              </div>
            </div>
            <div className="p-4">
              <div className="flex justify-between items-start mb-2">
                <h3 className="font-bold text-slate-900 truncate flex-1 mr-2">{training.title}</h3>
                <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider ${training.isActive ? 'bg-green-100 text-green-700' : 'bg-slate-100 text-slate-500'}`}>
                  {training.isActive ? 'Active' : 'Draft'}
                </span>
              </div>
              <p className="text-xs text-slate-500 line-clamp-2 mb-4 h-8">{training.description}</p>
              <div className="flex items-center justify-between text-xs font-medium text-slate-600 border-t pt-3">
                <span className="flex items-center gap-1"><FiList /> {training.questions?.length || 0} Questions</span>
                <span className="flex items-center gap-1"><FiPlayCircle /> {training.videoDuration}s watch time</span>
              </div>
            </div>
          </div>
        ))}

        {trainings.length === 0 && (
          <div className="col-span-full py-12 text-center bg-slate-50 rounded-2xl border-2 border-dashed border-slate-200">
            <FiList className="w-12 h-12 text-slate-300 mx-auto mb-3" />
            <p className="text-slate-500 font-medium">No training modules found</p>
            <button onClick={() => handleOpenModal()} className="mt-4 text-primary-600 font-bold hover:underline">Create your first training</button>
          </div>
        )}
      </div>

      {/* Modal Overlay */}
      {showModal && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm">
          <div className="bg-white w-full max-w-4xl max-h-[90vh] rounded-3xl shadow-2xl flex flex-col overflow-hidden animate-fade-in-up">
            {/* Modal Header */}
            <div className="px-8 py-6 border-b border-slate-100 flex items-center justify-between bg-slate-50">
              <div>
                <h2 className="text-xl font-bold text-slate-900">{editingId ? 'Edit Training' : 'Create Training'}</h2>
                <p className="text-sm text-slate-500">Configure video content and onboarding test</p>
              </div>
              <button onClick={() => setShowModal(false)} className="p-2 hover:bg-slate-200 rounded-full transition-colors">
                <FiX size={20} className="text-slate-500" />
              </button>
            </div>

            {/* Modal Body */}
            <div className="flex-1 overflow-y-auto p-8 scrollbar-admin">
              <form id="training-form" onSubmit={handleSubmit} className="space-y-8">
                {/* Basic Info */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="space-y-2">
                    <label className="text-sm font-bold text-slate-700">Training Title</label>
                    <input
                      type="text"
                      required
                      value={formData.title}
                      onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                      placeholder="e.g. Vendor Safety Guidelines"
                      className="w-full px-4 py-3 rounded-xl border border-slate-200 focus:ring-2 focus:ring-primary-500 focus:border-transparent outline-none transition-all"
                    />
                  </div>
                  <div className="space-y-2">
                    <label className="text-sm font-bold text-slate-700">Minimum Passing Score</label>
                    <input
                      type="number"
                      required
                      min="1"
                      value={formData.minimumScore}
                      onChange={(e) => setFormData({ ...formData, minimumScore: parseInt(e.target.value) })}
                      className="w-full px-4 py-3 rounded-xl border border-slate-200 focus:ring-2 focus:ring-primary-500 focus:border-transparent outline-none transition-all"
                    />
                  </div>
                  <div className="space-y-2 md:col-span-2">
                    <label className="text-sm font-bold text-slate-700">Description</label>
                    <textarea
                      value={formData.description}
                      onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                      rows="2"
                      className="w-full px-4 py-3 rounded-xl border border-slate-200 focus:ring-2 focus:ring-primary-500 focus:border-transparent outline-none transition-all resize-none"
                    ></textarea>
                  </div>
                </div>

                {/* Video Info */}
                <div className="bg-slate-50 p-6 rounded-2xl border border-slate-100 space-y-4">
                  <h3 className="font-bold text-slate-900 flex items-center gap-2"><FiPlayCircle /> Video Configuration</h3>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                    <div className="md:col-span-2 space-y-2">
                      <label className="text-sm font-bold text-slate-700">YouTube Video URL</label>
                      <input
                        type="url"
                        required
                        value={formData.videoUrl}
                        onChange={(e) => setFormData({ ...formData, videoUrl: e.target.value })}
                        placeholder="https://www.youtube.com/watch?v=..."
                        className="w-full px-4 py-3 rounded-xl border border-slate-200 focus:ring-2 focus:ring-primary-500 focus:border-transparent outline-none transition-all"
                      />
                    </div>
                    <div className="space-y-2">
                      <label className="text-sm font-bold text-slate-700">Min. Watch Duration (sec)</label>
                      <input
                        type="number"
                        required
                        min="0"
                        value={formData.videoDuration}
                        onChange={(e) => setFormData({ ...formData, videoDuration: parseInt(e.target.value) })}
                        className="w-full px-4 py-3 rounded-xl border border-slate-200 focus:ring-2 focus:ring-primary-500 focus:border-transparent outline-none transition-all"
                      />
                    </div>
                  </div>
                </div>

                {/* Questions Section */}
                <div className="space-y-6">
                  <div className="flex justify-between items-center">
                    <h3 className="font-bold text-slate-900 flex items-center gap-2"><FiList /> MCQ Questions</h3>
                    <button
                      type="button"
                      onClick={handleAddQuestion}
                      className="text-primary-600 text-sm font-bold flex items-center gap-1 hover:underline"
                    >
                      <FiPlus /> Add Question
                    </button>
                  </div>

                  <div className="space-y-8">
                    {formData.questions.map((q, qIndex) => (
                      <div key={qIndex} className="p-6 rounded-2xl border border-slate-200 relative bg-white shadow-sm">
                        <button
                          type="button"
                          onClick={() => handleRemoveQuestion(qIndex)}
                          className="absolute -top-3 -right-3 w-8 h-8 bg-red-50 text-red-500 rounded-full flex items-center justify-center border border-red-100 hover:bg-red-100 transition-colors shadow-sm"
                        >
                          <FiTrash2 size={14} />
                        </button>

                        <div className="space-y-4">
                          <div className="space-y-2">
                            <label className="text-xs font-black text-slate-400 uppercase tracking-widest">Question {qIndex + 1}</label>
                            <input
                              type="text"
                              required
                              value={q.question}
                              onChange={(e) => handleQuestionChange(qIndex, 'question', e.target.value)}
                              placeholder="Type your question here..."
                              className="w-full px-4 py-3 rounded-xl border border-slate-200 bg-slate-50 focus:bg-white focus:ring-2 focus:ring-primary-500 transition-all font-medium"
                            />
                          </div>

                          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            {q.options.map((opt, optIndex) => (
                              <div key={optIndex} className="flex items-center gap-3">
                                <div 
                                  onClick={() => handleQuestionChange(qIndex, 'correctOptionIndex', optIndex)}
                                  className={`w-6 h-6 rounded-full flex items-center justify-center cursor-pointer transition-all border ${q.correctOptionIndex === optIndex ? 'bg-primary-500 border-primary-500 text-white shadow-sm' : 'bg-white border-slate-300 text-transparent'}`}
                                >
                                  <FiCheck size={14} />
                                </div>
                                <input
                                  type="text"
                                  required
                                  value={opt}
                                  onChange={(e) => handleOptionChange(qIndex, optIndex, e.target.value)}
                                  placeholder={`Option ${optIndex + 1}`}
                                  className="flex-1 px-4 py-2.5 rounded-lg border border-slate-100 bg-slate-50/50 focus:bg-white outline-none text-sm font-medium"
                                />
                              </div>
                            ))}
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </form>
            </div>

            {/* Modal Footer */}
            <div className="px-8 py-6 border-t border-slate-100 flex items-center justify-between bg-slate-50">
              <div className="flex items-center gap-4">
                 <label className="flex items-center gap-2 cursor-pointer group">
                   <div 
                    onClick={() => setFormData({...formData, isActive: !formData.isActive})}
                    className={`w-10 h-5 rounded-full relative transition-colors ${formData.isActive ? 'bg-primary-500' : 'bg-slate-300'}`}
                   >
                     <div className={`absolute top-1 w-3 h-3 bg-white rounded-full transition-all ${formData.isActive ? 'left-6' : 'left-1'}`}></div>
                   </div>
                   <span className="text-sm font-bold text-slate-600">Module Active</span>
                 </label>
              </div>
              <div className="flex gap-4">
                <button
                  type="button"
                  onClick={() => setShowModal(false)}
                  className="px-6 py-2.5 rounded-xl text-slate-600 font-bold hover:bg-slate-200 transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  form="training-form"
                  className="flex items-center gap-2 bg-primary-600 text-white px-8 py-2.5 rounded-xl font-bold hover:bg-primary-700 transition-all shadow-lg hover:shadow-primary-500/30 transform active:scale-95"
                >
                  <FiSave /> {editingId ? 'Update Module' : 'Publish Training'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default TrainingManagement;
