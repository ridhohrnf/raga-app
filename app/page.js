'use client';

import { useState, useEffect, useRef } from 'react';
import { 
  Dumbbell, 
  TrendingUp, 
  Camera, 
  User, 
  Plus, 
  Trash2, 
  Check, 
  LogOut, 
  PlusCircle, 
  Calendar, 
  ChevronRight, 
  Search, 
  Sparkles, 
  Clock, 
  ArrowLeft, 
  Edit3, 
  Save,
  Info,
  Utensils,
  Apple,
  Minus
} from 'lucide-react';
import { 
  ResponsiveContainer, 
  LineChart, 
  Line, 
  BarChart, 
  Bar, 
  XAxis, 
  YAxis, 
  Tooltip, 
  CartesianGrid,
  Radar,
  RadarChart,
  PolarGrid,
  PolarAngleAxis,
  PolarRadiusAxis,
  Legend,
  ReferenceLine
} from 'recharts';
import confetti from 'canvas-confetti';
import { ConfigProvider, theme, DatePicker, Select, Button, Input, InputNumber, Upload, Modal, message } from 'antd';
import dayjs from 'dayjs';
import 'dayjs/locale/id'; // Indonesian locale for Day.js

dayjs.locale('id');

const EXERCISE_ANATOMY = {
  'Bench Press': {
    target: 'Dada Tengah & Bawah',
    detail: 'Pectoralis Major (Sternocostal & Abdominal Head)',
    modulInfo: 'MODUL 1 Hal. 11 - Menargetkan serat horisontal dada untuk membangun ketebalan dada.'
  },
  'Incline Dumbbell Press': {
    target: 'Dada Atas',
    detail: 'Pectoralis Major (Clavicular Head)',
    modulInfo: 'MODUL 1 Hal. 15 - Fokus pada serat dada atas untuk menyeimbangkan visual dada.'
  },
  'Squat': {
    target: 'Paha Depan & Bokong',
    detail: 'Quadriceps Femoris, Gluteus Maximus',
    modulInfo: 'MODUL 1 Hal. 40 - Gerakan komposit utama untuk kekuatan dan ukuran otot paha & bokong.'
  },
  'Leg Press': {
    target: 'Paha Depan',
    detail: 'Quadriceps Femoris',
    modulInfo: 'MODUL 1 Hal. 44 - Isolasi paha depan dengan beban berat secara stabil tanpa membebani tulang belakang.'
  },
  'Deadlift': {
    target: 'Punggung Bawah & Paha Belakang',
    detail: 'Erector Spinae, Hamstrings, Gluteus',
    modulInfo: 'MODUL 1 Hal. 36 - Melatih seluruh rantai posterior tubuh dari kaki hingga punggung atas.'
  },
  'Pull Up': {
    target: 'Lebar Punggung',
    detail: 'Latissimus Dorsi, Teres Major',
    modulInfo: 'MODUL 1 Hal. 19 - Gerakan tarikan vertikal terbaik untuk melebarkan punggung (V-Taper).'
  },
  'Barbell Row': {
    target: 'Ketebalan Punggung',
    detail: 'Trapezius, Rhomboids, Latissimus Dorsi',
    modulInfo: 'MODUL 1 Hal. 23 - Tarikan horisontal untuk menambah ketebalan punggung tengah & atas.'
  },
  'Overhead Press': {
    target: 'Bahu Depan',
    detail: 'Anterior Deltoid',
    modulInfo: 'MODUL 1 Hal. 55 - Gerakan menekan vertikal untuk kekuatan bahu depan dan stabilitas overhead.'
  },
  'Lateral Raise': {
    target: 'Bahu Samping',
    detail: 'Medial Deltoid',
    modulInfo: 'MODUL 1 Hal. 59 - Mengisolasi serat bahu samping untuk menciptakan ilusi bahu lebar bulat (3D).'
  },
  'Bicep Curl': {
    target: 'Lengan Depan',
    detail: 'Biceps Brachii',
    modulInfo: 'MODUL 1 Hal. 27 - Fokus pada kontraksi bicep (long head & short head).'
  },
  'Tricep Pushdown': {
    target: 'Lengan Belakang',
    detail: 'Triceps Brachii (Lateral & Medial Head)',
    modulInfo: 'MODUL 1 Hal. 31 - Gerakan ekstensi siku untuk melatih ketebalan lengan belakang.'
  },
  'Plank': {
    target: 'Otot Inti',
    detail: 'Rectus Abdominis, Obliques',
    modulInfo: 'MODUL 1 Hal. 50 - Melatih ketahanan isometrik otot perut dan stabilisasi lumbar.'
  }
};

const getExerciseAnatomyInfo = (name, category) => {
  if (!name) return { target: 'Umum', detail: 'General Muscle', modulInfo: '' };
  
  const normalized = name
    .toLowerCase()
    .split(' ')
    .filter(Boolean)
    .map(word => word.charAt(0).toUpperCase() + word.slice(1))
    .join(' ');

  if (EXERCISE_ANATOMY[normalized]) {
    return EXERCISE_ANATOMY[normalized];
  }
  
  const cat = category ? category.toLowerCase() : '';
  if (cat === 'chest') {
    return { target: 'Otot Dada (General)', detail: 'Pectoralis Major', modulInfo: 'MODUL 1 - Melatih otot dada.' };
  } else if (cat === 'back') {
    return { target: 'Otot Punggung (General)', detail: 'Latissimus Dorsi / Trapezius', modulInfo: 'MODUL 1 - Melatih punggung.' };
  } else if (cat === 'leg') {
    return { target: 'Otot Kaki (General)', detail: 'Quadriceps / Hamstrings / Glutes', modulInfo: 'MODUL 1 - Melatih tubuh bagian bawah.' };
  } else if (cat === 'shoulder') {
    return { target: 'Otot Bahu (General)', detail: 'Deltoids', modulInfo: 'MODUL 1 - Melatih kekuatan bahu.' };
  } else if (cat === 'bicep') {
    return { target: 'Otot Bisep (General)', detail: 'Biceps Brachii', modulInfo: 'MODUL 1 - Melatih lengan depan.' };
  } else if (cat === 'tricep') {
    return { target: 'Otot Trisep (General)', detail: 'Triceps Brachii', modulInfo: 'MODUL 1 - Melatih lengan belakang.' };
  } else if (cat === 'core') {
    return { target: 'Otot Inti (General)', detail: 'Abs & Core Stabilizers', modulInfo: 'MODUL 1 - Melatih otot perut.' };
  }
  
  return { target: 'Umum', detail: 'Latihan Fungsional', modulInfo: 'Latihan olahraga teratur.' };
};

const parseIndonesianFloat = (val) => {
  if (val === undefined || val === null || val === '') return NaN;
  const cleanVal = val.toString().replace(/,/g, '.');
  const parsed = parseFloat(cleanVal);
  return isNaN(parsed) ? NaN : parsed;
};

const parseIndonesianFloatWithDefault = (val, def = 0) => {
  const parsed = parseIndonesianFloat(val);
  return isNaN(parsed) ? def : parsed;
};

