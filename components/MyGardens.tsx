import React, { useState, useEffect, useCallback } from 'react';
import { motion } from 'motion/react';
import { useNavigate } from 'react-router-dom';
import {
  Sprout, Plus, Trash2, ChevronRight, ChevronLeft, X,
  Clock, AlertTriangle, Leaf, Sun, Droplets,
  TestTube, Ruler, FileText, Camera, Search, ArrowLeft,
  Activity, Eye, HelpCircle, Volume2, VolumeX
} from 'lucide-react';
import {
  Garden, Plant, Activity as GardenActivity, AIExaminationResult,
  GARDEN_TYPE_OPTIONS, PLANT_STAGE_OPTIONS, HEALTH_STATUS_OPTIONS,
  ACTIVITY_TYPE_OPTIONS, SOURCE_OPTIONS,
  getGardens, addGarden, deleteGarden,
  getPlantsByGarden, addPlant, deletePlant, updatePlant,
  getActivitiesByPlant, addActivity,
  generateId, calculateAgeInDays, getLastActivityDate, getRecentActivitiesByPlant, initStorage
} from '../services/myGardensStorage';
import { examinePlantWithAI, generateComparisonReport } from '../services/plantExaminationService';
import { generateChatResponse } from '../services/geminiService';
import { speakAgentVoice } from '../services/voiceService';

const MyGardens: React.FC = () => {
  const navigate = useNavigate();
  const [gardens, setGardens] = useState<Garden[]>([]);
  const [selectedGardenId, setSelectedGardenId] = useState<string | null>(null);
  const [plants, setPlants] = useState<Plant[]>([]);
  const [selectedPlantId, setSelectedPlantId] = useState<string | null>(null);
  const [activities, setActivities] = useState<GardenActivity[]>([]);
  const [loading, setLoading] = useState(true);

  // Modal states
  const [showAddGarden, setShowAddGarden] = useState(false);
  const [showAddPlant, setShowAddPlant] = useState(false);
  const [showAddActivity, setShowAddActivity] = useState(false);
  const [showExamination, setShowExamination] = useState(false);
  const [showExaminationResult, setShowExaminationResult] = useState(false);
  const [examinationResult, setExaminationResult] = useState<AIExaminationResult | null>(null);
  const [examinationLoading, setExaminationLoading] = useState(false);

  // Form states
  const [gardenForm, setGardenForm] = useState({ name: '', type: GARDEN_TYPE_OPTIONS[0], location: '', lighting: '', notes: '' });
  const [plantForm, setPlantForm] = useState({
    name: '', strainOrType: '', startDate: new Date().toISOString().split('T')[0],
    source: 'Unknown' as 'Seed' | 'Clone' | 'Unknown', stage: PLANT_STAGE_OPTIONS[0],
    medium: '', potSize: '', lightSchedule: '', currentPH: '', currentPPM: '',
    height: '', healthStatus: HEALTH_STATUS_OPTIONS[0], notes: '', imageUrl: ''
  });
  const [activityForm, setActivityForm] = useState({
    type: ACTIVITY_TYPE_OPTIONS[0], date: new Date().toISOString().split('T')[0],
    notes: '', ph: '', ppm: '', amount: '', imageUrl: ''
  });
  const [examinationConcern, setExaminationConcern] = useState('');
  const [examinationImage, setExaminationImage] = useState<string | null>(null);
  const [examinationUseLatestPhoto, setExaminationUseLatestPhoto] = useState(true);
  const [examinationPH, setExaminationPH] = useState('');
  const [examinationPPM, setExaminationPPM] = useState('');
  const [examinationWaterTemp, setExaminationWaterTemp] = useState('');
  const [meterAnalyzing, setMeterAnalyzing] = useState<'ph' | 'ppm' | 'temp' | 'combo' | false>(false);

  // Ask Grow Assistant
  const [growQuestion, setGrowQuestion] = useState('');
  const [growAnswer, setGrowAnswer] = useState('');
  const [growQuestionLoading, setGrowQuestionLoading] = useState(false);
  const [muteAssistant, setMuteAssistant] = useState(false);

  const [reportLoading, setReportLoading] = useState(false);
  const [reportHtml, setReportHtml] = useState<string | null>(null);
  const [reportType, setReportType] = useState<'last_exam' | 'weekly' | 'monthly'>('last_exam');

  const refreshData = useCallback(() => {
    setGardens([...getGardens()]);
    if (selectedGardenId) {
      setPlants([...getPlantsByGarden(selectedGardenId)]);
    }
    if (selectedPlantId) {
      setActivities([...getActivitiesByPlant(selectedPlantId)]);
    }
    setLoading(false);
  }, [selectedGardenId, selectedPlantId]);

  useEffect(() => {
    initStorage().then(() => {
      refreshData();
    });
  }, [refreshData]);

  // Refresh plants when selected garden changes
  useEffect(() => {
    if (selectedGardenId) {
      setPlants([...getPlantsByGarden(selectedGardenId)]);
    } else {
      setPlants([]);
    }
    setSelectedPlantId(null);
    setActivities([]);
  }, [selectedGardenId]);

  const selectedGarden = gardens.find(g => g.id === selectedGardenId) || null;
  const selectedPlant = plants.find(p => p.id === selectedPlantId) || null;

  // Garden handlers
  const handleAddGarden = () => {
    const newGarden: Garden = {
      id: generateId(),
      name: gardenForm.name || 'My Garden',
      type: gardenForm.type,
      location: gardenForm.location,
      lighting: gardenForm.lighting,
      notes: gardenForm.notes,
      createdAt: new Date().toISOString(),
    };
    addGarden(newGarden);
    setGardens([...getGardens()]);
    setShowAddGarden(false);
    setGardenForm({ name: '', type: GARDEN_TYPE_OPTIONS[0], location: '', lighting: '', notes: '' });
  };

  const handleDeleteGarden = (id: string) => {
    if (window.confirm('Delete this garden and all its plants and data?')) {
      deleteGarden(id);
      setGardens([...getGardens()]);
      if (selectedGardenId === id) {
        setSelectedGardenId(null);
        setSelectedPlantId(null);
        setPlants([]);
        setActivities([]);
      }
    }
  };

  // Plant handlers
  const handleAddPlant = () => {
    if (!selectedGardenId) return;
    const newPlant: Plant = {
      id: generateId(),
      gardenId: selectedGardenId,
      name: plantForm.name || 'Unnamed Plant',
      strainOrType: plantForm.strainOrType,
      startDate: plantForm.startDate || new Date().toISOString(),
      source: plantForm.source,
      stage: plantForm.stage,
      medium: plantForm.medium,
      potSize: plantForm.potSize,
      lightSchedule: plantForm.lightSchedule,
      currentPH: plantForm.currentPH,
      currentPPM: plantForm.currentPPM,
      height: plantForm.height,
      healthStatus: plantForm.healthStatus,
      notes: plantForm.notes,
      imageUrl: plantForm.imageUrl,
      createdAt: new Date().toISOString(),
    };
    addPlant(newPlant);
    setPlants([...getPlantsByGarden(selectedGardenId)]);
    setShowAddPlant(false);
    setPlantForm({
      name: '', strainOrType: '', startDate: new Date().toISOString().split('T')[0],
      source: 'Unknown', stage: PLANT_STAGE_OPTIONS[0],
      medium: '', potSize: '', lightSchedule: '', currentPH: '', currentPPM: '',
      height: '', healthStatus: HEALTH_STATUS_OPTIONS[0], notes: '', imageUrl: ''
    });
  };

  const handleDeletePlant = (id: string) => {
    if (window.confirm('Delete this plant and all its activity logs?')) {
      deletePlant(id);
      setPlants([...getPlantsByGarden(selectedGardenId!)]);
      if (selectedPlantId === id) {
        setSelectedPlantId(null);
        setActivities([]);
      }
    }
  };

  // Activity handlers
  const handleAddActivity = () => {
    if (!selectedPlantId) return;
    const newActivity: GardenActivity = {
      id: generateId(),
      plantId: selectedPlantId,
      type: activityForm.type,
      date: activityForm.date || new Date().toISOString(),
      notes: activityForm.notes,
      ph: activityForm.ph,
      ppm: activityForm.ppm,
      amount: activityForm.amount,
      imageUrl: activityForm.imageUrl,
    };
    addActivity(newActivity);
    setActivities([...getActivitiesByPlant(selectedPlantId)]);
    setShowAddActivity(false);
    setActivityForm({
      type: ACTIVITY_TYPE_OPTIONS[0], date: new Date().toISOString().split('T')[0],
      notes: '', ph: '', ppm: '', amount: '', imageUrl: ''
    });
  };

  // Examination handlers
  const handleRunExamination = async () => {
    if (!selectedPlant) return;
    setExaminationLoading(true);
    setExaminationResult(null);

    let imageToSend: string | null = null;
    if (examinationImage) {
      imageToSend = examinationImage;
    } else if (examinationUseLatestPhoto && selectedPlant.imageUrl) {
      imageToSend = selectedPlant.imageUrl;
    }

    const recentActivities = getRecentActivitiesByPlant(selectedPlant.id, 10);

    const fullConcern = `${examinationConcern}\nCurrent pH: ${examinationPH || 'Not provided'}\nCurrent PPM/EC: ${examinationPPM || 'Not provided'}\nWater Temp: ${examinationWaterTemp || 'Not provided'}`;

    const result = await examinePlantWithAI(
      selectedPlant,
      selectedGarden,
      recentActivities,
      fullConcern,
      imageToSend
    );

    setExaminationResult(result);
    setExaminationLoading(false);
    setShowExaminationResult(true);

    // Save the AI examination result to the activity log
    const examinationActivity: GardenActivity = {
      id: generateId(),
      plantId: selectedPlant.id,
      type: 'AI Examination',
      date: new Date().toISOString(),
      notes: `AI Examination: ${result.overallStatus} (Confidence: ${result.confidenceLevel})${examinationWaterTemp ? ` | Water Temp: ${examinationWaterTemp}` : ''}`,
      ph: examinationPH,
      ppm: examinationPPM,
      amount: '',
      imageUrl: '',
      aiExaminationResult: result,
    };
    addActivity(examinationActivity);
    if (selectedPlantId) {
      setActivities([...getActivitiesByPlant(selectedPlantId)]);
    }

    if (!muteAssistant && result.plantSummary) {
      speakAgentVoice(result.plantSummary);
    }
  };

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>, setter: (val: string) => void) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onloadend = () => {
      const base64 = reader.result as string;
      const base64Data = base64.split(',')[1];
      setter(base64Data);
    };
    reader.readAsDataURL(file);
  };

  const handleMeterImageUpload = async (e: React.ChangeEvent<HTMLInputElement>, type: 'ph' | 'ppm' | 'temp' | 'combo') => {
    const file = e.target.files?.[0];
    if (!file) return;
    
    setMeterAnalyzing(type);
    
    const reader = new FileReader();
    reader.onloadend = async () => {
      const base64 = reader.result as string;
      const base64Data = base64.split(',')[1];
      
      try {
        let prompt = "";
        if (type === 'ph') prompt = "Analyze this image of a meter. Extract the numeric value for pH. Respond ONLY with a JSON object: {\"ph\": \"6.2\"}.";
        else if (type === 'ppm') prompt = "Analyze this image of a meter. Extract the numeric value for PPM or EC. Respond ONLY with a JSON object: {\"ppm\": \"800\"}.";
        else if (type === 'temp') prompt = "Analyze this image of a meter. Extract the numeric value for Temperature (water temp). Respond ONLY with a JSON object: {\"temp\": \"72.5\"}.";
        else prompt = "Analyze this image of a meter. Extract the numeric values for pH, PPM (or EC), and Temperature. Respond ONLY with a JSON object in this exact format: {\"ph\": \"6.2\", \"ppm\": \"800\", \"temp\": \"72.5\"}. If a value is missing, return an empty string for it.";
        
        const response = await generateChatResponse(prompt, [], [{ name: 'meter.jpg', mimeType: 'image/jpeg', data: base64Data }]);
        
        let cleanedText = response.text.trim();
        if (cleanedText.startsWith('```json')) cleanedText = cleanedText.substring(7);
        if (cleanedText.startsWith('```')) cleanedText = cleanedText.substring(3);
        if (cleanedText.endsWith('```')) cleanedText = cleanedText.substring(0, cleanedText.length - 3);
        
        const data = JSON.parse(cleanedText.trim());
        if ((type === 'ph' || type === 'combo') && data.ph) setExaminationPH(data.ph);
        if ((type === 'ppm' || type === 'combo') && data.ppm) setExaminationPPM(data.ppm);
        if ((type === 'temp' || type === 'combo') && data.temp) setExaminationWaterTemp(data.temp);
      } catch (error) {
        console.error(`Failed to parse ${type} meter readings`, error);
      } finally {
        setMeterAnalyzing(false);
      }
    };
    reader.readAsDataURL(file);
  };

  // Grow Assistant
  const handleGrowQuestion = async () => {
    if (!growQuestion.trim()) return;
    setGrowQuestionLoading(true);
    setGrowAnswer('');
    
    try {
      let prompt = growQuestion;
      if (selectedPlant) {
        prompt = `Context: User is asking about their plant named "${selectedPlant.name}". It is a ${selectedPlant.strainOrType || 'cannabis'} plant in the ${selectedPlant.stage} stage. Health is ${selectedPlant.healthStatus}. Current pH: ${selectedPlant.currentPH || 'unknown'}, PPM: ${selectedPlant.currentPPM || 'unknown'}.\n\nUser Question: ${growQuestion}`;
      } else if (selectedGarden) {
        prompt = `Context: User is asking about their garden named "${selectedGarden.name}". It is a ${selectedGarden.type} located in ${selectedGarden.location || 'unknown'}.\n\nUser Question: ${growQuestion}`;
      }
      
      const response = await generateChatResponse(prompt);
      setGrowAnswer(response.text);
      
      if (!muteAssistant) {
        speakAgentVoice(response.text);
      }
    } catch (error) {
      console.error("Grow Assistant Error:", error);
      setGrowAnswer("Sorry, I couldn't reach the Green Genie right now. Please try again.");
    } finally {
      setGrowQuestionLoading(false);
    }
  };

  // Comparison Report
  const handleGenerateReport = async (type: 'last_exam' | 'weekly' | 'monthly') => {
    if (!selectedPlant) return;
    setReportType(type);
    setReportLoading(true);
    setReportHtml(null);

    try {
      const result = await generateComparisonReport(selectedPlant, selectedGarden, activities, type);
      setReportHtml(result.html);

      if (!muteAssistant) {
        speakAgentVoice(result.text);
      }
    } catch (err) {
      setReportHtml("<p class='text-rose-400'>Error generating report.</p>");
    } finally {
      setReportLoading(false);
    }
  };

  // Back to gardens
  const handleBackToGardens = () => {
    setSelectedGardenId(null);
    setSelectedPlantId(null);
    setPlants([]);
    setActivities([]);
  };

  if (loading) {
    return (
      <div className="min-h-screen pt-16 md:pt-20 pb-32 px-4 flex items-center justify-center">
        <div className="text-emerald-400 font-bold">Loading My Gardens...</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen pt-12 md:pt-20 pb-32 px-4 md:px-8 max-w-7xl mx-auto">
      {/* Floating Back to Home Button - left side to avoid mic/buttons overlap */}
      <div className="fixed bottom-6 left-4 md:bottom-10 md:left-16 z-[60]">
        <button
          onClick={() => navigate('/')}
          className="flex flex-col items-center gap-2 group pointer-events-auto"
        >
          <div className="w-14 h-14 md:w-20 md:h-20 rounded-full bg-emerald-950/90 text-emerald-400 border border-white/10 flex items-center justify-center shadow-2xl backdrop-blur-xl group-hover:scale-110 group-hover:border-emerald-500/50 transition-all duration-300">
            <ArrowLeft className="w-6 h-6 md:w-8 md:h-8" />
          </div>
          <span className="font-bold uppercase tracking-widest text-[9px] md:text-[10px] text-emerald-400/70 group-hover:text-emerald-400 transition-colors">Home</span>
        </button>
      </div>

      {/* Mobile-friendly Back to Home button for garden list page - visible on page top */}
      <div className="mb-6 md:mb-8">
        <button
          onClick={() => navigate('/')}
          className="flex items-center gap-2 text-emerald-400 hover:text-emerald-300 transition-colors font-bold group"
        >
          <ChevronLeft className="w-5 h-5 group-hover:-translate-x-1 transition-transform" />
          <span className="text-xs uppercase tracking-widest">Back to Home</span>
        </button>
      </div>

      {/* Main Content */}
      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
        {/* Hero Section */}
        <div className="text-center mb-12">
          <span className="inline-block px-4 py-1.5 mb-4 rounded-full bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 text-xs font-bold tracking-widest uppercase font-mono">
            Grow Management
          </span>
          <h1 className="text-5xl md:text-7xl font-black text-white tracking-tighter mb-6 drop-shadow-2xl">
            MY <span className="text-emerald-400">GARDENS</span>
          </h1>
          <p className="text-emerald-100/70 text-lg md:text-xl max-w-2xl mx-auto font-medium leading-relaxed">
            Organize and track every plant in your garden. Create gardens, log activities, and examine your plants with AI.
          </p>
        </div>

        {/* If no garden selected, show garden list */}
        {!selectedGardenId && (
          <>
            <div className="flex justify-center mb-10">
              <button
                onClick={() => setShowAddGarden(true)}
                className="px-8 py-4 bg-emerald-500 hover:bg-emerald-400 text-[#064e3b] font-bold rounded-2xl transition-all hover:scale-105 active:scale-95 shadow-[0_0_20px_rgba(16,185,129,0.3)] flex items-center gap-2"
              >
                <Plus className="w-5 h-5" /> Add Garden
              </button>
            </div>

            {gardens.length === 0 ? (
              <div className="text-center py-20 bg-white/[0.03] rounded-[2.5rem] border border-dashed border-emerald-500/20">
                <Sprout className="w-16 h-16 text-emerald-400/30 mx-auto mb-6" />
                <p className="text-emerald-100/40 font-medium text-lg">No gardens yet</p>
                <p className="text-emerald-100/30 text-sm mt-2">Create your first garden to start tracking your plants.</p>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {gardens.map((garden) => {
                  const gardenPlants = getPlantsByGarden(garden.id);
                  return (
                    <motion.div
                      key={garden.id}
                      initial={{ opacity: 0, scale: 0.95 }}
                      animate={{ opacity: 1, scale: 1 }}
                      className="bg-[#064e3b]/80 backdrop-blur-xl border border-emerald-500/20 rounded-[2.5rem] p-8 shadow-2xl hover:border-emerald-500/50 transition-all cursor-pointer group"
                      onClick={() => { setSelectedGardenId(garden.id); setSelectedPlantId(null); setPlants([...getPlantsByGarden(garden.id)]); setActivities([]); }}
                    >
                      <div className="flex justify-between items-start mb-4">
                        <div className="w-12 h-12 rounded-2xl bg-emerald-500/20 text-emerald-400 flex items-center justify-center">
                          <Sprout className="w-6 h-6" />
                        </div>
                        <button
                          onClick={(e) => { e.stopPropagation(); handleDeleteGarden(garden.id); }}
                          className="p-2 rounded-xl hover:bg-rose-500/20 text-rose-400/60 hover:text-rose-400 transition-all"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                      <h3 className="text-xl font-bold text-white mb-2">{garden.name}</h3>
                      <div className="flex flex-wrap gap-2 mb-4">
                        <span className="px-3 py-1 rounded-full bg-emerald-500/10 text-emerald-400 text-xs font-bold uppercase tracking-wider">
                          {garden.type}
                        </span>
                        <span className="px-3 py-1 rounded-full bg-emerald-500/10 text-emerald-300/60 text-xs font-mono">
                          {gardenPlants.length} plant{gardenPlants.length !== 1 ? 's' : ''}
                        </span>
                      </div>
                      {garden.location && (
                        <p className="text-emerald-100/50 text-sm mb-1">📍 {garden.location}</p>
                      )}
                      <div className="flex items-center justify-between mt-4 pt-4 border-t border-white/5">
                        <span className="text-emerald-100/30 text-xs font-mono">
                          Created {new Date(garden.createdAt).toLocaleDateString()}
                        </span>
                        <ChevronRight className="w-5 h-5 text-emerald-400 group-hover:translate-x-1 transition-transform" />
                      </div>
                    </motion.div>
                  );
                })}
              </div>
            )}
          </>
        )}

        {/* Garden detail view */}
        {selectedGardenId && selectedGarden && !selectedPlantId && (
          <>
            <button
              onClick={handleBackToGardens}
              className="flex items-center gap-2 text-emerald-400 hover:text-emerald-300 transition-colors mb-8 font-bold"
            >
              <ChevronLeft className="w-5 h-5" /> Back to Gardens
            </button>

            <div className="bg-[#064e3b]/80 backdrop-blur-xl border border-emerald-500/20 rounded-[2.5rem] p-8 md:p-12 shadow-2xl mb-8">
              <div className="flex justify-between items-start mb-6">
                <div>
                  <h2 className="text-3xl md:text-4xl font-black text-white mb-2">{selectedGarden.name}</h2>
                  <div className="flex flex-wrap gap-2">
                    <span className="px-3 py-1 rounded-full bg-emerald-500/10 text-emerald-400 text-xs font-bold uppercase tracking-wider">
                      {selectedGarden.type}
                    </span>
                    {selectedGarden.location && (
                      <span className="px-3 py-1 rounded-full bg-emerald-500/10 text-emerald-300/60 text-xs font-mono">
                        📍 {selectedGarden.location}
                      </span>
                    )}
                  </div>
                </div>
                <div className="flex gap-2">
                  <button
                    onClick={() => handleDeleteGarden(selectedGarden.id)}
                    className="px-4 py-3 rounded-2xl bg-rose-500/10 hover:bg-rose-500/20 text-rose-400 transition-all flex items-center gap-2"
                    title="Delete Garden"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                  <button
                    onClick={() => setShowAddPlant(true)}
                    className="px-6 py-3 bg-emerald-500 hover:bg-emerald-400 text-[#064e3b] font-bold rounded-2xl transition-all flex items-center gap-2"
                  >
                    <Plus className="w-4 h-4" /> Add Plant
                  </button>
                </div>
              </div>
              {selectedGarden.lighting && (
                <p className="text-emerald-100/50 text-sm mb-2"><Sun className="w-4 h-4 inline mr-1" /> {selectedGarden.lighting}</p>
              )}
              {selectedGarden.notes && (
                <p className="text-emerald-100/60 text-sm">{selectedGarden.notes}</p>
              )}
            </div>

            {plants.length === 0 ? (
              <div className="text-center py-16 bg-white/[0.03] rounded-[2.5rem] border border-dashed border-emerald-500/20">
                <Leaf className="w-16 h-16 text-emerald-400/30 mx-auto mb-6" />
                <p className="text-emerald-100/40 font-medium">No plants yet in this garden</p>
                <button
                  onClick={() => setShowAddPlant(true)}
                  className="mt-4 px-6 py-3 bg-emerald-500 hover:bg-emerald-400 text-[#064e3b] font-bold rounded-2xl transition-all inline-flex items-center gap-2"
                >
                  <Plus className="w-4 h-4" /> Add Your First Plant
                </button>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {plants.map((plant) => {
                  const age = calculateAgeInDays(plant.startDate);
                  const lastActivity = getLastActivityDate(plant.id);
                  const healthColor = plant.healthStatus === 'Healthy' ? 'text-emerald-400' : plant.healthStatus === 'Needs Attention' ? 'text-amber-400' : plant.healthStatus === 'Problem' ? 'text-rose-400' : 'text-emerald-300';
                  const healthBg = plant.healthStatus === 'Healthy' ? 'bg-emerald-500/10' : plant.healthStatus === 'Needs Attention' ? 'bg-amber-500/10' : plant.healthStatus === 'Problem' ? 'bg-rose-500/10' : 'bg-emerald-500/10';

                  return (
                    <motion.div
                      key={plant.id}
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      className="bg-[#064e3b]/80 backdrop-blur-xl border border-emerald-500/20 rounded-[2.5rem] overflow-hidden shadow-2xl hover:border-emerald-500/50 transition-all cursor-pointer group"
                      onClick={() => { setSelectedPlantId(plant.id); setActivities([...getActivitiesByPlant(plant.id)]); }}
                    >
                      {/* Plant image/placeholder */}
                      <div className="h-40 bg-gradient-to-br from-emerald-900/40 to-emerald-800/20 flex items-center justify-center relative overflow-hidden">
                        {plant.imageUrl ? (
                          <img src={`data:image/jpeg;base64,${plant.imageUrl}`} alt={plant.name} className="w-full h-full object-cover" />
                        ) : (
                          <Leaf className="w-16 h-16 text-emerald-400/20" />
                        )}
                        <div className="absolute top-3 right-3">
                          <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider ${healthBg} ${healthColor}`}>
                            {plant.healthStatus}
                          </span>
                        </div>
                      </div>

                      <div className="p-6">
                        <h3 className="text-lg font-bold text-white mb-1 group-hover:text-emerald-400 transition-colors">{plant.name}</h3>
                        <div className="flex flex-wrap gap-1.5 mb-3">
                          <span className="px-2 py-0.5 rounded-full bg-emerald-500/10 text-emerald-400 text-[10px] font-bold uppercase tracking-wider">
                            {plant.stage}
                          </span>
                          <span className="px-2 py-0.5 rounded-full bg-emerald-500/10 text-emerald-300/60 text-[10px] font-mono">
                            {age}d
                          </span>
                        </div>
                        <p className="text-emerald-100/40 text-xs font-mono mb-4">
                          {selectedGarden.name}
                        </p>
                        {lastActivity && (
                          <p className="text-emerald-100/30 text-[10px] font-mono">
                            Last: {new Date(lastActivity).toLocaleDateString()}
                          </p>
                        )}

                        <div className="flex flex-wrap gap-2 mt-4 pt-4 border-t border-white/5">
                          <div className="w-full flex gap-2">
                            <button
                              onClick={(e) => { e.stopPropagation(); setSelectedPlantId(plant.id); setActivities([...getActivitiesByPlant(plant.id)]); }}
                              className="flex-1 py-2 bg-emerald-500/10 hover:bg-emerald-500/20 text-emerald-400 text-xs font-bold rounded-xl transition-all flex items-center justify-center gap-1"
                            >
                              <Eye className="w-3 h-3" /> View Details
                            </button>
                            <button
                              onClick={(e) => { e.stopPropagation(); setSelectedPlantId(plant.id); setActivities([...getActivitiesByPlant(plant.id)]); setShowExamination(true); setExaminationConcern(''); setExaminationImage(null); setExaminationUseLatestPhoto(true); setExaminationResult(null); setShowExaminationResult(false); }}
                              className="flex-1 py-2 bg-emerald-500/10 hover:bg-emerald-500/20 text-emerald-400 text-xs font-bold rounded-xl transition-all flex items-center justify-center gap-1"
                            >
                              <Search className="w-3 h-3" /> Examine
                            </button>
                          </div>
                        </div>
                      </div>
                    </motion.div>
                  );
                })}
              </div>
            )}
          </>
        )}

        {/* Plant Detail View */}
        {selectedPlantId && selectedPlant && (
          <>
            <button
              onClick={() => { setSelectedPlantId(null); setActivities([]); }}
              className="flex items-center gap-2 text-emerald-400 hover:text-emerald-300 transition-colors mb-8 font-bold"
            >
              <ChevronLeft className="w-5 h-5" /> Back to {selectedGarden?.name || 'Garden'}
            </button>

            <div className="bg-[#064e3b]/80 backdrop-blur-xl border border-emerald-500/20 rounded-[2.5rem] p-8 md:p-12 shadow-2xl">
              {/* Plant header */}
              <div className="flex flex-col md:flex-row gap-8 mb-10">
                <div className="w-full md:w-64 h-64 rounded-[2rem] bg-gradient-to-br from-emerald-900/40 to-emerald-800/20 flex items-center justify-center overflow-hidden shrink-0">
                  {selectedPlant.imageUrl ? (
                    <img src={`data:image/jpeg;base64,${selectedPlant.imageUrl}`} alt={selectedPlant.name} className="w-full h-full object-cover" />
                  ) : (
                    <Leaf className="w-24 h-24 text-emerald-400/20" />
                  )}
                </div>
                <div className="flex-1">
                  <div className="flex justify-between items-start mb-2">
                    <h2 className="text-3xl md:text-4xl font-black text-white">{selectedPlant.name}</h2>
                    <div className="flex gap-2">
                      <button
                        onClick={() => { setShowExamination(true); setExaminationConcern(''); setExaminationImage(null); setExaminationUseLatestPhoto(true); setExaminationResult(null); setShowExaminationResult(false); }}
                        className="px-4 py-2 bg-emerald-500/10 hover:bg-emerald-500/20 text-emerald-400 text-sm font-bold rounded-xl transition-all flex items-center gap-1"
                      >
                        <Search className="w-4 h-4" /> Examine My Plant
                      </button>
                      <button
                        onClick={() => handleDeletePlant(selectedPlant.id)}
                        className="p-2 rounded-xl hover:bg-rose-500/20 text-rose-400/60 hover:text-rose-400 transition-all"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                  <p className="text-emerald-100/60 text-sm mb-4">{selectedGarden?.name} • {calculateAgeInDays(selectedPlant.startDate)} days old</p>
                  
                  <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                    <DetailBadge label="Stage" value={selectedPlant.stage} />
                    <DetailBadge label="Strain" value={selectedPlant.strainOrType || '—'} />
                    <DetailBadge label="Source" value={selectedPlant.source} />
                    <DetailBadge label="Medium" value={selectedPlant.medium || '—'} />
                    <DetailBadge label="Pot Size" value={selectedPlant.potSize || '—'} />
                    <DetailBadge label="Light" value={selectedPlant.lightSchedule || '—'} />
                    <DetailBadge label="pH" value={selectedPlant.currentPH || '—'} />
                    <DetailBadge label="PPM" value={selectedPlant.currentPPM || '—'} />
                    <DetailBadge label="Height" value={selectedPlant.height || '—'} />
                    <DetailBadge label="Health" value={selectedPlant.healthStatus} status />
                    <DetailBadge label="Started" value={new Date(selectedPlant.startDate).toLocaleDateString()} />
                  </div>
                  
                  {selectedPlant.notes && (
                    <div className="mt-4 p-4 bg-white/[0.03] rounded-2xl border border-emerald-500/10">
                      <p className="text-emerald-100/60 text-sm">{selectedPlant.notes}</p>
                    </div>
                  )}
                </div>
              </div>

              {/* Activity Timeline */}
              <div className="border-t border-white/5 pt-8">
                <div className="flex justify-between items-center mb-6">
                  <h3 className="text-xl font-bold text-white flex items-center gap-2">
                    <Activity className="w-5 h-5 text-emerald-400" /> Activity Log
                  </h3>
                  <button
                    onClick={() => setShowAddActivity(true)}
                    className="px-4 py-2 bg-emerald-500/10 hover:bg-emerald-500/20 text-emerald-400 text-sm font-bold rounded-xl transition-all flex items-center gap-1"
                  >
                    <Plus className="w-4 h-4" /> Add Activity
                  </button>
                </div>

                {activities.length === 0 ? (
                  <p className="text-emerald-100/30 text-center py-8">No activity logged yet. Start tracking your plant care!</p>
                ) : (
                  <div className="space-y-3 max-h-[500px] overflow-y-auto">
                    {activities.map((activity) => (
                      <div key={activity.id} className="p-4 bg-white/[0.03] border border-emerald-500/10 rounded-2xl">
                        <div className="flex justify-between items-start mb-2">
                          <div className="flex items-center gap-2">
                            <span className="px-2 py-0.5 rounded-full bg-emerald-500/10 text-emerald-400 text-[10px] font-bold uppercase tracking-wider">
                              {activity.type}
                            </span>
                            <span className="text-emerald-100/30 text-[10px] font-mono">
                              {new Date(activity.date).toLocaleString()}
                            </span>
                          </div>
                          {activity.aiExaminationResult && (
                            <span className={`text-[10px] font-bold ${activity.aiExaminationResult.overallStatus === 'Unable to examine' ? 'text-rose-400' : 'text-emerald-400'}`}>
                              AI Examined
                            </span>
                          )}
                        </div>
                        {activity.notes && <p className="text-emerald-100/60 text-sm mb-1">{activity.notes}</p>}
                        <div className="flex flex-wrap gap-3 text-[10px] font-mono text-emerald-100/30">
                          {activity.ph && <span>pH: {activity.ph}</span>}
                          {activity.ppm && <span>PPM: {activity.ppm}</span>}
                          {activity.amount && <span>Amount: {activity.amount}</span>}
                        </div>
                        {activity.imageUrl && (
                          <div className="mt-2 w-16 h-16 rounded-xl overflow-hidden bg-white/5">
                            <img src={`data:image/jpeg;base64,${activity.imageUrl}`} alt="Activity" className="w-full h-full object-cover" />
                          </div>
                        )}
                        {activity.aiExaminationResult && (
                          <div className="mt-2 p-3 bg-emerald-500/5 rounded-xl border border-emerald-500/10">
                            <p className="text-emerald-400 text-xs font-bold mb-1">AI Examination Result</p>
                            <p className="text-emerald-100/60 text-xs">{activity.aiExaminationResult.plantSummary}</p>
                            <div className="flex gap-2 mt-1 text-[10px] text-emerald-100/40">
                              <span>Status: {activity.aiExaminationResult.overallStatus}</span>
                              <span>Confidence: {activity.aiExaminationResult.confidenceLevel}</span>
                            </div>
                            {activity.aiExaminationResult.whatLooksGood.length > 0 && (
                              <div className="mt-1">
                                <span className="text-emerald-400 text-[10px] font-bold">✓ </span>
                                <span className="text-emerald-100/60 text-[10px]">{activity.aiExaminationResult.whatLooksGood.slice(0, 2).join(', ')}</span>
                              </div>
                            )}
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* Plant Reports */}
              <div className="border-t border-white/5 pt-8 mt-8">
                <div className="flex justify-between items-center mb-4">
                  <h3 className="text-xl font-bold text-white flex items-center gap-2">
                    <FileText className="w-5 h-5 text-emerald-400" /> Plant Reports
                  </h3>
                </div>
                
                <div className="flex flex-wrap gap-2 mb-4">
                  <button
                    onClick={() => handleGenerateReport('last_exam')}
                    disabled={reportLoading}
                    className={`px-4 py-2 rounded-xl text-sm font-bold transition-all ${reportType === 'last_exam' && reportHtml ? 'bg-emerald-500 text-[#064e3b]' : 'bg-white/5 text-emerald-400 hover:bg-white/10'}`}
                  >
                    Compare Last Exams
                  </button>
                  <button
                    onClick={() => handleGenerateReport('weekly')}
                    disabled={reportLoading}
                    className={`px-4 py-2 rounded-xl text-sm font-bold transition-all ${reportType === 'weekly' && reportHtml ? 'bg-emerald-500 text-[#064e3b]' : 'bg-white/5 text-emerald-400 hover:bg-white/10'}`}
                  >
                    Weekly Report
                  </button>
                  <button
                    onClick={() => handleGenerateReport('monthly')}
                    disabled={reportLoading}
                    className={`px-4 py-2 rounded-xl text-sm font-bold transition-all ${reportType === 'monthly' && reportHtml ? 'bg-emerald-500 text-[#064e3b]' : 'bg-white/5 text-emerald-400 hover:bg-white/10'}`}
                  >
                    Monthly Report
                  </button>
                </div>
                
                {reportLoading && (
                  <div className="flex items-center gap-3 p-4 bg-emerald-500/5 rounded-2xl border border-emerald-500/10">
                    <div className="animate-spin w-4 h-4 border-2 border-emerald-400 border-t-transparent rounded-full" />
                    <p className="text-emerald-100/60 text-sm">Analyzing data and generating report...</p>
                  </div>
                )}
                
                {!reportLoading && reportHtml && (
                  <div className="p-5 bg-white/[0.02] rounded-2xl border border-emerald-500/20 text-emerald-100/80 text-sm">
                    <div dangerouslySetInnerHTML={{ __html: reportHtml }} />
                  </div>
                )}
              </div>

              {/* Ask Grow Assistant */}
              <div className="border-t border-white/5 pt-8 mt-8">
                <div className="flex justify-between items-center mb-4">
                  <h3 className="text-xl font-bold text-white flex items-center gap-2">
                    <HelpCircle className="w-5 h-5 text-emerald-400" /> Ask Grow Assistant
                  </h3>
                  <button
                    onClick={() => {
                      const newMuteState = !muteAssistant;
                      setMuteAssistant(newMuteState);
                      if (newMuteState && 'speechSynthesis' in window) {
                        window.speechSynthesis.cancel();
                      }
                    }}
                    className="p-2 rounded-xl bg-white/5 hover:bg-white/10 text-emerald-400 transition-all"
                    title={muteAssistant ? "Unmute Assistant" : "Mute Assistant"}
                  >
                    {muteAssistant ? <VolumeX className="w-4 h-4" /> : <Volume2 className="w-4 h-4" />}
                  </button>
                </div>
                <div className="flex gap-2 mb-4">
                  <input
                    type="text"
                    value={growQuestion}
                    onChange={(e) => setGrowQuestion(e.target.value)}
                    placeholder="Ask a question about your plant..."
                    className="flex-1 bg-white/5 border border-emerald-500/20 rounded-xl px-4 py-3 text-white text-sm placeholder:text-emerald-100/30 focus:outline-none focus:border-emerald-500/50 transition-all"
                    onKeyDown={(e) => e.key === 'Enter' && handleGrowQuestion()}
                  />
                  <button
                    onClick={handleGrowQuestion}
                    disabled={growQuestionLoading}
                    className="px-6 py-3 bg-emerald-500/10 hover:bg-emerald-500/20 text-emerald-400 font-bold rounded-xl transition-all text-sm disabled:opacity-50"
                  >
                    {growQuestionLoading ? '...' : 'Ask'}
                  </button>
                </div>
                <div className="flex flex-wrap gap-2 mb-4">
                  {['Why are my leaves yellowing?', 'When should I water again?', 'What stage is this plant in?', 'What should my pH and PPM be?', 'Is this plant ready for harvest?'].map((q, i) => (
                    <button
                      key={i}
                      onClick={() => setGrowQuestion(q)}
                      className="px-3 py-1.5 rounded-full bg-white/[0.03] border border-emerald-500/10 text-emerald-100/50 text-xs hover:bg-emerald-500/10 hover:border-emerald-500/30 transition-all"
                    >
                      {q}
                    </button>
                  ))}
                </div>
                {growAnswer && (
                  <div className="p-4 bg-emerald-500/5 rounded-2xl border border-emerald-500/10">
                    <p className="text-emerald-100/70 text-sm">{growAnswer}</p>
                  </div>
                )}
              </div>
            </div>
          </>
        )}
      </motion.div>

      {/* Add Garden Modal */}
      {showAddGarden && (
        <Modal onClose={() => setShowAddGarden(false)} title="Add Garden">
          <FormField label="Garden Name" value={gardenForm.name} onChange={(v) => setGardenForm({ ...gardenForm, name: v })} placeholder="e.g., Veg Tent" />
          <SelectField label="Type" value={gardenForm.type} options={GARDEN_TYPE_OPTIONS} onChange={(v) => setGardenForm({ ...gardenForm, type: v })} />
          <FormField label="Location" value={gardenForm.location} onChange={(v) => setGardenForm({ ...gardenForm, location: v })} placeholder="e.g., Basement, Backyard" />
          <FormField label="Lighting" value={gardenForm.lighting} onChange={(v) => setGardenForm({ ...gardenForm, lighting: v })} placeholder="e.g., 600W LED" />
          <FormField label="Notes" value={gardenForm.notes} onChange={(v) => setGardenForm({ ...gardenForm, notes: v })} placeholder="Any notes about this garden" textarea />
          <button onClick={handleAddGarden} className="w-full py-4 bg-emerald-500 hover:bg-emerald-400 text-[#064e3b] font-bold rounded-2xl transition-all mt-4">
            Create Garden
          </button>
        </Modal>
      )}

      {/* Add Plant Modal */}
      {showAddPlant && (
        <Modal onClose={() => setShowAddPlant(false)} title="Add Plant to Garden">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            <FormField label="Plant Name" value={plantForm.name} onChange={(v) => setPlantForm({ ...plantForm, name: v })} placeholder="e.g., Blue Dream #1" />
            <FormField label="Strain/Type" value={plantForm.strainOrType} onChange={(v) => setPlantForm({ ...plantForm, strainOrType: v })} placeholder="e.g., Blue Dream" />
            <FormField label="Start Date" value={plantForm.startDate} onChange={(v) => setPlantForm({ ...plantForm, startDate: v })} type="date" />
            <SelectField label="Source" value={plantForm.source} options={SOURCE_OPTIONS} onChange={(v) => setPlantForm({ ...plantForm, source: v as any })} />
            <SelectField label="Stage" value={plantForm.stage} options={PLANT_STAGE_OPTIONS} onChange={(v) => setPlantForm({ ...plantForm, stage: v })} />
            <FormField label="Medium" value={plantForm.medium} onChange={(v) => setPlantForm({ ...plantForm, medium: v })} placeholder="e.g., Soil, Coco" />
            <FormField label="Pot Size" value={plantForm.potSize} onChange={(v) => setPlantForm({ ...plantForm, potSize: v })} placeholder="e.g., 5 gal" />
            <FormField label="Light Schedule" value={plantForm.lightSchedule} onChange={(v) => setPlantForm({ ...plantForm, lightSchedule: v })} placeholder="e.g., 18/6" />
            <FormField label="Current pH" value={plantForm.currentPH} onChange={(v) => setPlantForm({ ...plantForm, currentPH: v })} placeholder="e.g., 6.2" />
            <FormField label="Current PPM" value={plantForm.currentPPM} onChange={(v) => setPlantForm({ ...plantForm, currentPPM: v })} placeholder="e.g., 800" />
            <FormField label="Height" value={plantForm.height} onChange={(v) => setPlantForm({ ...plantForm, height: v })} placeholder="e.g., 12 in" />
            <SelectField label="Health Status" value={plantForm.healthStatus} options={HEALTH_STATUS_OPTIONS} onChange={(v) => setPlantForm({ ...plantForm, healthStatus: v })} />
          </div>
          <FormField label="Notes" value={plantForm.notes} onChange={(v) => setPlantForm({ ...plantForm, notes: v })} placeholder="Any notes about this plant" textarea />
          <div className="mt-3">
            <label className="block text-emerald-100/60 text-xs font-bold uppercase tracking-wider mb-2">Plant Photo</label>
            <input
              type="file"
              accept="image/*"
              onChange={(e) => handleImageUpload(e, (val) => setPlantForm({ ...plantForm, imageUrl: val }))}
              className="w-full text-emerald-100/40 text-sm file:mr-4 file:py-2 file:px-4 file:rounded-xl file:border-0 file:text-xs file:font-bold file:bg-emerald-500/10 file:text-emerald-400 hover:file:bg-emerald-500/20"
            />
            {plantForm.imageUrl && (
              <div className="mt-2 w-20 h-20 rounded-xl overflow-hidden bg-white/5">
                <img src={`data:image/jpeg;base64,${plantForm.imageUrl}`} alt="Preview" className="w-full h-full object-cover" />
              </div>
            )}
          </div>
          <button onClick={handleAddPlant} className="w-full py-4 bg-emerald-500 hover:bg-emerald-400 text-[#064e3b] font-bold rounded-2xl transition-all mt-4">
            Add Plant
          </button>
        </Modal>
      )}

      {/* Add Activity Modal */}
      {showAddActivity && (
        <Modal onClose={() => setShowAddActivity(false)} title="Add Activity">
          <SelectField label="Activity Type" value={activityForm.type} options={ACTIVITY_TYPE_OPTIONS} onChange={(v) => setActivityForm({ ...activityForm, type: v })} />
          <FormField label="Date" value={activityForm.date} onChange={(v) => setActivityForm({ ...activityForm, date: v })} type="date" />
          <FormField label="Notes" value={activityForm.notes} onChange={(v) => setActivityForm({ ...activityForm, notes: v })} placeholder="Details about this activity" textarea />
          <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
            <FormField label="pH" value={activityForm.ph} onChange={(v) => setActivityForm({ ...activityForm, ph: v })} placeholder="e.g., 6.2" />
            <FormField label="PPM" value={activityForm.ppm} onChange={(v) => setActivityForm({ ...activityForm, ppm: v })} placeholder="e.g., 800" />
            <FormField label="Amount" value={activityForm.amount} onChange={(v) => setActivityForm({ ...activityForm, amount: v })} placeholder="e.g., 1L" />
          </div>
          <div className="mt-3">
            <label className="block text-emerald-100/60 text-xs font-bold uppercase tracking-wider mb-2">Photo</label>
            <input
              type="file"
              accept="image/*"
              onChange={(e) => handleImageUpload(e, (val) => setActivityForm({ ...activityForm, imageUrl: val }))}
              className="w-full text-emerald-100/40 text-sm file:mr-4 file:py-2 file:px-4 file:rounded-xl file:border-0 file:text-xs file:font-bold file:bg-emerald-500/10 file:text-emerald-400 hover:file:bg-emerald-500/20"
            />
          </div>
          <button onClick={handleAddActivity} className="w-full py-4 bg-emerald-500 hover:bg-emerald-400 text-[#064e3b] font-bold rounded-2xl transition-all mt-4">
            Add Activity
          </button>
        </Modal>
      )}

      {/* Examination Modal */}
      {showExamination && selectedPlant && (
        <Modal onClose={() => { setShowExamination(false); setShowExaminationResult(false); }} title="Examine My Plant" wide>
          <div className="mb-6">
            <div className="flex items-center gap-3 mb-4">
              <div className="w-16 h-16 rounded-2xl bg-emerald-500/10 flex items-center justify-center overflow-hidden">
                {selectedPlant.imageUrl ? (
                  <img src={`data:image/jpeg;base64,${selectedPlant.imageUrl}`} alt={selectedPlant.name} className="w-full h-full object-cover" />
                ) : (
                  <Leaf className="w-8 h-8 text-emerald-400" />
                )}
              </div>
              <div>
                <h3 className="text-lg font-bold text-white">{selectedPlant.name}</h3>
                <p className="text-emerald-100/50 text-sm">{selectedPlant.stage} • {selectedPlant.healthStatus}</p>
              </div>
            </div>

            <div className="mb-4">
              <label className="block text-emerald-100/60 text-xs font-bold uppercase tracking-wider mb-2">What are you worried about?</label>
              <textarea
                value={examinationConcern}
                onChange={(e) => setExaminationConcern(e.target.value)}
                placeholder="Example: yellow leaves, curling, spots, slow growth, pests, watering, feeding, pH, PPM"
                className="w-full bg-white/5 border border-emerald-500/20 rounded-xl px-4 py-3 text-white text-sm placeholder:text-emerald-100/20 focus:outline-none focus:border-emerald-500/50 transition-all min-h-[80px]"
              />
            </div>

            <div className="mb-4 grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <label className="block text-emerald-100/60 text-xs font-bold uppercase tracking-wider mb-2">Current pH</label>
                <div className="flex gap-2">
                  <input
                    type="text"
                    value={examinationPH}
                    onChange={(e) => setExaminationPH(e.target.value)}
                    placeholder="e.g. 6.2"
                    className="flex-1 w-full bg-white/5 border border-emerald-500/20 rounded-xl px-4 py-2 text-white text-sm focus:outline-none focus:border-emerald-500/50 transition-all"
                  />
                  <label className="flex items-center justify-center px-3 bg-emerald-500/10 border border-emerald-500/30 rounded-xl text-emerald-400 cursor-pointer hover:bg-emerald-500/20 transition-all shrink-0" title="Scan pH Meter">
                    <Camera className="w-4 h-4" />
                    <input type="file" accept="image/*" onChange={(e) => handleMeterImageUpload(e, 'ph')} disabled={meterAnalyzing !== false} className="hidden" />
                  </label>
                </div>
                {meterAnalyzing === 'ph' && <p className="text-emerald-400 text-[10px] mt-1 animate-pulse">Scanning pH...</p>}
              </div>
              <div>
                <label className="block text-emerald-100/60 text-xs font-bold uppercase tracking-wider mb-2">Current PPM/EC</label>
                <div className="flex gap-2">
                  <input
                    type="text"
                    value={examinationPPM}
                    onChange={(e) => setExaminationPPM(e.target.value)}
                    placeholder="e.g. 800"
                    className="flex-1 w-full bg-white/5 border border-emerald-500/20 rounded-xl px-4 py-2 text-white text-sm focus:outline-none focus:border-emerald-500/50 transition-all"
                  />
                  <label className="flex items-center justify-center px-3 bg-emerald-500/10 border border-emerald-500/30 rounded-xl text-emerald-400 cursor-pointer hover:bg-emerald-500/20 transition-all shrink-0" title="Scan PPM Meter">
                    <Camera className="w-4 h-4" />
                    <input type="file" accept="image/*" onChange={(e) => handleMeterImageUpload(e, 'ppm')} disabled={meterAnalyzing !== false} className="hidden" />
                  </label>
                </div>
                {meterAnalyzing === 'ppm' && <p className="text-emerald-400 text-[10px] mt-1 animate-pulse">Scanning PPM...</p>}
              </div>
              <div>
                <label className="block text-emerald-100/60 text-xs font-bold uppercase tracking-wider mb-2">Water Temp</label>
                <div className="flex gap-2">
                  <input
                    type="text"
                    value={examinationWaterTemp}
                    onChange={(e) => setExaminationWaterTemp(e.target.value)}
                    placeholder="e.g. 72°F"
                    className="flex-1 w-full bg-white/5 border border-emerald-500/20 rounded-xl px-4 py-2 text-white text-sm focus:outline-none focus:border-emerald-500/50 transition-all"
                  />
                  <label className="flex items-center justify-center px-3 bg-emerald-500/10 border border-emerald-500/30 rounded-xl text-emerald-400 cursor-pointer hover:bg-emerald-500/20 transition-all shrink-0" title="Scan Water Temp">
                    <Camera className="w-4 h-4" />
                    <input type="file" accept="image/*" onChange={(e) => handleMeterImageUpload(e, 'temp')} disabled={meterAnalyzing !== false} className="hidden" />
                  </label>
                </div>
                {meterAnalyzing === 'temp' && <p className="text-emerald-400 text-[10px] mt-1 animate-pulse">Scanning Temp...</p>}
              </div>
            </div>

            <div className="mb-6 flex flex-col gap-2">
              <label className="flex items-center justify-center gap-2 px-4 py-2 bg-emerald-500/10 border border-emerald-500/30 rounded-xl text-emerald-400 text-sm font-bold cursor-pointer hover:bg-emerald-500/20 transition-all w-full">
                <Camera className="w-4 h-4" />
                {meterAnalyzing === 'combo' ? "Scanning Combo Meter..." : "Scan Combo Meter (Auto-fill All)"}
                <input
                  type="file"
                  accept="image/*"
                  onChange={(e) => handleMeterImageUpload(e, 'combo')}
                  disabled={meterAnalyzing !== false}
                  className="hidden"
                />
              </label>
            </div>

            <div className="flex gap-3 mb-4">
              {selectedPlant.imageUrl && (
                <label className="flex items-center gap-2 px-4 py-2 bg-white/5 border border-emerald-500/20 rounded-xl text-emerald-100/60 text-xs cursor-pointer hover:bg-white/10 transition-all">
                  <input
                    type="checkbox"
                    checked={examinationUseLatestPhoto}
                    onChange={() => setExaminationUseLatestPhoto(!examinationUseLatestPhoto)}
                    className="accent-emerald-500"
                  />
                  Use latest plant photo
                </label>
              )}
              <label className="flex items-center gap-2 px-4 py-2 bg-white/5 border border-emerald-500/20 rounded-xl text-emerald-100/60 text-xs cursor-pointer hover:bg-white/10 transition-all">
                <Camera className="w-3 h-3" />
                Upload New Photo
                <input
                  type="file"
                  accept="image/*"
                  onChange={(e) => handleImageUpload(e, (val) => { setExaminationImage(val); setExaminationUseLatestPhoto(false); })}
                  className="hidden"
                />
              </label>
            </div>
          </div>

          {examinationLoading && (
            <div className="text-center py-8">
              <div className="animate-spin w-8 h-8 border-2 border-emerald-400 border-t-transparent rounded-full mx-auto mb-4" />
              <p className="text-emerald-100/60 text-sm">Analyzing your plant data...</p>
            </div>
          )}

          {showExaminationResult && examinationResult && (
            <div className="space-y-4 mb-6">
              <div className={`p-4 rounded-2xl border ${examinationResult.overallStatus === 'Doing Well' || examinationResult.overallStatus === 'Healthy' ? 'bg-emerald-500/10 border-emerald-500/20' : examinationResult.overallStatus === 'Unable to examine' ? 'bg-rose-500/10 border-rose-500/20' : 'bg-amber-500/10 border-amber-500/20'}`}>
                <div className="flex justify-between items-center mb-2">
                  <span className="text-emerald-100/50 text-xs font-bold uppercase tracking-wider">Overall Status</span>
                  <span className={`text-sm font-bold ${examinationResult.overallStatus === 'Doing Well' || examinationResult.overallStatus === 'Healthy' ? 'text-emerald-400' : examinationResult.overallStatus === 'Unable to examine' ? 'text-rose-400' : 'text-amber-400'}`}>
                    {examinationResult.overallStatus}
                  </span>
                </div>
                <p className="text-emerald-100/70 text-sm">{examinationResult.plantSummary}</p>
                <div className="mt-2 text-[10px] font-mono text-emerald-100/30">
                  Confidence: {examinationResult.confidenceLevel}
                </div>
              </div>

              {examinationResult.whatLooksGood.length > 0 && (
                <Section title="What Looks Good" color="text-emerald-400">
                  {examinationResult.whatLooksGood.map((item, i) => (
                    <li key={i} className="text-emerald-100/70 text-sm flex items-start gap-2">
                      <span className="text-emerald-400 mt-0.5">✓</span> {item}
                    </li>
                  ))}
                </Section>
              )}

              {examinationResult.possibleIssues.length > 0 && (
                <Section title="Possible Issues" color="text-rose-400">
                  {examinationResult.possibleIssues.map((item, i) => (
                    <li key={i} className="text-emerald-100/70 text-sm flex items-start gap-2">
                      <span className="text-rose-400 mt-0.5">!</span> {item}
                    </li>
                  ))}
                </Section>
              )}

              {examinationResult.likelyCauses.length > 0 && (
                <Section title="Likely Causes" color="text-amber-400">
                  {examinationResult.likelyCauses.map((item, i) => (
                    <li key={i} className="text-emerald-100/70 text-sm flex items-start gap-2">
                      <span className="text-amber-400 mt-0.5">→</span> {item}
                    </li>
                  ))}
                </Section>
              )}

              {examinationResult.recommendedNextSteps.length > 0 && (
                <Section title="Recommended Next Steps" color="text-emerald-400">
                  {examinationResult.recommendedNextSteps.map((item, i) => (
                    <li key={i} className="text-emerald-100/70 text-sm flex items-start gap-2">
                      <span className="text-emerald-400 mt-0.5 font-bold">{i + 1}.</span> {item}
                    </li>
                  ))}
                </Section>
              )}

              {examinationResult.whatToMonitor.length > 0 && (
                <Section title="What to Monitor" color="text-emerald-400">
                  {examinationResult.whatToMonitor.map((item, i) => (
                    <li key={i} className="text-emerald-100/70 text-sm flex items-start gap-2">
                      <span className="text-emerald-400 mt-0.5">◉</span> {item}
                    </li>
                  ))}
                </Section>
              )}

              {examinationResult.suggestedReminder && (
                <div className="p-3 bg-emerald-500/5 rounded-xl border border-emerald-500/10">
                  <p className="text-emerald-100/50 text-[10px] font-bold uppercase tracking-wider mb-1">Suggested Reminder</p>
                  <p className="text-emerald-100/70 text-sm">{examinationResult.suggestedReminder}</p>
                </div>
              )}
            </div>
          )}

          <button
            onClick={handleRunExamination}
            disabled={examinationLoading}
            className="w-full py-4 bg-emerald-500 hover:bg-emerald-400 text-[#064e3b] font-bold rounded-2xl transition-all disabled:opacity-50 flex items-center justify-center gap-2"
          >
            <Search className="w-5 h-5" /> {examinationLoading ? 'Analyzing...' : showExaminationResult ? 'Re-run AI Examination' : 'Run AI Examination'}
          </button>
        </Modal>
      )}
    </div>
  );
};

// Sub-components

const Modal: React.FC<{ children: React.ReactNode; onClose: () => void; title: string; wide?: boolean }> = ({ children, onClose, title, wide }) => (
  <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm" onClick={onClose}>
    <motion.div
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      className={`bg-[#064e3b] border border-emerald-500/20 rounded-[2.5rem] p-6 md:p-8 shadow-2xl max-h-[90vh] overflow-y-auto ${wide ? 'w-full max-w-2xl' : 'w-full max-w-lg'}`}
      onClick={(e) => e.stopPropagation()}
    >
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-xl font-black text-white">{title}</h2>
        <button onClick={onClose} className="p-2 rounded-xl hover:bg-white/5 text-emerald-100/40 hover:text-emerald-100 transition-all">
          <X className="w-5 h-5" />
        </button>
      </div>
      {children}
    </motion.div>
  </div>
);

const FormField: React.FC<{
  label: string; value: string; onChange: (v: string) => void;
  placeholder?: string; type?: string; textarea?: boolean;
}> = ({ label, value, onChange, placeholder, type, textarea }) => (
  <div className="mb-3">
    <label className="block text-emerald-100/60 text-xs font-bold uppercase tracking-wider mb-1.5">{label}</label>
    {textarea ? (
      <textarea
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        className="w-full bg-white/5 border border-emerald-500/20 rounded-xl px-4 py-3 text-white text-sm placeholder:text-emerald-100/20 focus:outline-none focus:border-emerald-500/50 transition-all min-h-[80px]"
      />
    ) : (
      <input
        type={type || 'text'}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        className="w-full bg-white/5 border border-emerald-500/20 rounded-xl px-4 py-3 text-white text-sm placeholder:text-emerald-100/20 focus:outline-none focus:border-emerald-500/50 transition-all"
      />
    )}
  </div>
);

const SelectField: React.FC<{
  label: string; value: string; options: string[]; onChange: (v: string) => void;
}> = ({ label, value, options, onChange }) => (
  <div className="mb-3">
    <label className="block text-emerald-100/60 text-xs font-bold uppercase tracking-wider mb-1.5">{label}</label>
    <select
      value={value}
      onChange={(e) => onChange(e.target.value)}
      className="w-full bg-white/5 border border-emerald-500/20 rounded-xl px-4 py-3 text-white text-sm focus:outline-none focus:border-emerald-500/50 transition-all appearance-none cursor-pointer"
    >
      {options.map((opt) => (
        <option key={opt} value={opt} className="bg-[#064e3b]">{opt}</option>
      ))}
    </select>
  </div>
);

const DetailBadge: React.FC<{ label: string; value: string; status?: boolean }> = ({ label, value, status }) => {
  const healthColors: Record<string, string> = {
    'Healthy': 'text-emerald-400',
    'Needs Attention': 'text-amber-400',
    'Problem': 'text-rose-400',
    'Harvested': 'text-emerald-300',
  };
  return (
    <div className="p-3 bg-white/[0.03] rounded-xl border border-emerald-500/10">
      <p className="text-emerald-100/30 text-[10px] font-bold uppercase tracking-wider mb-1">{label}</p>
      <p className={`text-sm font-bold ${status ? (healthColors[value] || 'text-white') : 'text-white'}`}>{value}</p>
    </div>
  );
};

const Section: React.FC<{ title: string; color: string; children: React.ReactNode }> = ({ title, color, children }) => (
  <div className="p-4 bg-white/[0.02] rounded-2xl border border-white/5">
    <h4 className={`${color} text-xs font-bold uppercase tracking-wider mb-3`}>{title}</h4>
    <ul className="space-y-1.5">{children}</ul>
  </div>
);

export default MyGardens;