export default function Home() {
  // Authentication & Global State
  const [user, setUser] = useState(null);
  const [loadingAuth, setLoadingAuth] = useState(true);
  const [loadingProgress, setLoadingProgress] = useState(0);
  const [authChecked, setAuthChecked] = useState(false);
  const [authMode, setAuthMode] = useState('login'); // 'login', 'register', 'forgot', 'reset'
  const [authForm, setAuthForm] = useState({ username: '', password: '' });
  const [authError, setAuthError] = useState('');
  const [forgotForm, setForgotForm] = useState({ username: '' });
  const [resetForm, setResetForm] = useState({ password: '', confirmPassword: '' });
  const [resetToken, setResetToken] = useState('');
  const [simulatedEmailLink, setSimulatedEmailLink] = useState('');
  const [authSuccessMessage, setAuthSuccessMessage] = useState('');
  const [submittingAuth, setSubmittingAuth] = useState(false);

  useEffect(() => {
    if (typeof window !== 'undefined') {
      const urlParams = new URLSearchParams(window.location.search);
      const mode = urlParams.get('mode');
      const token = urlParams.get('token');
      if (mode === 'reset' && token) {
        setAuthMode('reset');
        setResetToken(token);
        setAuthError('');
        setAuthSuccessMessage('');
      }
    }
  }, []);
  
  // Navigation
  const [activeTab, setActiveTab] = useState('dashboard'); // 'dashboard', 'workout', 'exercises', 'gallery', 'profile'
  
  // Data State
  const [workouts, setWorkouts] = useState([]);
  const [exercisesList, setExercisesList] = useState([
    { name: 'Bench Press', category: 'Chest' },
    { name: 'Incline Dumbbell Press', category: 'Chest' },
    { name: 'Squat', category: 'Leg' },
    { name: 'Leg Press', category: 'Leg' },
    { name: 'Deadlift', category: 'Back' },
    { name: 'Pull Up', category: 'Back' },
    { name: 'Barbell Row', category: 'Back' },
    { name: 'Overhead Press', category: 'Shoulder' },
    { name: 'Lateral Raise', category: 'Shoulder' },
    { name: 'Bicep Curl', category: 'Bicep' },
    { name: 'Tricep Pushdown', category: 'Tricep' },
    { name: 'Plank', category: 'Core' }
  ]);
  const [customExerciseName, setCustomExerciseName] = useState('');
  const [customExerciseCategory, setCustomExerciseCategory] = useState('Chest');
  const [analyticsData, setAnalyticsData] = useState(null);
  const [galleryImages, setGalleryImages] = useState([]);
  const [selectedImage, setSelectedImage] = useState(null);
  
  // Active Workout Tracking
  const [activeWorkout, setActiveWorkout] = useState(null);
  const [showExerciseSelector, setShowExerciseSelector] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  
  // Specific Exercise Detail Analytics
  const [selectedExerciseDetail, setSelectedExerciseDetail] = useState(null);
  const [exerciseHistoryData, setExerciseHistoryData] = useState(null);
  const [loadingExerciseDetail, setLoadingExerciseDetail] = useState(false);
  
  // Loading States for API Actions
  const [submittingWorkout, setSubmittingWorkout] = useState(false);
  const [uploadingImage, setUploadingImage] = useState(false);
  const [imageNotes, setImageNotes] = useState('');
  
  // Dashboard Active Exercise Chart States
  const [dashboardExercise, setDashboardExercise] = useState('Bench Press');
  const [dashboardExerciseHistory, setDashboardExerciseHistory] = useState([]);
  const [loadingDashboardExercise, setLoadingDashboardExercise] = useState(false);

  // Daily Activity State
  const [activities, setActivities] = useState([]);
  const [activityForm, setActivityForm] = useState({ steps: null, calories: null });
  const [submittingActivity, setSubmittingActivity] = useState(false);

  // Nutrition & Profile States
  const [loggedMeals, setLoggedMeals] = useState([]);
  const [expandedMeals, setExpandedMeals] = useState({});
  const [editMealWeight, setEditMealWeight] = useState({});
  const [updatingMealId, setUpdatingMealId] = useState(null);
  const [foodLibrary, setFoodLibrary] = useState([]);
  const [loadingNutrition, setLoadingNutrition] = useState(false);
  const [submittingMeal, setSubmittingMeal] = useState(false);
  const [submittingFoodItem, setSubmittingFoodItem] = useState(false);
  const [nutritionDate, setNutritionDate] = useState(new Date().toISOString().split('T')[0]);
  const [mealForm, setMealForm] = useState({ foodName: '', weightG: 100, calories: '', protein: '', carbs: '', fat: '', isCustom: false });
  const [foodForm, setFoodForm] = useState({ name: '', calories: '', protein: '', carbs: '', fat: '', servingG: 100 });
  const [searchFoodTerm, setSearchFoodTerm] = useState('');
  const [selectedLibraryFood, setSelectedLibraryFood] = useState(null);
  const [foodActiveSubTab, setFoodActiveSubTab] = useState('library');
  const [mealImage, setMealImage] = useState(null);
  const [expandMacros, setExpandMacros] = useState(false);
  const [profileForm, setProfileForm] = useState({ weight: '', height: '', age: '', gender: 'male', activityLevel: 'moderate', fitnessGoal: 'maintenance', workoutProgram: 'Upper, Lower' });
  const [showProfileModal, setShowProfileModal] = useState(false);
  const [profileError, setProfileError] = useState('');

  // Daily target custom override states
  const [dailyTarget, setDailyTarget] = useState(null);
  const [showDailyTargetModal, setShowDailyTargetModal] = useState(false);
  const [dailyTargetForm, setDailyTargetForm] = useState({ targetCalories: '' });
  const [submittingDailyTarget, setSubmittingDailyTarget] = useState(false);

  // Workout split template states
  const [templates, setTemplates] = useState([]);
  const [showTemplateModal, setShowTemplateModal] = useState(false);
  const [templateForm, setTemplateForm] = useState({ id: null, name: '', exercises: [] });
  const [submittingTemplate, setSubmittingTemplate] = useState(false);
  const [selectedLibraryEx, setSelectedLibraryEx] = useState(null);
  const [customExName, setCustomExName] = useState('');
  const [customExCategory, setCustomExCategory] = useState('Chest');


  const fetchDashboardExerciseProgress = async () => {
    if (!dashboardExercise) return;
    setLoadingDashboardExercise(true);
    try {
      const res = await fetch(`/api/analytics?exercise=${encodeURIComponent(dashboardExercise)}`);
      if (res.ok) {
        const data = await res.json();
        setDashboardExerciseHistory(data.history || []);
      }
    } catch (e) {
      console.error('Error fetching dashboard exercise progress:', e);
    } finally {
      setLoadingDashboardExercise(false);
    }
  };

  useEffect(() => {
    if (user && dashboardExercise) {
      fetchDashboardExerciseProgress();
    }
  }, [user, dashboardExercise, workouts]);

  const fetchLoggedMeals = async (dateVal) => {
    try {
      const res = await fetch(`/api/food-logger?date=${dateVal || nutritionDate}`);
      if (res.ok) {
        const data = await res.json();
        setLoggedMeals(data.meals || []);
      }
    } catch (e) {
      console.error('Error fetching logged meals:', e);
    }
  };

  const fetchFoodLibrary = async () => {
    try {
      const res = await fetch('/api/food-library');
      if (res.ok) {
        const data = await res.json();
        setFoodLibrary(data.items || []);
      }
    } catch (e) {
      console.error('Error fetching food library:', e);
    }
  };

  const getMacroStatus = (consumed, target) => {
    if (target <= 0) return { emoji: '❓', color: 'text-muted border-white/5 bg-white/5' };
    const ratio = consumed / target;

    if (ratio < 0.9) {
      // Kurang (Lacking)
      return { emoji: '⬇️', color: 'text-amber-400 bg-amber-500/10 border-amber-500/20' };
    } else if (ratio > 1.1) {
      // Lebih (Excessive)
      return { emoji: '⬆️', color: 'text-rose-400 bg-rose-500/10 border-rose-500/20' };
    } else {
      // Pas/Cukup (Met)
      return { emoji: '✅', color: 'text-emerald-400 bg-emerald-500/10 border-emerald-500/20' };
    }
  };

  const getMacrosFeedback = (consumed, targets) => {
    if (!targets.isCompleted) {
      return 'Lengkapi data fisik Anda di menu "Ubah Goal" untuk mendapatkan rekomendasi makro nutrisi personal. 🎯';
    }

    const pRatio = consumed.consumedProtein / targets.targetProtein;
    const cRatio = consumed.consumedCarbs / targets.targetCarbs;
    const fRatio = consumed.consumedFat / targets.targetFat;

    if (pRatio < 0.8) {
      return 'Tips Harian: Asupan protein Anda masih rendah. Coba konsumsi dada ayam, putih telur, atau whey protein untuk pembentukan otot optimal! 🍗';
    }
    if (cRatio > 1.15 && user.fitness_goal === 'cutting') {
      return 'Peringatan Cutting: Karbohidrat Anda melebihi batas target deficit. Kurangi porsi nasi atau roti manis untuk efisiensi cutting! 🥐';
    }
    if (fRatio > 1.2) {
      return 'Perhatian: Asupan lemak harian cukup tinggi hari ini. Batasi makanan digoreng/berminyak untuk kesehatan jantung! 🍳';
    }
    if (pRatio >= 0.9 && cRatio >= 0.9 && fRatio >= 0.9 && pRatio <= 1.1 && cRatio <= 1.1 && fRatio <= 1.1) {
      return 'Luar biasa! Semua target makronutrisi harian Anda terpenuhi secara seimbang. Pertahankan konsistensi ini! 🔥🏆';
    }

    return 'Nutrisi Anda hari ini terpantau cukup baik. Jaga pola makan dan terus catat apa yang dikonsumsi! 🍏';
  };

  const calculateCalorieTargets = () => {
    if (dailyTarget) {
      return {
        bmr: 1500,
        tdee: parseFloat(dailyTarget.target_calories),
        targetCalories: parseFloat(dailyTarget.target_calories),
        targetProtein: parseFloat(dailyTarget.target_protein),
        targetFat: parseFloat(dailyTarget.target_fat),
        targetCarbs: parseFloat(dailyTarget.target_carbs),
        isCompleted: true,
        isDailyCustom: true
      };
    }

    if (!user || !user.weight || !user.height || !user.age) {
      return {
        bmr: 1500,
        tdee: 2000,
        targetCalories: 2000,
        targetProtein: 140, 
        targetFat: 70,      
        targetCarbs: 202.5, 
        isCompleted: false
      };
    }

    const weight = parseFloat(user.weight);
    const height = parseFloat(user.height);
    const age = parseInt(user.age);
    const isMale = user.gender === 'male';

    let bmr = (10 * weight) + (6.25 * height) - (5 * age);
    if (isMale) {
      bmr += 5;
    } else {
      bmr -= 161;
    }

    let factor = 1.2;
    if (user.activity_level === 'light') factor = 1.375;
    else if (user.activity_level === 'moderate') factor = 1.55;
    else if (user.activity_level === 'heavy') factor = 1.725;

    const tdee = Math.round(bmr * factor);
    let targetCalories = tdee;

    if (user.fitness_goal === 'cutting') {
      targetCalories = tdee - 500;
    } else if (user.fitness_goal === 'bulking') {
      targetCalories = tdee + 500;
    }

    const targetProtein = Math.round(weight * 1.8); 
    const fatPct = user.fitness_goal === 'cutting' ? 0.20 : 0.25;
    const targetFat = Math.round((targetCalories * fatPct) / 9);     
    
    const proteinCalories = targetProtein * 4;
    const fatCalories = targetFat * 9;
    const remainingCalories = Math.max(0, targetCalories - proteinCalories - fatCalories);
    const targetCarbs = Math.round(remainingCalories / 4);

    return {
      bmr,
      tdee,
      targetCalories,
      targetProtein,
      targetFat,
      targetCarbs,
      isCompleted: true
    };
  };

  const getConsumedStats = () => {
    let consumedCalories = 0;
    let consumedProtein = 0;
    let consumedCarbs = 0;
    let consumedFat = 0;

    loggedMeals.forEach(meal => {
      consumedCalories += parseFloat(meal.calories);
      consumedProtein += parseFloat(meal.protein);
      consumedCarbs += parseFloat(meal.carbs);
      consumedFat += parseFloat(meal.fat);
    });

    return {
      consumedCalories: Math.round(consumedCalories),
      consumedProtein: Math.round(consumedProtein),
      consumedCarbs: Math.round(consumedCarbs),
      consumedFat: Math.round(consumedFat)
    };
  };

  const handleUpdateProfile = async (e) => {
    if (e) e.preventDefault();
    setProfileError('');

    const parsedWeight = parseFloat(profileForm.weight);
    const parsedHeight = parseFloat(profileForm.height);
    const parsedAge = parseInt(profileForm.age);

    if (isNaN(parsedWeight) || isNaN(parsedHeight) || isNaN(parsedAge)) {
      setProfileError('Berat badan, tinggi, dan umur harus diisi dengan angka.');
      return;
    }

    try {
      const res = await fetch('/api/auth/me', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          weight: parsedWeight,
          height: parsedHeight,
          age: parsedAge,
          gender: profileForm.gender,
          activity_level: profileForm.activityLevel,
          fitness_goal: profileForm.fitnessGoal,
          workout_program: profileForm.workoutProgram
        })
      });
      const data = await res.json();
      if (res.ok) {
        setUser(data.user);
        message.success('Profil dan target kalori berhasil diperbarui!');
        setShowProfileModal(false);
      } else {
        setProfileError(data.error || 'Gagal memperbarui profil.');
      }
    } catch (err) {
      setProfileError('Masalah koneksi.');
    }
  };

  const handleAddMealLog = async (e) => {
    if (e) e.preventDefault();
    if (!mealForm.foodName || !mealForm.weightG) {
      message.warning('Nama makanan dan berat wajib diisi.');
      return;
    }

    setSubmittingMeal(true);
    try {
      const payload = {
        food_name: mealForm.foodName,
        weight_g: parseFloat(mealForm.weightG),
        calories: parseFloat(mealForm.calories || 0),
        protein: parseFloat(mealForm.protein || 0),
        carbs: parseFloat(mealForm.carbs || 0),
        fat: parseFloat(mealForm.fat || 0),
        date: nutritionDate,
        image_data: mealImage
      };

      const res = await fetch('/api/food-logger', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });

      if (res.ok) {
        setMealForm({ foodName: '', weightG: 100, calories: '', protein: '', carbs: '', fat: '', isCustom: false });
        setSelectedLibraryFood(null);
        setMealImage(null);
        message.success('Makanan berhasil dicatat!');
        await fetchLoggedMeals(nutritionDate);
      } else {
        const err = await res.json();
        message.error(err.error || 'Gagal mencatat makanan.');
      }
    } catch (err) {
      console.error(err);
      message.error('Gagal menghubungi server.');
    } finally {
      setSubmittingMeal(false);
    }
  };

  const handleDeleteMealLog = async (id) => {
    if (!confirm('Hapus catatan makanan ini?')) return;
    try {
      const res = await fetch(`/api/food-logger?id=${id}`, { method: 'DELETE' });
      if (res.ok) {
        message.success('Catatan makanan berhasil dihapus.');
        await fetchLoggedMeals(nutritionDate);
      } else {
        message.error('Gagal menghapus catatan makanan.');
      }
    } catch (err) {
      console.error(err);
    }
  };

  const handleSaveMealEdit = async (meal) => {
    const newWeightStr = editMealWeight[meal.id] !== undefined ? editMealWeight[meal.id] : meal.weight_g.toString();
    const newWeight = parseIndonesianFloatWithDefault(newWeightStr, 0);
    if (newWeight <= 0) {
      message.warning('Berat makanan harus lebih besar dari 0.');
      return;
    }

    const originalWeight = parseFloat(meal.weight_g) || 1;

    const newCalories = (parseFloat(meal.calories) / originalWeight) * newWeight;
    const newProtein = (parseFloat(meal.protein) / originalWeight) * newWeight;
    const newCarbs = (parseFloat(meal.carbs) / originalWeight) * newWeight;
    const newFat = (parseFloat(meal.fat) / originalWeight) * newWeight;

    setUpdatingMealId(meal.id);
    try {
      const res = await fetch('/api/food-logger', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          id: meal.id,
          weight_g: newWeight,
          calories: Math.round(newCalories * 10) / 10,
          protein: Math.round(newProtein * 10) / 10,
          carbs: Math.round(newCarbs * 10) / 10,
          fat: Math.round(newFat * 10) / 10
        })
      });

      if (res.ok) {
        message.success('Catatan makanan berhasil diperbarui!');
        setEditMealWeight(prev => {
          const updated = { ...prev };
          delete updated[meal.id];
          return updated;
        });
        setExpandedMeals(prev => ({ ...prev, [meal.id]: false }));
        await fetchLoggedMeals(nutritionDate);
      } else {
        const err = await res.json();
        message.error(err.error || 'Gagal memperbarui catatan makanan.');
      }
    } catch (err) {
      console.error(err);
      message.error('Masalah koneksi.');
    } finally {
      setUpdatingMealId(null);
    }
  };


  const handleCreateFoodItem = async (e) => {
    if (e) e.preventDefault();
    const name = foodForm.name?.trim();
    const servingG = parseIndonesianFloat(foodForm.servingG);

    if (!name || isNaN(servingG) || servingG <= 0) {
      message.warning('Nama makanan dan takaran saji wajib diisi.');
      return;
    }

    let caloriesVal = parseIndonesianFloat(foodForm.calories);
    let proteinVal = parseIndonesianFloatWithDefault(foodForm.protein, 0);
    let carbsVal = parseIndonesianFloatWithDefault(foodForm.carbs, 0);
    let fatVal = parseIndonesianFloatWithDefault(foodForm.fat, 0);

    if (isNaN(caloriesVal)) {
      const hasProtein = foodForm.protein !== '' && foodForm.protein !== null && !isNaN(parseIndonesianFloat(foodForm.protein));
      const hasCarbs = foodForm.carbs !== '' && foodForm.carbs !== null && !isNaN(parseIndonesianFloat(foodForm.carbs));
      const hasFat = foodForm.fat !== '' && foodForm.fat !== null && !isNaN(parseIndonesianFloat(foodForm.fat));

      if (!hasProtein && !hasCarbs && !hasFat) {
        message.warning('Masukkan total Kalori ATAU setidaknya salah satu kandungan makro (Protein/Karbo/Lemak) agar Kalori bisa dihitung otomatis.');
        return;
      }
      caloriesVal = Math.round((proteinVal * 4) + (carbsVal * 4) + (fatVal * 9));
    }

    setSubmittingFoodItem(true);
    try {
      const res = await fetch('/api/food-library', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: name,
          calories: caloriesVal,
          protein: proteinVal,
          carbs: carbsVal,
          fat: fatVal,
          serving_g: servingG
        })
      });

      if (res.ok) {
        setFoodForm({ name: '', calories: '', protein: '', carbs: '', fat: '', servingG: 100 });
        await fetchFoodLibrary();
        message.success('Makanan baru berhasil ditambahkan ke pustaka kustom Anda.');
      } else {
        const err = await res.json();
        message.error(err.error || 'Gagal menambahkan ke pustaka.');
      }
    } catch (err) {
      console.error(err);
      message.error('Gagal menghubungi server.');
    } finally {
      setSubmittingFoodItem(false);
    }
  };

  const handleLogCustomFoodDirectly = async (e) => {
    if (e) e.preventDefault();
    const name = foodForm.name?.trim();
    const servingG = parseIndonesianFloat(foodForm.servingG);

    if (!name || isNaN(servingG) || servingG <= 0) {
      message.warning('Nama makanan dan berat/takaran saji wajib diisi.');
      return;
    }

    let caloriesVal = parseIndonesianFloat(foodForm.calories);
    let proteinVal = parseIndonesianFloatWithDefault(foodForm.protein, 0);
    let carbsVal = parseIndonesianFloatWithDefault(foodForm.carbs, 0);
    let fatVal = parseIndonesianFloatWithDefault(foodForm.fat, 0);

    if (isNaN(caloriesVal)) {
      const hasProtein = foodForm.protein !== '' && foodForm.protein !== null && !isNaN(parseIndonesianFloat(foodForm.protein));
      const hasCarbs = foodForm.carbs !== '' && foodForm.carbs !== null && !isNaN(parseIndonesianFloat(foodForm.carbs));
      const hasFat = foodForm.fat !== '' && foodForm.fat !== null && !isNaN(parseIndonesianFloat(foodForm.fat));

      if (!hasProtein && !hasCarbs && !hasFat) {
        message.warning('Masukkan total Kalori ATAU setidaknya salah satu kandungan makro (Protein/Karbo/Lemak) agar Kalori bisa dihitung otomatis.');
        return;
      }
      caloriesVal = Math.round((proteinVal * 4) + (carbsVal * 4) + (fatVal * 9));
    }

    setSubmittingMeal(true);
    try {
      const payload = {
        food_name: name,
        weight_g: servingG,
        calories: caloriesVal,
        protein: proteinVal,
        carbs: carbsVal,
        fat: fatVal,
        date: nutritionDate,
        image_data: mealImage
      };

      const res = await fetch('/api/food-logger', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });

      if (res.ok) {
        setFoodForm({ name: '', calories: '', protein: '', carbs: '', fat: '', servingG: 100 });
        setMealImage(null);
        await fetchLoggedMeals(nutritionDate);
        message.success('Makanan kustom berhasil dicatat ke diary harian Anda.');
      } else {
        const err = await res.json();
        message.error(err.error || 'Gagal mencatat makanan.');
      }
    } catch (err) {
      console.error(err);
      message.error('Gagal menghubungi server.');
    } finally {
      setSubmittingMeal(false);
    }
  };

  const handleLogAndCreateFoodItem = async (e) => {
    if (e) e.preventDefault();
    const name = foodForm.name?.trim();
    const servingG = parseIndonesianFloat(foodForm.servingG);
    const caloriesVal = parseIndonesianFloat(foodForm.calories);
    const proteinVal = parseIndonesianFloat(foodForm.protein);
    const carbsVal = parseIndonesianFloat(foodForm.carbs);
    const fatVal = parseIndonesianFloat(foodForm.fat);

    // For "Catat & Tambahkan ke Pustaka", ALL columns must be fully filled
    if (!name || isNaN(servingG) || isNaN(caloriesVal) || isNaN(proteinVal) || isNaN(carbsVal) || isNaN(fatVal)) {
      message.warning('Semua kolom (Nama, Takaran, Kalori, Protein, Karbo, Lemak) wajib diisi lengkap untuk pilihan ini.');
      return;
    }

    setSubmittingFoodItem(true);
    setSubmittingMeal(true);
    try {
      // 1. Add to Food Library
      const libRes = await fetch('/api/food-library', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: name,
          calories: caloriesVal,
          protein: proteinVal,
          carbs: carbsVal,
          fat: fatVal,
          serving_g: servingG
        })
      });

      if (!libRes.ok) {
        const err = await libRes.json();
        message.error(err.error || 'Gagal menambahkan ke pustaka.');
        return;
      }

      // 2. Log to Diary
      const payload = {
        food_name: name,
        weight_g: servingG,
        calories: caloriesVal,
        protein: proteinVal,
        carbs: carbsVal,
        fat: fatVal,
        date: nutritionDate,
        image_data: mealImage
      };

      const logRes = await fetch('/api/food-logger', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });

      if (logRes.ok) {
        setFoodForm({ name: '', calories: '', protein: '', carbs: '', fat: '', servingG: 100 });
        setMealImage(null);
        await fetchFoodLibrary();
        await fetchLoggedMeals(nutritionDate);
        message.success('Makanan kustom berhasil dicatat dan disimpan ke pustaka Anda.');
      } else {
        const err = await logRes.json();
        message.error(err.error || 'Gagal mencatat makanan.');
      }
    } catch (err) {
      console.error(err);
      message.error('Koneksi bermasalah.');
    } finally {
      setSubmittingFoodItem(false);
      setSubmittingMeal(false);
    }
  };

  const handleDeleteFoodItem = async (id) => {
    if (!confirm('Hapus makanan ini dari pustaka Anda?')) return;
    try {
      const res = await fetch(`/api/food-library?id=${id}`, { method: 'DELETE' });
      if (res.ok) {
        message.success('Makanan berhasil dihapus dari pustaka.');
        await fetchFoodLibrary();
      } else {
        const err = await res.json();
        message.error(err.error || 'Gagal menghapus makanan dari pustaka.');
      }
    } catch (err) {
      console.error(err);
    }
  };

  useEffect(() => {
    if (user) {
      setProfileForm({
        weight: user.weight || '',
        height: user.height || '',
        age: user.age || '',
        gender: user.gender || 'male',
        activityLevel: user.activity_level || 'moderate',
        fitnessGoal: user.fitness_goal || 'maintenance',
        workoutProgram: user.workout_program || 'Upper, Lower'
      });
    }
  }, [user]);

  // 1. Initial Authentication Check and Data Loading
  useEffect(() => {
    checkAuth();
  }, []);

  // Mengatur laju progress bar membulat (circular progress)
  useEffect(() => {
    let timer;
    if (loadingProgress < 100) {
      // Jika cek auth sudah selesai, laju bertambah lebih cepat (speed lebih kecil)
      const speed = authChecked ? 8 : 20;
      timer = setTimeout(() => {
        setLoadingProgress(prev => {
          const increment = Math.floor(Math.random() * 4) + 2; // bertambah 2-5% per tick
          const next = prev + increment;
          return next >= 100 ? 100 : next;
        });
      }, speed + Math.random() * 20);
    } else if (authChecked) {
      // Tunggu transisi sejenak setelah 100% selesai untuk visual feel yang memuaskan
      const fadeTimer = setTimeout(() => {
        setLoadingAuth(false);
      }, 250);
      return () => clearTimeout(fadeTimer);
    }
    return () => clearTimeout(timer);
  }, [loadingProgress, authChecked]);

  useEffect(() => {
    if (user) {
      fetchWorkouts();
      fetchAnalytics();
      fetchGallery();
      fetchActivities();
      fetchLoggedMeals(nutritionDate);
      fetchFoodLibrary();
      fetchDailyTarget(nutritionDate);
      fetchTemplates();
      // Extract unique exercises from DB workouts if any to populate selection list
      updateExercisesList();
    }
  }, [user]);

  useEffect(() => {
    if (user) {
      fetchLoggedMeals(nutritionDate);
      fetchDailyTarget(nutritionDate);
    }
  }, [user, nutritionDate]);

  const checkAuth = async () => {
    try {
      const res = await fetch('/api/auth/me');
      if (res.ok) {
        const data = await res.json();
        setUser(data.user);
      }
    } catch (e) {
      console.error('Failed checking auth session:', e);
    } finally {
      setAuthChecked(true);
    }
  };

  const fetchDailyTarget = async (dateVal) => {
    try {
      const res = await fetch(`/api/daily-target?date=${dateVal || nutritionDate}`);
      if (res.ok) {
        const data = await res.json();
        setDailyTarget(data.target || null);
      }
    } catch (e) {
      console.error('Error fetching daily target:', e);
    }
  };

  const openDailyTargetModal = () => {
    const targets = calculateCalorieTargets();
    setDailyTargetForm({ targetCalories: targets.targetCalories });
    setShowDailyTargetModal(true);
  };

  const handleSaveDailyTarget = async (e) => {
    if (e) e.preventDefault();
    if (!dailyTargetForm.targetCalories) {
      message.warning('Target kalori wajib diisi.');
      return;
    }

    setSubmittingDailyTarget(true);
    try {
      let protein = 140;
      let fat = 70;
      let carbs = 202.5;

      const targetCalories = parseInt(dailyTargetForm.targetCalories);

      if (user && user.weight) {
        const weight = parseFloat(user.weight);
        protein = Math.round(weight * 1.8);
        const fatPct = user.fitness_goal === 'cutting' ? 0.20 : 0.25;
        fat = Math.round((targetCalories * fatPct) / 9);
        const remaining = Math.max(0, targetCalories - (protein * 4) - (fat * 9));
        carbs = Math.round(remaining / 4);
      } else {
        protein = Math.round(140 * (targetCalories / 2000));
        fat = Math.round(70 * (targetCalories / 2000));
        carbs = Math.round(202.5 * (targetCalories / 2000));
      }

      const res = await fetch('/api/daily-target', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          date: nutritionDate,
          target_calories: targetCalories,
          target_protein: protein,
          target_carbs: carbs,
          target_fat: fat
        })
      });

      if (res.ok) {
        message.success('Target kalori harian berhasil diperbarui!');
        await fetchDailyTarget(nutritionDate);
        setShowDailyTargetModal(false);
      } else {
        const err = await res.json();
        message.error(err.error || 'Gagal menyimpan target harian.');
      }
    } catch (err) {
      console.error(err);
      message.error('Gagal menghubungi server.');
    } finally {
      setSubmittingDailyTarget(false);
    }
  };

  const handleResetDailyTarget = async () => {
    if (!confirm('Kembalikan ke target default profil?')) return;
    
    setSubmittingDailyTarget(true);
    try {
      const res = await fetch(`/api/daily-target?date=${nutritionDate}`, {
        method: 'DELETE'
      });

      if (res.ok) {
        message.success('Target harian berhasil direset ke default.');
        await fetchDailyTarget(nutritionDate);
        setShowDailyTargetModal(false);
      } else {
        const err = await res.json();
        message.error(err.error || 'Gagal mereset target harian.');
      }
    } catch (err) {
      console.error(err);
      message.error('Gagal menghubungi server.');
    } finally {
      setSubmittingDailyTarget(false);
    }
  };

  const fetchTemplates = async () => {
    try {
      const res = await fetch('/api/templates');
      if (res.ok) {
        const data = await res.json();
        setTemplates(data.templates || []);
      }
    } catch (e) {
      console.error('Error fetching templates:', e);
    }
  };

  const handleSaveTemplate = async (e) => {
    if (e) e.preventDefault();
    if (!templateForm.name || !templateForm.name.trim()) {
      alert('Nama rencana wajib diisi.');
      return;
    }
    if (!templateForm.exercises || templateForm.exercises.length === 0) {
      alert('Pilih minimal satu gerakan untuk rencana ini.');
      return;
    }

    setSubmittingTemplate(true);
    try {
      const res = await fetch('/api/templates', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          id: templateForm.id,
          name: templateForm.name,
          exercises: templateForm.exercises
        })
      });

      if (res.ok) {
        await fetchTemplates();
        setShowTemplateModal(false);
        setTemplateForm({ id: null, name: '', exercises: [] });
      } else {
        const err = await res.json();
        alert(err.error || 'Gagal menyimpan rencana latihan.');
      }
    } catch (err) {
      console.error(err);
      alert('Gagal menghubungi server.');
    } finally {
      setSubmittingTemplate(false);
    }
  };

  const handleDeleteTemplate = async (id) => {
    if (!confirm('Hapus rencana latihan ini?')) return;
    try {
      const res = await fetch(`/api/templates?id=${id}`, {
        method: 'DELETE'
      });
      if (res.ok) {
        await fetchTemplates();
      } else {
        const err = await res.json();
        alert(err.error || 'Gagal menghapus rencana latihan.');
      }
    } catch (e) {
      console.error('Delete template error:', e);
    }
  };

  const startWorkoutFromTemplate = async (template) => {
    const defaultExercises = [];
    
    for (const ex of template.exercises) {
      let defaultSets = [];
      const prevSets = getPreviousWorkoutData(ex.name);
      
      // If template has sets defined, use them!
      if (ex.sets) {
        if (!Array.isArray(ex.sets)) {
          // New single-object format: { sets_count, reps_target, rir_target }
          const setsCount = parseInt(ex.sets.sets_count) || 4;
          const targetReps = ex.sets.reps_target !== undefined ? ex.sets.reps_target : "8 - 12";
          const targetRir = ex.sets.rir_target !== undefined ? ex.sets.rir_target : 2;
          
          for (let idx = 0; idx < setsCount; idx++) {
            let prevWeightVal = null;
            if (prevSets && prevSets[idx]) {
              prevWeightVal = prevSets[idx].weight;
            } else if (prevSets && prevSets.length > 0) {
              prevWeightVal = prevSets[prevSets.length - 1].weight;
            }
            
            let rpeVal = 8;
            if (targetRir !== '' && !isNaN(targetRir)) {
              rpeVal = 10 - parseInt(targetRir);
            }
            
            let defaultRepsInputVal = 10;
            if (targetReps) {
              const matchedDigits = targetReps.match(/\d+/);
              if (matchedDigits) {
                defaultRepsInputVal = parseInt(matchedDigits[0]);
              }
            }
            
            defaultSets.push({
              set_number: idx + 1,
              weight: prevWeightVal !== null ? prevWeightVal : 10,
              reps: defaultRepsInputVal,
              rpe: rpeVal,
              target_reps: targetReps,
              target_rir: targetRir,
              prev_weight: prevWeightVal,
              completed: false
            });
          }
        } else if (Array.isArray(ex.sets) && ex.sets.length > 0) {
          // Old array-of-sets format
          defaultSets = ex.sets.map((s, idx) => {
            let prevWeightVal = null;
            if (prevSets && prevSets[idx]) {
              prevWeightVal = prevSets[idx].weight;
            } else if (prevSets && prevSets.length > 0) {
              prevWeightVal = prevSets[prevSets.length - 1].weight;
            }
            
            return {
              set_number: idx + 1,
              weight: prevWeightVal !== null ? prevWeightVal : 10,
              reps: s.reps !== undefined && s.reps !== '' ? parseInt(s.reps) : 10,
              rpe: s.rir !== undefined && s.rir !== '' ? (10 - parseInt(s.rir)) : 8,
              target_reps: s.reps,
              target_rir: s.rir,
              prev_weight: prevWeightVal,
              completed: false
            };
          });
        } else {
          // Fallback to historical data
          if (prevSets && prevSets.length > 0) {
            defaultSets = prevSets.map((s, idx) => ({
              set_number: idx + 1,
              weight: s.weight,
              reps: s.reps,
              rpe: s.rpe || 8,
              prev_weight: s.weight,
              completed: false
            }));
          } else {
            defaultSets = [{ set_number: 1, weight: 10, reps: 10, rpe: 8, completed: false }];
          }
        }
      } else {
        // Fallback to historical data
        if (prevSets && prevSets.length > 0) {
          defaultSets = prevSets.map((s, idx) => ({
            set_number: idx + 1,
            weight: s.weight,
            reps: s.reps,
            rpe: s.rpe || 8,
            prev_weight: s.weight,
            completed: false
          }));
        } else {
          defaultSets = [{ set_number: 1, weight: 10, reps: 10, rpe: 8, completed: false }];
        }
      }
      
      defaultExercises.push({
        name: ex.name,
        category: ex.category || 'General',
        notes: '',
        sets: defaultSets
      });
    }

    setActiveWorkout({
      name: `Sesi ${template.name}`,
      date: new Date().toISOString(),
      notes: `Memulai latihan menggunakan rencana ${template.name}`,
      completed: false,
      exercises: defaultExercises
    });
    setActiveTab('workout');
  };

  const addExerciseToTemplateForm = () => {
    let nameToUse = '';
    let categoryToUse = 'General';
    
    if (selectedLibraryEx) {
      nameToUse = selectedLibraryEx;
      const found = exercisesList.find(e => e.name === selectedLibraryEx);
      if (found) categoryToUse = found.category;
    } else if (customExName && customExName.trim()) {
      nameToUse = customExName.trim();
      categoryToUse = customExCategory;
    } else {
      alert('Pilih gerakan dari pustaka atau tulis nama gerakan baru.');
      return;
    }

    const exists = templateForm.exercises.some(e => e.name.toLowerCase() === nameToUse.toLowerCase());
    if (exists) {
      alert('Gerakan ini sudah ada dalam rencana.');
      return;
    }

    setTemplateForm({
      ...templateForm,
      exercises: [...templateForm.exercises, { name: nameToUse, category: categoryToUse, sets: { sets_count: 4, reps_target: "8 - 12", rir_target: 2 } }]
    });

    // Add new custom exercise to the library state so it is immediately searchable
    if (customExName && customExName.trim()) {
      const newEx = { name: nameToUse, category: categoryToUse };
      setExercisesList(prev => {
        if (!prev.some(e => e.name.toLowerCase() === nameToUse.toLowerCase())) {
          return [...prev, newEx];
        }
        return prev;
      });
    }

    // Reset fields
    setSelectedLibraryEx(null);
    setCustomExName('');
  };

  const removeExerciseFromTemplateForm = (idxToRemove) => {
    setTemplateForm({
      ...templateForm,
      exercises: templateForm.exercises.filter((_, idx) => idx !== idxToRemove)
    });
  };

  const updateTemplateExerciseSets = (exIdx, field, val) => {
    const updatedExercises = [...templateForm.exercises];
    const exercise = updatedExercises[exIdx];
    
    // Ensure sets is an object
    const setsObj = (exercise.sets && !Array.isArray(exercise.sets)) 
      ? { ...exercise.sets } 
      : { sets_count: 4, reps_target: "8 - 12", rir_target: 2 };
      
    if (field === 'sets_count') {
      setsObj.sets_count = val === '' ? '' : parseInt(val);
    } else if (field === 'reps_target') {
      setsObj.reps_target = val;
    } else if (field === 'rir_target') {
      setsObj.rir_target = val === '' ? '' : val;
    }
    
    exercise.sets = setsObj;
    setTemplateForm({ ...templateForm, exercises: updatedExercises });
  };

  const handleAuthSubmit = async (e) => {
    e.preventDefault();
    setAuthError('');
    if (!authForm.username || !authForm.password) {
      setAuthError('Username dan Password wajib diisi.');
      return;
    }
    
    setSubmittingAuth(true);
    const endpoint = authMode === 'login' ? '/api/auth/login' : '/api/auth/register';
    try {
      const res = await fetch(endpoint, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(authForm),
      });
      const data = await res.json();
      if (res.ok) {
        setUser(data.user);
        setAuthForm({ username: '', password: '' });
      } else {
        setAuthError(data.error || 'Terjadi kesalahan autentikasi.');
      }
    } catch (err) {
      setAuthError('Gagal menghubungi server.');
    } finally {
      setSubmittingAuth(false);
    }
  };

  const handleForgotSubmit = async (e) => {
    e.preventDefault();
    setAuthError('');
    setAuthSuccessMessage('');
    setSimulatedEmailLink('');

    if (!forgotForm.username) {
      setAuthError('Username wajib diisi.');
      return;
    }

    setSubmittingAuth(true);
    try {
      const res = await fetch('/api/auth/forgot-password', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username: forgotForm.username }),
      });
      const data = await res.json();
      if (res.ok) {
        setAuthSuccessMessage('Tautan reset password berhasil dibuat!');
        const resetLink = `/?mode=reset&token=${data.token}`;
        setSimulatedEmailLink(resetLink);
      } else {
        setAuthError(data.error || 'Gagal mengirim permintaan reset password.');
      }
    } catch (err) {
      setAuthError('Gagal menghubungi server.');
    } finally {
      setSubmittingAuth(false);
    }
  };

  const handleResetSubmit = async (e) => {
    e.preventDefault();
    setAuthError('');
    setAuthSuccessMessage('');

    if (!resetForm.password || !resetForm.confirmPassword) {
      setAuthError('Semua kolom password wajib diisi.');
      return;
    }

    if (resetForm.password.length < 6) {
      setAuthError('Password baru minimal harus 6 karakter.');
      return;
    }

    if (resetForm.password !== resetForm.confirmPassword) {
      setAuthError('Konfirmasi password baru tidak cocok.');
      return;
    }

    setSubmittingAuth(true);
    try {
      const res = await fetch('/api/auth/reset-password', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ token: resetToken, newPassword: resetForm.password }),
      });
      const data = await res.json();
      if (res.ok) {
        setAuthSuccessMessage('Password berhasil diperbarui! Silakan masuk kembali.');
        setResetForm({ password: '', confirmPassword: '' });
        setResetToken('');
        if (typeof window !== 'undefined') {
          window.history.replaceState({}, document.title, window.location.pathname);
        }
        setTimeout(() => {
          setAuthMode('login');
          setAuthSuccessMessage('');
        }, 2500);
      } else {
        setAuthError(data.error || 'Gagal memperbarui password.');
      }
    } catch (err) {
      setAuthError('Gagal menghubungi server.');
    } finally {
      setSubmittingAuth(false);
    }
  };

  const handleLogout = async () => {
    try {
      await fetch('/api/auth/logout', { method: 'POST' });
      setUser(null);
      setActiveTab('dashboard');
      setActiveWorkout(null);
      setActivities([]);
    } catch (e) {
      console.error('Logout error:', e);
    }
  };

  // 2. Fetch Data from APIs
  const fetchWorkouts = async () => {
    try {
      const res = await fetch('/api/workouts');
      if (res.ok) {
        const data = await res.json();
        setWorkouts(data.workouts || []);
      }
    } catch (e) {
      console.error('Error fetching workouts:', e);
    }
  };

  const fetchAnalytics = async () => {
    try {
      const res = await fetch('/api/analytics');
      if (res.ok) {
        const data = await res.json();
        setAnalyticsData(data);
      }
    } catch (e) {
      console.error('Error fetching analytics:', e);
    }
  };

  const fetchGallery = async () => {
    try {
      const res = await fetch('/api/images');
      if (res.ok) {
        const data = await res.json();
        setGalleryImages(data.images || []);
      }
    } catch (e) {
      console.error('Error fetching gallery:', e);
    }
  };

  const fetchActivities = async () => {
    try {
      const res = await fetch('/api/activities');
      if (res.ok) {
        const data = await res.json();
        setActivities(data.activities || []);
      }
    } catch (e) {
      console.error('Error fetching activities:', e);
    }
  };

  const handleAddActivity = async (e) => {
    if (e) e.preventDefault();
    if (activityForm.steps === null || activityForm.steps === undefined || 
        activityForm.calories === null || activityForm.calories === undefined) return;
    setSubmittingActivity(true);
    try {
      const res = await fetch('/api/activities', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(activityForm)
      });
      if (res.ok) {
        setActivityForm({ steps: null, calories: null });
        await fetchActivities();
      } else {
        alert('Gagal menyimpan aktivitas.');
      }
    } catch (err) {
      console.error(err);
      alert('Masalah koneksi.');
    } finally {
      setSubmittingActivity(false);
    }
  };

  const handleDeleteActivity = async (id) => {
    if (!confirm('Hapus aktivitas ini?')) return;
    try {
      const res = await fetch(`/api/activities?id=${id}`, { method: 'DELETE' });
      if (res.ok) {
        await fetchActivities();
      } else {
        alert('Gagal menghapus aktivitas.');
      }
    } catch (err) {
      console.error(err);
    }
  };

  const loadWorkoutForEditing = (workout) => {
    const clone = JSON.parse(JSON.stringify(workout));
    setActiveWorkout(clone);
    setActiveTab('workout');
  };

  const getWorkoutDaysThisWeek = () => {
    if (!workouts || workouts.length === 0) return 0;
    const startOfWeek = dayjs().startOf('week');
    const endOfWeek = dayjs().endOf('week');
    
    const uniqueDates = new Set();
    workouts.forEach(w => {
      if (!w.completed) return;
      const wDate = dayjs(w.date);
      if ((wDate.isAfter(startOfWeek) || wDate.isSame(startOfWeek)) && 
          (wDate.isBefore(endOfWeek) || wDate.isSame(endOfWeek))) {
        uniqueDates.add(wDate.format('YYYY-MM-DD'));
      }
    });
    return uniqueDates.size;
  };

  const getWeeklyVolume = () => {
    if (!workouts || workouts.length === 0) return 0;
    const startOfWeek = dayjs().startOf('week');
    const endOfWeek = dayjs().endOf('week');
    
    let totalVolume = 0;
    workouts.forEach(w => {
      if (!w.completed) return;
      const wDate = dayjs(w.date);
      if ((wDate.isAfter(startOfWeek) || wDate.isSame(startOfWeek)) && 
          (wDate.isBefore(endOfWeek) || wDate.isSame(endOfWeek))) {
        w.exercises?.forEach(ex => {
          ex.sets?.forEach(s => {
            if (s.completed) {
              totalVolume += 1;
            }
          });
        });
      }
    });
    return totalVolume;
  };

  const getWeeklyWorkoutsCount = () => {
    if (!workouts || workouts.length === 0) return 0;
    const startOfWeek = dayjs().startOf('week');
    const endOfWeek = dayjs().endOf('week');
    
    let count = 0;
    workouts.forEach(w => {
      if (!w.completed) return;
      const wDate = dayjs(w.date);
      if ((wDate.isAfter(startOfWeek) || wDate.isSame(startOfWeek)) && 
          (wDate.isBefore(endOfWeek) || wDate.isSame(endOfWeek))) {
        count++;
      }
    });
    return count;
  };

  const getMuscleGroupStats = () => {
    const categories = ['Chest', 'Back', 'Leg', 'Shoulder', 'Bicep', 'Tricep', 'Core'];
    const labelMap = {
      Chest: 'Dada',
      Back: 'Punggung',
      Leg: 'Kaki',
      Shoulder: 'Bahu',
      Bicep: 'Bisep',
      Tricep: 'Trisep',
      Core: 'Inti/Perut'
    };

    const startOfWeek = dayjs().startOf('week');
    const endOfWeek = dayjs().endOf('week');
    const startOfLastWeek = dayjs().subtract(1, 'week').startOf('week');
    const endOfLastWeek = dayjs().subtract(1, 'week').endOf('week');

    // Initialize counts
    const thisWeekSets = {};
    const lastWeekSets = {};
    categories.forEach(cat => {
      thisWeekSets[cat] = 0;
      lastWeekSets[cat] = 0;
    });

    workouts.forEach(w => {
      if (!w.completed) return;
      const wDate = dayjs(w.date);
      const isThisWeek = (wDate.isAfter(startOfWeek) || wDate.isSame(startOfWeek)) && 
                         (wDate.isBefore(endOfWeek) || wDate.isSame(endOfWeek));
      const isLastWeek = (wDate.isAfter(startOfLastWeek) || wDate.isSame(startOfLastWeek)) && 
                         (wDate.isBefore(endOfLastWeek) || wDate.isSame(endOfLastWeek));

      if (isThisWeek || isLastWeek) {
        w.exercises?.forEach(ex => {
          let cat = ex.category;
          if (cat) {
            cat = cat.charAt(0).toUpperCase() + cat.slice(1).toLowerCase();
          }
          if (categories.includes(cat)) {
            ex.sets?.forEach(s => {
              if (s.completed) {
                if (isThisWeek) thisWeekSets[cat]++;
                if (isLastWeek) lastWeekSets[cat]++;
              }
            });
          }
        });
      }
    });

    // Format for Recharts RadarChart
    const chartData = categories.map(cat => {
      return {
        subject: labelMap[cat],
        'Minggu Ini': thisWeekSets[cat],
        'Minggu Lalu': lastWeekSets[cat],
        category: cat
      };
    });

    return { chartData, thisWeekSets, lastWeekSets };
  };

  const getMonthlyPrsCount = () => {
    if (!analyticsData?.prs) return 0;
    const startOfMonth = dayjs().startOf('month');
    
    let count = 0;
    analyticsData.prs.forEach(pr => {
      const lastDone = dayjs(pr.last_done);
      if (lastDone.isAfter(startOfMonth) || lastDone.isSame(startOfMonth)) {
        count++;
      }
    });
    return count;
  };

  const getLatestAchievements = () => {
    if (!workouts || workouts.length === 0) return [];
    
    const latestWorkout = workouts.find(w => w.completed);
    if (!latestWorkout) return [];
    
    const achievements = [];
    
    latestWorkout.exercises?.forEach(ex => {
      const exName = ex.name.toLowerCase();
      let prevEx = null;
      
      for (const w of workouts) {
        if (!w.completed || w.id === latestWorkout.id) continue;
        const found = w.exercises?.find(e => e.name.toLowerCase() === exName);
        if (found && found.sets?.some(s => s.completed)) {
          prevEx = found;
          break;
        }
      }
      
      if (prevEx) {
        const currentCompletedSets = ex.sets.filter(s => s.completed);
        const prevCompletedSets = prevEx.sets.filter(s => s.completed);
        
        if (currentCompletedSets.length > 0 && prevCompletedSets.length > 0) {
          const currentMaxWeight = Math.max(...currentCompletedSets.map(s => s.weight));
          const prevMaxWeight = Math.max(...prevCompletedSets.map(s => s.weight));
          
          const currentVolume = currentCompletedSets.reduce((sum, s) => sum + (s.weight * s.reps), 0);
          const prevVolume = prevCompletedSets.reduce((sum, s) => sum + (s.weight * s.reps), 0);
          
          const weightDiff = currentMaxWeight - prevMaxWeight;
          const volumeDiff = currentVolume - prevVolume;
          
          if (weightDiff > 0) {
            achievements.push({
              id: `${ex.id}-weight`,
              exercise: ex.name,
              type: 'Beban',
              diff: `+${weightDiff.toFixed(1)} kg`,
              detail: `Beban terberat naik ke ${currentMaxWeight} kg (sebelumnya ${prevMaxWeight} kg)`
            });
          }
          if (volumeDiff > 0) {
            achievements.push({
              id: `${ex.id}-volume`,
              exercise: ex.name,
              type: 'Volume Latihan',
              diff: `+${volumeDiff.toFixed(0)} kg`,
              detail: `Total volume naik ke ${currentVolume.toFixed(0)} kg (sebelumnya ${prevVolume.toFixed(0)} kg)`
            });
          }
        }
      }
    });
    
    return achievements;
  };

  const updateExercisesList = () => {
    if (workouts.length === 0) return;
    const dbExercises = [];
    workouts.forEach(w => {
      w.exercises?.forEach(ex => {
        if (!dbExercises.some(item => item.name.toLowerCase() === ex.name.toLowerCase())) {
          dbExercises.push({ name: ex.name, category: ex.category || 'General' });
        }
      });
    });
    
    // Merge database exercises with default ones
    setExercisesList(prev => {
      const merged = [...prev];
      dbExercises.forEach(dbEx => {
        if (!merged.some(m => m.name.toLowerCase() === dbEx.name.toLowerCase())) {
          merged.push(dbEx);
        }
      });
      return merged;
    });
  };

  useEffect(() => {
    updateExercisesList();
  }, [workouts]);

  // Fetch specific exercise data for detailed charting
  const viewExerciseDetail = async (exerciseName) => {
    setLoadingExerciseDetail(true);
    setSelectedExerciseDetail(exerciseName);
    setActiveTab('exercises'); // switch tab if not there
    try {
      const res = await fetch(`/api/analytics?exercise=${encodeURIComponent(exerciseName)}`);
      if (res.ok) {
        const data = await res.json();
        setExerciseHistoryData(data);
      }
    } catch (e) {
      console.error('Error fetching exercise detail history:', e);
    } finally {
      setLoadingExerciseDetail(false);
    }
  };

  // Helper: Find previous set parameters for progressive overload comparison
  const getPreviousWorkoutData = (exerciseName) => {
    if (!workouts || workouts.length === 0) return null;
    
    // Find the latest completed workout that contains this exercise
    for (const w of workouts) {
      if (!w.completed) continue;
      // Skip the active workout if it's already saved
      if (activeWorkout && activeWorkout.id === w.id) continue;
      
      const foundEx = w.exercises?.find(e => e.name.toLowerCase() === exerciseName.toLowerCase());
      if (foundEx && foundEx.sets?.some(s => s.completed)) {
        return foundEx.sets.filter(s => s.completed);
      }
    }
    return null;
  };

  // 3. Active Workout Operations
  const startNewWorkout = () => {
    setActiveWorkout({
      name: 'Workout ' + new Date().toLocaleDateString('id-ID', { weekday: 'long', hour: '2-digit', minute: '2-digit' }),
      date: new Date().toISOString(),
      notes: '',
      completed: false,
      exercises: []
    });
    setActiveTab('workout');
  };

  const addExerciseToActiveWorkout = (exName, exCategory) => {
    if (!activeWorkout) return;
    
    // Check if exercise already exists in active session
    if (activeWorkout.exercises.some(e => e.name.toLowerCase() === exName.toLowerCase())) {
      setShowExerciseSelector(false);
      return;
    }

    // Attempt to pull historical average sets
    const prevSets = getPreviousWorkoutData(exName);
    let defaultSets = [{ set_number: 1, weight: 10, reps: 10, completed: false }];
    
    if (prevSets && prevSets.length > 0) {
      defaultSets = prevSets.map((s, idx) => ({
        set_number: idx + 1,
        weight: s.weight,
        reps: s.reps,
        prev_weight: s.weight,
        completed: false
      }));
    }

    const updatedExercises = [
      ...activeWorkout.exercises,
      {
        name: exName,
        category: exCategory || 'General',
        notes: '',
        sets: defaultSets
      }
    ];

    setActiveWorkout({
      ...activeWorkout,
      exercises: updatedExercises
    });
    setShowExerciseSelector(false);
  };

  const removeExerciseFromActiveWorkout = (index) => {
    const updated = activeWorkout.exercises.filter((_, i) => i !== index);
    setActiveWorkout({ ...activeWorkout, exercises: updated });
  };

  const addSetToExercise = (exIndex) => {
    const ex = activeWorkout.exercises[exIndex];
    const lastSet = ex.sets[ex.sets.length - 1];
    
    const newSet = {
      set_number: ex.sets.length + 1,
      weight: lastSet ? lastSet.weight : 10,
      reps: lastSet ? lastSet.reps : 10,
      completed: false
    };

    const updatedExercises = [...activeWorkout.exercises];
    updatedExercises[exIndex].sets = [...ex.sets, newSet];
    setActiveWorkout({ ...activeWorkout, exercises: updatedExercises });
  };

  const removeSetFromExercise = (exIndex, setIndex) => {
    const ex = activeWorkout.exercises[exIndex];
    if (ex.sets.length <= 1) return; // keep at least 1 set
    
    const updatedSets = ex.sets.filter((_, i) => i !== setIndex).map((s, idx) => ({
      ...s,
      set_number: idx + 1
    }));

    const updatedExercises = [...activeWorkout.exercises];
    updatedExercises[exIndex].sets = updatedSets;
    setActiveWorkout({ ...activeWorkout, exercises: updatedExercises });
  };

  const updateSetValues = (exIndex, setIndex, field, value) => {
    const updatedExercises = [...activeWorkout.exercises];
    const updatedSet = { ...updatedExercises[exIndex].sets[setIndex] };
    
    if (field === 'completed') {
      updatedSet.completed = value;
      // If completed is checked and it breaks a PR, trigger sound/effect
      if (value) {
        const exName = updatedExercises[exIndex].name;
        const weightVal = parseFloat(updatedSet.weight) || 0;
        const repsVal = parseInt(updatedSet.reps) || 0;
        const currentEst1rm = weightVal * (1 + repsVal / 30);
        
        // Check if this is a PR (highest weight or est 1RM)
        const oldPr = analyticsData?.prs?.find(p => p.exercise_name.toLowerCase() === exName.toLowerCase());
        if (oldPr) {
          if (weightVal > oldPr.max_weight || currentEst1rm > oldPr.max_est_1rm) {
            // New local PR set! Trigger a mini-confetti burst
            confetti({
              particleCount: 50,
              spread: 60,
              origin: { y: 0.8 }
            });
          }
        }
      }
    } else {
      updatedSet[field] = value;
    }

    updatedExercises[exIndex].sets[setIndex] = updatedSet;
    setActiveWorkout({ ...activeWorkout, exercises: updatedExercises });
  };

  const saveActiveWorkout = async () => {
    if (!activeWorkout || activeWorkout.exercises.length === 0) return;
    
    // Check if any set was checked as completed
    const hasCompletedSets = activeWorkout.exercises.some(e => e.sets.some(s => s.completed));
    if (!hasCompletedSets) {
      alert('Tandai setidaknya satu set sebagai selesai (hijau) sebelum menyimpan latihan.');
      return;
    }

    setSubmittingWorkout(true);
    try {
      const res = await fetch('/api/workouts', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...activeWorkout,
          completed: true
        })
      });

      if (res.ok) {
        // Workout saved successfully! Large celebration confetti!
        confetti({
          particleCount: 150,
          spread: 80,
          origin: { y: 0.6 }
        });
        
        setActiveWorkout(null);
        await fetchWorkouts();
        await fetchAnalytics();
        setActiveTab('dashboard');
      } else {
        alert('Gagal menyimpan latihan.');
      }
    } catch (e) {
      console.error(e);
      alert('Koneksi bermasalah.');
    } finally {
      setSubmittingWorkout(false);
    }
  };

  const cancelActiveWorkout = () => {
    Modal.confirm({
      title: 'Batalkan Sesi Latihan?',
      content: 'Semua progres latihan yang sedang berjalan dan belum disimpan akan terhapus.',
      okText: 'Ya, Batalkan',
      cancelText: 'Tidak',
      okType: 'danger',
      centered: true,
      onOk: () => {
        setActiveWorkout(null);
      }
    });
  };

  const deleteWorkout = async (id) => {
    if (!confirm('Apakah Anda yakin ingin menghapus sesi latihan ini?')) return;
    try {
      const res = await fetch(`/api/workouts?id=${id}`, { method: 'DELETE' });
      if (res.ok) {
        await fetchWorkouts();
        await fetchAnalytics();
      } else {
        alert('Gagal menghapus latihan.');
      }
    } catch (e) {
      console.error(e);
    }
  };

  // 4. Progress Image Gallery Actions
  const handleImageUpload = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (file.size > 2.5 * 1024 * 1024) {
      alert('Ukuran foto terlalu besar. Maksimal 2.5 MB.');
      return;
    }

    setUploadingImage(true);
    
    const reader = new FileReader();
    reader.readAsDataURL(file);
    reader.onload = async () => {
      try {
        const base64Data = reader.result;
        const res = await fetch('/api/images', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            image_data: base64Data,
            notes: imageNotes
          })
        });

        if (res.ok) {
          setImageNotes('');
          await fetchGallery();
          alert('Foto progres berhasil diunggah!');
        } else {
          const err = await res.json();
          alert(err.error || 'Gagal mengunggah foto.');
        }
      } catch (err) {
        console.error(err);
        alert('Gagal mengunggah foto progres.');
      } finally {
        setUploadingImage(false);
      }
    };
  };

  const deleteImage = async (id) => {
    if (!confirm('Hapus foto progres ini?')) return;
    try {
      const res = await fetch(`/api/images?id=${id}`, { method: 'DELETE' });
      if (res.ok) {
        setSelectedImage(null);
        await fetchGallery();
      } else {
        alert('Gagal menghapus foto.');
      }
    } catch (e) {
      console.error(e);
    }
  };

  const capitalizeWords = (str) => {
    return str
      .toLowerCase()
      .split(' ')
      .filter(Boolean)
      .map(word => word.charAt(0).toUpperCase() + word.slice(1))
      .join(' ');
  };

  const handleAddCustomExercise = (e) => {
    e.preventDefault();
    if (!customExerciseName.trim()) return;

    const name = capitalizeWords(customExerciseName.trim());
    if (exercisesList.some(ex => ex.name.toLowerCase() === name.toLowerCase())) {
      alert('Gerakan ini sudah ada dalam daftar.');
      return;
    }

    const newEx = { name, category: customExerciseCategory };
    setExercisesList(prev => [newEx, ...prev]);
    addExerciseToActiveWorkout(newEx.name, newEx.category);
    setCustomExerciseName('');
  };

  // Auth Screen Render
  if (loadingAuth) {
    return (
      <ConfigProvider
        theme={{
          algorithm: theme.darkAlgorithm,
          token: {
            colorPrimary: '#2997ff',
            colorBgContainer: '#161617',
            colorBorder: '#333336',
            borderRadius: 8,
            colorText: '#ffffff',
            fontSize: 14,
          }
        }}
      >
        <div className="app-container justify-center items-center px-6">
          <div className="glass-card w-full max-w-sm p-8 flex flex-col items-center justify-center text-center gap-6 animate-pop-in">
            <div className="flex flex-col items-center gap-2 mb-2">
              <img src="/raga_logo.png" alt="Raga Logo" className="w-14 h-14 object-cover rounded-2xl border border-purple/10 shadow-lg shadow-purple/10" />
              <h1 className="text-2xl font-bold tracking-tight mt-3 mb-0">Raga</h1>
              <p className="text-xs text-secondary">Catat Volume, PR, & Progressive Overload</p>
            </div>
            
            {/* Circular Progress Bar */}
            <div className="relative w-32 h-32 flex items-center justify-center my-3">
              <svg className="w-full h-full transform -rotate-90" viewBox="0 0 100 100">
                <defs>
                  <linearGradient id="progressGradient" x1="0%" y1="0%" x2="100%" y2="100%">
                    <stop offset="0%" stopColor="#2997ff" />
                    <stop offset="100%" stopColor="#a855f7" />
                  </linearGradient>
                </defs>
                {/* Track Circle */}
                <circle
                  cx="50"
                  cy="50"
                  r="40"
                  stroke="rgba(255, 255, 255, 0.05)"
                  strokeWidth="6"
                  fill="transparent"
                />
                {/* Progress Circle */}
                <circle
                  cx="50"
                  cy="50"
                  r="40"
                  stroke="url(#progressGradient)"
                  strokeWidth="6"
                  fill="transparent"
                  strokeDasharray="251.3px"
                  strokeDashoffset={`${251.3 - (251.3 * loadingProgress) / 100}px`}
                  strokeLinecap="round"
                  className="transition-all duration-300 ease-out"
                  style={{
                    filter: 'drop-shadow(0px 0px 6px rgba(41, 151, 255, 0.5))'
                  }}
                />
              </svg>
              {/* Percentage Text inside */}
              <div className="absolute flex flex-col items-center justify-center">
                <span className="text-2xl font-black text-white tracking-tighter">{loadingProgress}%</span>
              </div>
            </div>
            
            {/* Loading Status Labels */}
            <div className="flex flex-col gap-2.5 w-full mt-2">
              <p className="text-[11px] font-semibold text-purple tracking-wider uppercase h-4 animate-pulse">
                {loadingProgress < 25 ? "Menginisialisasi modul..." :
                 loadingProgress < 50 ? "Memeriksa sesi pengguna..." :
                 loadingProgress < 75 ? "Memuat riwayat latihan..." :
                 loadingProgress < 95 ? "Menyelaraskan data fisik..." :
                 loadingProgress < 100 ? "Mempersiapkan dashboard..." :
                 "Selamat Berlatih! 🔥"}
              </p>
              <div className="w-full bg-white/5 h-1.5 rounded-full overflow-hidden border border-white/5">
                <div 
                  className="bg-purple h-full transition-all duration-300 rounded-full"
                  style={{ width: `${loadingProgress}%` }}
                ></div>
              </div>
            </div>
          </div>
        </div>
      </ConfigProvider>
    );
  }

  if (submittingAuth) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen text-center p-4">
        <style>{`
          @keyframes progressSlide {
            0% { left: -50%; }
            100% { left: 100%; }
          }
          .animate-progress-slide {
            animation: progressSlide 1.5s infinite linear;
          }
        `}</style>
        <div className="flex flex-col items-center gap-5">
          <img src="/raga_logo.png" alt="Raga Logo" className="w-14 h-14 object-cover rounded-2xl border border-purple/10 shadow-lg shadow-purple/10 animate-pulse" />
          <div className="w-32 h-1 bg-white/10 rounded-full overflow-hidden relative">
            <div className="absolute top-0 h-full bg-purple w-1/2 rounded-full animate-progress-slide"></div>
          </div>
          <p className="text-xs text-secondary font-medium tracking-wide">Memproses...</p>
        </div>
      </div>
    );
  }

  if (!user) {
    return (
      <ConfigProvider
        theme={{
          algorithm: theme.darkAlgorithm,
          token: {
            colorPrimary: '#2997ff',
            colorBgContainer: '#161617',
            colorBorder: '#333336',
            borderRadius: 8,
            colorText: '#ffffff',
            fontSize: 14,
          }
        }}
      >
        <div className="app-container justify-center items-center px-6">
          <div className="glass-card w-full max-w-sm animate-pop-in">
            <div className="flex flex-col items-center gap-2 mb-6">
              <img src="/raga_logo.png" alt="Raga Logo" className="w-14 h-14 object-cover rounded-2xl border border-purple/10 shadow-md shadow-purple/10" />
              <h1 className="text-2xl font-bold tracking-tight mt-2">Raga</h1>
              <p className="text-sm text-secondary text-center">Catat Volume, PR, & Progressive Overload</p>
            </div>

            {/* Error Message */}
            {authError && (
              <div className="bg-danger-glow border border-danger/20 text-rose-400 text-xs p-3 rounded-lg text-center mb-4">
                {authError}
              </div>
            )}

            {/* Success Message */}
            {authSuccessMessage && (
              <div className="bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 text-xs p-3 rounded-lg text-center mb-4 font-medium">
                {authSuccessMessage}
              </div>
            )}

            {/* LOGIN & REGISTER FORMS */}
            {(authMode === 'login' || authMode === 'register') && (
              <form onSubmit={handleAuthSubmit} className="flex flex-col gap-4">
                <div className="flex flex-col gap-1">
                  <label className="text-xs text-secondary font-medium">Username</label>
                  <Input 
                    placeholder="ex: andi_fit"
                    value={authForm.username}
                    onChange={e => setAuthForm({ ...authForm, username: e.target.value })}
                    className="h-11 text-sm"
                  />
                </div>

                <div className="flex flex-col gap-1">
                  <label className="text-xs text-secondary font-medium">Password</label>
                  <Input.Password 
                    placeholder="••••••"
                    value={authForm.password}
                    onChange={e => setAuthForm({ ...authForm, password: e.target.value })}
                    className="h-11 text-sm"
                  />
                </div>

                {authMode === 'login' && (
                  <div className="text-right -mt-2">
                    <span 
                      onClick={() => { setAuthMode('forgot'); setAuthError(''); setAuthSuccessMessage(''); setSimulatedEmailLink(''); }} 
                      className="text-[11px] text-purple hover:underline cursor-pointer font-semibold"
                    >
                      Lupa Password?
                    </span>
                  </div>
                )}

                <Button 
                  type="primary" 
                  htmlType="submit" 
                  size="large" 
                  block 
                  className="mt-2 h-12 text-sm font-semibold"
                >
                  {authMode === 'login' ? 'Masuk' : 'Daftar Baru'}
                </Button>
              </form>
            )}

            {/* FORGOT PASSWORD FORM */}
            {authMode === 'forgot' && (
              <form onSubmit={handleForgotSubmit} className="flex flex-col gap-4">
                <div className="flex flex-col gap-1">
                  <label className="text-xs text-secondary font-medium">Username</label>
                  <Input 
                    placeholder="Masukkan username Anda..."
                    value={forgotForm.username}
                    onChange={e => setForgotForm({ ...forgotForm, username: e.target.value })}
                    className="h-11 text-sm"
                  />
                </div>

                <Button 
                  type="primary" 
                  htmlType="submit" 
                  size="large" 
                  block 
                  className="mt-2 h-12 text-sm font-semibold"
                >
                  Kirim Link Reset
                </Button>

                {simulatedEmailLink && (
                  <div className="mt-2 bg-purple-glow/20 border border-purple/30 rounded-xl p-3.5 flex flex-col gap-2.5 animate-pop-in">
                    <div className="flex items-center gap-1.5 text-xs text-purple font-bold">
                      <Sparkles className="w-4 h-4 text-purple animate-pulse" />
                      <span>[SIMULASI EMAIL TERKIRIM]</span>
                    </div>
                    <p className="text-[11px] text-slate-300 leading-normal m-0">
                      Link reset password berhasil dibuat. Klik tombol di bawah untuk simulasi membuka email dan reset password:
                    </p>
                    <Button 
                      type="primary" 
                      size="small"
                      className="text-[11.5px] font-bold h-9 bg-purple hover:bg-purple/80"
                      onClick={() => {
                        const urlParams = new URLSearchParams(simulatedEmailLink.split('?')[1]);
                        const token = urlParams.get('token');
                        if (token) {
                          setResetToken(token);
                          setAuthMode('reset');
                          setAuthError('');
                          setAuthSuccessMessage('');
                        }
                      }}
                    >
                      👉 Reset Password Sekarang
                    </Button>
                  </div>
                )}
              </form>
            )}

            {/* RESET PASSWORD FORM */}
            {authMode === 'reset' && (
              <form onSubmit={handleResetSubmit} className="flex flex-col gap-4">
                <div className="flex flex-col gap-1">
                  <label className="text-xs text-secondary font-medium">Password Baru</label>
                  <Input.Password 
                    placeholder="Minimal 6 karakter"
                    value={resetForm.password}
                    onChange={e => setResetForm({ ...resetForm, password: e.target.value })}
                    className="h-11 text-sm"
                  />
                </div>

                <div className="flex flex-col gap-1">
                  <label className="text-xs text-secondary font-medium">Konfirmasi Password Baru</label>
                  <Input.Password 
                    placeholder="Ulangi password baru"
                    value={resetForm.confirmPassword}
                    onChange={e => setResetForm({ ...resetForm, confirmPassword: e.target.value })}
                    className="h-11 text-sm"
                  />
                </div>

                <Button 
                  type="primary" 
                  htmlType="submit" 
                  size="large" 
                  block 
                  className="mt-2 h-12 text-sm font-semibold"
                >
                  Simpan Password
                </Button>
              </form>
            )}

            {/* Bottom links */}
            <div className="mt-6 text-center text-xs text-secondary">
              {authMode === 'login' && (
                <p>
                  Belum punya akun?{' '}
                  <span className="text-purple cursor-pointer font-semibold hover:underline" onClick={() => { setAuthMode('register'); setAuthError(''); setAuthSuccessMessage(''); setSimulatedEmailLink(''); }}>
                    Daftar di sini
                  </span>
                </p>
              )}
              {authMode === 'register' && (
                <p>
                  Sudah punya akun?{' '}
                  <span className="text-purple cursor-pointer font-semibold hover:underline" onClick={() => { setAuthMode('login'); setAuthError(''); setAuthSuccessMessage(''); setSimulatedEmailLink(''); }}>
                    Masuk di sini
                  </span>
                </p>
              )}
              {(authMode === 'forgot' || authMode === 'reset') && (
                <p>
                  Kembali ke{' '}
                  <span className="text-purple cursor-pointer font-semibold hover:underline" onClick={() => { setAuthMode('login'); setAuthError(''); setAuthSuccessMessage(''); setSimulatedEmailLink(''); }}>
                    Halaman Masuk
                  </span>
                </p>
              )}
            </div>
          </div>
        </div>
      </ConfigProvider>
    );
  }

  // Filtered exercises for the selector dropdown
  const filteredExercises = exercisesList.filter(ex => 
    ex.name.toLowerCase().includes(searchTerm.toLowerCase()) || 
    ex.category.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <ConfigProvider
      theme={{
        algorithm: theme.darkAlgorithm,
        token: {
          colorPrimary: '#2997ff',
          colorBgContainer: '#161617',
          colorBorder: '#333336',
          borderRadius: 8,
          colorText: '#ffffff',
          fontSize: 14,
        }
      }}
    >
      <div className="app-container">
      {/* 1. Header */}
      <header className="app-header">
        <div className="flex items-center gap-2">
          <img src="/raga_logo.png" alt="Raga Logo" className="w-6 h-6 object-contain rounded-md" />
          <span className="font-bold text-gradient-purple tracking-tight">Raga</span>
        </div>
        <div className="flex items-center gap-3">
          <span className="text-xs font-semibold bg-white/5 border border-white/10 px-3 py-1.5 rounded-full text-secondary">
            @{user.username}
          </span>
        </div>
      </header>

      {/* 2. Main Tab Screen Content */}
      <main className="screen-content">
        
        {/* ==================== TAB 1: DASHBOARD ==================== */}
        {activeTab === 'dashboard' && (
          <div className="flex flex-col gap-5 animate-slide-up">
            
            {/* Highlight Banner: Days Work out this week */}
            <div className="glass-card bg-purple-glow border-purple/30 p-5 text-center">
              <span className="text-xs font-bold text-purple block tracking-wide uppercase">Konsistensi Mingguan</span>
              <h2 className="text-xl font-bold mt-1 text-slate-100">
                🔥 Kamu sudah latihan <span className="text-gradient-purple font-black text-2xl">{getWorkoutDaysThisWeek()}</span> hari minggu ini!
              </h2>
            </div>

            {/* Onboarding Guide Card for New Users */}
            {(!user.weight || !user.height || !user.age || workouts.length === 0) && (
              <div className="glass-card border-purple/30 bg-purple-glow/10 flex flex-col gap-4 p-5 animate-pop-in">
                <div className="flex items-center gap-2 border-b border-white/5 pb-3">
                  <Sparkles className="text-purple w-5 h-5 animate-pulse shrink-0" />
                  <div className="text-left">
                    <h3 className="text-sm font-bold m-0 text-slate-100">🚀 Panduan Memulai Raga</h3>
                    <p className="text-[10px] text-muted m-0 mt-0.5">Langkah mudah untuk mulai melacak latihan dan kalori harian Anda.</p>
                  </div>
                </div>

                <div className="flex flex-col gap-4 text-left">
                  {/* Step 1 */}
                  <div className="flex gap-3 items-start">
                    <div className={`w-5 h-5 rounded-full flex items-center justify-center text-[10px] font-bold shrink-0 mt-0.5 ${
                      (user.weight && user.height && user.age) 
                        ? 'bg-success text-white' 
                        : 'bg-white/10 text-secondary'
                    }`}>
                      {(user.weight && user.height && user.age) ? <Check className="w-3.5 h-3.5" /> : "1"}
                    </div>
                    <div className="flex-1">
                      <span className={`text-xs font-bold block ${
                        (user.weight && user.height && user.age) ? 'text-muted line-through' : 'text-slate-200'
                      }`}>
                        Lengkapi Profil Fisik & Target Kalori
                      </span>
                      <p className="text-[10px] text-muted m-0 mt-0.5 font-normal">
                        Masukkan berat badan, tinggi badan, umur, dan aktivitas untuk menghitung kebutuhan kalori dan TDEE Anda.
                      </p>
                      {!(user.weight && user.height && user.age) && (
                        <Button 
                          type="primary" 
                          size="small" 
                          onClick={() => setShowProfileModal(true)}
                          className="text-[10px] font-bold h-7 px-3 mt-2"
                        >
                          Lengkapi Profil
                        </Button>
                      )}
                    </div>
                  </div>

                  {/* Step 2 */}
                  <div className="flex gap-3 items-start">
                    <div className={`w-5 h-5 rounded-full flex items-center justify-center text-[10px] font-bold shrink-0 mt-0.5 ${
                      user.workout_program 
                        ? 'bg-success text-white' 
                        : 'bg-white/10 text-secondary'
                    }`}>
                      {user.workout_program ? <Check className="w-3.5 h-3.5" /> : "2"}
                    </div>
                    <div className="flex-1">
                      <span className="text-xs font-bold block text-slate-200">
                        Atur Program Latihan (Workout Split)
                      </span>
                      <p className="text-[10px] text-muted m-0 mt-0.5 font-normal">
                        Tentukan program split latihan Anda (saat ini: <strong>{user.workout_program || 'Upper, Lower'}</strong>).
                      </p>
                      <Button 
                        type="dashed" 
                        size="small" 
                        onClick={() => setShowProfileModal(true)}
                        className="text-[10px] font-bold h-7 px-3 mt-2 text-purple border-purple/30"
                      >
                        Atur Program Split
                      </Button>
                    </div>
                  </div>

                  {/* Step 3 */}
                  <div className="flex gap-3 items-start">
                    <div className={`w-5 h-5 rounded-full flex items-center justify-center text-[10px] font-bold shrink-0 mt-0.5 ${
                      workouts.length > 0 
                        ? 'bg-success text-white' 
                        : 'bg-white/10 text-secondary'
                    }`}>
                      {workouts.length > 0 ? <Check className="w-3.5 h-3.5" /> : "3"}
                    </div>
                    <div className="flex-1">
                      <span className={`text-xs font-bold block ${
                        workouts.length > 0 ? 'text-muted line-through' : 'text-slate-200'
                      }`}>
                        Mulai Latihan Pertama Anda
                      </span>
                      <p className="text-[10px] text-muted m-0 mt-0.5 font-normal">
                        Mulai sesi latihan kustom atau pilih dari split program (contoh: Upper/Lower) yang sudah diatur.
                      </p>
                      {workouts.length === 0 && (
                        <Button 
                          type="primary" 
                          size="small" 
                          onClick={startNewWorkout}
                          className="text-[10px] font-bold h-7 px-3 mt-2"
                        >
                          Mulai Latihan Baru
                        </Button>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* Calorie & Macro Target Card */}
            {(() => {
              const targets = calculateCalorieTargets();
              const consumed = getConsumedStats();
              const percent = Math.min(100, Math.round((consumed.consumedCalories / targets.targetCalories) * 100)) || 0;

              return (
                <div 
                  onClick={() => setExpandMacros(!expandMacros)}
                  className="glass-card cursor-pointer flex flex-col gap-4 transition-all duration-300 hover:border-purple/30 bg-purple/5"
                >
                  <div className="flex justify-between items-center">
                    <div>
                      <h3 className="text-sm font-semibold m-0 text-slate-100 flex items-center gap-1.5">
                        <Utensils className="w-4 h-4 text-purple" />
                        Target Kalori Harian
                      </h3>
                      {targets.isCompleted && (
                        <span className="text-[10px] text-purple font-semibold uppercase tracking-wider mt-0.5 block">
                          Tujuan: {user.fitness_goal === 'cutting' ? 'Cutting (Defisit)' : user.fitness_goal === 'bulking' ? 'Bulking (Surplus)' : 'Maintenance'} {targets.isDailyCustom && "(Kustom Hari Ini)"}
                        </span>
                      )}
                    </div>
                    <div className="flex gap-2">
                      <Button 
                        type="dashed" 
                        size="small" 
                        onClick={(e) => { e.stopPropagation(); openDailyTargetModal(); }}
                        className="text-[10px] font-semibold border-purple/30 text-purple"
                      >
                        Set Target
                      </Button>
                      <Button 
                        type="dashed" 
                        size="small" 
                        onClick={(e) => { e.stopPropagation(); setShowProfileModal(true); }}
                        className="text-[10px] font-semibold border-white/10 text-secondary"
                      >
                        Ubah Goal
                      </Button>
                    </div>
                  </div>

                  {/* Calorie Progress */}
                  <div className="flex gap-4 items-center">
                    <div className="flex-1 flex flex-col gap-1.5">
                      <div className="flex justify-between text-xs font-bold">
                        <span className="text-secondary">Konsumsi: {consumed.consumedCalories} kkal</span>
                        <span className="text-muted">Target: {targets.targetCalories} kkal</span>
                      </div>
                      
                      {/* Progress Bar */}
                      <div className="w-full h-2 bg-white/5 rounded-full overflow-hidden relative border border-white/5">
                        <div 
                          className="absolute top-0 left-0 h-full bg-purple rounded-full transition-all duration-500"
                          style={{ width: `${percent}%` }}
                        ></div>
                      </div>

                      <div className="flex justify-between items-center text-[10px] text-muted">
                        <span>{percent}% terpenuhi</span>
                        <span>{Math.max(0, targets.targetCalories - consumed.consumedCalories)} kkal tersisa</span>
                      </div>
                    </div>
                  </div>

                  {/* Macro Breakdown */}
                  <div className={`flex flex-col gap-3 border-t border-white/5 pt-3 transition-all duration-300 ${expandMacros ? 'block' : 'hidden'}`}>
                    <h4 className="text-[10px] font-bold text-secondary uppercase tracking-wider mb-0.5">Detail Makronutrisi (Hari Ini)</h4>
                    
                    <div className="grid grid-cols-3 gap-2 text-center">
                      {/* Protein */}
                      <div className="bg-white/5 border border-white/5 rounded-xl p-2.5 flex flex-col gap-1.5 justify-between">
                        <div className="flex flex-col gap-0.5">
                          <span className="text-[9px] text-muted uppercase tracking-wider font-bold">Protein</span>
                          <span className="text-xs font-bold text-muted">{consumed.consumedProtein}g / {targets.targetProtein}g</span>
                        </div>
                        <div className="w-full h-1.5 bg-white/10 rounded-full overflow-hidden my-0.5">
                          <div className="h-full bg-purple" style={{ width: `${Math.min(100, (consumed.consumedProtein / targets.targetProtein) * 100)}%`, backgroundColor: 'var(--primary)' }}></div>
                        </div>
                      </div>

                      {/* Carbs */}
                      <div className="bg-white/5 border border-white/5 rounded-xl p-2.5 flex flex-col gap-1.5 justify-between">
                        <div className="flex flex-col gap-0.5">
                          <span className="text-[9px] text-muted uppercase tracking-wider font-bold">Karbo</span>
                          <span className="text-xs font-bold text-muted">{consumed.consumedCarbs}g / {targets.targetCarbs}g</span>
                        </div>
                        <div className="w-full h-1.5 bg-white/10 rounded-full overflow-hidden my-0.5">
                          <div className="h-full bg-purple" style={{ width: `${Math.min(100, (consumed.consumedCarbs / targets.targetCarbs) * 100)}%`, backgroundColor: 'var(--primary)' }}></div>
                        </div>
                      </div>

                      {/* Fat */}
                      <div className="bg-white/5 border border-white/5 rounded-xl p-2.5 flex flex-col gap-1.5 justify-between">
                        <div className="flex flex-col gap-0.5">
                          <span className="text-[9px] text-muted uppercase tracking-wider font-bold">Lemak</span>
                          <span className="text-xs font-bold text-muted">{consumed.consumedFat}g / {targets.targetFat}g</span>
                        </div>
                        <div className="w-full h-1.5 bg-white/10 rounded-full overflow-hidden my-0.5">
                          <div className="h-full bg-purple" style={{ width: `${Math.min(100, (consumed.consumedFat / targets.targetFat) * 100)}%`, backgroundColor: 'var(--primary)' }}></div>
                        </div>
                      </div>
                    </div>
                  </div>

                  {!expandMacros && (
                    <div className="text-center text-[9px] text-muted hover:text-purple transition-all -mt-1">
                      👇 Klik untuk melihat detail makronutrisi harian Anda
                    </div>
                  )}
                </div>
              );
            })()}

            {/* Quick Stats Grid */}
            <div className="grid grid-cols-3 gap-3">
              <div className="glass-card p-3 flex flex-col justify-between items-center text-center">
                <span className="text-[9px] text-secondary font-bold uppercase tracking-wider block">Volume (Week)</span>
                <span className="text-sm font-bold mt-1 text-slate-100">
                  {getWeeklyVolume().toLocaleString('id-ID')} Set
                </span>
              </div>
              <div className="glass-card p-3 flex flex-col justify-between items-center text-center">
                <span className="text-[9px] text-secondary font-bold uppercase tracking-wider block">Sesi (Week)</span>
                <span className="text-sm font-bold mt-1 text-slate-100">
                  {getWeeklyWorkoutsCount()} Sesi
                </span>
              </div>
              <div className="glass-card p-3 flex flex-col justify-between items-center text-center">
                <span className="text-[9px] text-secondary font-bold uppercase tracking-wider block">New PR (Month)</span>
                <span className="text-sm font-bold mt-1 text-slate-100">
                  {getMonthlyPrsCount()} PR
                </span>
              </div>
            </div>

            {/* Start Session CTA */}
            {activeWorkout ? (
              <div 
                onClick={() => setActiveTab('workout')}
                className="glass-card bg-purple-glow border-purple/20 cursor-pointer flex justify-between items-center animate-pulse"
              >
                <div>
                  <h3 className="font-semibold text-purple text-sm">Latihan Sedang Berjalan</h3>
                  <p className="text-xs text-secondary mt-1">{activeWorkout.name}</p>
                </div>
                <ChevronRight className="text-purple" />
              </div>
            ) : (
              <Button 
                type="primary" 
                size="large" 
                block 
                icon={<PlusCircle className="w-5 h-5" />} 
                onClick={startNewWorkout}
                className="h-12 text-sm font-semibold"
              >
                Mulai Sesi Latihan Baru
              </Button>
            )}

            {/* Daily Activities Logger */}
            <div className="glass-card flex flex-col gap-4">
              <div className="flex justify-between items-center border-b border-white/5 pb-2">
                <h3 className="text-xs font-bold text-slate-200 uppercase tracking-wider m-0">Aktivitas Harian</h3>
                <span className="text-[10px] text-muted">Langkah & Kalori</span>
              </div>
              
              <form onSubmit={handleAddActivity} className="flex gap-2 items-center">
                <div className="flex-1">
                  <InputNumber 
                    placeholder="Langkah (steps)" 
                    value={activityForm.steps}
                    onChange={val => setActivityForm({ ...activityForm, steps: val })}
                    className="w-full text-xs h-9"
                    min={0}
                  />
                  {activityForm.steps && (
                    <div className="text-[9px] text-muted mt-1 ml-1">
                      Jarak: {(Number(activityForm.steps) * 0.00075 || 0).toFixed(2)} km
                    </div>
                  )}
                </div>
                <div className="flex-1">
                  <InputNumber 
                    placeholder="Kalori (kcal)" 
                    value={activityForm.calories}
                    onChange={val => setActivityForm({ ...activityForm, calories: val })}
                    className="w-full text-xs h-9"
                    min={0}
                  />
                </div>
                <Button 
                  type="primary" 
                  htmlType="submit" 
                  loading={submittingActivity}
                  className="h-9 px-4 text-xs font-bold shrink-0"
                >
                  Log
                </Button>
              </form>

              {/* Activities list */}
              {activities.length > 0 ? (
                <div className="flex flex-col gap-2 max-h-36 overflow-y-auto mt-1 pr-1">
                  {activities.map((act) => (
                    <div key={act.id} className="flex justify-between items-center bg-white/5 border border-white/5 rounded-xl p-2 text-xs">
                      <div>
                        <span className="font-semibold text-slate-200">
                          {act.steps.toLocaleString('id-ID')} langkah
                        </span>
                        <div className="flex gap-2.5 text-[9px] text-muted mt-0.5">
                          <span>{act.calories} kcal</span>
                          <span>{act.distance} km</span>
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        <span className="text-[10px] text-muted">
                          {new Date(act.date).toLocaleDateString('id-ID', { day: 'numeric', month: 'short' })}
                        </span>
                        <button 
                          type="button"
                          onClick={() => handleDeleteActivity(act.id)}
                          className="text-muted hover:text-rose-400 p-1 rounded transition-colors"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-2 text-[10px] text-muted">Belum ada catatan aktivitas.</div>
              )}
            </div>

            {/* Your Latest Achievement */}
            {getLatestAchievements().length > 0 && (
              <div className="glass-card border-l-4 border-l-emerald-400 flex flex-col gap-3">
                <div className="flex items-center gap-1.5 border-b border-white/5 pb-2">
                  <Sparkles className="text-emerald-400 w-4 h-4" />
                  <h3 className="text-xs font-bold text-emerald-400 uppercase tracking-wider m-0">Your Latest Achievement</h3>
                </div>
                <div className="flex flex-col gap-2">
                  {getLatestAchievements().map((ach, idx) => (
                    <div key={ach.id || idx} className="flex flex-col bg-emerald-500/5 border border-emerald-500/10 rounded-xl p-2.5">
                      <div className="flex justify-between items-center">
                        <span className="font-semibold text-xs text-slate-200">{ach.exercise}</span>
                        <span className="text-xs font-bold text-emerald-400">{ach.diff} ({ach.type})</span>
                      </div>
                      <p className="text-[10px] text-muted mt-1 mb-0 leading-normal">{ach.detail}</p>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Chart: Workout Weekly Volume Trend */}
            <div className="glass-card">
              <div className="flex justify-between items-center mb-4">
                <h3 className="text-sm font-semibold text-primary">Volume Latihan Mingguan</h3>
                <span className="text-[10px] bg-cyan-glow text-cyan-400 border border-cyan/20 px-2 py-0.5 rounded-full font-medium">
                  Trend (Set)
                </span>
              </div>
              <div className="w-full h-48">
                {analyticsData?.weeklyTrend?.length > 0 ? (
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={analyticsData.weeklyTrend}>
                      <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" />
                      <XAxis dataKey="weekLabel" stroke="var(--text-muted)" fontSize={10} tickLine={false} />
                      <YAxis stroke="var(--text-muted)" fontSize={10} tickLine={false} />
                      <Tooltip 
                        contentStyle={{ 
                          background: 'rgba(13, 17, 33, 0.95)', 
                          borderColor: 'var(--border-glass)',
                          borderRadius: '12px',
                          color: '#fff',
                          fontSize: '11px'
                        }} 
                      />
                      <Bar dataKey="totalVolume" name="Volume (Set)" fill="var(--info)" radius={[4, 4, 0, 0]} />
                    </BarChart>
                  </ResponsiveContainer>
                ) : (
                  <div className="flex items-center justify-center h-full text-xs text-muted">Belum ada data latihan.</div>
                )}
              </div>
            </div>

            {/* Chart: Frequency (Sessions per Week) */}
            <div className="glass-card">
              <div className="flex justify-between items-center mb-4">
                <h3 className="text-sm font-semibold text-primary">Frekuensi Latihan</h3>
                <span className="text-[10px] bg-purple-glow text-purple border border-purple/20 px-2 py-0.5 rounded-full font-medium">
                  Sesi / Minggu
                </span>
              </div>
              <div className="w-full h-48">
                {analyticsData?.weeklyTrend?.length > 0 ? (
                  <ResponsiveContainer width="100%" height="100%">
                    <LineChart data={analyticsData.weeklyTrend}>
                      <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" />
                      <XAxis dataKey="weekLabel" stroke="var(--text-muted)" fontSize={10} tickLine={false} />
                      <YAxis stroke="var(--text-muted)" fontSize={10} tickLine={false} allowDecimals={false} />
                      <Tooltip 
                        contentStyle={{ 
                          background: 'rgba(13, 17, 33, 0.95)', 
                          borderColor: 'var(--border-glass)',
                          borderRadius: '12px',
                          color: '#fff',
                          fontSize: '11px'
                        }} 
                      />
                      <Line type="monotone" dataKey="workoutsCount" name="Sesi" stroke="var(--primary)" strokeWidth={2} dot={{ fill: 'var(--primary)', r: 3 }} />
                    </LineChart>
                  </ResponsiveContainer>
                ) : (
                  <div className="flex items-center justify-center h-full text-xs text-muted">Belum ada data latihan.</div>
                )}
              </div>
            </div>            {/* Radar Chart: Muscle Volume Distribution (Sets per Week) */}
            {(() => {
              const { chartData, thisWeekSets, lastWeekSets } = getMuscleGroupStats();
              const hasData = chartData.some(d => d['Minggu Ini'] > 0 || d['Minggu Lalu'] > 0);
              const categories = ['Chest', 'Back', 'Leg', 'Shoulder', 'Bicep', 'Tricep', 'Core'];
              const labelMap = {
                Chest: 'Dada',
                Back: 'Punggung',
                Leg: 'Kaki',
                Shoulder: 'Bahu',
                Bicep: 'Bisep',
                Tricep: 'Trisep',
                Core: 'Inti/Perut'
              };
              
              return (
                <div className="glass-card flex flex-col gap-4">
                  <div className="flex justify-between items-center border-b border-white/5 pb-2">
                    <div>
                      <h3 className="text-xs font-bold text-gradient-purple uppercase tracking-wider m-0">Rating Stimulus Otot</h3>
                      <p className="text-[10px] text-muted mt-0.5 mb-0">Pembagian Volume Set per Otot (Mingguan)</p>
                    </div>
                    <span className="text-[9px] bg-purple-glow text-purple border border-purple/20 px-2 py-0.5 rounded-full font-medium">
                      Radar Chart
                    </span>
                  </div>

                  <div className="w-full h-56 flex items-center justify-center">
                    {hasData ? (
                      <ResponsiveContainer width="100%" height="100%">
                        <RadarChart cx="50%" cy="50%" outerRadius="70%" data={chartData}>
                          <PolarGrid stroke="rgba(255, 255, 255, 0.08)" />
                          <PolarAngleAxis 
                            dataKey="subject" 
                            tick={{ fill: 'var(--text-secondary)', fontSize: 10, fontWeight: '500' }} 
                          />
                          <PolarRadiusAxis 
                            angle={30} 
                            domain={[0, 'auto']} 
                            tick={{ fill: 'rgba(255, 255, 255, 0.4)', fontSize: 8 }}
                            axisLine={false}
                          />
                          <Radar 
                            name="Minggu Ini" 
                            dataKey="Minggu Ini" 
                            stroke="#2997ff" 
                            fill="#2997ff" 
                            fillOpacity={0.3} 
                          />
                          <Radar 
                            name="Minggu Lalu" 
                            dataKey="Minggu Lalu" 
                            stroke="#86868b" 
                            fill="#86868b" 
                            fillOpacity={0.15} 
                          />
                          <Tooltip 
                            contentStyle={{ 
                              background: 'rgba(13, 17, 33, 0.95)', 
                              borderColor: 'var(--border-glass)',
                              borderRadius: '12px',
                              color: '#fff',
                              fontSize: '11px'
                            }} 
                          />
                          <Legend 
                            wrapperStyle={{ fontSize: '10px', marginTop: '10px' }}
                            iconSize={8}
                          />
                        </RadarChart>
                      </ResponsiveContainer>
                    ) : (
                      <div className="flex items-center justify-center h-full text-xs text-muted">Belum ada data set latihan untuk minggu ini dan minggu lalu.</div>
                    )}
                  </div>

                  {/* WoW Progress List */}
                  {hasData && (
                    <div className="border-t border-white/5 pt-3 mt-1">
                      <h4 className="text-[10px] font-bold text-secondary uppercase tracking-wider mb-2">Progresi Otot per Minggu</h4>
                      <div className="grid grid-cols-2 gap-2">
                        {chartData.map((data) => {
                          const current = data['Minggu Ini'];
                          const prev = data['Minggu Lalu'];
                          const diff = current - prev;
                          let diffText = '';
                          let diffClass = '';
                          if (diff > 0) {
                            diffText = `+${diff} set 📈`;
                            diffClass = 'text-emerald-400 font-semibold bg-emerald-500/5 border-emerald-500/10';
                          } else if (diff < 0) {
                            diffText = `${diff} set 📉`;
                            diffClass = 'text-rose-400 font-semibold bg-rose-500/5 border-rose-500/10';
                          } else {
                            diffText = 'Sama';
                            diffClass = 'text-slate-400 font-medium bg-white/5 border-white/5';
                          }

                          return (
                            <div key={data.subject} className="bg-white/5 border border-white/10 rounded-xl p-2.5 flex flex-col gap-1.5">
                              <div className="flex justify-between items-center">
                                <span className="text-xs font-semibold text-slate-200">{data.subject}</span>
                                <span className="text-[10px] text-muted font-bold">{current} set</span>
                              </div>
                              <div className="flex justify-between items-center border-t border-white/5 pt-1.5">
                                <span className="text-[8px] text-muted uppercase tracking-wider">WoW Progress</span>
                                <span className={`text-[9.5px] px-1.5 py-0.5 rounded border ${diffClass}`}>{diffText}</span>
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  )}

                  {/* Pencapaian Volume Set (Target Min. 10 Set) */}
                  {hasData && (
                    <div className="border-t border-white/5 pt-3 mt-1">
                      <h4 className="text-[10px] font-bold text-secondary uppercase tracking-wider mb-2">Pencapaian Volume Set (Target Min. 10 Set)</h4>
                      <div className="flex flex-col gap-2.5">
                        {categories.map(cat => {
                          const count = thisWeekSets[cat] || 0;
                          const target = 10;
                          const pct = Math.min(100, Math.round((count / target) * 100));
                          
                          return (
                            <div key={cat} className="flex flex-col gap-1">
                              <div className="flex justify-between items-center text-[10px]">
                                <span className="font-semibold text-slate-300">{labelMap[cat]}</span>
                                <span className="text-muted font-bold">{count} / {target} set</span>
                              </div>
                              <div className="w-full h-1.5 bg-white/5 rounded-full overflow-hidden border border-white/5">
                                <div 
                                  className="h-full rounded-full transition-all duration-500" 
                                  style={{ 
                                    width: `${pct}%`, 
                                    backgroundColor: pct >= 100 ? '#30d158' : '#2997ff' 
                                  }}
                                ></div>
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  )}
                </div>
              );
            })()}

            {/* Chart: Tren Diet & Kalori (7 Hari Terakhir) */}
            {analyticsData?.nutritionTrend?.length > 0 && (
              <div className="glass-card">
                <div className="flex justify-between items-center mb-4 border-b border-white/5 pb-2">
                  <div>
                    <h3 className="text-sm font-semibold text-primary m-0">Tren Asupan Kalori Harian</h3>
                    <p className="text-[10px] text-muted mt-0.5 mb-0">Konsumsi Kalori vs Target (7 Hari Terakhir)</p>
                  </div>
                  <span className="text-[10px] bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 px-2 py-0.5 rounded-full font-medium">
                    Diet Chart
                  </span>
                </div>
                <div className="w-full h-48">
                  {(() => {
                    const targets = calculateCalorieTargets();
                    return (
                      <ResponsiveContainer width="100%" height="100%">
                        <BarChart data={analyticsData.nutritionTrend}>
                          <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" />
                          <XAxis dataKey="label" stroke="var(--text-muted)" fontSize={10} tickLine={false} />
                          <YAxis stroke="var(--text-muted)" fontSize={10} tickLine={false} />
                          <Tooltip 
                            contentStyle={{ 
                              background: 'rgba(13, 17, 33, 0.95)', 
                              borderColor: 'var(--border-glass)',
                              borderRadius: '12px',
                              color: '#fff',
                              fontSize: '11px'
                            }} 
                            formatter={(value) => [`${value} kcal`, 'Asupan']}
                          />
                          <Bar dataKey="calories" name="Kalori" fill="#2997ff" radius={[4, 4, 0, 0]} />
                          {targets.targetCalories > 0 && (
                            <ReferenceLine 
                              y={targets.targetCalories} 
                              stroke="#ff453a" 
                              strokeDasharray="4 4" 
                              label={{ 
                                value: `Target: ${targets.targetCalories} kcal`, 
                                fill: '#ff453a', 
                                position: 'top',
                                fontSize: 9,
                                fontWeight: 'bold'
                              }} 
                            />
                          )}
                        </BarChart>
                      </ResponsiveContainer>
                    );
                  })()}
                </div>
              </div>
            )}

            {/* Recent Workout History List (Detailed Cards) */}
            <div>
              <h2 className="text-sm font-semibold text-secondary mb-3">Aktivitas Terakhir</h2>
              <div className="flex flex-col gap-4">
                {workouts.length > 0 ? (
                  workouts.map((w, idx) => (
                    <div key={w.id || idx} className="glass-card flex flex-col gap-3">
                      
                      {/* Workout Card Header */}
                      <div className="flex justify-between items-start border-b border-white/5 pb-2.5">
                        <div>
                          <h4 className="font-bold text-sm text-gradient-purple">{w.name}</h4>
                          <span className="flex items-center gap-1.5 text-[10px] text-muted mt-1">
                            <Calendar className="w-3.5 h-3.5" />
                            {new Date(w.date).toLocaleDateString('id-ID', { dateStyle: 'medium' })}
                          </span>
                        </div>
                        <div className="flex gap-2">
                          <Button 
                            type="dashed"
                            size="small"
                            icon={<Edit3 className="w-3.5 h-3.5 text-purple" />}
                            onClick={() => loadWorkoutForEditing(w)}
                            className="text-[10px] font-semibold border-purple/30 text-purple"
                          >
                            Edit
                          </Button>
                          <Button 
                            danger
                            type="text"
                            size="small"
                            icon={<Trash2 className="w-3.5 h-3.5 text-rose-400" />}
                            onClick={() => deleteWorkout(w.id)}
                            className="text-[10px] font-semibold p-1"
                          />
                        </div>
                      </div>

                      {/* Workout Notes */}
                      {w.notes && (
                        <p className="text-[11px] text-slate-300 italic leading-relaxed bg-white/5 p-2.5 rounded-lg m-0 border border-white/5">
                          "{w.notes}"
                        </p>
                      )}

                      {/* Workout Exercises & Sets Detail */}
                      <div className="flex flex-col gap-3 mt-1">
                        {w.exercises?.map((ex, exIdx) => {
                          const anatomy = getExerciseAnatomyInfo(ex.name, ex.category);
                          return (
                            <div key={ex.id || exIdx} className="bg-white/5 border border-white/5 rounded-xl p-3 flex flex-col gap-2">
                              <div className="flex justify-between items-center">
                                <span className="font-bold text-xs text-slate-200">{ex.name}</span>
                                <span className="text-[9px] text-muted bg-white/10 px-2 py-0.5 rounded-full">{ex.category}</span>
                              </div>
                              <div className="text-[10px] text-purple/90 font-semibold -mt-1">
                                🎯 Target: {anatomy.detail} ({anatomy.target})
                              </div>
                            
                            {/* Sets rows */}
                            <div className="flex flex-wrap gap-2 mt-1">
                              {ex.sets?.map((set, setIdx) => (
                                <div 
                                  key={set.id || setIdx} 
                                  className={`flex items-center gap-1 px-2.5 py-1 rounded-lg text-[10px] border ${
                                    set.completed 
                                      ? 'bg-success-glow/20 border-success/20 text-emerald-400' 
                                      : 'bg-white/5 border-white/5 text-slate-400'
                                  }`}
                                >
                                  <span className="font-bold">S{set.set_number}:</span>
                                  <span>{set.weight} kg</span>
                                  <span>x</span>
                                  <span>{set.reps} r</span>
                                </div>
                              ))}
                            </div>
                          </div>
                        );
                      })}
                      </div>
                    </div>
                  ))
                ) : (
                  <div className="text-center p-8 bg-white/5 border border-white/10 rounded-2xl text-xs text-muted">
                    Belum ada riwayat latihan. Klik tombol di atas untuk memulai!
                  </div>
                )}
              </div>
            </div>
          </div>
        )}

        {/* ==================== TAB 2: WORKOUT WRITER / EDITOR ==================== */}
        {activeTab === 'workout' && (
          <div className="flex flex-col gap-5 animate-slide-up">
            {activeWorkout ? (
              <>
                {/* Active Session Header Card */}
                <div className="glass-card">
                  <div className="flex flex-col gap-3">
                    <div className="flex justify-between items-center">
                      <h2 className="text-base font-bold text-gradient-purple">Sesi Latihan Aktif</h2>
                      <span className="badge badge-success animate-pulse">Latihan...</span>
                    </div>
                    <div className="flex flex-col gap-1">
                      <label className="text-[10px] text-secondary font-medium uppercase tracking-wider">Nama Latihan</label>
                      <Input 
                        value={activeWorkout.name}
                        onChange={e => setActiveWorkout({ ...activeWorkout, name: e.target.value })}
                        className="h-10 text-sm font-semibold"
                      />
                    </div>

                    {/* Quick Program Split Pills */}
                    {(() => {
                      const splitOptions = user.workout_program 
                        ? user.workout_program.split(',').map(s => s.trim()).filter(Boolean)
                        : ['Upper', 'Lower'];
                      return (
                        <div className="flex flex-col gap-1.5 mt-1 text-left">
                          <label className="text-[10px] text-secondary font-medium uppercase tracking-wider">Pilih Bagian Latihan (Program Split)</label>
                          <div className="flex gap-2 flex-wrap">
                            {splitOptions.map((splitName, idx) => {
                              const isActive = activeWorkout.name.toLowerCase().includes(splitName.toLowerCase());
                              return (
                                <div
                                  key={idx}
                                  onClick={() => {
                                    setActiveWorkout({
                                      ...activeWorkout,
                                      name: `Sesi ${splitName}`
                                    });
                                  }}
                                  className={`px-3.5 py-1.5 rounded-full text-xs font-bold border cursor-pointer transition-all ${
                                    isActive
                                      ? 'bg-purple border-purple text-white shadow-md shadow-purple/10'
                                      : 'bg-white/5 border-white/10 text-secondary hover:text-slate-200'
                                  }`}
                                >
                                  {splitName}
                                </div>
                              );
                            })}
                          </div>
                        </div>
                      );
                    })()}
                    <div className="flex flex-col gap-1">
                      <label className="text-[10px] text-secondary font-medium uppercase tracking-wider">Tanggal & Waktu</label>
                      <DatePicker
                        showTime
                        format="YYYY-MM-DD HH:mm"
                        value={activeWorkout.date ? dayjs(activeWorkout.date) : null}
                        onChange={date => {
                          if (date) {
                            setActiveWorkout({ ...activeWorkout, date: date.toISOString() });
                          }
                        }}
                        style={{ width: '100%' }}
                        className="bg-transparent border-white/10 hover:border-purple focus:border-purple text-xs h-10"
                      />
                    </div>
                    <div className="flex flex-col gap-1">
                      <label className="text-[10px] text-secondary font-medium uppercase tracking-wider">Catatan</label>
                      <Input.TextArea 
                        placeholder="Tambahkan catatan latihan (opsional)..."
                        value={activeWorkout.notes}
                        onChange={e => setActiveWorkout({ ...activeWorkout, notes: e.target.value })}
                        className="text-xs py-2 h-14 resize-none"
                      />
                    </div>
                  </div>
                </div>

                {/* Workout Exercises Editor */}
                {activeWorkout.exercises.map((ex, exIdx) => {
                  const prevSets = getPreviousWorkoutData(ex.name);
                  
                  return (
                    <div key={exIdx} className="glass-card border-l-4 border-l-purple flex flex-col gap-3">
                      <div className="flex justify-between items-start">
                        <div>
                          <h4 className="font-semibold text-sm">{ex.name}</h4>
                          <div className="flex gap-2 items-center flex-wrap mt-1">
                            <span className="text-[10px] text-muted bg-white/5 border border-white/10 px-2 py-0.5 rounded">
                              {ex.category}
                            </span>
                            <span className="text-[10.5px] text-purple/90 font-semibold">
                              🎯 {getExerciseAnatomyInfo(ex.name, ex.category).detail}
                            </span>
                          </div>
                        </div>
                        <Button 
                          type="text" 
                          danger
                          icon={<Trash2 className="w-4 h-4" />}
                          onClick={() => removeExerciseFromActiveWorkout(exIdx)}
                          className="p-1 h-auto flex items-center justify-center"
                        />
                      </div>

                      {/* Overload Indicator Box */}
                      {prevSets && prevSets.length > 0 && (
                        <div className="bg-cyan-glow/30 border border-cyan/10 rounded-lg p-2 text-[10px] text-cyan-400 flex items-start gap-1.5">
                          <Info className="w-3.5 h-3.5 mt-0.5 shrink-0" />
                          <div>
                            <span className="font-bold">Info Sesi Lalu:</span>{' '}
                            {prevSets.map((s, i) => `${s.weight} kg x ${s.reps}`).join(' | ')}
                          </div>
                        </div>
                      )}

                      {/* Sets Table */}
                      <div className="overflow-x-auto w-full pb-1">
                        <div className="min-w-[320px] flex flex-col gap-2">
                          <div className="grid grid-cols-[36px_1.5fr_1.5fr_50px] gap-2 mb-1 text-[10px] text-muted font-bold uppercase tracking-wider text-center">
                            <div className="text-left pl-2">Set</div>
                            <div>Beban</div>
                            <div>Reps</div>
                            <div>Centang</div>
                          </div>

                          {ex.sets.map((set, setIdx) => (
                            <div key={setIdx} className="flex flex-col gap-1.5">
                              <div className="grid grid-cols-[36px_1.5fr_1.5fr_50px] gap-2 items-end">
                                {/* Set Number Column */}
                                <div style={{ display: 'flex', flexDirection: 'column', gap: '2px', alignItems: 'center' }}>
                                  <span style={{ height: '11px', display: 'block' }}></span>
                                  <span className="text-xs text-muted text-center font-bold">{set.set_number}</span>
                                </div>
                                
                                {/* Weight Input with small previous weight above */}
                                <div style={{ display: 'flex', flexDirection: 'column', gap: '2px' }}>
                                  {set.prev_weight !== undefined && set.prev_weight !== null ? (
                                    <span style={{ fontSize: '8.5px', color: 'var(--info)', fontWeight: '700', textAlign: 'center', display: 'block', height: '11px', lineHeight: '11px' }}>
                                      Lalu: {set.prev_weight}kg
                                    </span>
                                  ) : (
                                    <span style={{ height: '11px', display: 'block' }}></span>
                                  )}
                                  <div className="input-wrapper-suffix">
                                    <input 
                                      type="number" 
                                      step="0.5"
                                      placeholder="0"
                                      value={set.weight !== undefined && set.weight !== null ? set.weight : ''}
                                      onChange={e => updateSetValues(exIdx, setIdx, 'weight', e.target.value === '' ? '' : parseFloat(e.target.value))}
                                    />
                                    <span>kg</span>
                                  </div>
                                </div>

                                {/* Reps Input */}
                                <div style={{ display: 'flex', flexDirection: 'column', gap: '2px' }}>
                                  <span style={{ height: '11px', display: 'block' }}></span>
                                  <div className="input-wrapper-suffix">
                                    <input 
                                      type="number" 
                                      placeholder={set.target_reps !== undefined && set.target_reps !== null ? set.target_reps.toString() : "0"}
                                      value={set.reps !== undefined && set.reps !== null ? set.reps : ''}
                                      onChange={e => updateSetValues(exIdx, setIdx, 'reps', e.target.value === '' ? '' : parseInt(e.target.value))}
                                    />
                                    <span>reps</span>
                                  </div>
                                </div>

                                {/* Completed Checkbox Column */}
                                <div style={{ display: 'flex', flexDirection: 'column', gap: '2px', justifySelf: 'center' }}>
                                  <span style={{ height: '11px', display: 'block' }}></span>
                                  <div 
                                    onClick={() => updateSetValues(exIdx, setIdx, 'completed', !set.completed)}
                                    className={`set-checkbox mx-auto ${set.completed ? 'checked' : ''}`}
                                  >
                                    {set.completed && <Check className="w-3.5 h-3.5" />}
                                  </div>
                                </div>
                              </div>

                              {/* Target Reference Info Badge */}
                              {(set.target_reps !== undefined || set.target_rir !== undefined) && (
                                <div className="pl-9 text-[9.5px] text-purple/85 font-medium flex items-center gap-1">
                                  <span className="text-slate-500 font-bold uppercase tracking-wider text-[8px]">Patokan Rencana:</span>
                                  <span className="bg-purple/10 px-2 py-0.5 rounded text-purple border border-purple/10 font-bold">
                                    {set.target_reps !== undefined ? `${set.target_reps} reps` : ''} 
                                    {set.target_rir !== undefined && set.target_rir !== '' ? ` @ RIR ${set.target_rir}` : ''}
                                  </span>
                                </div>
                              )}
                            </div>
                          ))}
                        </div>
                      </div>

                      {/* Set Modifiers buttons */}
                      <div className="flex gap-2 justify-end mt-2">
                        {ex.sets.length > 1 && (
                          <Button 
                            danger 
                            size="small" 
                            onClick={() => removeSetFromExercise(exIdx, ex.sets.length - 1)}
                            className="text-[11px] font-semibold"
                          >
                            Hapus Set Terakhir
                          </Button>
                        )}
                        <Button 
                          type="dashed" 
                          size="small" 
                          icon={<Plus className="w-3.5 h-3.5" />}
                          onClick={() => addSetToExercise(exIdx)}
                          className="text-[11px] font-semibold text-purple"
                        >
                          Tambah Set
                        </Button>
                      </div>
                    </div>
                  );
                })}

                {/* Big Action Buttons */}
                <div className="flex flex-col gap-3 mt-4">
                  <Button 
                    type="dashed" 
                    size="large" 
                    block 
                    icon={<Plus className="w-5 h-5" />} 
                    onClick={() => setShowExerciseSelector(true)}
                    className="h-12 border-dashed border-2 hover:border-purple/40 text-sm font-semibold"
                  >
                    Tambah Gerakan
                  </Button>

                  <Button 
                    type="primary" 
                    size="large" 
                    block 
                    loading={submittingWorkout}
                    onClick={saveActiveWorkout}
                    className="h-12 text-sm font-semibold"
                  >
                    Simpan Latihan
                  </Button>

                  <Button 
                    danger
                    size="large" 
                    block 
                    onClick={cancelActiveWorkout}
                    className="h-12 text-sm font-semibold border-none"
                    style={{ color: '#ff453a', background: 'rgba(255, 69, 58, 0.1)' }}
                  >
                    Batalkan Sesi Latihan
                  </Button>
                </div>
              </>
            ) : (
              // Workout Hub Home (if not workout active) - Routines and split programs list
              <div className="flex flex-col gap-5 text-left animate-slide-up">
                <div className="flex justify-between items-center">
                  <h2 className="text-xs font-bold text-secondary uppercase tracking-wider mb-0">Program & Split Latihan</h2>
                  <Button 
                    type="primary" 
                    size="small" 
                    icon={<Plus className="w-3.5 h-3.5" />}
                    onClick={() => {
                      setTemplateForm({ id: null, name: '', exercises: [] });
                      setShowTemplateModal(true);
                    }}
                    className="text-[10px] font-bold h-8 px-3 rounded-lg flex items-center gap-1"
                  >
                    Buat Rencana
                  </Button>
                </div>

                {/* Templates list */}
                {templates.length > 0 ? (
                  <div className="flex flex-col gap-3">
                    {templates.map((temp) => (
                      <div key={temp.id} className="glass-card flex flex-col gap-3.5 border border-white/5 hover:border-purple/20 transition-all p-5">
                        <div className="flex justify-between items-start">
                          <div>
                            <h3 className="font-bold text-sm text-slate-100 m-0">{temp.name}</h3>
                            <span className="text-[9.5px] text-purple font-semibold uppercase tracking-wider mt-0.5 block">
                              Rencana Latihan (Split)
                            </span>
                          </div>
                          <div className="flex gap-2">
                            <Button 
                              type="text" 
                              size="small"
                              onClick={() => {
                                // Convert old sets array format to new object format for editing if necessary
                                const formattedExercises = (temp.exercises || []).map(ex => {
                                  let setsObj = { sets_count: 4, reps_target: "8 - 12", rir_target: 2 };
                                  if (ex.sets) {
                                    if (Array.isArray(ex.sets)) {
                                      if (ex.sets.length > 0) {
                                        setsObj = {
                                          sets_count: ex.sets.length,
                                          reps_target: ex.sets[0].reps !== undefined ? ex.sets[0].reps.toString() : "10",
                                          rir_target: ex.sets[0].rir !== undefined ? ex.sets[0].rir : 2
                                        };
                                      }
                                    } else {
                                      setsObj = ex.sets;
                                    }
                                  }
                                  return {
                                    ...ex,
                                    sets: setsObj
                                  };
                                });

                                setTemplateForm({
                                  id: temp.id,
                                  name: temp.name,
                                  exercises: formattedExercises
                                });
                                setShowTemplateModal(true);
                              }}
                              className="text-[10.5px] font-semibold text-secondary hover:text-slate-200 h-auto p-1"
                            >
                              Edit
                            </Button>
                            <Button 
                              type="text" 
                              danger
                              size="small"
                              onClick={() => handleDeleteTemplate(temp.id)}
                              className="text-[10.5px] font-semibold text-rose-400 h-auto p-1"
                            >
                              Hapus
                            </Button>
                          </div>
                        </div>

                        {/* Exercises preview */}
                        <div className="flex flex-col gap-1.5 mt-2">
                          {temp.exercises?.map((ex, idx) => {
                            let setsDetails = '';
                            if (ex.sets) {
                              if (!Array.isArray(ex.sets)) {
                                setsDetails = ` (${ex.sets.sets_count} set × ${ex.sets.reps_target} reps @ RIR ${ex.sets.rir_target})`;
                              } else if (Array.isArray(ex.sets) && ex.sets.length > 0) {
                                setsDetails = ` (${ex.sets.length} set × ${ex.sets[0].reps !== undefined ? ex.sets[0].reps : '10'} reps)`;
                              }
                            }
                            return (
                              <div key={idx} className="flex items-center justify-between text-[11px] py-1 border-b border-white/5 last:border-none">
                                <span className="font-semibold text-slate-200">{ex.name}</span>
                                <span className="text-[10px] text-purple/90 font-medium">{setsDetails}</span>
                              </div>
                            );
                          })}
                        </div>

                        <Button 
                          type="primary" 
                          block
                          onClick={() => startWorkoutFromTemplate(temp)}
                          className="h-10 text-xs font-semibold mt-2 bg-emerald-500 hover:bg-emerald-400 border-none rounded-xl"
                        >
                          Mulai Latihan Dari Rencana Ini
                        </Button>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="glass-card bg-purple-glow/10 border-dashed border-2 border-white/10 p-8 text-center flex flex-col items-center gap-3">
                    <div className="w-12 h-12 rounded-full bg-purple/10 flex items-center justify-center border border-purple/20">
                      <Dumbbell className="text-purple w-6 h-6 animate-pulse" />
                    </div>
                    <div>
                      <h4 className="font-bold text-xs text-slate-200 m-0">Belum ada Rencana Split kustom</h4>
                      <p className="text-[10px] text-muted m-0 mt-1.5 max-w-[220px] mx-auto leading-relaxed">
                        Tulis rencana latihan Anda (misal: *Upper Body*) dan tentukan set serta repetisinya langsung untuk pencatatan instan.
                      </p>
                    </div>
                    <Button 
                      type="primary" 
                      onClick={() => {
                        setTemplateForm({ id: null, name: '', exercises: [] });
                        setShowTemplateModal(true);
                      }}
                      className="text-[10px] font-bold h-8 px-4 rounded-lg mt-1"
                    >
                      Buat Rencana Split Pertama
                    </Button>
                  </div>
                )}

                {/* Start empty session */}
                <div className="border-t border-white/5 pt-4 mt-1">
                  <Button 
                    type="dashed"
                    block
                    onClick={startNewWorkout}
                    className="h-12 text-xs font-bold border-dashed border hover:border-purple/30 text-secondary bg-transparent rounded-xl"
                  >
                    Mulai Latihan Kosong (Ad-hoc)
                  </Button>
                </div>
              </div>
            )}
          </div>
        )}

        {/* ==================== TAB 3: EXERCISES & DETAIL CHARTS ==================== */}
        {activeTab === 'exercises' && (
          <div className="flex flex-col gap-5 animate-slide-up">
            
            {/* If checking detail chart of a movement */}
            {selectedExerciseDetail ? (
              <div className="flex flex-col gap-4">
                <button 
                  onClick={() => {
                    setSelectedExerciseDetail(null);
                    setExerciseHistoryData(null);
                  }}
                  className="btn-secondary w-fit text-xs font-semibold py-1.5 px-3 mb-2"
                >
                  <ArrowLeft className="w-4 h-4" /> Kembali
                </button>

                <div className="glass-card">
                  <h2 className="text-base font-bold text-gradient-purple">{selectedExerciseDetail}</h2>
                  {loadingExerciseDetail ? (
                    <p className="text-xs text-muted mt-2">Memuat riwayat...</p>
                  ) : exerciseHistoryData?.history?.length > 0 ? (
                    <>
                      {/* Progressive Overload analysis feedback */}
                      {exerciseHistoryData.progressiveOverload && (
                        <div className={`mt-3 p-3 rounded-xl border text-xs font-medium ${
                          exerciseHistoryData.progressiveOverload.status === 'overloaded' 
                            ? 'bg-success-glow border-success/20 text-emerald-400' 
                            : 'bg-white/5 border-white/10 text-secondary'
                        }`}>
                          {exerciseHistoryData.progressiveOverload.message}
                        </div>
                      )}
                      
                      {/* Summary calculations */}
                      {(() => {
                        const history = exerciseHistoryData.history;
                        const maxWeight = Math.max(...history.map(h => h.max_weight || 0));
                        const maxReps = Math.max(...history.map(h => h.max_reps || 0));
                        const maxSets = Math.max(...history.map(h => h.total_volume || 0));
                        const maxEst1RM = Math.max(...history.map(h => h.max_est_1rm || 0));
                        const show1RM = maxWeight > 0;

                        return (
                          <>
                            <div className="grid grid-cols-2 gap-3 mt-4">
                              <div className="bg-white/5 border border-white/10 rounded-xl p-2.5 text-center">
                                <span className="text-[10px] text-muted block">
                                  {show1RM ? 'PR Beban Terberat' : 'PR Repetisi Terbanyak'}
                                </span>
                                <span className="text-base font-bold text-gradient-cyan">
                                  {show1RM ? `${maxWeight} kg` : `${maxReps} reps`}
                                </span>
                              </div>
                              <div className="bg-white/5 border border-white/10 rounded-xl p-2.5 text-center">
                                <span className="text-[10px] text-muted block">
                                  {show1RM ? 'PR Estimasi 1RM' : 'PR Set Terbanyak'}
                                </span>
                                <span className="text-base font-bold text-gradient-purple">
                                  {show1RM ? `${maxEst1RM.toFixed(1)} kg` : `${maxSets} set`}
                                </span>
                              </div>
                            </div>
                          </>
                        );
                      })()}
                    </>
                  ) : (
                    <p className="text-xs text-muted mt-2">Belum ada riwayat tercatat untuk gerakan ini.</p>
                  )}
                </div>

                {/* Graph: Estimated 1RM (PR) Over Time (Only for weighted movements) */}
                {(() => {
                  const history = exerciseHistoryData?.history || [];
                  const maxWeight = history.length > 0 ? Math.max(...history.map(h => h.max_weight || 0)) : 0;
                  if (maxWeight <= 0) return null;
                  
                  return (
                    <div className="glass-card">
                      <h3 className="text-xs font-bold text-secondary mb-3 uppercase tracking-wider">Perkembangan Estimasi 1RM (PR)</h3>
                      <div className="w-full h-48">
                        <ResponsiveContainer width="100%" height="100%">
                          <LineChart data={history}>
                            <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" />
                            <XAxis 
                              dataKey="date" 
                              stroke="var(--text-muted)" 
                              fontSize={9} 
                              tickFormatter={(str) => new Date(str).toLocaleDateString('id-ID', { day: 'numeric', month: 'short' })}
                              tickLine={false} 
                            />
                            <YAxis stroke="var(--text-muted)" fontSize={9} tickLine={false} domain={['dataMin - 5', 'dataMax + 5']} />
                            <Tooltip 
                              contentStyle={{ 
                                background: 'rgba(13, 17, 33, 0.95)', 
                                borderColor: 'var(--border-glass)',
                                borderRadius: '12px',
                                color: '#fff',
                                fontSize: '11px'
                              }} 
                              labelFormatter={(label) => new Date(label).toLocaleDateString('id-ID', { dateStyle: 'medium' })}
                            />
                            <Line type="monotone" dataKey="max_est_1rm" name="Est 1RM (kg)" stroke="var(--primary)" strokeWidth={2.5} dot={{ fill: 'var(--primary)', r: 3 }} />
                          </LineChart>
                        </ResponsiveContainer>
                      </div>
                    </div>
                  );
                })()}

                {/* Graph: Total Sets Completed Over Time */}
                {exerciseHistoryData?.history?.length > 0 && (
                  <div className="glass-card">
                    <h3 className="text-xs font-bold text-secondary mb-3 uppercase tracking-wider">Jumlah Set Selesai per Sesi</h3>
                    <div className="w-full h-48">
                      <ResponsiveContainer width="100%" height="100%">
                        <LineChart data={exerciseHistoryData.history}>
                          <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" />
                          <XAxis 
                            dataKey="date" 
                            stroke="var(--text-muted)" 
                            fontSize={9} 
                            tickFormatter={(str) => new Date(str).toLocaleDateString('id-ID', { day: 'numeric', month: 'short' })}
                            tickLine={false} 
                          />
                          <YAxis stroke="var(--text-muted)" fontSize={9} tickLine={false} allowDecimals={false} />
                          <Tooltip 
                            contentStyle={{ 
                              background: 'rgba(13, 17, 33, 0.95)', 
                              borderColor: 'var(--border-glass)',
                              borderRadius: '12px',
                              color: '#fff',
                              fontSize: '11px'
                            }} 
                            labelFormatter={(label) => new Date(label).toLocaleDateString('id-ID', { dateStyle: 'medium' })}
                          />
                          <Line type="monotone" dataKey="total_volume" name="Jumlah Set" stroke="var(--info)" strokeWidth={2.5} dot={{ fill: 'var(--info)', r: 3 }} />
                        </LineChart>
                      </ResponsiveContainer>
                    </div>
                  </div>
                )}
              </div>
            ) : (
              // MAIN MOVEMENT LISTING SCREEN
              <>
                <div className="glass-card">
                  <h2 className="text-base font-bold mb-3">Tambah Gerakan Kustom</h2>
                  <form onSubmit={handleAddCustomExercise} className="flex gap-2">
                    <Input 
                      placeholder="Nama gerakan baru..." 
                      value={customExerciseName}
                      onChange={e => setCustomExerciseName(e.target.value)}
                      className="h-11 text-sm bg-white/5 border-white/10"
                    />
                    <Select 
                      className="w-32 h-11"
                      value={customExerciseCategory}
                      onChange={val => setCustomExerciseCategory(val)}
                      options={[
                        { value: 'Chest', label: 'Chest' },
                        { value: 'Back', label: 'Back' },
                        { value: 'Leg', label: 'Leg' },
                        { value: 'Bicep', label: 'Bicep' },
                        { value: 'Tricep', label: 'Tricep' },
                        { value: 'Shoulder', label: 'Shoulder' },
                        { value: 'Core', label: 'Core' },
                        { value: 'Kardio', label: 'Kardio' }
                      ]}
                    />
                    <Button 
                      type="primary" 
                      htmlType="submit" 
                      className="h-11 w-11 flex items-center justify-center p-0 rounded-xl"
                    >
                      <Plus className="w-5 h-5" />
                    </Button>
                  </form>
                </div>

                <div className="flex flex-col gap-3">
                  <div className="w-full">
                    <Input 
                      placeholder="Cari nama gerakan atau bagian otot..." 
                      prefix={<Search className="text-muted w-4 h-4 mr-1" />}
                      value={searchTerm}
                      onChange={e => setSearchTerm(e.target.value)}
                      className="h-11 text-sm bg-white/5 border-white/10"
                    />
                  </div>

                  {/* List of available exercises */}
                  <div className="flex flex-col gap-2.5 mt-1">
                    {filteredExercises.map((ex, idx) => {
                      const dbPr = analyticsData?.prs?.find(p => p.exercise_name.toLowerCase() === ex.name.toLowerCase());
                      const anatomy = getExerciseAnatomyInfo(ex.name, ex.category);
                      
                      return (
                        <div 
                          key={idx} 
                          onClick={() => viewExerciseDetail(ex.name)}
                          className="glass-card flex justify-between items-center cursor-pointer py-3"
                        >
                          <div className="flex-1">
                            <h4 className="font-semibold text-sm">{ex.name}</h4>
                            <div className="text-[10.5px] text-purple/90 mt-1 font-semibold">
                              🎯 Target: {anatomy.detail} ({anatomy.target})
                            </div>
                            {anatomy.modulInfo && (
                              <div className="text-[9.5px] text-muted italic mt-0.5 leading-relaxed">
                                📖 {anatomy.modulInfo}
                              </div>
                            )}
                            <div className="flex gap-2 items-center text-[10px] mt-2">
                              <span className="text-muted bg-white/5 border border-white/10 px-2 py-0.5 rounded">{ex.category}</span>
                              {dbPr && (
                                <span className="badge badge-purple py-0 px-1.5 text-[9px]">
                                  {`PR: ${dbPr.max_weight} kg`}
                                </span>
                              )}
                            </div>
                          </div>
                          <ChevronRight className="text-muted w-4 h-4 shrink-0 ml-2" />
                        </div>
                      );
                    })}
                  </div>
                </div>
              </>
            )}
          </div>
        )}

        {/* ==================== TAB: NUTRITION & FOOD LOGGER ==================== */}
        {activeTab === 'nutrition' && (
          <div className="flex flex-col gap-5 animate-slide-up">
            
            {/* Calorie Progress Card at top */}
            {(() => {
              const targets = calculateCalorieTargets();
              const consumed = getConsumedStats();
              const percent = Math.min(100, Math.round((consumed.consumedCalories / targets.targetCalories) * 100)) || 0;

              return (
                <div className="glass-card bg-purple-glow/10 flex flex-col gap-3">
                  <div className="flex justify-between items-center border-b border-white/5 pb-2">
                    <div className="flex flex-col gap-0.5">
                      <h3 className="text-xs font-bold text-gradient-purple uppercase tracking-wider m-0">Ringkasan Nutrisi Harian</h3>
                      {targets.isDailyCustom && (
                        <span className="text-[9px] text-purple font-semibold uppercase tracking-wider">Target Kustom Hari Ini</span>
                      )}
                    </div>
                    <div className="flex items-center gap-2">
                      <Button 
                        type="dashed" 
                        size="small" 
                        onClick={() => openDailyTargetModal()}
                        className="text-[9px] font-semibold border-purple/30 text-purple px-2 py-0.5 h-6 rounded"
                      >
                        Set Target
                      </Button>
                      <span className="text-[10px] text-muted">{nutritionDate}</span>
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-4 items-center">
                    <div className="flex flex-col">
                      <span className="text-[10px] text-muted font-bold uppercase tracking-wider">Energi</span>
                      <span className="text-xl font-bold text-slate-100">{consumed.consumedCalories} <span className="text-xs font-medium text-secondary">/ {targets.targetCalories} kcal</span></span>
                      <div className="w-full h-1.5 bg-white/5 rounded-full overflow-hidden mt-1.5">
                        <div className="h-full bg-purple" style={{ width: `${percent}%`, backgroundColor: 'var(--primary)' }}></div>
                      </div>
                    </div>

                    <div className="flex flex-col">
                      <span className="text-[10px] text-muted font-bold uppercase tracking-wider">Tersisa</span>
                      <span className="text-xl font-bold text-purple">
                        {Math.max(0, targets.targetCalories - consumed.consumedCalories)} <span className="text-xs font-medium text-secondary">kcal</span>
                      </span>
                    </div>
                  </div>

                  <div className="grid grid-cols-3 gap-2.5 mt-1">
                    <div className="flex flex-col gap-1 text-center bg-white/5 border border-white/5 rounded-xl p-2">
                      <span className="text-[9px] text-muted uppercase font-bold">Protein</span>
                      <span className="text-[11px] font-bold text-muted">{consumed.consumedProtein}g / {targets.targetProtein}g</span>
                    </div>
                    <div className="flex flex-col gap-1 text-center bg-white/5 border border-white/5 rounded-xl p-2">
                      <span className="text-[9px] text-muted uppercase font-bold">Karbo</span>
                      <span className="text-[11px] font-bold text-muted">{consumed.consumedCarbs}g / {targets.targetCarbs}g</span>
                    </div>
                    <div className="flex flex-col gap-1 text-center bg-white/5 border border-white/5 rounded-xl p-2">
                      <span className="text-[9px] text-muted uppercase font-bold">Lemak</span>
                      <span className="text-[11px] font-bold text-muted">{consumed.consumedFat}g / {targets.targetFat}g</span>
                    </div>
                  </div>
                </div>
              );
            })()}

            {/* Date selector and add buttons */}
            <div className="flex justify-between items-center gap-3">
              <DatePicker
                format="YYYY-MM-DD"
                value={nutritionDate ? dayjs(nutritionDate) : null}
                onChange={date => {
                  if (date) {
                    setNutritionDate(date.format('YYYY-MM-DD'));
                  }
                }}
                className="h-10 text-xs bg-white/5 border-white/10 flex-1 animate-pop-in"
                allowClear={false}
              />
              <Button 
                type="primary" 
                onClick={() => {
                  setMealForm({ foodName: '', weightG: 100, calories: '', protein: '', carbs: '', fat: '', isCustom: false });
                  setSelectedLibraryFood(null);
                  setSearchFoodTerm('');
                  setFoodActiveSubTab('library');
                  document.getElementById('new-meal-form')?.scrollIntoView({ behavior: 'smooth' });
                }}
                className="h-10 text-xs font-semibold px-4 flex items-center gap-1.5"
                icon={<Plus className="w-4 h-4" />}
              >
                Catat Makanan
              </Button>
            </div>

            {/* Logged meals list */}
            <div className="glass-card">
              <h3 className="text-sm font-semibold text-secondary mb-3">Makanan Yang Dikonsumsi</h3>
              {loggedMeals.length > 0 ? (
                <div className="flex flex-col gap-2.5 max-h-[40vh] overflow-y-auto pr-1">
                  {loggedMeals.map((meal) => (
                    <div 
                      key={meal.id} 
                      onClick={() => setExpandedMeals(prev => ({ ...prev, [meal.id]: !prev[meal.id] }))}
                      className="flex flex-col gap-2 bg-white/5 border border-white/5 hover:border-white/10 rounded-xl p-3 text-xs cursor-pointer transition-all animate-pop-in"
                    >
                      <div className="flex gap-3 items-center">
                        {meal.image_data && (
                          <img 
                            src={meal.image_data} 
                            alt={meal.food_name} 
                            className="w-10 h-10 object-cover rounded-lg border border-white/10 shrink-0" 
                          />
                        )}
                        <div className="flex-1 min-w-0">
                          <div className="flex justify-between items-center">
                            <span className="font-semibold text-slate-200 truncate">{meal.food_name}, {Math.round(parseFloat(meal.calories))} kcal</span>
                            <button 
                              type="button"
                              onClick={(e) => { e.stopPropagation(); handleDeleteMealLog(meal.id); }}
                              className="text-muted hover:text-rose-400 p-1 rounded transition-colors shrink-0"
                            >
                              <Minus className="w-3.5 h-3.5" />
                            </button>
                          </div>
                        </div>
                      </div>
                      
                      {expandedMeals[meal.id] && (
                        <div className="flex flex-col gap-3 border-t border-white/5 pt-2 mt-1 animate-slide-up" onClick={e => e.stopPropagation()}>
                          <div className="flex flex-col gap-1.5">
                            <label className="text-[10px] text-secondary">Ubah Berat (gram)</label>
                            <div className="flex gap-2 items-center">
                              <div className="input-wrapper-suffix h-9 flex-1">
                                <input 
                                  type="text" 
                                  inputMode="decimal"
                                  placeholder="Berat..."
                                  value={
                                    editMealWeight[meal.id] !== undefined 
                                      ? editMealWeight[meal.id] 
                                      : parseFloat(meal.weight_g)
                                  }
                                  onChange={e => {
                                    const valStr = e.target.value;
                                    setEditMealWeight(prev => ({ ...prev, [meal.id]: valStr }));
                                  }}
                                />
                                <span>gram</span>
                              </div>
                              <Button
                                type="primary"
                                size="small"
                                loading={updatingMealId === meal.id}
                                onClick={() => handleSaveMealEdit(meal)}
                                className="h-9 text-[11px] px-3 font-semibold rounded-lg"
                              >
                                Simpan
                              </Button>
                            </div>
                          </div>

                          <div className="grid grid-cols-4 gap-1.5 text-center text-[9.5px] bg-black/30 p-2 rounded-lg border border-white/5">
                            <div>
                              <span className="text-muted block text-[8px] uppercase font-semibold">Kalori</span>
                              <span className="font-bold text-slate-200">
                                {Math.round(
                                  (parseFloat(meal.calories) / (parseFloat(meal.weight_g) || 1)) * 
                                  parseIndonesianFloatWithDefault(
                                    editMealWeight[meal.id] !== undefined ? editMealWeight[meal.id] : meal.weight_g, 
                                    0
                                  )
                                )} kcal
                              </span>
                            </div>
                            <div>
                              <span className="text-muted block text-[8px] uppercase font-semibold">Protein</span>
                              <span className="font-bold text-slate-200">
                                {(
                                  ((parseFloat(meal.protein) / (parseFloat(meal.weight_g) || 1)) * 
                                  parseIndonesianFloatWithDefault(
                                    editMealWeight[meal.id] !== undefined ? editMealWeight[meal.id] : meal.weight_g, 
                                    0
                                  ))
                                ).toFixed(1)} g
                              </span>
                            </div>
                            <div>
                              <span className="text-muted block text-[8px] uppercase font-semibold">Karbo</span>
                              <span className="font-bold text-slate-200">
                                {(
                                  ((parseFloat(meal.carbs) / (parseFloat(meal.weight_g) || 1)) * 
                                  parseIndonesianFloatWithDefault(
                                    editMealWeight[meal.id] !== undefined ? editMealWeight[meal.id] : meal.weight_g, 
                                    0
                                  ))
                                ).toFixed(1)} g
                              </span>
                            </div>
                            <div>
                              <span className="text-muted block text-[8px] uppercase font-semibold">Lemak</span>
                              <span className="font-bold text-slate-200">
                                {(
                                  ((parseFloat(meal.fat) / (parseFloat(meal.weight_g) || 1)) * 
                                  parseIndonesianFloatWithDefault(
                                    editMealWeight[meal.id] !== undefined ? editMealWeight[meal.id] : meal.weight_g, 
                                    0
                                  ))
                                ).toFixed(1)} g
                              </span>
                            </div>
                          </div>

                          {meal.image_data && (
                            <div className="w-full rounded-xl overflow-hidden border border-white/10 mt-1">
                              <img 
                                src={meal.image_data} 
                                alt={meal.food_name} 
                                className="w-full max-h-48 object-cover" 
                              />
                            </div>
                          )}
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-8 text-xs text-muted">Belum ada catatan makanan untuk hari ini. Silakan input makanan Anda di bawah.</div>
              )}
            </div>

            {/* Food logger form container */}
            <div id="new-meal-form" className="glass-card flex flex-col gap-4">
              <h3 className="text-sm font-semibold text-primary m-0 border-b border-white/5 pb-2">Catat Makanan Baru</h3>

              {/* Segmented Control / Sub Tabs */}
              <div className="grid grid-cols-2 gap-2 text-center bg-white/5 p-1 rounded-xl">
                <div 
                  onClick={() => setFoodActiveSubTab('library')}
                  className={`py-1.5 text-xs font-semibold rounded-lg cursor-pointer transition-all ${foodActiveSubTab === 'library' ? 'bg-purple text-white' : 'text-muted hover:text-slate-200'}`}
                >
                  Pustaka Makanan
                </div>
                <div 
                  onClick={() => setFoodActiveSubTab('custom')}
                  className={`py-1.5 text-xs font-semibold rounded-lg cursor-pointer transition-all ${foodActiveSubTab === 'custom' ? 'bg-purple text-white' : 'text-muted hover:text-slate-200'}`}
                >
                  Tambah Makanan Kustom
                </div>
              </div>

              {foodActiveSubTab === 'library' ? (
                <div className="flex flex-col gap-3 animate-pop-in">
                  <Input 
                    placeholder="Cari makanan di pustaka (contoh: Nasi)..."
                    value={searchFoodTerm}
                    onChange={e => setSearchFoodTerm(e.target.value)}
                    prefix={<Search className="w-4 h-4 text-muted mr-1" />}
                    className="h-10 text-xs bg-white/5 border-white/10"
                  />

                  <div className="flex flex-col gap-2 max-h-[360px] overflow-y-auto mt-1 pr-1">
                    {foodLibrary
                      .filter(item => item.name.toLowerCase().includes(searchFoodTerm.toLowerCase()))
                      .map(item => (
                        <div 
                          key={item.id}
                          onClick={() => {
                            if (selectedLibraryFood?.id === item.id) {
                              setSelectedLibraryFood(null);
                              setMealForm({
                                foodName: '',
                                weightG: 100,
                                calories: '',
                                protein: '',
                                carbs: '',
                                fat: '',
                                isCustom: false
                              });
                            } else {
                              const serving = parseFloat(item.serving_g || 100);
                              setSelectedLibraryFood(item);
                              setMealForm({
                                ...mealForm,
                                foodName: item.name,
                                weightG: serving,
                                calories: Math.round(parseFloat(item.calories)),
                                protein: Math.round(parseFloat(item.protein) * 10) / 10,
                                carbs: Math.round(parseFloat(item.carbs) * 10) / 10,
                                fat: Math.round(parseFloat(item.fat) * 10) / 10
                              });
                            }
                          }}
                          className={`flex flex-col gap-1.5 bg-white/5 border rounded-xl p-2.5 cursor-pointer hover:bg-white/10 transition-all ${selectedLibraryFood?.id === item.id ? 'border-purple bg-white/[0.07]' : 'border-white/5'}`}
                        >
                          <div className="flex justify-between items-center w-full">
                            <span className="font-semibold text-slate-200 text-xs">{item.name}, {Math.round(parseFloat(item.calories))} kcal</span>
                            {item.user_id && (
                              <button 
                                type="button" 
                                onClick={(e) => { e.stopPropagation(); handleDeleteFoodItem(item.id); }}
                                className="text-muted hover:text-rose-400 p-1 rounded transition-colors"
                              >
                                <Trash2 className="w-3.5 h-3.5" />
                              </button>
                            )}
                          </div>
                          
                          <div 
                            className={`expandable-details ${selectedLibraryFood?.id === item.id ? 'expanded' : ''}`}
                            onClick={(e) => e.stopPropagation()}
                          >
                            <div className="flex gap-4 text-[9.5px] text-muted flex-wrap mb-2">
                              <span>Protein: {parseFloat(item.protein)} g</span>
                              <span>•</span>
                              <span>Karbo: {parseFloat(item.carbs)} g</span>
                              <span>•</span>
                              <span>Lemak: {parseFloat(item.fat)} g</span>
                              <span>•</span>
                              <span className="italic text-[8.5px]">(per {parseFloat(item.serving_g || 100)} g)</span>
                            </div>

                            {selectedLibraryFood?.id === item.id && (
                              <div className="flex flex-col gap-3 pt-2 border-t border-white/5 mt-1">
                                <div className="flex flex-col gap-1">
                                  <label className="text-[10px] text-secondary">Berat Makanan (gram)</label>
                                  <div className="input-wrapper-suffix h-9">
                                    <input 
                                      type="text" 
                                      inputMode="decimal"
                                      value={mealForm.weightG}
                                      onChange={e => {
                                        const valStr = e.target.value;
                                        const val = parseIndonesianFloatWithDefault(valStr, 0);
                                        setMealForm({
                                          ...mealForm,
                                          weightG: valStr,
                                          calories: Math.round(parseIndonesianFloatWithDefault(item.calories, 0) * (val / parseIndonesianFloatWithDefault(item.serving_g || 100, 100))),
                                          protein: Math.round(parseIndonesianFloatWithDefault(item.protein, 0) * (val / parseIndonesianFloatWithDefault(item.serving_g || 100, 100)) * 10) / 10,
                                          carbs: Math.round(parseIndonesianFloatWithDefault(item.carbs, 0) * (val / parseIndonesianFloatWithDefault(item.serving_g || 100, 100)) * 10) / 10,
                                          fat: Math.round(parseIndonesianFloatWithDefault(item.fat, 0) * (val / parseIndonesianFloatWithDefault(item.serving_g || 100, 100)) * 10) / 10
                                        });
                                      }}
                                    />
                                    <span>gram</span>
                                  </div>
                                </div>

                                <div className="grid grid-cols-4 gap-1.5 text-center text-[9.5px] bg-black/30 p-2 rounded-lg border border-white/5">
                                  <div>
                                    <span className="text-muted block text-[8px] uppercase font-semibold">Kalori</span>
                                    <span className="font-bold text-slate-200">{mealForm.calories} kcal</span>
                                  </div>
                                  <div>
                                    <span className="text-muted block text-[8px] uppercase font-semibold">Protein</span>
                                    <span className="font-bold text-slate-200">{mealForm.protein}g</span>
                                  </div>
                                  <div>
                                    <span className="text-muted block text-[8px] uppercase font-semibold">Karbo</span>
                                    <span className="font-bold text-slate-200">{mealForm.carbs}g</span>
                                  </div>
                                  <div>
                                    <span className="text-muted block text-[8px] uppercase font-semibold">Lemak</span>
                                    <span className="font-bold text-slate-200">{mealForm.fat}g</span>
                                  </div>
                                </div>

                                <div className="flex flex-col gap-1.5">
                                  {mealImage ? (
                                    <div className="flex items-center justify-between bg-white/5 border border-white/10 p-1.5 rounded-lg">
                                      <div className="flex items-center gap-2">
                                        <img src={mealImage} alt="Preview" className="w-8 h-8 object-cover rounded border border-white/10" />
                                        <span className="text-[9px] text-muted">Foto ditambahkan</span>
                                      </div>
                                      <button 
                                        type="button" 
                                        onClick={() => setMealImage(null)} 
                                        className="text-rose-400 hover:text-rose-300 text-[9px] font-semibold px-2 py-1 rounded bg-white/5 border border-white/5"
                                      >
                                        Hapus
                                      </button>
                                    </div>
                                  ) : (
                                    <label className="flex items-center justify-center gap-1.5 h-9 border border-dashed border-white/10 hover:border-purple/35 rounded-lg cursor-pointer bg-white/5 hover:bg-white/10 transition-all text-muted hover:text-slate-200">
                                      <Camera className="w-3.5 h-3.5 text-secondary" />
                                      <span className="text-[10px]">Foto Makanan (Opsional)</span>
                                      <input 
                                        type="file" 
                                        accept="image/*" 
                                        className="hidden" 
                                        onChange={e => {
                                          const file = e.target.files?.[0];
                                          if (file) {
                                            if (file.size / 1024 / 1024 >= 2.5) {
                                              alert('Ukuran foto terlalu besar. Maksimal 2.5 MB.');
                                              return;
                                            }
                                            const reader = new FileReader();
                                            reader.readAsDataURL(file);
                                            reader.onload = () => {
                                              setMealImage(reader.result);
                                            };
                                          }
                                        }}
                                      />
                                    </label>
                                  )}
                                </div>

                                <Button 
                                  type="primary" 
                                  loading={submittingMeal}
                                  onClick={(e) => { e.preventDefault(); handleAddMealLog(); }}
                                  className="h-9 text-xs font-semibold mt-1"
                                >
                                  Catat Makanan
                                </Button>
                              </div>
                            )}
                          </div>
                        </div>
                      ))}
                  </div>
                </div>
              ) : (
                <div className="flex flex-col gap-3 animate-pop-in">
                  <p className="text-[10.5px] text-muted m-0 leading-relaxed">
                    Tulis detail makanan kustom Anda. Anda dapat langsung mencatatnya ke diary harian atau menyimpannya ke pustaka untuk digunakan kembali nanti.
                  </p>
                  
                  <div className="flex flex-col gap-1">
                    <label className="text-[10px] text-secondary">Nama Makanan</label>
                    <Input 
                      placeholder="Contoh: Dada Ayam Goreng"
                      value={foodForm.name}
                      onChange={e => setFoodForm({ ...foodForm, name: e.target.value })}
                      className="h-10 text-xs bg-white/5 border-white/10"
                    />
                  </div>

                  <div className="grid grid-cols-2 gap-3">
                    <div className="flex flex-col gap-1">
                      <label className="text-[10px] text-secondary">Berat / Takaran Saji (gram)</label>
                      <Input 
                        placeholder="Contoh: 35 atau 100"
                        value={foodForm.servingG}
                        inputMode="decimal"
                        onChange={e => setFoodForm({ ...foodForm, servingG: e.target.value })}
                        className="h-10 text-xs bg-white/5 border-white/10"
                      />
                    </div>
                    <div className="flex flex-col gap-1">
                      <label className="text-[10px] text-secondary">Total Kalori (kkal)</label>
                      <Input 
                        placeholder="Contoh: 140"
                        value={foodForm.calories}
                        inputMode="decimal"
                        onChange={e => setFoodForm({ ...foodForm, calories: e.target.value })}
                        className="h-10 text-xs bg-white/5 border-white/10"
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-3 gap-3">
                    <div className="flex flex-col gap-1">
                      <label className="text-[10px] text-secondary">Protein (g)</label>
                      <Input 
                        placeholder="Contoh: 28"
                        value={foodForm.protein}
                        inputMode="decimal"
                        onChange={e => setFoodForm({ ...foodForm, protein: e.target.value })}
                        className="h-10 text-xs bg-white/5 border-white/10"
                      />
                    </div>
                    <div className="flex flex-col gap-1">
                      <label className="text-[10px] text-secondary">Karbo (g)</label>
                      <Input 
                        placeholder="Contoh: 15"
                        value={foodForm.carbs}
                        inputMode="decimal"
                        onChange={e => setFoodForm({ ...foodForm, carbs: e.target.value })}
                        className="h-10 text-xs bg-white/5 border-white/10"
                      />
                    </div>
                    <div className="flex flex-col gap-1">
                      <label className="text-[10px] text-secondary">Lemak (g)</label>
                      <Input 
                        placeholder="Contoh: 10"
                        value={foodForm.fat}
                        inputMode="decimal"
                        onChange={e => setFoodForm({ ...foodForm, fat: e.target.value })}
                        className="h-10 text-xs bg-white/5 border-white/10"
                      />
                    </div>
                  </div>

                  {/* Foto Makanan (Opsional) */}
                  <div className="flex flex-col gap-1.5 mt-1.5 mb-1.5">
                    <label className="text-[10px] text-secondary">Foto Makanan (Opsional)</label>
                    {mealImage ? (
                      <div className="flex items-center gap-3 bg-white/5 border border-white/10 p-2 rounded-xl animate-pop-in">
                        <img src={mealImage} alt="Preview Makanan" className="w-10 h-10 object-cover rounded-lg border border-white/10" />
                        <span className="text-[10px] text-muted flex-1 truncate">Foto berhasil diunggah</span>
                        <button 
                          type="button" 
                          onClick={() => setMealImage(null)} 
                          className="text-rose-400 hover:text-rose-300 text-[10px] font-semibold px-2 py-1 rounded bg-white/5 border border-white/5 hover:border-white/10 transition-colors"
                        >
                          Hapus
                        </button>
                      </div>
                    ) : (
                      <div className="flex items-center gap-2 animate-pop-in">
                        <label className="flex-1 flex items-center justify-center gap-1.5 h-10 border border-dashed border-white/10 hover:border-purple/35 rounded-xl cursor-pointer bg-white/5 hover:bg-white/10 transition-all text-muted hover:text-slate-200">
                          <Camera className="w-4 h-4 text-secondary" />
                          <span className="text-xs">Ambil / Unggah Foto Makanan</span>
                          <input 
                            type="file" 
                            accept="image/*" 
                            className="hidden" 
                            onChange={e => {
                              const file = e.target.files?.[0];
                              if (file) {
                                if (file.size / 1024 / 1024 >= 2.5) {
                                  alert('Ukuran foto terlalu besar. Maksimal 2.5 MB.');
                                  return;
                                }
                                const reader = new FileReader();
                                reader.readAsDataURL(file);
                                reader.onload = () => {
                                  setMealImage(reader.result);
                                };
                              }
                            }}
                          />
                        </label>
                      </div>
                    )}
                  </div>

                  <div className="flex gap-3 mt-2">
                    <Button 
                      type="default" 
                      onClick={handleLogCustomFoodDirectly}
                      loading={submittingMeal}
                      className="flex-1 h-11 text-xs font-semibold"
                    >
                      Catat
                    </Button>
                    <Button 
                      type="primary" 
                      onClick={handleLogAndCreateFoodItem}
                      loading={submittingFoodItem || submittingMeal}
                      className="flex-1 h-11 text-xs font-semibold"
                    >
                      Catat & Tambahkan ke Pustaka
                    </Button>
                  </div>
                </div>
              )}
            </div>

          </div>
        )}

        {/* ==================== TAB 4: PHOTO GALLERY ==================== */}
        {activeTab === 'gallery' && (
          <div className="flex flex-col gap-5 animate-slide-up">
            
            {/* Uploader Card */}
            <div className="glass-card">
              <h2 className="text-base font-bold mb-3">Unggah Foto Progres</h2>
              <div className="flex flex-col gap-3">
                <Input 
                  placeholder="Beri catatan kecil (ex: Berat 72kg, habis leg day)..." 
                  value={imageNotes}
                  onChange={e => setImageNotes(e.target.value)}
                  className="text-xs h-10"
                />
                
                <Upload.Dragger 
                  accept="image/*"
                  multiple={false}
                  beforeUpload={file => {
                    const isLt2M = file.size / 1024 / 1024 < 2.5;
                    if (!isLt2M) {
                      alert('Ukuran foto terlalu besar. Maksimal 2.5 MB.');
                      return false;
                    }
                    
                    setUploadingImage(true);
                    const reader = new FileReader();
                    reader.readAsDataURL(file);
                    reader.onload = async () => {
                      try {
                        const base64Data = reader.result;
                        const res = await fetch('/api/images', {
                          method: 'POST',
                          headers: { 'Content-Type': 'application/json' },
                          body: JSON.stringify({
                            image_data: base64Data,
                            notes: imageNotes
                          })
                        });

                        if (res.ok) {
                          setImageNotes('');
                          await fetchGallery();
                          alert('Foto progres berhasil diunggah!');
                        } else {
                          const err = await res.json();
                          alert(err.error || 'Gagal mengunggah foto.');
                        }
                      } catch (err) {
                        console.error(err);
                        alert('Gagal mengunggah foto progres.');
                      } finally {
                        setUploadingImage(false);
                      }
                    };
                    return false; // Prevent auto upload
                  }}
                  showUploadList={false}
                  style={{ background: 'rgba(255,255,255,0.02)', borderColor: 'rgba(255,255,255,0.1)', borderRadius: '12px' }}
                >
                  <p className="ant-upload-drag-icon flex justify-center text-purple mb-2">
                    <Camera className="w-8 h-8" />
                  </p>
                  <p className="ant-upload-text text-sm font-semibold text-slate-200">
                    {uploadingImage ? 'Mengunggah...' : 'Klik atau seret foto ke area ini'}
                  </p>
                  <p className="ant-upload-hint text-[11px] text-muted mt-1">Mendukung format gambar hingga 2.5 MB</p>
                </Upload.Dragger>
              </div>
            </div>

            {/* Photos Grid list */}
            <div>
              <h3 className="text-sm font-semibold text-secondary mb-3">Galeri Foto Progres</h3>
              {galleryImages.length > 0 ? (
                <div className="grid grid-cols-2 gap-3">
                  {galleryImages.map((img) => (
                    <div 
                      key={img.id} 
                      onClick={() => setSelectedImage(img)}
                      className="glass-card p-1 cursor-pointer overflow-hidden rounded-xl h-40 relative group"
                    >
                      <img 
                        src={img.image_data} 
                        alt="Progress" 
                        className="w-full h-full object-cover rounded-lg transition-transform group-hover:scale-105" 
                      />
                      <div className="absolute bottom-1 left-1 right-1 bg-black/60 backdrop-blur-sm p-1.5 rounded text-[10px] text-white truncate">
                        {img.notes || new Date(img.created_at).toLocaleDateString('id-ID', { dateStyle: 'short' })}
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center p-12 bg-white/5 border border-white/10 rounded-2xl text-xs text-muted">
                  Belum ada foto progres. Unggah foto pertama Anda untuk melacak perubahan fisik!
                </div>
              )}
            </div>

            {/* Lightbox / Preview Modal for Selected Image */}
            <Modal
              open={!!selectedImage}
              onCancel={() => setSelectedImage(null)}
              footer={null}
              centered
              width={450}
              styles={{
                mask: {
                  backdropFilter: 'blur(6px)',
                },
                content: {
                  background: '#0a0d1d',
                  border: '1px solid rgba(255, 255, 255, 0.1)',
                  borderRadius: '20px',
                  padding: '16px',
                }
              }}
            >
              {selectedImage && (
                <div className="flex flex-col gap-4">
                  <div className="rounded-xl overflow-hidden max-h-[60vh] bg-neutral-900 border border-white/10 flex items-center justify-center">
                    <img 
                      src={selectedImage.image_data} 
                      alt="Progress Full" 
                      className="w-full h-auto max-h-[60vh] object-contain" 
                    />
                  </div>
                  
                  <div className="flex flex-col gap-1">
                    <p className="text-[10px] text-muted">
                      Diunggah pada: {new Date(selectedImage.created_at).toLocaleDateString('id-ID', { dateStyle: 'long', timeStyle: 'short' })}
                    </p>
                    {selectedImage.notes && <p className="text-sm font-semibold mt-1">{selectedImage.notes}</p>}
                  </div>
                  
                  <div className="flex gap-3 mt-2">
                    <Button 
                      block 
                      onClick={() => setSelectedImage(null)}
                      className="h-10 text-xs font-semibold"
                    >
                      Tutup
                    </Button>
                    <Button 
                      danger 
                      block 
                      onClick={() => deleteImage(selectedImage.id)}
                      className="h-10 text-xs font-semibold"
                    >
                      Hapus Foto
                    </Button>
                  </div>
                </div>
              )}
            </Modal>
          </div>
        )}

        {/* ==================== TAB 5: PROFILE ==================== */}
        {activeTab === 'profile' && (
          <div className="flex flex-col gap-5 animate-slide-up">
            
            <div className="glass-card flex flex-col items-center py-8 text-center">
              <div className="w-16 h-16 rounded-full bg-purple/10 border border-purple/20 flex items-center justify-center mb-3 text-purple text-2xl font-bold uppercase">
                {user.username[0]}
              </div>
              <h2 className="text-lg font-bold">@{user.username}</h2>
              <p className="text-xs text-muted mt-1">Raga Member</p>
            </div>

            <div className="glass-card flex flex-col gap-4">
              <h3 className="text-xs font-bold text-secondary uppercase tracking-wider">Statistik Anggota</h3>
              
              <div className="flex justify-between items-center py-2 border-b border-white/5">
                <span className="text-xs text-secondary">Total Sesi Latihan</span>
                <span className="text-sm font-semibold">{analyticsData?.summary?.totalSessions || 0}</span>
              </div>
              
              <div className="flex justify-between items-center py-2 border-b border-white/5">
                <span className="text-xs text-secondary">Gerakan Berbeda Dilacak</span>
                <span className="text-sm font-semibold">{analyticsData?.summary?.prsCount || 0}</span>
              </div>

              <div className="flex justify-between items-center py-2">
                <span className="text-xs text-secondary">Foto Progres</span>
                <span className="text-sm font-semibold">{galleryImages.length}</span>
              </div>
            </div>

            <div className="glass-card flex flex-col gap-4 text-left">
              <h3 className="text-xs font-bold text-secondary uppercase tracking-wider">Program Latihan (Workout Split)</h3>
              <div className="flex justify-between items-center">
                <div className="flex flex-col gap-1">
                  <span className="text-[10px] text-muted uppercase tracking-wider font-bold">Split Aktif</span>
                  <span className="text-sm font-semibold text-slate-200">{user.workout_program || 'Upper, Lower'}</span>
                </div>
                <Button 
                  type="dashed" 
                  size="small" 
                  onClick={() => setShowProfileModal(true)}
                  className="text-[10px] font-semibold border-purple/30 text-purple"
                >
                  Ubah Split
                </Button>
              </div>
            </div>

            <button 
              onClick={handleLogout} 
              className="btn-secondary border-rose-500/20 text-rose-400 hover:bg-rose-500/10 justify-center py-3"
            >
              <LogOut className="w-4 h-4" /> Keluar Akun
            </button>
          </div>
        )}

      </main>

      {/* 3. Dynamic Exercise Selection Modal for Workout Mode */}
      <Modal
        title={<span className="text-base font-bold text-gradient-purple">Pilih Gerakan</span>}
        open={showExerciseSelector}
        onCancel={() => setShowExerciseSelector(false)}
        footer={null}
        width={400}
        centered
        styles={{
          mask: {
            backdropFilter: 'blur(4px)',
          },
          content: {
            background: '#0a0d1d',
            border: '1px solid rgba(255, 255, 255, 0.1)',
            borderRadius: '20px',
          }
        }}
      >
        <div className="flex flex-col gap-4 pt-2">
          {/* Search filter */}
          <Input 
            placeholder="Cari gerakan..." 
            prefix={<Search className="w-4 h-4 text-slate-500 mr-1" />}
            value={searchTerm}
            onChange={e => setSearchTerm(e.target.value)}
            className="h-10 bg-transparent border-white/10 hover:border-purple focus:border-purple text-xs"
          />

          {/* Quick list container */}
          <div className="flex flex-col gap-2 max-h-[35vh] overflow-y-auto pr-1">
            {filteredExercises.map((ex, idx) => {
              const anatomy = getExerciseAnatomyInfo(ex.name, ex.category);
              const prevSets = getPreviousWorkoutData(ex.name);
              const prevWeightStr = prevSets && prevSets.length > 0
                ? prevSets.map(s => `${s.weight}kg`).join(' / ')
                : null;
              
              return (
                <div 
                  key={idx}
                  onClick={() => addExerciseToActiveWorkout(ex.name, ex.category)}
                  className="w-full flex justify-between items-center bg-white/5 border border-white/5 hover:bg-white/10 hover:border-purple/20 transition-all rounded-xl p-3 text-left cursor-pointer"
                >
                  <div className="flex flex-col gap-0.5">
                    {prevWeightStr && (
                      <span className="text-[9px] font-bold block mb-0.5" style={{ color: 'var(--info)' }}>
                        Lalu: {prevWeightStr}
                      </span>
                    )}
                    <span className="font-semibold text-xs text-slate-200">{ex.name}</span>
                    <span className="text-[10px] text-purple/80 font-medium">🎯 {anatomy.detail} ({anatomy.target})</span>
                  </div>
                  <span className="text-[9px] bg-white/10 px-2 py-0.5 rounded text-muted shrink-0 ml-2">{ex.category}</span>
                </div>
              );
            })}
          </div>

          {/* Custom creation form inside modal */}
          <div className="border-t border-white/10 pt-4 mt-2">
            <span className="text-[10px] font-bold text-muted uppercase tracking-wider block mb-2">Buat Gerakan Kustom Baru</span>
            <div className="flex gap-2">
              <Input 
                placeholder="Nama gerakan..." 
                className="text-xs h-9"
                value={customExerciseName}
                onChange={e => setCustomExerciseName(e.target.value)}
              />
              <Select 
                className="w-28 h-9"
                value={customExerciseCategory}
                onChange={val => setCustomExerciseCategory(val)}
                options={[
                  { value: 'Chest', label: 'Chest' },
                  { value: 'Back', label: 'Back' },
                  { value: 'Leg', label: 'Leg' },
                  { value: 'Bicep', label: 'Bicep' },
                  { value: 'Tricep', label: 'Tricep' },
                  { value: 'Shoulder', label: 'Shoulder' },
                  { value: 'Core', label: 'Core' },
                  { value: 'Kardio', label: 'Kardio' }
                ]}
              />
              <Button 
                type="primary"
                onClick={handleAddCustomExercise}
                className="px-3 h-9 text-xs font-semibold"
              >
                Buat
              </Button>
            </div>
          </div>
        </div>
      </Modal>

      {/* 5. Fitness Profile & Calorie Goal Setup Modal */}
      <Modal
        title={<span className="text-base font-bold text-gradient-purple">Setup Target Kalori & Profil</span>}
        open={showProfileModal}
        onCancel={() => setShowProfileModal(false)}
        footer={null}
        width={400}
        centered
        styles={{
          mask: {
            backdropFilter: 'blur(4px)',
          },
          content: {
            background: '#0a0d1d',
            border: '1px solid rgba(255, 255, 255, 0.1)',
            borderRadius: '20px',
          }
        }}
      >
        <form onSubmit={handleUpdateProfile} className="flex flex-col gap-4 pt-2">
          {profileError && (
            <div className="bg-danger-glow border border-danger/20 text-rose-400 text-xs p-3 rounded-lg text-center">
              {profileError}
            </div>
          )}

          <div className="grid grid-cols-2 gap-3">
            <div className="flex flex-col gap-1">
              <label className="text-[10px] text-secondary">Berat Badan</label>
              <div className="input-wrapper-suffix h-10">
                <input 
                  type="number" 
                  step="0.1" 
                  placeholder="ex: 70"
                  value={profileForm.weight}
                  onChange={e => setProfileForm({ ...profileForm, weight: e.target.value })}
                />
                <span>kg</span>
              </div>
            </div>

            <div className="flex flex-col gap-1">
              <label className="text-[10px] text-secondary">Tinggi Badan</label>
              <div className="input-wrapper-suffix h-10">
                <input 
                  type="number" 
                  step="1" 
                  placeholder="ex: 170"
                  value={profileForm.height}
                  onChange={e => setProfileForm({ ...profileForm, height: e.target.value })}
                />
                <span>cm</span>
              </div>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div className="flex flex-col gap-1">
              <label className="text-[10px] text-secondary">Umur</label>
              <div className="input-wrapper-suffix h-10">
                <input 
                  type="number" 
                  step="1" 
                  placeholder="ex: 25"
                  value={profileForm.age}
                  onChange={e => setProfileForm({ ...profileForm, age: e.target.value })}
                />
                <span>tahun</span>
              </div>
            </div>

            <div className="flex flex-col gap-1">
              <label className="text-[10px] text-secondary font-medium">Gender</label>
              <Select 
                className="w-full h-10"
                value={profileForm.gender}
                onChange={val => setProfileForm({ ...profileForm, gender: val })}
                options={[
                  { value: 'male', label: 'Pria' },
                  { value: 'female', label: 'Wanita' }
                ]}
              />
            </div>
          </div>

          <div className="flex flex-col gap-1">
            <label className="text-[10px] text-secondary font-medium">Tingkat Aktivitas Harian</label>
            <Select 
              className="w-full h-10"
              value={profileForm.activityLevel}
              onChange={val => setProfileForm({ ...profileForm, activityLevel: val })}
              options={[
                { value: 'sedentary', label: 'Sedentary (Jarang olahraga)' },
                { value: 'light', label: 'Ringan (Olahraga 1-3x / minggu)' },
                { value: 'moderate', label: 'Sedang (Olahraga 3-5x / minggu)' },
                { value: 'heavy', label: 'Sangat Aktif (Olahraga 6-7x / minggu)' }
              ]}
            />
          </div>

          <div className="flex flex-col gap-1">
            <label className="text-[10px] text-secondary font-medium">Target Hubungan / Goal</label>
            <Select 
              className="w-full h-10"
              value={profileForm.fitnessGoal}
              onChange={val => setProfileForm({ ...profileForm, fitnessGoal: val })}
              options={[
                { value: 'maintenance', label: 'Maintenance (Energi Seimbang)' },
                { value: 'cutting', label: 'Cutting (Turun Berat / Defisit)' },
                { value: 'bulking', label: 'Bulking (Naik Otot / Surplus)' }
              ]}
            />
          </div>

          <div className="flex flex-col gap-1">
            <label className="text-[10px] text-secondary font-medium">Program Latihan / Workout Split (Pisahkan dengan koma)</label>
            <Input 
              placeholder="ex: Upper, Lower atau Push, Pull, Legs"
              value={profileForm.workoutProgram}
              onChange={e => setProfileForm({ ...profileForm, workoutProgram: e.target.value })}
              className="h-10 text-xs bg-white/5 border-white/10"
            />
            <span className="text-[9px] text-muted italic">Pisahkan bagian dengan koma. Opsi ini akan menjadi pilihan cepat saat merekam latihan baru.</span>
          </div>

          <Button 
            type="primary" 
            htmlType="submit" 
            className="h-11 text-xs font-semibold mt-2 animate-pop-in"
          >
            Hitung & Simpan Target
          </Button>
        </form>
      </Modal>

      {/* 6. Daily Target Calories Override Modal */}
      <Modal
        title={<span className="text-base font-bold text-gradient-purple">Set Target Kalori Harian (TDEE)</span>}
        open={showDailyTargetModal}
        onCancel={() => setShowDailyTargetModal(false)}
        footer={null}
        width={360}
        centered
        styles={{
          mask: {
            backdropFilter: 'blur(4px)',
          },
          content: {
            background: '#0a0d1d',
            border: '1px solid rgba(255, 255, 255, 0.1)',
            borderRadius: '20px',
          }
        }}
      >
        <form onSubmit={handleSaveDailyTarget} className="flex flex-col gap-4 pt-2">
          <p className="text-xs text-secondary leading-relaxed">
            Sesuaikan target energi (TDEE) Anda khusus untuk tanggal <strong>{nutritionDate}</strong>. 
            Makronutrisi akan didistribusikan secara otomatis berdasarkan profil fisik Anda.
          </p>

          <div className="flex flex-col gap-1">
            <label className="text-[10px] text-secondary">Target Kalori</label>
            <div className="input-wrapper-suffix h-11">
              <input 
                type="number" 
                min="500"
                max="10000"
                placeholder="ex: 2200"
                value={dailyTargetForm.targetCalories}
                onChange={e => setDailyTargetForm({ ...dailyTargetForm, targetCalories: e.target.value })}
                className="font-bold text-sm"
              />
              <span className="font-semibold text-xs">kkal</span>
            </div>
          </div>

          <div className="flex flex-col gap-2 mt-2">
            <Button 
              type="primary" 
              htmlType="submit" 
              loading={submittingDailyTarget}
              className="h-11 text-xs font-semibold"
            >
              Simpan Target Hari Ini
            </Button>
            {dailyTarget && (
              <Button 
                danger
                type="text" 
                onClick={handleResetDailyTarget}
                loading={submittingDailyTarget}
                className="text-[11px] font-semibold"
              >
                Reset ke Target Profil Default
              </Button>
            )}
          </div>
        </form>
      </Modal>

      {/* 4. Custom Workout Routine Template Creator Modal */}
      <Modal
        title={<span className="text-base font-bold text-gradient-purple">{templateForm.id ? 'Edit Rencana Latihan' : 'Buat Rencana Latihan'}</span>}
        open={showTemplateModal}
        onCancel={() => {
          setShowTemplateModal(false);
          setTemplateForm({ id: null, name: '', exercises: [] });
          setSelectedLibraryEx(null);
          setCustomExName('');
        }}
        footer={null}
        width={400}
        centered
        styles={{
          mask: {
            backdropFilter: 'blur(4px)',
          },
          content: {
            background: '#0a0d1d',
            border: '1px solid rgba(255, 255, 255, 0.1)',
            borderRadius: '20px',
          }
        }}
      >
        <div className="flex flex-col gap-4 pt-2 text-left">
          <div className="flex flex-col gap-1">
            <label className="text-[10px] text-secondary font-medium">Nama Rencana Latihan</label>
            <Input 
              placeholder="ex: Upper Body, Lower Body, Push, Pull" 
              value={templateForm.name}
              onChange={e => setTemplateForm({ ...templateForm, name: e.target.value })}
              className="h-10 text-xs bg-white/5 border-white/10 text-slate-100 placeholder:text-slate-500"
            />
          </div>

          <div className="flex flex-col gap-1.5 mt-1">
            <label className="text-[10px] text-secondary font-medium">Daftar Gerakan & Rencana Set ({templateForm.exercises.length})</label>
            {templateForm.exercises.length > 0 ? (
              <div className="flex flex-col gap-3 max-h-[300px] overflow-y-auto pr-1 bg-white/5 rounded-xl p-2 border border-white/5">
                {templateForm.exercises.map((ex, idx) => (
                  <div key={idx} className="flex flex-col gap-2.5 bg-white/5 border border-white/5 rounded-lg p-3">
                    <div className="flex justify-between items-center border-b border-white/5 pb-2">
                      <div className="flex flex-col">
                        <span className="text-xs font-semibold text-slate-200">{ex.name}</span>
                        <span className="text-[9px] text-purple/80 font-medium">🎯 {ex.category}</span>
                      </div>
                      <Button 
                        type="text" 
                        danger 
                        size="small" 
                        icon={<Trash2 className="w-3.5 h-3.5" />} 
                        onClick={() => removeExerciseFromTemplateForm(idx)}
                        className="text-rose-400 hover:text-rose-300 p-1 h-auto flex items-center justify-center border-none"
                      />
                    </div>
                    
                    {/* Simplified sets input: Sets count, Reps range (e.g., 8 - 12), and RIR */}
                    {(() => {
                      const setsObj = (ex.sets && !Array.isArray(ex.sets))
                        ? ex.sets
                        : { sets_count: 4, reps_target: "8 - 12", rir_target: 2 };
                        
                      return (
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', paddingLeft: '4px' }}>
                          <div style={{ display: 'grid', gridTemplateColumns: '1.2fr 1.8fr 1.2fr', gap: '10px', fontSize: '9px', fontWeight: 'bold', color: 'var(--text-secondary)', textTransform: 'uppercase', letterSpacing: '0.05em', textAlign: 'center' }}>
                            <div>Jumlah Set</div>
                            <div>Repetisi (Reps)</div>
                            <div>Target RIR</div>
                          </div>

                          <div style={{ display: 'grid', gridTemplateColumns: '1.2fr 1.8fr 1.2fr', gap: '10px', alignItems: 'center' }}>
                            {/* Sets Count */}
                            <div className="input-wrapper-suffix" style={{ height: '34px', background: 'rgba(255, 255, 255, 0.03)', border: '1px solid rgba(255, 255, 255, 0.05)', borderRadius: '8px', padding: '0 6px', display: 'flex', alignItems: 'center' }}>
                              <input 
                                type="number" 
                                min="1"
                                max="20"
                                value={setsObj.sets_count !== undefined && setsObj.sets_count !== null ? setsObj.sets_count : ''}
                                onChange={e => updateTemplateExerciseSets(idx, 'sets_count', e.target.value)}
                                style={{ width: '100%', height: '100%', background: 'transparent', border: 'none', color: '#fff', fontSize: '12px', fontWeight: '600', outline: 'none', textAlign: 'center', padding: '0' }}
                              />
                              <span style={{ fontSize: '8.5px', color: 'var(--text-muted)' }}>set</span>
                            </div>

                            {/* Reps Target */}
                            <div className="input-wrapper-suffix" style={{ height: '34px', background: 'rgba(255, 255, 255, 0.03)', border: '1px solid rgba(255, 255, 255, 0.05)', borderRadius: '8px', padding: '0 6px', display: 'flex', alignItems: 'center' }}>
                              <input 
                                type="text" 
                                placeholder="ex: 8 - 12"
                                value={setsObj.reps_target !== undefined && setsObj.reps_target !== null ? setsObj.reps_target : ''}
                                onChange={e => updateTemplateExerciseSets(idx, 'reps_target', e.target.value)}
                                style={{ width: '100%', height: '100%', background: 'transparent', border: 'none', color: '#fff', fontSize: '12px', fontWeight: '600', outline: 'none', textAlign: 'center', padding: '0' }}
                              />
                            </div>

                            {/* RIR Target */}
                            <div className="input-wrapper-suffix" style={{ height: '34px', background: 'rgba(255, 255, 255, 0.03)', border: '1px solid rgba(255, 255, 255, 0.05)', borderRadius: '8px', padding: '0 6px', display: 'flex', alignItems: 'center' }}>
                              <input 
                                type="number" 
                                min="0"
                                max="10"
                                placeholder="ex: 2"
                                value={setsObj.rir_target !== undefined && setsObj.rir_target !== null ? setsObj.rir_target : ''}
                                onChange={e => updateTemplateExerciseSets(idx, 'rir_target', e.target.value)}
                                style={{ width: '100%', height: '100%', background: 'transparent', border: 'none', color: '#fff', fontSize: '12px', fontWeight: '600', outline: 'none', textAlign: 'center', padding: '0' }}
                              />
                              <span style={{ fontSize: '8.5px', color: 'var(--text-muted)' }}>rir</span>
                            </div>
                          </div>
                        </div>
                      );
                    })()}
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-4 bg-white/5 border border-dashed border-white/10 rounded-xl text-[10px] text-slate-400 leading-relaxed px-4">
                Belum ada gerakan ditambahkan. Pilih dari pustaka gerakan atau tulis nama gerakan baru di bawah ini.
              </div>
            )}
          </div>

          <div className="bg-white/5 border border-white/10 rounded-xl p-3 mt-1 flex flex-col gap-3">
            <span className="text-[10px] font-bold text-slate-300 uppercase tracking-wider block">Tambah Gerakan Baru</span>
            
            <div className="flex flex-col gap-1">
              <label className="text-[9px] text-slate-400">Pilih dari Pustaka Gerakan</label>
              <Select
                showSearch
                placeholder="Cari & pilih gerakan..."
                filterOption={(input, option) =>
                  (option?.label ?? '').toLowerCase().includes(input.toLowerCase())
                }
                className="w-full text-xs"
                value={selectedLibraryEx}
                onChange={(val) => {
                  setSelectedLibraryEx(val);
                  setCustomExName('');
                }}
                options={exercisesList.map(e => ({ value: e.name, label: `${e.name} (${e.category})` }))}
                allowClear
              />
            </div>

            <div className="flex items-center gap-2">
              <div className="h-px bg-white/10 flex-1"></div>
              <span className="text-[9px] text-slate-500 font-bold uppercase">Atau</span>
              <div className="h-px bg-white/10 flex-1"></div>
            </div>

            <div className="flex flex-col gap-1">
              <label className="text-[9px] text-slate-400">Tulis Gerakan Kustom Baru</label>
              <div className="flex gap-2">
                <Input 
                  placeholder="Nama gerakan..." 
                  value={customExName}
                  onChange={e => {
                    setCustomExName(e.target.value);
                    setSelectedLibraryEx(null);
                  }}
                  className="text-xs h-9 flex-1 bg-white/5 border-white/10 text-slate-100 placeholder:text-slate-500"
                />
                <Select 
                  value={customExCategory}
                  onChange={val => setCustomExCategory(val)}
                  className="w-24 h-9 text-xs"
                  options={[
                    { value: 'Chest', label: 'Chest' },
                    { value: 'Back', label: 'Back' },
                    { value: 'Leg', label: 'Leg' },
                    { value: 'Bicep', label: 'Bicep' },
                    { value: 'Tricep', label: 'Tricep' },
                    { value: 'Shoulder', label: 'Shoulder' },
                    { value: 'Core', label: 'Core' },
                    { value: 'Kardio', label: 'Kardio' }
                  ]}
                />
              </div>
            </div>

            <Button
              type="dashed"
              icon={<Plus className="w-3.5 h-3.5" />}
              onClick={addExerciseToTemplateForm}
              className="h-9 text-xs font-semibold text-purple border-purple/30 hover:border-purple/50 flex items-center justify-center gap-1 mt-1"
            >
              Tambahkan ke Rencana
            </Button>
          </div>

          <div className="flex gap-3 mt-3">
            <Button 
              block 
              onClick={() => {
                setShowTemplateModal(false);
                setTemplateForm({ id: null, name: '', exercises: [] });
                setSelectedLibraryEx(null);
                setCustomExName('');
              }}
              className="h-11 text-xs font-semibold bg-white/5 border-white/10 hover:bg-white/10 text-slate-300"
            >
              Batal
            </Button>
            <Button 
              type="primary" 
              block 
              loading={submittingTemplate}
              onClick={handleSaveTemplate}
              className="h-11 text-xs font-semibold"
            >
              Simpan Rencana Latihan
            </Button>
          </div>
        </div>
      </Modal>

      {/* 4. Bottom Navbar tabs Navigation */}
      <nav className="bottom-nav">
        <div 
          onClick={() => { setActiveTab('dashboard'); setSelectedExerciseDetail(null); }}
          className={`nav-item ${activeTab === 'dashboard' ? 'active' : ''}`}
          title="Dashboard"
        >
          <TrendingUp className="w-6 h-6" />
        </div>
        <div 
          onClick={() => { setActiveTab('workout'); }}
          className={`nav-item ${activeTab === 'workout' ? 'active' : ''}`}
          title="Latihan"
        >
          <Dumbbell className="w-6 h-6" />
        </div>
        <div 
          onClick={() => { setActiveTab('exercises'); setSelectedExerciseDetail(null); }}
          className={`nav-item ${activeTab === 'exercises' ? 'active' : ''}`}
          title="Gerakan"
        >
          <Search className="w-6 h-6" />
        </div>
        <div 
          onClick={() => { setActiveTab('nutrition'); }}
          className={`nav-item ${activeTab === 'nutrition' ? 'active' : ''}`}
          title="Nutrisi"
        >
          <Utensils className="w-6 h-6" />
        </div>
        <div 
          onClick={() => { setActiveTab('gallery'); }}
          className={`nav-item ${activeTab === 'gallery' ? 'active' : ''}`}
          title="Galeri"
        >
          <Camera className="w-6 h-6" />
        </div>
        <div 
          onClick={() => { setActiveTab('profile'); }}
          className={`nav-item ${activeTab === 'profile' ? 'active' : ''}`}
          title="Profil"
        >
          <User className="w-6 h-6" />
        </div>
      </nav>
    </div>
    </ConfigProvider>
  );
}
